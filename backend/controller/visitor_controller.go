package controller

import (
	"net/http"

	"github.com/2930134478/AI-CS/backend/service"
	"github.com/gin-gonic/gin"
)

// VisitorController 负责处理访客相关的 HTTP 请求。
type VisitorController struct {
	visitorService *service.VisitorService
}

// NewVisitorController 创建 VisitorController 实例。
func NewVisitorController(visitorService *service.VisitorService) *VisitorController {
	return &VisitorController{
		visitorService: visitorService,
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

