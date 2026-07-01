package controller

import (
	"log"
	"net/http"
	"strconv"

	"github.com/2930134478/AI-CS/backend/models"
	"github.com/2930134478/AI-CS/backend/service"
	"github.com/gin-gonic/gin"
)

// DocumentChunkController 文档分段控制器
type DocumentChunkController struct {
	chunkService *service.ChunkService
	users        *service.UserService
}

// NewDocumentChunkController 创建文档分段控制器实例
func NewDocumentChunkController(chunkService *service.ChunkService, users *service.UserService) *DocumentChunkController {
	return &DocumentChunkController{
		chunkService: chunkService,
		users:        users,
	}
}

// ExecuteChunking 执行分段
// POST /api/documents/:id/chunks
func (c *DocumentChunkController) ExecuteChunking(ctx *gin.Context) {
	if !requirePermission(ctx, c.users, string(service.PermKnowledge)) {
		return
	}

	idStr := ctx.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || id == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "文档 ID 不合法"})
		return
	}

	var req service.ChunkRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Method != "char_count" && req.Method != "separator" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "分段方式必须为 char_count 或 separator"})
		return
	}

	chunks, err := c.chunkService.ExecuteChunking(ctx, uint(id), req)
	if err != nil {
		log.Printf("[分段] 执行分段失败 (doc=%d): %v", id, err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message":     "分段完成",
		"chunk_count": len(chunks),
		"chunks":      chunks,
	})
}

// GetChunks 获取文档分段列表
// GET /api/documents/:id/chunks?page=1&page_size=20
func (c *DocumentChunkController) GetChunks(ctx *gin.Context) {
	if !requirePermission(ctx, c.users, string(service.PermKnowledge)) {
		return
	}

	idStr := ctx.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || id == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "文档 ID 不合法"})
		return
	}

	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(ctx.DefaultQuery("page_size", "20"))

	chunks, total, err := c.chunkService.GetChunks(uint(id), page, pageSize)
	if err != nil {
		log.Printf("[分段] 获取分段列表失败 (doc=%d): %v", id, err)
		ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	if chunks == nil {
		chunks = []models.DocumentChunk{}
	}

	totalPage := int(total) / pageSize
	if int(total)%pageSize > 0 {
		totalPage++
	}

	ctx.JSON(http.StatusOK, gin.H{
		"chunks":     chunks,
		"total":      int(total),
		"page":       page,
		"page_size":  pageSize,
		"total_page": totalPage,
	})
}

// UpdateChunk 更新单个分段
// PUT /api/documents/:id/chunks/:chunkId
func (c *DocumentChunkController) UpdateChunk(ctx *gin.Context) {
	if !requirePermission(ctx, c.users, string(service.PermKnowledge)) {
		return
	}

	chunkIDStr := ctx.Param("chunkId")
	chunkID, err := strconv.ParseUint(chunkIDStr, 10, 64)
	if err != nil || chunkID == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "分段 ID 不合法"})
		return
	}

	var req struct {
		Content string `json:"content" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	chunk, err := c.chunkService.UpdateChunk(ctx, uint(chunkID), req.Content)
	if err != nil {
		log.Printf("[分段] 更新分段失败 (chunk=%d): %v", chunkID, err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, chunk)
}

// DeleteChunks 删除文档所有分段
// DELETE /api/documents/:id/chunks
func (c *DocumentChunkController) DeleteChunks(ctx *gin.Context) {
	if !requirePermission(ctx, c.users, string(service.PermKnowledge)) {
		return
	}

	idStr := ctx.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || id == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "文档 ID 不合法"})
		return
	}

	if err := c.chunkService.DeleteChunks(ctx, uint(id)); err != nil {
		log.Printf("[分段] 删除分段失败 (doc=%d): %v", id, err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "分段已删除"})
}
