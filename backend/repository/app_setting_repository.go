package repository

import (
	"github.com/2930134478/AI-CS/backend/models"
	"gorm.io/gorm"
)

type AppSettingRepository struct {
	db *gorm.DB
}

func NewAppSettingRepository(db *gorm.DB) *AppSettingRepository {
	return &AppSettingRepository{db: db}
}

func (r *AppSettingRepository) Get(key string) (*models.AppSetting, error) {
	var m models.AppSetting
	err := r.db.Where("`key` = ?", key).First(&m).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *AppSettingRepository) SetValue(key, value string) error {
	return r.db.Save(&models.AppSetting{Key: key, Value: value}).Error
}

func (r *AppSettingRepository) Delete(key string) error {
	return r.db.Where("`key` = ?", key).Delete(&models.AppSetting{}).Error
}
