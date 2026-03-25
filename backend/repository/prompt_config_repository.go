package repository

import (
	"github.com/2930134478/AI-CS/backend/models"
	"gorm.io/gorm"
)

// PromptConfigRepository 提示词配置仓储（按 key 读写）
type PromptConfigRepository struct {
	db *gorm.DB
}

// NewPromptConfigRepository 创建仓储实例
func NewPromptConfigRepository(db *gorm.DB) *PromptConfigRepository {
	return &PromptConfigRepository{db: db}
}

// Get 按 key 获取一条配置，不存在返回 nil, nil
// 使用反引号包裹 key，避免 MySQL 保留字导致 SQL 语法错误
func (r *PromptConfigRepository) Get(key string) (*models.PromptConfig, error) {
	var m models.PromptConfig
	err := r.db.Where("`key` = ?", key).First(&m).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &m, nil
}

// GetAll 获取所有配置（用于管理页展示）
func (r *PromptConfigRepository) GetAll() ([]models.PromptConfig, error) {
	var list []models.PromptConfig
	err := r.db.Order("`key`").Find(&list).Error
	return list, err
}

// Save 按 key 保存或更新（upsert）
func (r *PromptConfigRepository) Save(c *models.PromptConfig) error {
	return r.db.Save(c).Error
}
