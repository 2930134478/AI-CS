package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/2930134478/AI-CS/backend/models"
	"github.com/2930134478/AI-CS/backend/repository"
	"github.com/2930134478/AI-CS/backend/utils"
)

// EmbeddingConfigService 知识库向量配置服务
type EmbeddingConfigService struct {
	repo     *repository.EmbeddingConfigRepository
	userRepo *repository.UserRepository
}

// NewEmbeddingConfigService 创建服务实例
func NewEmbeddingConfigService(repo *repository.EmbeddingConfigRepository, userRepo *repository.UserRepository) *EmbeddingConfigService {
	return &EmbeddingConfigService{repo: repo, userRepo: userRepo}
}

// GetForAPI 返回给前端的配置（API Key 脱敏，不返回明文）
func (s *EmbeddingConfigService) GetForAPI() (*EmbeddingConfigResult, error) {
	c, err := s.repo.Get()
	if err != nil {
		return nil, err
	}
	if c == nil {
		return &EmbeddingConfigResult{
			EmbeddingType:    "openai",
			APIURL:           "",
			APIKeyMasked:     "",
			Model:            "text-embedding-3-small",
			CustomerCanUseKB: true,
		}, nil
	}
	masked := ""
	if c.APIKey != "" {
		masked = "sk-***"
	}
	return &EmbeddingConfigResult{
		ID:               c.ID,
		EmbeddingType:    c.EmbeddingType,
		APIURL:           c.APIURL,
		APIKeyMasked:     masked,
		Model:            c.Model,
		CustomerCanUseKB: c.CustomerCanUseKB,
		UpdatedAt:       c.UpdatedAt,
	}, nil
}

// GetRaw 供 embedding 工厂使用，返回含解密后 API Key 的配置；若 DB 无有效配置返回 nil, nil
func (s *EmbeddingConfigService) GetRaw() (embeddingType, apiURL, apiKey, model string, err error) {
	c, err := s.repo.Get()
	if err != nil || c == nil || c.APIKey == "" {
		return "", "", "", "", nil
	}
	decrypted, err := utils.DecryptAPIKey(c.APIKey)
	if err != nil {
		return "", "", "", "", fmt.Errorf("解密 API Key 失败: %w", err)
	}
	return c.EmbeddingType, c.APIURL, decrypted, c.Model, nil
}

// CustomerCanUseKB 是否开放知识库给客服使用
func (s *EmbeddingConfigService) CustomerCanUseKB() (bool, error) {
	c, err := s.repo.Get()
	if err != nil {
		return false, err
	}
	if c == nil {
		return true, nil // 默认开放
	}
	return c.CustomerCanUseKB, nil
}

// CheckKnowledgeBaseAccess 校验当前用户是否允许使用知识库（创建/上传/导入等）
// 若未开放且用户非 admin 则返回 error
func (s *EmbeddingConfigService) CheckKnowledgeBaseAccess(userID uint) error {
	ok, err := s.CustomerCanUseKB()
	if err != nil {
		return err
	}
	if ok {
		return nil
	}
	user, err := s.userRepo.GetByID(userID)
	if err != nil || user == nil {
		return errors.New("用户不存在")
	}
	if user.Role == "admin" {
		return nil
	}
	return errors.New("当前未开放知识库功能，仅管理员可使用")
}

// Update 更新配置（仅管理员可调）；若传入 api_key 为空则保留原密钥
func (s *EmbeddingConfigService) Update(userID uint, input UpdateEmbeddingConfigInput) (*EmbeddingConfigResult, error) {
	user, err := s.userRepo.GetByID(userID)
	if err != nil || user == nil {
		return nil, errors.New("用户不存在")
	}
	if user.Role != "admin" {
		return nil, errors.New("仅管理员可修改知识库向量配置")
	}

	c, err := s.repo.Get()
	if err != nil {
		return nil, err
	}
	if c == nil {
		c = &models.EmbeddingConfig{ID: 1}
	}

	if input.EmbeddingType != nil {
		c.EmbeddingType = *input.EmbeddingType
	}
	if input.APIURL != nil {
		c.APIURL = *input.APIURL
	}
	if input.APIKey != nil && *input.APIKey != "" {
		encrypted, err := utils.EncryptAPIKey(*input.APIKey)
		if err != nil {
			return nil, fmt.Errorf("加密 API Key 失败: %v", err)
		}
		c.APIKey = encrypted
	}
	if input.Model != nil {
		c.Model = *input.Model
	}
	if input.CustomerCanUseKB != nil {
		c.CustomerCanUseKB = *input.CustomerCanUseKB
	}

	if err := s.repo.Save(c); err != nil {
		return nil, err
	}
	return s.GetForAPI()
}

// EmbeddingConfigResult 返回给前端的结构（不含明文 API Key）
type EmbeddingConfigResult struct {
	ID               uint   `json:"id"`
	EmbeddingType    string `json:"embedding_type"`
	APIURL           string `json:"api_url"`
	APIKeyMasked     string `json:"api_key_masked"`
	Model            string `json:"model"`
	CustomerCanUseKB bool   `json:"customer_can_use_kb"`
	UpdatedAt       time.Time `json:"updated_at,omitempty"`
}

// UpdateEmbeddingConfigInput 更新入参
type UpdateEmbeddingConfigInput struct {
	EmbeddingType    *string `json:"embedding_type"`
	APIURL           *string `json:"api_url"`
	APIKey           *string `json:"api_key"`
	Model            *string `json:"model"`
	CustomerCanUseKB *bool   `json:"customer_can_use_kb"`
}
