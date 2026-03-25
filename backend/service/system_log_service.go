package service

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/2930134478/AI-CS/backend/models"
	"github.com/2930134478/AI-CS/backend/repository"
)

type CreateSystemLogInput struct {
	Level          string
	Category       string
	Event          string
	Source         string
	TraceID        string
	ConversationID *uint
	UserID         *uint
	VisitorID      *uint
	Message        string
	Meta           map[string]interface{}
	Timestamp      *time.Time
}

type QuerySystemLogsInput struct {
	From           string
	To             string
	Level          string
	Category       string
	Event          string
	Source         string
	ConversationID *uint
	Keyword        string
	Page           int
	PageSize       int
}

type QuerySystemLogsResult struct {
	Items    []models.SystemLog `json:"items"`
	Total    int64              `json:"total"`
	Page     int                `json:"page"`
	PageSize int                `json:"page_size"`
}

// SystemLogService 结构化日志服务（查询 + 写入）。
type SystemLogService struct {
	repo *repository.SystemLogRepository
}

func NewSystemLogService(repo *repository.SystemLogRepository) *SystemLogService {
	return &SystemLogService{repo: repo}
}

func (s *SystemLogService) Create(input CreateSystemLogInput) error {
	level := strings.ToLower(strings.TrimSpace(input.Level))
	if level == "" {
		level = "info"
	}
	category := strings.ToLower(strings.TrimSpace(input.Category))
	if category == "" {
		category = "system"
	}
	source := strings.ToLower(strings.TrimSpace(input.Source))
	if source == "" {
		source = "backend"
	}
	event := strings.TrimSpace(input.Event)
	if event == "" {
		event = "general"
	}
	message := strings.TrimSpace(input.Message)
	if message == "" {
		return fmt.Errorf("message 不能为空")
	}

	metaJSON := ""
	if input.Meta != nil {
		if b, err := json.Marshal(input.Meta); err == nil {
			metaJSON = string(b)
		}
	}
	ts := time.Now()
	if input.Timestamp != nil {
		ts = *input.Timestamp
	}

	item := &models.SystemLog{
		Timestamp:      ts,
		Level:          level,
		Category:       category,
		Event:          event,
		Source:         source,
		TraceID:        strings.TrimSpace(input.TraceID),
		ConversationID: input.ConversationID,
		UserID:         input.UserID,
		VisitorID:      input.VisitorID,
		Message:        message,
		MetaJSON:       metaJSON,
	}
	return s.repo.Create(item)
}

func (s *SystemLogService) Query(input QuerySystemLogsInput) (*QuerySystemLogsResult, error) {
	page := input.Page
	if page <= 0 {
		page = 1
	}
	pageSize := input.PageSize
	if pageSize <= 0 {
		pageSize = 50
	}
	if pageSize > 200 {
		pageSize = 200
	}

	db := s.repo.DB().Model(&models.SystemLog{})
	if input.From != "" {
		if t, err := time.Parse("2006-01-02", input.From); err == nil {
			db = db.Where("timestamp >= ?", t)
		}
	}
	if input.To != "" {
		if t, err := time.Parse("2006-01-02", input.To); err == nil {
			db = db.Where("timestamp < ?", t.AddDate(0, 0, 1))
		}
	}
	if v := strings.TrimSpace(input.Level); v != "" {
		db = db.Where("level = ?", strings.ToLower(v))
	}
	if v := strings.TrimSpace(input.Category); v != "" {
		db = db.Where("category = ?", strings.ToLower(v))
	}
	if v := strings.TrimSpace(input.Event); v != "" {
		db = db.Where("event = ?", v)
	}
	if v := strings.TrimSpace(input.Source); v != "" {
		db = db.Where("source = ?", strings.ToLower(v))
	}
	if input.ConversationID != nil {
		db = db.Where("conversation_id = ?", *input.ConversationID)
	}
	if v := strings.TrimSpace(input.Keyword); v != "" {
		like := "%" + v + "%"
		db = db.Where("(message LIKE ? OR meta_json LIKE ? OR trace_id LIKE ?)", like, like, like)
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, err
	}
	items := make([]models.SystemLog, 0, pageSize)
	if err := db.Order("timestamp DESC").Offset((page-1)*pageSize).Limit(pageSize).Find(&items).Error; err != nil {
		return nil, err
	}
	return &QuerySystemLogsResult{
		Items:    items,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	}, nil
}

