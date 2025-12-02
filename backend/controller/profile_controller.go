package controller

import (
	"net/http"

	"github.com/2930134478/AI-CS/backend/service"
	"github.com/gin-gonic/gin"
)

// ProfileController 负责处理个人资料相关的 HTTP 请求。
type ProfileController struct {
	profileService *service.ProfileService
}

// NewProfileController 创建 ProfileController 实例。
func NewProfileController(profileService *service.ProfileService) *ProfileController {
	return &ProfileController{profileService: profileService}
}

type updateProfileRequest struct {
	Nickname               *string `json:"nickname"`
	Email                  *string `json:"email"`
	ReceiveAIConversations *bool   `json:"receive_ai_conversations"` // 是否接收 AI 对话（可选）
}

// GetProfile 获取当前用户的个人资料。
func (p *ProfileController) GetProfile(c *gin.Context) {
	// 从路径参数获取用户ID（后续可以改为从JWT token获取）
	userID, err := parseUintParam(c, "user_id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id 不合法"})
		return
	}

	profile, err := p.profileService.GetProfile(uint(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, profile)
}

// UpdateProfile 更新当前用户的个人资料。
func (p *ProfileController) UpdateProfile(c *gin.Context) {
	// 从路径参数获取用户ID（后续可以改为从JWT token获取）
	userID, err := parseUintParam(c, "user_id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id 不合法"})
		return
	}

	var req updateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	profile, err := p.profileService.UpdateProfile(service.UpdateProfileInput{
		UserID:                 uint(userID),
		Nickname:               req.Nickname,
		Email:                  req.Email,
		ReceiveAIConversations: req.ReceiveAIConversations,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, profile)
}

// UploadAvatar 上传用户头像。
func (p *ProfileController) UploadAvatar(c *gin.Context) {
	// 从路径参数获取用户ID（后续可以改为从JWT token获取）
	userID, err := parseUintParam(c, "user_id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id 不合法"})
		return
	}

	// 获取上传的文件
	file, err := c.FormFile("avatar")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请选择头像文件"})
		return
	}

	// 验证文件类型（只允许图片）
	allowedTypes := map[string]bool{
		"image/jpeg": true,
		"image/jpg":  true,
		"image/png":  true,
		"image/gif":  true,
	}
	if !allowedTypes[file.Header.Get("Content-Type")] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "只支持上传图片文件（jpg、png、gif）"})
		return
	}

	// 验证文件大小（限制10MB）
	if file.Size > 10*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "头像文件大小不能超过10MB"})
		return
	}

	// 打开文件
	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "打开文件失败"})
		return
	}
	defer src.Close()

	// 上传头像
	profile, err := p.profileService.UploadAvatar(uint(userID), src, file.Filename)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, profile)
}

