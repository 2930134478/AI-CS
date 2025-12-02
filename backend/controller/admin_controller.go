package controller

import (
	"log"
	"net/http"
	"strconv"

	"github.com/2930134478/AI-CS/backend/service"
	"github.com/gin-gonic/gin"
)

// AdminController 负责处理管理员相关的 HTTP 请求。
type AdminController struct {
	authService *service.AuthService
	userService *service.UserService
}

// NewAdminController 创建 AdminController 实例。
func NewAdminController(authService *service.AuthService, userService *service.UserService) *AdminController {
	return &AdminController{
		authService: authService,
		userService: userService,
	}
}

// checkAdminPermission 检查当前用户是否是管理员。
// 暂时从 query 参数获取 current_user_id，后续可以改为从 JWT token 获取。
func (a *AdminController) checkAdminPermission(c *gin.Context) (uint, bool) {
	userIDStr := c.Query("current_user_id")
	if userIDStr == "" {
		// 也可以从请求头获取
		userIDStr = c.GetHeader("X-Current-User-ID")
	}
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未提供当前用户ID"})
		return 0, false
	}

	userID, err := strconv.ParseUint(userIDStr, 10, 64)
	if err != nil || userID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "用户ID不合法"})
		return 0, false
	}

	// 检查用户是否是管理员
	user, err := a.userService.GetUser(uint(userID))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户不存在"})
		return 0, false
	}

	if user.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "权限不足，只有管理员才能执行此操作"})
		return 0, false
	}

	return uint(userID), true
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

// ListUsers 获取所有用户列表。
func (a *AdminController) ListUsers(c *gin.Context) {
	// 检查权限
	currentUserID, ok := a.checkAdminPermission(c)
	if !ok {
		return
	}
	_ = currentUserID // 暂时不使用，但保留用于后续日志记录

	users, err := a.userService.ListUsers()
	if err != nil {
		log.Printf("❌ 获取用户列表失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取用户列表失败"})
		return
	}

	c.JSON(http.StatusOK, users)
}

// GetUser 获取用户详情。
func (a *AdminController) GetUser(c *gin.Context) {
	// 检查权限
	currentUserID, ok := a.checkAdminPermission(c)
	if !ok {
		return
	}
	_ = currentUserID

	// 获取用户ID
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "用户ID不合法"})
		return
	}

	user, err := a.userService.GetUser(uint(id))
	if err != nil {
		if err.Error() == "用户不存在" {
			c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		} else {
			log.Printf("❌ 获取用户详情失败: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取用户详情失败"})
		}
		return
	}

	c.JSON(http.StatusOK, user)
}

// CreateUser 处理创建新用户的请求。
func (a *AdminController) CreateUser(c *gin.Context) {
	// 检查权限
	currentUserID, ok := a.checkAdminPermission(c)
	if !ok {
		return
	}
	_ = currentUserID

	var req struct {
		Username string  `json:"username"`
		Password string  `json:"password"`
		Role     string  `json:"role"`
		Nickname *string `json:"nickname"`
		Email    *string `json:"email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	user, err := a.userService.CreateUser(service.CreateUserInput{
		Username: req.Username,
		Password: req.Password,
		Role:     req.Role,
		Nickname: req.Nickname,
		Email:    req.Email,
	})
	if err != nil {
		switch err {
		case service.ErrUsernameExists:
			c.JSON(http.StatusBadRequest, gin.H{"error": "用户名已存在"})
		default:
			log.Printf("❌ 创建用户失败: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "创建成功",
		"user":    user,
	})
}

// UpdateUser 处理更新用户信息的请求。
func (a *AdminController) UpdateUser(c *gin.Context) {
	// 检查权限
	currentUserID, ok := a.checkAdminPermission(c)
	if !ok {
		return
	}
	_ = currentUserID

	// 获取用户ID
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "用户ID不合法"})
		return
	}

	var req struct {
		Role                   *string `json:"role"`
		Nickname               *string `json:"nickname"`
		Email                  *string `json:"email"`
		ReceiveAIConversations *bool   `json:"receive_ai_conversations"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	user, err := a.userService.UpdateUser(service.UpdateUserInput{
		UserID:                 uint(id),
		Role:                   req.Role,
		Nickname:               req.Nickname,
		Email:                  req.Email,
		ReceiveAIConversations: req.ReceiveAIConversations,
	})
	if err != nil {
		if err.Error() == "用户不存在" {
			c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		} else {
			log.Printf("❌ 更新用户失败: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "更新成功",
		"user":    user,
	})
}

// DeleteUser 处理删除用户的请求。
func (a *AdminController) DeleteUser(c *gin.Context) {
	// 检查权限
	currentUserID, ok := a.checkAdminPermission(c)
	if !ok {
		return
	}

	// 获取用户ID
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "用户ID不合法"})
		return
	}

	if err := a.userService.DeleteUser(uint(id), currentUserID); err != nil {
		if err.Error() == "用户不存在" {
			c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		} else {
			log.Printf("❌ 删除用户失败: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}

// UpdateUserPassword 处理更新用户密码的请求。
func (a *AdminController) UpdateUserPassword(c *gin.Context) {
	// 检查权限
	currentUserID, ok := a.checkAdminPermission(c)
	if !ok {
		return
	}

	// 获取用户ID
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "用户ID不合法"})
		return
	}

	var req struct {
		OldPassword *string `json:"old_password"`
		NewPassword string  `json:"new_password"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	// 判断是否是管理员修改其他用户密码
	isAdmin := uint(id) != currentUserID

	if err := a.userService.UpdateUserPassword(service.UpdatePasswordInput{
		UserID:      uint(id),
		OldPassword: req.OldPassword,
		NewPassword: req.NewPassword,
		IsAdmin:     isAdmin,
	}); err != nil {
		if err.Error() == "用户不存在" {
			c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		} else {
			log.Printf("❌ 更新密码失败: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "密码更新成功"})
}
