package controller

import (
	"net/http"

	"github.com/2930134478/AI-CS/backend/service"
	"github.com/gin-gonic/gin"
)

// AdminController 负责处理管理员相关的 HTTP 请求。
type AdminController struct {
	authService *service.AuthService
}

// NewAdminController 创建 AdminController 实例。
func NewAdminController(authService *service.AuthService) *AdminController {
	return &AdminController{authService: authService}
}

type createAgentRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

// CreateAgent 处理创建客服或管理员账号的请求。
func (a *AdminController) CreateAgent(c *gin.Context) {
	var req createAgentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := a.authService.CreateAgent(service.CreateAgentInput{
		Username: req.Username,
		Password: req.Password,
		Role:     req.Role,
	})
	if err != nil {
		switch err {
		case service.ErrUsernameExists:
			c.JSON(http.StatusBadRequest, gin.H{"error": "用户名已存在"})
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "创建成功",
		"user_id":  user.ID,
		"username": user.Username,
		"role":     user.Role,
	})
}
