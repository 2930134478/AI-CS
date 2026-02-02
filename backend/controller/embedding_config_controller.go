package controller

import (
	"net/http"

	"github.com/2930134478/AI-CS/backend/service"
	"github.com/gin-gonic/gin"
)

// EmbeddingConfigController 知识库向量配置控制器
type EmbeddingConfigController struct {
	service *service.EmbeddingConfigService
}

// NewEmbeddingConfigController 创建控制器实例
func NewEmbeddingConfigController(s *service.EmbeddingConfigService) *EmbeddingConfigController {
	return &EmbeddingConfigController{service: s}
}

// Get 获取当前配置（API Key 脱敏）
// GET /agent/embedding-config?user_id=1
func (e *EmbeddingConfigController) Get(c *gin.Context) {
	_, err := parseUintQuery(c, "user_id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id 不合法"})
		return
	}
	result, err := e.service.GetForAPI()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

// Update 更新配置（仅管理员）
// PUT /agent/embedding-config
// Body: { "user_id": 1, "embedding_type": "openai", "api_url": "...", "api_key": "...", "model": "...", "customer_can_use_kb": true }
func (e *EmbeddingConfigController) Update(c *gin.Context) {
	var req struct {
		UserID            uint    `json:"user_id" binding:"required"`
		EmbeddingType     *string `json:"embedding_type"`
		APIURL            *string `json:"api_url"`
		APIKey            *string `json:"api_key"`
		Model             *string `json:"model"`
		CustomerCanUseKB  *bool   `json:"customer_can_use_kb"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}
	result, err := e.service.Update(req.UserID, service.UpdateEmbeddingConfigInput{
		EmbeddingType:    req.EmbeddingType,
		APIURL:           req.APIURL,
		APIKey:           req.APIKey,
		Model:            req.Model,
		CustomerCanUseKB: req.CustomerCanUseKB,
	})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}
