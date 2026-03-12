package repository

import (
	"github.com/2930134478/AI-CS/backend/models"
	"gorm.io/gorm"
)

// QuickReplyRepository 封装与快捷回复模板相关的数据库操作。
type QuickReplyRepository struct {
	db *gorm.DB
}

// NewQuickReplyRepository 创建快捷回复仓库实例。
func NewQuickReplyRepository(db *gorm.DB) *QuickReplyRepository {
	return &QuickReplyRepository{db: db}
}

// Create 创建新的快捷回复模板。
func (r *QuickReplyRepository) Create(reply *models.QuickReply) error {
	return r.db.Create(reply).Error
}

// GetByID 根据ID查询快捷回复模板。
func (r *QuickReplyRepository) GetByID(id uint) (*models.QuickReply, error) {
	var reply models.QuickReply
	if err := r.db.First(&reply, id).Error; err != nil {
		return nil, err
	}
	return &reply, nil
}

// Update 更新快捷回复模板。
func (r *QuickReplyRepository) Update(reply *models.QuickReply) error {
	return r.db.Save(reply).Error
}

// Delete 删除快捷回复模板。
func (r *QuickReplyRepository) Delete(id uint) error {
	return r.db.Delete(&models.QuickReply{}, id).Error
}

// ListByUserID 获取指定用户的个人模板列表。
func (r *QuickReplyRepository) ListByUserID(userID uint) ([]models.QuickReply, error) {
	var replies []models.QuickReply
	if err := r.db.Where("user_id = ?", userID).
		Order("sort_order ASC, created_at DESC").
		Find(&replies).Error; err != nil {
		return nil, err
	}
	return replies, nil
}

// ListPublic 获取公共模板列表（user_id 为 null）。
func (r *QuickReplyRepository) ListPublic() ([]models.QuickReply, error) {
	var replies []models.QuickReply
	if err := r.db.Where("user_id IS NULL").
		Order("sort_order ASC, created_at DESC").
		Find(&replies).Error; err != nil {
		return nil, err
	}
	return replies, nil
}

// ListByUserIDAndPublic 获取用户的个人模板和公共模板（合并列表）。
func (r *QuickReplyRepository) ListByUserIDAndPublic(userID uint) ([]models.QuickReply, error) {
	var replies []models.QuickReply
	if err := r.db.Where("user_id = ? OR user_id IS NULL", userID).
		Order("user_id DESC, sort_order ASC, created_at DESC"). // 个人模板优先
		Find(&replies).Error; err != nil {
		return nil, err
	}
	return replies, nil
}

// IncrementUsageCount 增加使用次数。
func (r *QuickReplyRepository) IncrementUsageCount(id uint) error {
	return r.db.Model(&models.QuickReply{}).
		Where("id = ?", id).
		UpdateColumn("usage_count", gorm.Expr("usage_count + 1")).Error
}

// ListByCategory 按分类获取模板列表。
func (r *QuickReplyRepository) ListByCategory(userID uint, category string) ([]models.QuickReply, error) {
	var replies []models.QuickReply
	query := r.db.Where("user_id = ? OR user_id IS NULL", userID)
	if category != "" {
		query = query.Where("category = ?", category)
	}
	if err := query.Order("user_id DESC, sort_order ASC, created_at DESC").
		Find(&replies).Error; err != nil {
		return nil, err
	}
	return replies, nil
}

// GetCategories 获取所有分类。
func (r *QuickReplyRepository) GetCategories(userID uint) ([]string, error) {
	var categories []string
	if err := r.db.Model(&models.QuickReply{}).
		Where("user_id = ? OR user_id IS NULL", userID).
		Distinct("category").
		Pluck("category", &categories).Error; err != nil {
		return nil, err
	}
	return categories, nil
}
