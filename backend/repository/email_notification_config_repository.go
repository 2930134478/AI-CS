package repository

import (
	"github.com/2930134478/AI-CS/backend/models"
	"gorm.io/gorm"
)

// EmailNotificationConfigRepository 离线邮件配置仓储（单例）
type EmailNotificationConfigRepository struct {
	db *gorm.DB
}

func NewEmailNotificationConfigRepository(db *gorm.DB) *EmailNotificationConfigRepository {
	return &EmailNotificationConfigRepository{db: db}
}

func (r *EmailNotificationConfigRepository) Get() (*models.EmailNotificationConfig, error) {
	var m models.EmailNotificationConfig
	err := r.db.First(&m, 1).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *EmailNotificationConfigRepository) Save(c *models.EmailNotificationConfig) error {
	c.ID = 1
	return r.db.Save(c).Error
}

func (r *EmailNotificationConfigRepository) Delete() error {
	return r.db.Where("id = ?", 1).Delete(&models.EmailNotificationConfig{}).Error
}
