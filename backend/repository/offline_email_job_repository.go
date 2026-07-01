package repository

import (
	"time"

	"github.com/2930134478/AI-CS/backend/models"
	"gorm.io/gorm"
)

// OfflineEmailJobRepository 离线邮件任务仓储
type OfflineEmailJobRepository struct {
	db *gorm.DB
}

func NewOfflineEmailJobRepository(db *gorm.DB) *OfflineEmailJobRepository {
	return &OfflineEmailJobRepository{db: db}
}

func (r *OfflineEmailJobRepository) Create(job *models.OfflineEmailJob) error {
	return r.db.Create(job).Error
}

func (r *OfflineEmailJobRepository) Save(job *models.OfflineEmailJob) error {
	return r.db.Save(job).Error
}

func (r *OfflineEmailJobRepository) GetPendingByConversationID(conversationID uint) (*models.OfflineEmailJob, error) {
	var job models.OfflineEmailJob
	err := r.db.Where("conversation_id = ? AND status = ?", conversationID, "pending").
		Order("id DESC").
		First(&job).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &job, nil
}

func (r *OfflineEmailJobRepository) ListDuePending(before time.Time, limit int) ([]models.OfflineEmailJob, error) {
	var jobs []models.OfflineEmailJob
	q := r.db.Where("status = ? AND scheduled_at <= ?", "pending", before).
		Order("scheduled_at ASC")
	if limit > 0 {
		q = q.Limit(limit)
	}
	if err := q.Find(&jobs).Error; err != nil {
		return nil, err
	}
	return jobs, nil
}
