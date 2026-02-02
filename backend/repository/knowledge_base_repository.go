package repository

import (
	"github.com/2930134478/AI-CS/backend/models"
	"gorm.io/gorm"
)

// KnowledgeBaseRepository 封装与知识库相关的数据库操作
type KnowledgeBaseRepository struct {
	db *gorm.DB
}

// NewKnowledgeBaseRepository 创建知识库仓库实例
func NewKnowledgeBaseRepository(db *gorm.DB) *KnowledgeBaseRepository {
	return &KnowledgeBaseRepository{db: db}
}

// Create 创建新的知识库
func (r *KnowledgeBaseRepository) Create(kb *models.KnowledgeBase) error {
	return r.db.Create(kb).Error
}

// GetByID 根据ID查询知识库
func (r *KnowledgeBaseRepository) GetByID(id uint) (*models.KnowledgeBase, error) {
	var kb models.KnowledgeBase
	if err := r.db.Where("id = ?", id).First(&kb).Error; err != nil {
		return nil, err
	}
	return &kb, nil
}

// List 获取所有知识库列表
func (r *KnowledgeBaseRepository) List() ([]models.KnowledgeBase, error) {
	var kbs []models.KnowledgeBase
	if err := r.db.Order("created_at DESC").Find(&kbs).Error; err != nil {
		return nil, err
	}
	return kbs, nil
}

// Update 更新知识库
func (r *KnowledgeBaseRepository) Update(kb *models.KnowledgeBase) error {
	return r.db.Save(kb).Error
}

// Delete 删除知识库
func (r *KnowledgeBaseRepository) Delete(id uint) error {
	return r.db.Delete(&models.KnowledgeBase{}, id).Error
}

// UpdateDocumentCount 更新知识库的文档数量
func (r *KnowledgeBaseRepository) UpdateDocumentCount(id uint, count int) error {
	return r.db.Model(&models.KnowledgeBase{}).Where("id = ?", id).Update("document_count", count).Error
}

// GetByIDs 根据多个 ID 批量查询知识库（用于 RAG 过滤）。
func (r *KnowledgeBaseRepository) GetByIDs(ids []uint) ([]models.KnowledgeBase, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	var list []models.KnowledgeBase
	if err := r.db.Where("id IN ?", ids).Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}
