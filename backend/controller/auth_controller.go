package controller

import (
	"net/http"

	"github.com/2930134478/AI-CS/backend/service"
	"github.com/gin-gonic/gin"
)

// AuthController 负责处理认证相关的 HTTP 请求。
type AuthController struct {
	authService *service.AuthService
}

// NewAuthController 创建 AuthController 实例。
func NewAuthController(authService *service.AuthService) *AuthController {
	return &AuthController{authService: authService}
}

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// Login 处理登录请求。
func (a *AuthController) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.Username == "" || req.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "用户名和密码不能为空"})
		return
	}

	user, err := a.authService.Login(req.Username, req.Password)
	if err != nil {
		switch err {
		case service.ErrInvalidCredentials:
			c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "登录失败"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "登录成功",
		"user_id":  user.ID,
		"username": user.Username,
		"role":     user.Role,
	})
}

// Logout 响应退出登录请求。
func (a *AuthController) Logout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "退出成功"})
}
