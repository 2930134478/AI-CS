package controller

import (
	"net/http"

	"github.com/2930134478/AI-CS/backend/service"
	"github.com/gin-gonic/gin"
)

// VisitorController 负责处理访客相关的 HTTP 请求。
type VisitorController struct {
	visitorService        *service.VisitorService
	embeddingConfigService *service.EmbeddingConfigService
}

// NewVisitorController 创建 VisitorController 实例。
func NewVisitorController(visitorService *service.VisitorService, embeddingConfigService *service.EmbeddingConfigService) *VisitorController {
	return &VisitorController{
		visitorService:         visitorService,
		embeddingConfigService: embeddingConfigService,
	}
}

// GetOnlineAgents 获取在线客服列表（供访客查看）。
// GET /visitor/online-agents
func (v *VisitorController) GetOnlineAgents(c *gin.Context) {
	agents, err := v.visitorService.GetOnlineAgents()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"agents": agents,
	})
}

// GetWidgetConfig 获取访客小窗配置（联网设置等，无需登录）。
// GET /visitor/widget-config
func (v *VisitorController) GetWidgetConfig(c *gin.Context) {
	cfg, err := v.embeddingConfigService.GetVisitorWebSearchConfig()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cfg)
}

