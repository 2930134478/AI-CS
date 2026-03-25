package service

import (
	"fmt"
	"strings"
	"time"

	"github.com/2930134478/AI-CS/backend/models"
	"github.com/2930134478/AI-CS/backend/repository"
	"gorm.io/gorm"
)

// AnalyticsSummaryResponse 报表汇总（按日 + 区间总计）
type AnalyticsSummaryResponse struct {
	From    string                 `json:"from"`
	To      string                 `json:"to"`
	Totals  AnalyticsTotals        `json:"totals"`
	Daily   []AnalyticsDailyRow    `json:"daily"`
	Note    string                 `json:"note"`
}

// AnalyticsTotals 区间内汇总指标
type AnalyticsTotals struct {
	WidgetOpens                  int64   `json:"widget_opens"`
	Sessions                     int64   `json:"sessions"`
	Messages                     int64   `json:"messages"`
	AIReplies                    int64   `json:"ai_replies"`
	AIFailed                     int64   `json:"ai_failed"`
	AIFailureRatePercent         float64 `json:"ai_failure_rate_percent"`
	KBHits                       int64   `json:"kb_hits"`
	KBHitRatePercent             float64 `json:"kb_hit_rate_percent"`
	MaxAIRounds                  int     `json:"max_ai_rounds"`
	// SessionsWithAI 区间内新建的访客会话中，至少使用过 AI（访客 AI 发言或收到 AI 回复）的会话数
	SessionsWithAI             int64   `json:"sessions_with_ai"`
	AIParticipationRatePercent float64 `json:"ai_participation_rate_percent"`
	AIToHumanSessions          int64   `json:"ai_to_human_sessions"`
	AIToHumanRatePercent       float64 `json:"ai_to_human_rate_percent"`
	HumanToAISessions          int64   `json:"human_to_ai_sessions"`
	HumanToAIRatePercent       float64 `json:"human_to_ai_rate_percent"`
	// 以下为转人工率分母说明用（区间内有活动的会话中统计）
	SessionsWithAIUserMsg    int64 `json:"sessions_with_ai_user_msg"`
	SessionsWithHumanUserMsg int64 `json:"sessions_with_human_user_msg"`
}

// AnalyticsDailyRow 单日指标（用于折线/柱状图）
type AnalyticsDailyRow struct {
	Date        string `json:"date"`
	WidgetOpens int64  `json:"widget_opens"`
	Sessions    int64  `json:"sessions"`
	Messages    int64  `json:"messages"`
	AIReplies   int64  `json:"ai_replies"`
}

// AnalyticsService 数据分析报表（访客会话，不含内部知识库测试）
type AnalyticsService struct {
	db           *gorm.DB
	widgetOpens  *repository.WidgetOpenRepository
	analyticsLoc *time.Location
}

// NewAnalyticsService 创建报表服务；loc 用于按自然日切分，默认上海时区
func NewAnalyticsService(db *gorm.DB, widgetOpens *repository.WidgetOpenRepository) *AnalyticsService {
	loc, err := time.LoadLocation("Asia/Shanghai")
	if err != nil {
		loc = time.Local
	}
	return &AnalyticsService{db: db, widgetOpens: widgetOpens, analyticsLoc: loc}
}

// RecordWidgetOpen 记录一次访客打开客服小窗
func (s *AnalyticsService) RecordWidgetOpen(visitorID uint) error {
	if visitorID == 0 {
		return fmt.Errorf("visitor_id 无效")
	}
	return s.widgetOpens.Create(&models.WidgetOpenEvent{VisitorID: visitorID})
}

// GetSummary 查询 [fromDate, toDate] 闭区间内的统计（按上海时区日历日）
func (s *AnalyticsService) GetSummary(fromDate, toDate string) (*AnalyticsSummaryResponse, error) {
	start, endExclusive, err := parseInclusiveDateRange(fromDate, toDate, s.analyticsLoc)
	if err != nil {
		return nil, err
	}
	if !endExclusive.After(start) {
		return nil, fmt.Errorf("结束日期须不早于开始日期")
	}

	totals := s.computeTotals(start, endExclusive)
	daily := s.computeDailySeries(start, endExclusive)

	return &AnalyticsSummaryResponse{
		From:   fromDate,
		To:     toDate,
		Totals: totals,
		Daily:  daily,
		Note:   "访客会话统计；时区按 Asia/Shanghai 切日。知识库命中率分母为「非失败的 AI 回复数」。转人工率分母为「有过 AI 模式访客发言的会话数」。",
	}, nil
}

func parseInclusiveDateRange(fromStr, toStr string, loc *time.Location) (start, endExclusive time.Time, err error) {
	fromStr = strings.TrimSpace(fromStr)
	toStr = strings.TrimSpace(toStr)
	if fromStr == "" || toStr == "" {
		return time.Time{}, time.Time{}, fmt.Errorf("请提供 from 与 to，格式 YYYY-MM-DD")
	}
	d0, e1 := time.ParseInLocation("2006-01-02", fromStr, loc)
	d1, e2 := time.ParseInLocation("2006-01-02", toStr, loc)
	if e1 != nil || e2 != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("日期格式应为 YYYY-MM-DD")
	}
	start = time.Date(d0.Year(), d0.Month(), d0.Day(), 0, 0, 0, 0, loc)
	endDay := time.Date(d1.Year(), d1.Month(), d1.Day(), 0, 0, 0, 0, loc)
	endExclusive = endDay.AddDate(0, 0, 1)
	return start, endExclusive, nil
}

func (s *AnalyticsService) computeTotals(start, endExclusive time.Time) AnalyticsTotals {
	var out AnalyticsTotals

	// 小窗打开次数
	s.db.Model(&models.WidgetOpenEvent{}).
		Where("created_at >= ? AND created_at < ?", start, endExclusive).
		Count(&out.WidgetOpens)

	// 新建访客会话（区间内创建的）
	s.db.Model(&models.Conversation{}).
		Where("conversation_type = ? AND created_at >= ? AND created_at < ?", "visitor", start, endExclusive).
		Count(&out.Sessions)

	// 区间内产生的消息（仅访客会话）
	s.db.Model(&models.Message{}).
		Joins("JOIN conversations ON conversations.id = messages.conversation_id").
		Where("conversations.conversation_type = ?", "visitor").
		Where("messages.created_at >= ? AND messages.created_at < ?", start, endExclusive).
		Count(&out.Messages)

	// AI 回复：客服侧且 sender_id=0
	s.db.Model(&models.Message{}).
		Joins("JOIN conversations ON conversations.id = messages.conversation_id").
		Where("conversations.conversation_type = ?", "visitor").
		Where("messages.sender_is_agent = ? AND messages.sender_id = ?", true, 0).
		Where("messages.created_at >= ? AND messages.created_at < ?", start, endExclusive).
		Count(&out.AIReplies)

	s.db.Model(&models.Message{}).
		Joins("JOIN conversations ON conversations.id = messages.conversation_id").
		Where("conversations.conversation_type = ?", "visitor").
		Where("messages.sender_is_agent = ? AND messages.sender_id = ?", true, 0).
		Where("messages.is_ai_generation_failed = ?", true).
		Where("messages.created_at >= ? AND messages.created_at < ?", start, endExclusive).
		Count(&out.AIFailed)

	aiOK := out.AIReplies - out.AIFailed
	if out.AIReplies > 0 {
		out.AIFailureRatePercent = round2(float64(out.AIFailed) * 100 / float64(out.AIReplies))
	}

	s.db.Model(&models.Message{}).
		Joins("JOIN conversations ON conversations.id = messages.conversation_id").
		Where("conversations.conversation_type = ?", "visitor").
		Where("messages.sender_is_agent = ? AND messages.sender_id = ?", true, 0).
		Where("messages.is_ai_generation_failed = ?", false).
		Where("messages.sources_used LIKE ?", "%knowledge_base%").
		Where("messages.created_at >= ? AND messages.created_at < ?", start, endExclusive).
		Count(&out.KBHits)

	if aiOK > 0 {
		out.KBHitRatePercent = round2(float64(out.KBHits) * 100 / float64(aiOK))
	}

	// 需要全量消息的会话：区间内新建或有消息活动的访客会话
	convIDs := s.visitorConversationIDsTouchingRange(start, endExclusive)
	if len(convIDs) > 0 {
		var all []models.Message
		s.db.Where("conversation_id IN ?", convIDs).
			Order("conversation_id ASC, created_at ASC").
			Find(&all)
		byConv := groupMessagesByConversation(all)
		maxRounds := 0
		seenAI := make(map[uint]struct{})
		seenHuman := make(map[uint]struct{})
		seenATH := make(map[uint]struct{})
		seenHTA := make(map[uint]struct{})
		for cid, msgs := range byConv {
			r := countAIRounds(msgs)
			if r > maxRounds {
				maxRounds = r
			}
			ath, hta, hasAIUser, hasHumanUser := detectModeTransitions(msgs)
			if hasAIUser {
				seenAI[cid] = struct{}{}
			}
			if hasHumanUser {
				seenHuman[cid] = struct{}{}
			}
			if ath {
				seenATH[cid] = struct{}{}
			}
			if hta {
				seenHTA[cid] = struct{}{}
			}
		}
		out.MaxAIRounds = maxRounds
		out.SessionsWithAIUserMsg = int64(len(seenAI))
		out.SessionsWithHumanUserMsg = int64(len(seenHuman))

		var createdInRange []uint
		s.db.Model(&models.Conversation{}).
			Select("id").
			Where("conversation_type = ? AND created_at >= ? AND created_at < ?", "visitor", start, endExclusive).
			Pluck("id", &createdInRange)
		var sessionsWithAI int64
		for _, cid := range createdInRange {
			if conversationUsedAI(byConv[cid]) {
				sessionsWithAI++
			}
		}
		out.SessionsWithAI = sessionsWithAI
		if out.Sessions > 0 {
			out.AIParticipationRatePercent = round2(float64(sessionsWithAI) * 100 / float64(out.Sessions))
		}
		if len(seenAI) > 0 {
			out.AIToHumanSessions = int64(len(seenATH))
			out.AIToHumanRatePercent = round2(float64(len(seenATH)) * 100 / float64(len(seenAI)))
		}
		if len(seenHuman) > 0 {
			out.HumanToAISessions = int64(len(seenHTA))
			out.HumanToAIRatePercent = round2(float64(len(seenHTA)) * 100 / float64(len(seenHuman)))
		}
	}

	return out
}

func (s *AnalyticsService) visitorConversationIDsTouchingRange(start, endExclusive time.Time) []uint {
	var created []uint
	s.db.Model(&models.Conversation{}).
		Select("id").
		Where("conversation_type = ? AND created_at >= ? AND created_at < ?", "visitor", start, endExclusive).
		Pluck("id", &created)

	var fromMessages []uint
	s.db.Model(&models.Message{}).
		Joins("JOIN conversations ON conversations.id = messages.conversation_id").
		Where("conversations.conversation_type = ?", "visitor").
		Where("messages.created_at >= ? AND messages.created_at < ?", start, endExclusive).
		Pluck("messages.conversation_id", &fromMessages)

	uniq := make(map[uint]struct{})
	for _, id := range created {
		uniq[id] = struct{}{}
	}
	for _, id := range fromMessages {
		uniq[id] = struct{}{}
	}
	out := make([]uint, 0, len(uniq))
	for id := range uniq {
		out = append(out, id)
	}
	return out
}

func groupMessagesByConversation(msgs []models.Message) map[uint][]models.Message {
	m := make(map[uint][]models.Message)
	for _, msg := range msgs {
		m[msg.ConversationID] = append(m[msg.ConversationID], msg)
	}
	return m
}

// countAIRounds 同一会话内：访客在 AI 模式下一条消息 + 紧随其后的 AI 回复算一轮
func countAIRounds(msgs []models.Message) int {
	n := 0
	for i := 0; i < len(msgs)-1; i++ {
		a, b := msgs[i], msgs[i+1]
		if !a.SenderIsAgent && a.ChatMode == "ai" && b.SenderIsAgent && b.SenderID == 0 {
			n++
		}
	}
	return n
}

// detectModeTransitions 仅看访客用户消息（非客服）的 chat_mode 变化
func conversationUsedAI(msgs []models.Message) bool {
	for _, m := range msgs {
		if m.SenderIsAgent && m.SenderID == 0 {
			return true
		}
		if !m.SenderIsAgent && m.ChatMode == "ai" {
			return true
		}
	}
	return false
}

func detectModeTransitions(msgs []models.Message) (aiToHuman, humanToAI, hasAIUser, hasHumanUser bool) {
	var prev string
	for _, m := range msgs {
		if m.SenderIsAgent {
			continue
		}
		mode := m.ChatMode
		if mode != "ai" && mode != "human" {
			continue
		}
		if mode == "ai" {
			hasAIUser = true
		}
		if mode == "human" {
			hasHumanUser = true
		}
		if prev == "ai" && mode == "human" {
			aiToHuman = true
		}
		if prev == "human" && mode == "ai" {
			humanToAI = true
		}
		prev = mode
	}
	return
}

func (s *AnalyticsService) computeDailySeries(start, endExclusive time.Time) []AnalyticsDailyRow {
	var rows []AnalyticsDailyRow
	for d := start; d.Before(endExclusive); d = d.AddDate(0, 0, 1) {
		dayEnd := d.AddDate(0, 0, 1)
		dateStr := d.Format("2006-01-02")
		var w, sess, msg, ai int64
		s.db.Model(&models.WidgetOpenEvent{}).
			Where("created_at >= ? AND created_at < ?", d, dayEnd).Count(&w)
		s.db.Model(&models.Conversation{}).
			Where("conversation_type = ? AND created_at >= ? AND created_at < ?", "visitor", d, dayEnd).Count(&sess)
		s.db.Model(&models.Message{}).
			Joins("JOIN conversations ON conversations.id = messages.conversation_id").
			Where("conversations.conversation_type = ?", "visitor").
			Where("messages.created_at >= ? AND messages.created_at < ?", d, dayEnd).
			Count(&msg)
		s.db.Model(&models.Message{}).
			Joins("JOIN conversations ON conversations.id = messages.conversation_id").
			Where("conversations.conversation_type = ?", "visitor").
			Where("messages.sender_is_agent = ? AND messages.sender_id = ?", true, 0).
			Where("messages.created_at >= ? AND messages.created_at < ?", d, dayEnd).
			Count(&ai)
		rows = append(rows, AnalyticsDailyRow{
			Date:        dateStr,
			WidgetOpens: w,
			Sessions:    sess,
			Messages:    msg,
			AIReplies:   ai,
		})
	}
	return rows
}

func round2(x float64) float64 {
	return float64(int64(x*100+0.5)) / 100
}
