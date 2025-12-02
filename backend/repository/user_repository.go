package repository

import (
	"github.com/2930134478/AI-CS/backend/models"
	"gorm.io/gorm"
)

// UserRepository 封装与用户相关的数据库操作。
type UserRepository struct {
	db *gorm.DB
}

// NewUserRepository 创建用户仓库实例。
func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

// FindByUsername 根据用户名查询用户。
func (r *UserRepository) FindByUsername(username string) (*models.User, error) {
	var user models.User
	if err := r.db.Where("username = ?", username).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

// Create 创建新的用户记录。
func (r *UserRepository) Create(user *models.User) error {
	return r.db.Create(user).Error
}

// GetByID 根据ID查询用户。
func (r *UserRepository) GetByID(id uint) (*models.User, error) {
	var user models.User
	if err := r.db.Where("id = ?", id).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

// UpdateFields 更新用户的部分字段。
func (r *UserRepository) UpdateFields(id uint, updates map[string]interface{}) error {
	return r.db.Model(&models.User{}).Where("id = ?", id).Updates(updates).Error
}

// ListUsers 获取所有用户列表。
func (r *UserRepository) ListUsers() ([]models.User, error) {
	var users []models.User
	if err := r.db.Order("created_at DESC").Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

// Delete 删除用户。
func (r *UserRepository) Delete(id uint) error {
	return r.db.Delete(&models.User{}, id).Error
}

// CountByRole 统计指定角色的用户数量。
func (r *UserRepository) CountByRole(role string) (int64, error) {
	var count int64
	if err := r.db.Model(&models.User{}).Where("role = ?", role).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

// FindByIDsAndRole 根据ID列表和角色查询用户。
func (r *UserRepository) FindByIDsAndRole(ids []uint, role string) ([]models.User, error) {
	var users []models.User
	if err := r.db.Where("id IN ? AND role = ?", ids, role).Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

// FindByIDsAndRoles 根据ID列表和多个角色查询用户（支持查询多个角色，如 admin 和 agent）。
func (r *UserRepository) FindByIDsAndRoles(ids []uint, roles []string) ([]models.User, error) {
	var users []models.User
	if err := r.db.Where("id IN ? AND role IN ?", ids, roles).Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}
