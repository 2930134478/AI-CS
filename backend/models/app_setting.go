package models

import "time"

// AppSetting 通用键值配置（少量平台级开关，避免为单项配置建新表）。
type AppSetting struct {
	Key       string    `json:"key" gorm:"primaryKey;type:varchar(64)"`
	Value     string    `json:"value" gorm:"type:text"`
	UpdatedAt time.Time `json:"updated_at"`
}

const (
	// AppSettingKeySystemLogMinLevel 结构化日志最低落库级别（值：debug/info/warn/error/none）
	AppSettingKeySystemLogMinLevel = "system_log_min_level"
)
