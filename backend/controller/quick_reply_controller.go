package controller

import (
	"log"
	"net/http"
	"strconv"

	"github.com/2930134478/AI-CS/backend/service"
	"github.com/gin-gonic/gin"
)

// QuickReplyController 负责处理快捷回复模板相关的 HTTP 请求。
type QuickReplyController struct {
	service *service.QuickReplyService
}

// NewQuickReplyController 创建 QuickReplyController 实例。
func NewQuickReplyController(service *service.QuickReplyService) *QuickReplyController {
	return &QuickReplyController{service: service}
}

// ListQuickReplies 获取快捷回复模板列表。
// GET /quick-replies?user_id=1&category=问候
func (c *QuickReplyController) ListQuickReplies(ctx *gin.Context) {
	// 获取用户ID
	userIDStr := ctx.Query("user_id")
	if userIDStr == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "user_id 参数必填"})
		return
	}
	userID, err := strconv.ParseUint(userIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "user_id 参数不合法"})
		return
	}

	// 获取分类（可选）
	category := ctx.Query("category")

	// 查询模板列表
	summaries, err := c.service.ListQuickReplies(uint(userID), category)
	if err != nil {
		log.Printf("查询快捷回复模板列表失败: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "查询失败"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"quick_replies": summaries,
	})
}

// GetQuickReply 获取快捷回复模板详情。
// GET /quick-replies/:id
func (c *QuickReplyController) GetQuickReply(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || id == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "ID 不合法"})
		return
	}

	summary, err := c.service.GetQuickReply(uint(id))
	if err != nil {
		log.Printf("查询快捷回复模板失败: %v", err)
		ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, summary)
}

// CreateQuickReply 创建快捷回复模板。
// POST /quick-replies
func (c *QuickReplyController) CreateQuickReply(ctx *gin.Context) {
	var req struct {
		UserID    *uint   `json:"user_id"`
		Title     string  `json:"title"`
		Content   string  `json:"content" binding:"required"`
		Category  string  `json:"category"`
		SortOrder int     `json:"sort_order"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	summary, err := c.service.CreateQuickReply(service.CreateQuickReplyInput{
		UserID:    req.UserID,
		Title:     req.Title,
		Content:   req.Content,
		Category:  req.Category,
		SortOrder: req.SortOrder,
	})
	if err != nil {
		log.Printf("创建快捷回复模板失败: %v", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, summary)
}

// UpdateQuickReply 更新快捷回复模板。
// PUT /quick-replies/:id
func (c *QuickReplyController) UpdateQuickReply(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || id == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "ID 不合法"})
		return
	}

	var req struct {
		Title     *string `json:"title"`
		Content   *string `json:"content"`
		Category  *string `json:"category"`
		SortOrder *int    `json:"sort_order"`
		UserID    *uint   `json:"user_id"` // 操作者ID，用于权限检查
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	summary, err := c.service.UpdateQuickReply(uint(id), service.UpdateQuickReplyInput{
		Title:     req.Title,
		Content:   req.Content,
		Category:  req.Category,
		SortOrder: req.SortOrder,
	}, req.UserID)
	if err != nil {
		log.Printf("更新快捷回复模板失败: %v", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, summary)
}

// DeleteQuickReply 删除快捷回复模板。
// DELETE /quick-replies/:id
func (c *QuickReplyController) DeleteQuickReply(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || id == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "ID 不合法"})
		return
	}

	// 获取操作者ID
	userIDStr := ctx.Query("user_id")
	var userID *uint
	if userIDStr != "" {
		uid, err := strconv.ParseUint(userIDStr, 10, 64)
		if err == nil {
			u := uint(uid)
			userID = &u
		}
	}

	if err := c.service.DeleteQuickReply(uint(id), userID); err != nil {
		log.Printf("删除快捷回复模板失败: %v", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}

// RecordUsage 记录快捷回复使用。
// POST /quick-replies/:id/use
func (c *QuickReplyController) RecordUsage(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || id == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "ID 不合法"})
		return
	}

	if err := c.service.RecordUsage(uint(id)); err != nil {
		log.Printf("记录使用次数失败: %v", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "记录成功"})
}

// GetCategories 获取所有分类。
// GET /quick-replies/categories?user_id=1
func (c *QuickReplyController) GetCategories(ctx *gin.Context) {
	userIDStr := ctx.Query("user_id")
	if userIDStr == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "user_id 参数必填"})
		return
	}
	userID, err := strconv.ParseUint(userIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "user_id 参数不合法"})
		return
	}

	categories, err := c.service.GetCategories(uint(userID))
	if err != nil {
		log.Printf("获取分类列表失败: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "获取失败"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"categories": categories,
	})
}
