package service

import (
	"time"

	"github.com/2930134478/AI-CS/backend/repository"
)

// StatisticsService 负责统计数据相关的业务编排。
type StatisticsService struct {
	repo *repository.StatisticsRepository
}

// NewStatisticsService 创建 StatisticsService 实例。
func NewStatisticsService(repo *repository.StatisticsRepository) *StatisticsService {
	return &StatisticsService{repo: repo}
}

// GetDashboardStats 获取 Dashboard 概览统计数据。
func (s *StatisticsService) GetDashboardStats() (*DashboardStats, error) {
	// 并发获取各项统计数据
	todayConv, err := s.repo.GetTodayConversationCount()
	if err != nil {
		return nil, err
	}

	todayMsg, err := s.repo.GetTodayMessageCount()
	if err != nil {
		return nil, err
	}

	activeVisitors, err := s.repo.GetActiveVisitorCount()
	if err != nil {
		return nil, err
	}

	totalConv, err := s.repo.GetTotalConversationCount()
	if err != nil {
		return nil, err
	}

	totalMsg, err := s.repo.GetTotalMessageCount()
	if err != nil {
		return nil, err
	}

	return &DashboardStats{
		TodayConversations: todayConv,
		TodayMessages:      todayMsg,
		OnlineAgents:       0, // 在线客服数需要从 WebSocket Hub 获取，暂时设为0
		ActiveVisitors:     activeVisitors,
		TotalConversations: totalConv,
		TotalMessages:      totalMsg,
	}, nil
}

// GetConversationTrend 获取对话趋势数据。
func (s *StatisticsService) GetConversationTrend(days int) ([]ConversationTrendData, error) {
	if days <= 0 {
		days = 7
	}
	if days > 30 {
		days = 30
	}

	// 获取对话趋势
	convTrend, err := s.repo.GetConversationTrend(days)
	if err != nil {
		return nil, err
	}

	// 获取消息趋势
	msgTrend, err := s.repo.GetMessageTrend(days)
	if err != nil {
		return nil, err
	}

	// 合并数据
	msgMap := make(map[string]int64)
	for _, item := range msgTrend {
		if date, ok := item["date"].(time.Time); ok {
			msgMap[date.Format("2006-01-02")] = item["count"].(int64)
		}
	}

	results := make([]ConversationTrendData, 0, len(convTrend))
	for _, item := range convTrend {
		var dateStr string
		if date, ok := item["date"].(time.Time); ok {
			dateStr = date.Format("2006-01-02")
		} else {
			continue
		}

		count, _ := item["count"].(int64)
		msgCount := msgMap[dateStr]

		results = append(results, ConversationTrendData{
			Date:         dateStr,
			Count:        count,
			MessageCount: msgCount,
		})
	}

	return results, nil
}

// GetAgentWorkload 获取客服工作量统计。
func (s *StatisticsService) GetAgentWorkload(days int) ([]AgentWorkloadData, error) {
	if days <= 0 {
		days = 7
	}
	if days > 30 {
		days = 30
	}

	startDate := time.Now().AddDate(0, 0, -days)
	endDate := time.Now()

	results, err := s.repo.GetAgentWorkload(startDate, endDate)
	if err != nil {
		return nil, err
	}

	workload := make([]AgentWorkloadData, 0, len(results))
	for _, item := range results {
		agentID, _ := item["agent_id"].(uint)
		agentName, _ := item["agent_name"].(string)
		convCount, _ := item["conversation_count"].(int64)
		msgCount, _ := item["message_count"].(int64)

		workload = append(workload, AgentWorkloadData{
			AgentID:           agentID,
			AgentName:         agentName,
			ConversationCount: convCount,
			MessageCount:      msgCount,
			AvgResponseTime:   0, // 平均响应时间计算较复杂，暂设为0
		})
	}

	return workload, nil
}

// GetVisitorAnalytics 获取访客分析数据。
func (s *StatisticsService) GetVisitorAnalytics(days int) (map[string]interface{}, error) {
	if days <= 0 {
		days = 7
	}
	if days > 30 {
		days = 30
	}

	// 获取来源统计
	sourceStats, err := s.repo.GetVisitorSourceStats(days)
	if err != nil {
		return nil, err
	}

	// 获取浏览器统计
	browserStats, err := s.repo.GetBrowserStats(days)
	if err != nil {
		return nil, err
	}

	// 获取时间分布
	hourlyDist, err := s.repo.GetHourlyDistribution(days)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"sources":      sourceStats,
		"browsers":     browserStats,
		"hourly_dist":  hourlyDist,
	}, nil
}

// GetAIStats 获取AI统计数据。
func (s *StatisticsService) GetAIStats(days int) (*AIStatsData, error) {
	if days <= 0 {
		days = 7
	}
	if days > 30 {
		days = 30
	}

	stats, err := s.repo.GetAIResponseStats(days)
	if err != nil {
		return nil, err
	}

	totalResponses, _ := stats["total_ai_responses"].(int64)
	aiModeCount, _ := stats["ai_mode_count"].(int64)

	var aiResponseRate float64
	if totalResponses > 0 {
		aiResponseRate = float64(aiModeCount) / float64(totalResponses) * 100
	}

	return &AIStatsData{
		TotalAIResponses:  aiModeCount,
		AIResponseRate:    aiResponseRate,
		AvgResponseTime:   0, // 平均响应时间需要额外计算
		HumanTakeoverRate: 0, // 人工接管率需要额外计算
	}, nil
}
