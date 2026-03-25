package controller

import (
	"net/http"

	"github.com/2930134478/AI-CS/backend/service"
	"github.com/gin-gonic/gin"
)

// PromptConfigController 提示词配置控制器（供「提示词」页）
type PromptConfigController struct {
	service *service.PromptConfigService
}

// NewPromptConfigController 创建控制器实例
func NewPromptConfigController(s *service.PromptConfigService) *PromptConfigController {
	return &PromptConfigController{service: s}
}

// Get 获取所有提示词项（含默认内容）
// GET /agent/prompts?user_id=1
func (p *PromptConfigController) Get(c *gin.Context) {
	_, err := parseUintQuery(c, "user_id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id 不合法"})
		return
	}
	list, err := p.service.GetAllForAPI()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"prompts": list})
}

// Update 更新单条提示词（仅管理员）
// PUT /agent/prompts
// Body: { "user_id": 1, "key": "rag_prompt", "content": "..." }
func (p *PromptConfigController) Update(c *gin.Context) {
	var req struct {
		UserID  uint   `json:"user_id" binding:"required"`
		Key     string `json:"key" binding:"required"`
		Content string `json:"content"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}
	if err := p.service.Update(req.UserID, req.Key, req.Content); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "保存成功"})
}
