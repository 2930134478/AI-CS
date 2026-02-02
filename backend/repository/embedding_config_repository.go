package repository

import (
	"github.com/2930134478/AI-CS/backend/models"
	"gorm.io/gorm"
)

// EmbeddingConfigRepository 知识库向量配置仓储（单例）
type EmbeddingConfigRepository struct {
	db *gorm.DB
}

// NewEmbeddingConfigRepository 创建仓储实例
func NewEmbeddingConfigRepository(db *gorm.DB) *EmbeddingConfigRepository {
	return &EmbeddingConfigRepository{db: db}
}

// Get 获取唯一一条配置（id=1），不存在则返回 nil, nil
func (r *EmbeddingConfigRepository) Get() (*models.EmbeddingConfig, error) {
	var m models.EmbeddingConfig
	err := r.db.First(&m, 1).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &m, nil
}

// Save 保存或更新（存在则更新，不存在则插入 id=1）
func (r *EmbeddingConfigRepository) Save(c *models.EmbeddingConfig) error {
	c.ID = 1
	return r.db.Save(c).Error
}
