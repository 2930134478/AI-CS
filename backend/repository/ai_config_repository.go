package repository

import (
	"github.com/2930134478/AI-CS/backend/models"
	"gorm.io/gorm"
)

// AIConfigRepository 封装与 AI 配置相关的数据库操作。
type AIConfigRepository struct {
	db *gorm.DB
}

// NewAIConfigRepository 创建 AI 配置仓库实例。
func NewAIConfigRepository(db *gorm.DB) *AIConfigRepository {
	return &AIConfigRepository{db: db}
}

// Create 创建新的 AI 配置记录。
func (r *AIConfigRepository) Create(config *models.AIConfig) error {
	return r.db.Create(config).Error
}

// GetByID 根据主键查询 AI 配置。
func (r *AIConfigRepository) GetByID(id uint) (*models.AIConfig, error) {
	var config models.AIConfig
	if err := r.db.First(&config, id).Error; err != nil {
		return nil, err
	}
	return &config, nil
}

// GetActiveByUserID 查询指定用户的活跃 AI 配置（按模型类型筛选）。
func (r *AIConfigRepository) GetActiveByUserID(userID uint, modelType string) (*models.AIConfig, error) {
	var config models.AIConfig
	query := r.db.Where("user_id = ? AND is_active = ?", userID, true)
	if modelType != "" {
		query = query.Where("model_type = ?", modelType)
	}
	if err := query.Order("created_at desc").First(&config).Error; err != nil {
		return nil, err
	}
	return &config, nil
}

// ListByUserID 查询指定用户的所有 AI 配置。
func (r *AIConfigRepository) ListByUserID(userID uint) ([]models.AIConfig, error) {
	var configs []models.AIConfig
	if err := r.db.Where("user_id = ?", userID).Order("created_at desc").Find(&configs).Error; err != nil {
		return nil, err
	}
	return configs, nil
}

// UpdateFields 更新 AI 配置的指定字段。
func (r *AIConfigRepository) UpdateFields(id uint, values map[string]interface{}) error {
	if len(values) == 0 {
		return nil
	}
	return r.db.Model(&models.AIConfig{}).Where("id = ?", id).Updates(values).Error
}

// Delete 删除 AI 配置。
func (r *AIConfigRepository) Delete(id uint) error {
	return r.db.Delete(&models.AIConfig{}, id).Error
}

// ListPublic 查询所有开放的模型配置（供访客选择）。
func (r *AIConfigRepository) ListPublic(modelType string) ([]models.AIConfig, error) {
	var configs []models.AIConfig
	query := r.db.Where("is_active = ? AND is_public = ?", true, true)
	if modelType != "" {
		query = query.Where("model_type = ?", modelType)
	}
	if err := query.Order("provider, model").Find(&configs).Error; err != nil {
		return nil, err
	}
	return configs, nil
}

