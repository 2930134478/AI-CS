package repository

import (
	"github.com/2930134478/AI-CS/backend/models"
	"gorm.io/gorm"
)

// FAQRepository 封装与 FAQ（常见问题）相关的数据库操作。
type FAQRepository struct {
	db *gorm.DB
}

// NewFAQRepository 创建 FAQ 仓库实例。
func NewFAQRepository(db *gorm.DB) *FAQRepository {
	return &FAQRepository{db: db}
}

// Create 创建新的 FAQ 记录。
func (r *FAQRepository) Create(faq *models.FAQ) error {
	return r.db.Create(faq).Error
}

// GetByID 根据ID查询 FAQ 记录。
func (r *FAQRepository) GetByID(id uint) (*models.FAQ, error) {
	var faq models.FAQ
	if err := r.db.Where("id = ?", id).First(&faq).Error; err != nil {
		return nil, err
	}
	return &faq, nil
}

// List 获取所有 FAQ 列表，支持关键词搜索。
// 如果 keywords 不为空，会按关键词搜索（AND 查询，所有关键词都要包含）。
// 搜索范围：问题、答案、关键词字段。
func (r *FAQRepository) List(keywords []string) ([]models.FAQ, error) {
	var faqs []models.FAQ
	query := r.db.Model(&models.FAQ{})

	// 如果有关键词，进行 AND 查询
	// 每个关键词都必须在 question、answer、keywords 字段中至少有一个匹配
	// 但所有关键词都必须被满足（AND 逻辑）
	if len(keywords) > 0 {
		for _, keyword := range keywords {
			if keyword != "" {
				// 对于每个关键词，要求在问题、答案、关键词字段中至少有一个包含该关键词（OR）
				// 但所有关键词都必须满足（通过链式 Where 实现 AND）
				query = query.Where(
					"(question LIKE ? OR answer LIKE ? OR keywords LIKE ?)",
					"%"+keyword+"%",
					"%"+keyword+"%",
					"%"+keyword+"%",
				)
			}
		}
	}

	// 按创建时间倒序排列
	if err := query.Order("created_at DESC").Find(&faqs).Error; err != nil {
		return nil, err
	}

	return faqs, nil
}

// Update 更新 FAQ 记录。
func (r *FAQRepository) Update(faq *models.FAQ) error {
	return r.db.Save(faq).Error
}

// Delete 删除 FAQ 记录。
func (r *FAQRepository) Delete(id uint) error {
	return r.db.Delete(&models.FAQ{}, id).Error
}

