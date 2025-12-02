package models

import (
	"time"
)

// AIConfig AI 配置模型
// 支持多种模型类型（文本、图片、语音、视频）和不同的协议路径
type AIConfig struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	UserID      uint      `json:"user_id"`                                    // 配置所属的用户（管理员）
	Provider    string    `json:"provider" gorm:"type:varchar(50)"`           // 服务提供商（如：openai、claude、custom，仅用于标识）
	APIURL      string    `json:"api_url" gorm:"type:varchar(500)"`           // API 地址（支持不同的协议路径）
	APIKey      string    `json:"api_key" gorm:"type:varchar(1000)"`          // API Key（加密存储）
	Model       string    `json:"model" gorm:"type:varchar(100)"`             // 模型名称（如：gpt-3.5-turbo、gpt-4）
	ModelType   string    `json:"model_type" gorm:"type:varchar(20);default:'text'"` // 模型类型：text、image、audio、video
	IsActive    bool      `json:"is_active" gorm:"default:true"`             // 是否启用（服务商级别）
	IsPublic    bool      `json:"is_public" gorm:"default:false"`             // 是否开放给访客使用（模型级别）
	Description string    `json:"description" gorm:"type:varchar(500)"`       // 配置描述
	// 可选的适配参数（JSON 格式，用于适配不同服务商的细微差异）
	// 例如：{"auth_header": "X-API-Key", "response_path": "data.choices[0].message.content"}
	AdapterConfig string `json:"adapter_config" gorm:"type:text"`            // 适配器配置（JSON 格式）
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

