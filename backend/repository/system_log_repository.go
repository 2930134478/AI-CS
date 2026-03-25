package repository

import (
	"github.com/2930134478/AI-CS/backend/models"
	"gorm.io/gorm"
)

// SystemLogRepository 系统日志仓储。
type SystemLogRepository struct {
	db *gorm.DB
}

func NewSystemLogRepository(db *gorm.DB) *SystemLogRepository {
	return &SystemLogRepository{db: db}
}

func (r *SystemLogRepository) Create(item *models.SystemLog) error {
	return r.db.Create(item).Error
}

func (r *SystemLogRepository) DB() *gorm.DB {
	return r.db
}

