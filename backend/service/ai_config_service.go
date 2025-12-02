package service

import (
	"errors"
	"fmt"

	"github.com/2930134478/AI-CS/backend/models"
	"github.com/2930134478/AI-CS/backend/repository"
	"github.com/2930134478/AI-CS/backend/utils"
)

// AIConfigService AI 配置服务（负责管理 AI 配置）
type AIConfigService struct {
	aiConfigRepo *repository.AIConfigRepository
	userRepo     *repository.UserRepository
}

// NewAIConfigService 创建 AI 配置服务实例。
func NewAIConfigService(
	aiConfigRepo *repository.AIConfigRepository,
	userRepo *repository.UserRepository,
) *AIConfigService {
	return &AIConfigService{
		aiConfigRepo: aiConfigRepo,
		userRepo:     userRepo,
	}
}

// CreateAIConfigInput 创建 AI 配置的输入参数。
type CreateAIConfigInput struct {
	UserID      uint
	Provider    string
	APIURL      string
	APIKey      string // 明文 API Key（会被加密存储）
	Model       string
	ModelType   string
	IsActive    bool
	IsPublic    bool   // 是否开放给访客使用
	Description string
}

// UpdateAIConfigInput 更新 AI 配置的输入参数。
type UpdateAIConfigInput struct {
	ID          uint
	Provider    *string
	APIURL      *string
	APIKey      *string // 明文 API Key（如果提供，会被加密存储）
	Model       *string
	ModelType   *string
	IsActive    *bool
	IsPublic    *bool   // 是否开放给访客使用
	Description *string
}

// AIConfigResult AI 配置返回结果（不包含加密的 API Key）。
type AIConfigResult struct {
	ID          uint   `json:"id"`
	UserID      uint   `json:"user_id"`
	Provider    string `json:"provider"`
	APIURL      string `json:"api_url"`
	Model       string `json:"model"`
	ModelType   string `json:"model_type"`
	Protocol    string `json:"protocol"`
	IsActive    bool   `json:"is_active"`
	IsPublic    bool   `json:"is_public"`
	Description string `json:"description"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

// CreateAIConfig 创建 AI 配置。
func (s *AIConfigService) CreateAIConfig(input CreateAIConfigInput) (*AIConfigResult, error) {
	// 验证用户是否存在
	_, err := s.userRepo.GetByID(input.UserID)
	if err != nil {
		return nil, errors.New("用户不存在")
	}

	// 验证 API Key 不能为空
	if input.APIKey == "" {
		return nil, errors.New("API Key 不能为空")
	}

	// 加密 API Key
	encryptedKey, err := utils.EncryptAPIKey(input.APIKey)
	if err != nil {
		return nil, fmt.Errorf("加密 API Key 失败: %v", err)
	}

	// 设置默认值
	modelType := input.ModelType
	if modelType == "" {
		modelType = "text"
	}

	// 创建配置
	config := &models.AIConfig{
		UserID:      input.UserID,
		Provider:    input.Provider,
		APIURL:      input.APIURL,
		APIKey:      encryptedKey,
		Model:       input.Model,
		ModelType:   modelType,
		IsActive:    input.IsActive,
		IsPublic:    input.IsPublic,
		Description: input.Description,
	}

	if err := s.aiConfigRepo.Create(config); err != nil {
		return nil, err
	}

	return s.toResult(config), nil
}

// GetAIConfig 获取 AI 配置（不返回加密的 API Key）。
func (s *AIConfigService) GetAIConfig(id uint) (*AIConfigResult, error) {
	config, err := s.aiConfigRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	return s.toResult(config), nil
}

// ListAIConfigs 获取指定用户的所有 AI 配置。
func (s *AIConfigService) ListAIConfigs(userID uint) ([]AIConfigResult, error) {
	configs, err := s.aiConfigRepo.ListByUserID(userID)
	if err != nil {
		return nil, err
	}

	results := make([]AIConfigResult, 0, len(configs))
	for _, config := range configs {
		results = append(results, *s.toResult(&config))
	}

	return results, nil
}

// UpdateAIConfig 更新 AI 配置。
func (s *AIConfigService) UpdateAIConfig(input UpdateAIConfigInput) (*AIConfigResult, error) {
	// 检查配置是否存在
	_, err := s.aiConfigRepo.GetByID(input.ID)
	if err != nil {
		return nil, errors.New("AI 配置不存在")
	}

	// 构建更新字段
	updates := make(map[string]interface{})
	if input.Provider != nil {
		updates["provider"] = *input.Provider
	}
	if input.APIURL != nil {
		updates["api_url"] = *input.APIURL
	}
		if input.APIKey != nil {
			// 验证 API Key 不能为空
			if *input.APIKey == "" {
				return nil, errors.New("API Key 不能为空")
			}
			// 如果提供了新的 API Key，需要加密
			encryptedKey, err := utils.EncryptAPIKey(*input.APIKey)
			if err != nil {
				return nil, fmt.Errorf("加密 API Key 失败: %v", err)
			}
			updates["api_key"] = encryptedKey
		}
	if input.Model != nil {
		updates["model"] = *input.Model
	}
	if input.ModelType != nil {
		updates["model_type"] = *input.ModelType
	}
	if input.IsActive != nil {
		updates["is_active"] = *input.IsActive
	}
	if input.IsPublic != nil {
		updates["is_public"] = *input.IsPublic
	}
	if input.Description != nil {
		updates["description"] = *input.Description
	}

	if err := s.aiConfigRepo.UpdateFields(input.ID, updates); err != nil {
		return nil, err
	}

	// 返回更新后的配置
	return s.GetAIConfig(input.ID)
}

// DeleteAIConfig 删除 AI 配置。
func (s *AIConfigService) DeleteAIConfig(id uint) error {
	return s.aiConfigRepo.Delete(id)
}

// GetPublicModels 获取所有开放的模型配置（供访客选择）。
func (s *AIConfigService) GetPublicModels(modelType string) ([]AIConfigResult, error) {
	configs, err := s.aiConfigRepo.ListPublic(modelType)
	if err != nil {
		return nil, err
	}
	
	results := make([]AIConfigResult, 0, len(configs))
	for _, config := range configs {
		results = append(results, *s.toResult(&config))
	}
	
	return results, nil
}

// toResult 将模型转换为返回结果（不包含加密的 API Key）。
func (s *AIConfigService) toResult(config *models.AIConfig) *AIConfigResult {
	return &AIConfigResult{
		ID:          config.ID,
		UserID:      config.UserID,
		Provider:    config.Provider,
		APIURL:      config.APIURL,
		Model:       config.Model,
		ModelType:   config.ModelType,
		IsActive:    config.IsActive,
		IsPublic:    config.IsPublic,
		Description: config.Description,
		CreatedAt:   config.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt:   config.UpdatedAt.Format("2006-01-02 15:04:05"),
	}
}

