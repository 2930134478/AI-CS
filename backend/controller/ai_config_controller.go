package controller

import (
	"net/http"

	"github.com/2930134478/AI-CS/backend/service"
	"github.com/gin-gonic/gin"
)

// AIConfigController 负责处理 AI 配置相关的 HTTP 请求。
type AIConfigController struct {
	aiConfigService *service.AIConfigService
}

// NewAIConfigController 创建 AI 配置控制器实例。
func NewAIConfigController(aiConfigService *service.AIConfigService) *AIConfigController {
	return &AIConfigController{aiConfigService: aiConfigService}
}

type createAIConfigRequest struct {
	Provider    string `json:"provider" binding:"required"`
	APIURL      string `json:"api_url" binding:"required"`
	APIKey      string `json:"api_key" binding:"required"`
	Model       string `json:"model" binding:"required"`
	ModelType   string `json:"model_type"`
	IsActive    bool   `json:"is_active"`
	IsPublic    bool   `json:"is_public"` // 是否开放给访客使用
	Description string `json:"description"`
}

type updateAIConfigRequest struct {
	Provider    *string `json:"provider"`
	APIURL      *string `json:"api_url"`
	APIKey      *string `json:"api_key"`
	Model       *string `json:"model"`
	ModelType   *string `json:"model_type"`
	IsActive    *bool   `json:"is_active"`
	IsPublic    *bool   `json:"is_public"` // 是否开放给访客使用
	Description *string `json:"description"`
}

// CreateAIConfig 创建 AI 配置。
func (a *AIConfigController) CreateAIConfig(c *gin.Context) {
	userID, err := parseUintParam(c, "user_id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id 不合法"})
		return
	}

	var req createAIConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	config, err := a.aiConfigService.CreateAIConfig(service.CreateAIConfigInput{
		UserID:      uint(userID),
		Provider:    req.Provider,
		APIURL:      req.APIURL,
		APIKey:      req.APIKey,
		Model:       req.Model,
		ModelType:   req.ModelType,
		IsActive:    req.IsActive,
		IsPublic:    req.IsPublic,
		Description: req.Description,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, config)
}

// GetAIConfig 获取 AI 配置。
func (a *AIConfigController) GetAIConfig(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id 不合法"})
		return
	}

	config, err := a.aiConfigService.GetAIConfig(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "AI 配置不存在"})
		return
	}

	c.JSON(http.StatusOK, config)
}

// ListAIConfigs 获取指定用户的所有 AI 配置。
func (a *AIConfigController) ListAIConfigs(c *gin.Context) {
	userID, err := parseUintParam(c, "user_id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id 不合法"})
		return
	}

	configs, err := a.aiConfigService.ListAIConfigs(uint(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询失败"})
		return
	}

	c.JSON(http.StatusOK, configs)
}

// UpdateAIConfig 更新 AI 配置。
func (a *AIConfigController) UpdateAIConfig(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id 不合法"})
		return
	}

	var req updateAIConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	config, err := a.aiConfigService.UpdateAIConfig(service.UpdateAIConfigInput{
		ID:          uint(id),
		Provider:    req.Provider,
		APIURL:      req.APIURL,
		APIKey:      req.APIKey,
		Model:       req.Model,
		ModelType:   req.ModelType,
		IsActive:    req.IsActive,
		IsPublic:    req.IsPublic,
		Description: req.Description,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, config)
}

// DeleteAIConfig 删除 AI 配置。
func (a *AIConfigController) DeleteAIConfig(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id 不合法"})
		return
	}

	if err := a.aiConfigService.DeleteAIConfig(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}

