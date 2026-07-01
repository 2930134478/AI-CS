package repository

import (
	"github.com/2930134478/AI-CS/backend/models"
	"gorm.io/gorm"
)

// DocumentChunkRepository 封装与文档分段相关的数据库操作
type DocumentChunkRepository struct {
	db *gorm.DB
}

// NewDocumentChunkRepository 创建文档分段仓库实例
func NewDocumentChunkRepository(db *gorm.DB) *DocumentChunkRepository {
	return &DocumentChunkRepository{db: db}
}

// Create 创建分段
func (r *DocumentChunkRepository) Create(chunk *models.DocumentChunk) error {
	return r.db.Create(chunk).Error
}

// BatchCreate 批量创建分段
func (r *DocumentChunkRepository) BatchCreate(chunks []*models.DocumentChunk) error {
	return r.db.Create(&chunks).Error
}

// GetByDocumentID 获取文档的所有分段（按 chunk_index 排序）
func (r *DocumentChunkRepository) GetByDocumentID(documentID uint) ([]models.DocumentChunk, error) {
	var chunks []models.DocumentChunk
	if err := r.db.Where("document_id = ?", documentID).Order("chunk_index ASC").Find(&chunks).Error; err != nil {
		return nil, err
	}
	return chunks, nil
}

// GetByDocumentIDPaginated 分页获取文档的分段
func (r *DocumentChunkRepository) GetByDocumentIDPaginated(documentID uint, offset, limit int) ([]models.DocumentChunk, int64, error) {
	var total int64
	if err := r.db.Model(&models.DocumentChunk{}).Where("document_id = ?", documentID).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var chunks []models.DocumentChunk
	if err := r.db.Where("document_id = ?", documentID).
		Order("chunk_index ASC").
		Offset(offset).
		Limit(limit).
		Find(&chunks).Error; err != nil {
		return nil, 0, err
	}
	return chunks, total, nil
}

// GetByID 根据 ID 获取单个分段
func (r *DocumentChunkRepository) GetByID(id uint) (*models.DocumentChunk, error) {
	var chunk models.DocumentChunk
	if err := r.db.Where("id = ?", id).First(&chunk).Error; err != nil {
		return nil, err
	}
	return &chunk, nil
}

// Update 更新分段
func (r *DocumentChunkRepository) Update(chunk *models.DocumentChunk) error {
	return r.db.Save(chunk).Error
}

// UpdateContent 更新分段内容
func (r *DocumentChunkRepository) UpdateContent(id uint, content string) error {
	return r.db.Model(&models.DocumentChunk{}).Where("id = ?", id).Updates(map[string]interface{}{
		"content":          content,
		"embedding_status": "pending",
	}).Error
}

// UpdateEmbeddingStatus 更新分段的向量化状态
func (r *DocumentChunkRepository) UpdateEmbeddingStatus(id uint, status string) error {
	return r.db.Model(&models.DocumentChunk{}).Where("id = ?", id).Update("embedding_status", status).Error
}

// DeleteByDocumentID 删除文档的所有分段
func (r *DocumentChunkRepository) DeleteByDocumentID(documentID uint) error {
	return r.db.Where("document_id = ?", documentID).Delete(&models.DocumentChunk{}).Error
}

// DeleteByID 按 ID 删除单个分段
func (r *DocumentChunkRepository) DeleteByID(id uint) error {
	return r.db.Delete(&models.DocumentChunk{}, id).Error
}

// CountByDocumentID 统计文档的分段数
func (r *DocumentChunkRepository) CountByDocumentID(documentID uint) (int64, error) {
	var count int64
	if err := r.db.Model(&models.DocumentChunk{}).Where("document_id = ?", documentID).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

// GetByIDs 根据 ID 列表查询分段
func (r *DocumentChunkRepository) GetByIDs(ids []uint) ([]models.DocumentChunk, error) {
	var chunks []models.DocumentChunk
	if len(ids) == 0 {
		return chunks, nil
	}
	if err := r.db.Where("id IN ?", ids).Find(&chunks).Error; err != nil {
		return nil, err
	}
	return chunks, nil
}
