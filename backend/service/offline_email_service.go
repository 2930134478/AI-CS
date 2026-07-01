package service

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"github.com/2930134478/AI-CS/backend/infra"
	"github.com/2930134478/AI-CS/backend/models"
	"github.com/2930134478/AI-CS/backend/repository"
)

// VisitorPresenceHub 访客在线状态探测
type VisitorPresenceHub interface {
	BroadcastHub
	VisitorConnectionCount(conversationID uint) int
}

// OfflineEmailService 离线邮件延迟推送
type OfflineEmailService struct {
	configSvc     *EmailNotificationConfigService
	jobRepo       *repository.OfflineEmailJobRepository
	convRepo      *repository.ConversationRepository
	messageRepo   *repository.MessageRepository
	hub           VisitorPresenceHub
}

// NewOfflineEmailService 创建离线邮件服务
func NewOfflineEmailService(
	configSvc *EmailNotificationConfigService,
	jobRepo *repository.OfflineEmailJobRepository,
	convRepo *repository.ConversationRepository,
	messageRepo *repository.MessageRepository,
	hub VisitorPresenceHub,
) *OfflineEmailService {
	return &OfflineEmailService{
		configSvc:   configSvc,
		jobRepo:     jobRepo,
		convRepo:    convRepo,
		messageRepo: messageRepo,
		hub:         hub,
	}
}

// OnAgentMessage 客服在人工访客会话发消息后，若访客离线则调度邮件
func (s *OfflineEmailService) OnAgentMessage(conversationID, messageID uint) {
	if s == nil {
		return
	}
	go func() {
		if err := s.scheduleAgentMessage(conversationID, messageID); err != nil {
			log.Printf("[离线邮件] 调度失败 conv=%d msg=%d: %v", conversationID, messageID, err)
		}
	}()
}

// CancelPending 访客上线时取消待发送任务
func (s *OfflineEmailService) CancelPending(conversationID uint) {
	if s == nil {
		return
	}
	job, err := s.jobRepo.GetPendingByConversationID(conversationID)
	if err != nil || job == nil {
		return
	}
	job.Status = "cancelled"
	_ = s.jobRepo.Save(job)
}

func (s *OfflineEmailService) scheduleAgentMessage(conversationID, messageID uint) error {
	cfg, err := s.configSvc.ResolveEffective()
	if err != nil || !cfg.Enabled {
		return err
	}
	if cfg.SMTPHost == "" || cfg.FromEmail == "" {
		return fmt.Errorf("SMTP 未配置")
	}

	conv, err := s.convRepo.GetByID(conversationID)
	if err != nil {
		return err
	}
	if conv.ConversationType != "visitor" || conv.ChatMode != "human" {
		return nil
	}
	if strings.TrimSpace(conv.Email) == "" {
		return nil
	}
	if s.hub != nil && s.hub.VisitorConnectionCount(conversationID) > 0 {
		return nil
	}

	delay := cfg.OfflineDelaySeconds
	if delay < 0 {
		delay = 0
	}
	scheduledAt := time.Now().Add(time.Duration(delay) * time.Second)

	job, err := s.jobRepo.GetPendingByConversationID(conversationID)
	if err != nil {
		return err
	}
	if job != nil {
		ids := parseMessageIDs(job.MessageIDs)
		if !containsUint(ids, messageID) {
			ids = append(ids, messageID)
		}
		job.MessageIDs = joinMessageIDs(ids)
		job.ScheduledAt = scheduledAt
		return s.jobRepo.Save(job)
	}

	return s.jobRepo.Create(&models.OfflineEmailJob{
		ConversationID: conversationID,
		MessageIDs:     strconv.FormatUint(uint64(messageID), 10),
		ScheduledAt:    scheduledAt,
		Status:         "pending",
	})
}

// StartWorker 后台轮询到期任务
func (s *OfflineEmailService) StartWorker(ctx context.Context) {
	if s == nil {
		return
	}
	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			s.processDueJobs()
		}
	}
}

func (s *OfflineEmailService) processDueJobs() {
	jobs, err := s.jobRepo.ListDuePending(time.Now(), 20)
	if err != nil {
		log.Printf("[离线邮件] 查询待发送任务失败: %v", err)
		return
	}
	for i := range jobs {
		if err := s.processJob(&jobs[i]); err != nil {
			log.Printf("[离线邮件] 处理任务 #%d 失败: %v", jobs[i].ID, err)
		}
	}
}

func (s *OfflineEmailService) processJob(job *models.OfflineEmailJob) error {
	cfg, err := s.configSvc.ResolveEffective()
	if err != nil {
		return err
	}
	if !cfg.Enabled {
		job.Status = "cancelled"
		return s.jobRepo.Save(job)
	}

	if s.hub != nil && s.hub.VisitorConnectionCount(job.ConversationID) > 0 {
		job.Status = "cancelled"
		return s.jobRepo.Save(job)
	}

	conv, err := s.convRepo.GetByID(job.ConversationID)
	if err != nil {
		job.Status = "failed"
		job.LastError = "会话不存在"
		return s.jobRepo.Save(job)
	}
	to := strings.TrimSpace(conv.Email)
	if to == "" {
		job.Status = "cancelled"
		job.LastError = "访客未留邮箱"
		return s.jobRepo.Save(job)
	}

	ids := parseMessageIDs(job.MessageIDs)
	var parts []string
	for _, id := range ids {
		msg, err := s.messageRepo.GetByID(id)
		if err != nil || msg == nil {
			continue
		}
		if !msg.SenderIsAgent || msg.MessageType == "system_message" {
			continue
		}
		content := strings.TrimSpace(msg.Content)
		if content == "" && msg.FileURL != nil {
			content = "[附件消息]"
		}
		if content != "" {
			parts = append(parts, content)
		}
	}
	if len(parts) == 0 {
		job.Status = "cancelled"
		return s.jobRepo.Save(job)
	}

	subject := "您有一条新的客服回复"
	body := "您好，\n\n客服在您离线时给您留了消息：\n\n"
	body += strings.Join(parts, "\n\n---\n\n")
	body += "\n\n"
	if conv.Website != "" {
		body += "您可返回原页面继续对话：\n" + conv.Website + "\n"
	}
	body += "\n—— AI-CS 智能客服"

	mailCfg := infra.SMTPMailConfig{
		Host:      cfg.SMTPHost,
		Port:      cfg.SMTPPort,
		User:      cfg.SMTPUser,
		Password:  cfg.SMTPPassword,
		FromEmail: cfg.FromEmail,
		FromName:  cfg.FromName,
	}
	if err := infra.SendSMTPMail(mailCfg, to, subject, body); err != nil {
		job.Status = "failed"
		job.LastError = err.Error()
		return s.jobRepo.Save(job)
	}

	job.Status = "sent"
	job.LastError = ""
	log.Printf("[离线邮件] 已发送 conv=%d to=%s messages=%d", job.ConversationID, to, len(parts))
	return s.jobRepo.Save(job)
}

// SendTestEmail 发送测试邮件（设置页验证 SMTP）
func (s *OfflineEmailService) SendTestEmail(to string) error {
	cfg, err := s.configSvc.ResolveEffective()
	if err != nil {
		return err
	}
	if cfg.SMTPHost == "" || cfg.FromEmail == "" {
		return fmt.Errorf("请先配置 SMTP 服务器与发件邮箱")
	}
	mailCfg := infra.SMTPMailConfig{
		Host:      cfg.SMTPHost,
		Port:      cfg.SMTPPort,
		User:      cfg.SMTPUser,
		Password:  cfg.SMTPPassword,
		FromEmail: cfg.FromEmail,
		FromName:  cfg.FromName,
	}
	body := "这是一封来自 AI-CS 的测试邮件。若您收到此邮件，说明 SMTP 配置正确。"
	return infra.SendSMTPMail(mailCfg, to, "AI-CS SMTP 测试", body)
}

func parseMessageIDs(raw string) []uint {
	parts := strings.Split(raw, ",")
	var ids []uint
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		if n, err := strconv.ParseUint(p, 10, 32); err == nil {
			ids = append(ids, uint(n))
		}
	}
	return ids
}

func joinMessageIDs(ids []uint) string {
	strs := make([]string, len(ids))
	for i, id := range ids {
		strs[i] = strconv.FormatUint(uint64(id), 10)
	}
	return strings.Join(strs, ",")
}

func containsUint(ids []uint, target uint) bool {
	for _, id := range ids {
		if id == target {
			return true
		}
	}
	return false
}
