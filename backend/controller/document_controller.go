package controller

import (
	"log"
	"net/http"
	"strconv"

	"github.com/2930134478/AI-CS/backend/service"
	"github.com/gin-gonic/gin"
)

// DocumentController 文档控制器
type DocumentController struct {
	documentService       *service.DocumentService
	embeddingConfigService *service.EmbeddingConfigService
}

// NewDocumentController 创建文档控制器实例
func NewDocumentController(documentService *service.DocumentService, embeddingConfigService *service.EmbeddingConfigService) *DocumentController {
	return &DocumentController{
		documentService:       documentService,
		embeddingConfigService: embeddingConfigService,
	}
}

func (c *DocumentController) checkKBAccess(ctx *gin.Context) bool {
	userID := getUserIDFromHeader(ctx)
	if userID == 0 {
		return true
	}
	if err := c.embeddingConfigService.CheckKnowledgeBaseAccess(userID); err != nil {
		ctx.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return false
	}
	return true
}

// ListDocuments 获取文档列表
func (c *DocumentController) ListDocuments(ctx *gin.Context) {
	if !c.checkKBAccess(ctx) {
		return
	}
	// 获取查询参数
	kbIDStr := ctx.Query("knowledge_base_id")
	pageStr := ctx.DefaultQuery("page", "1")
	pageSizeStr := ctx.DefaultQuery("page_size", "20")
	keyword := ctx.Query("keyword")
	status := ctx.Query("status")

	var knowledgeBaseID uint
	if kbIDStr != "" {
		id, err := strconv.ParseUint(kbIDStr, 10, 64)
		if err == nil {
			knowledgeBaseID = uint(id)
		}
	}

	page, _ := strconv.Atoi(pageStr)
	pageSize, _ := strconv.Atoi(pageSizeStr)

	result, err := c.documentService.ListDocuments(knowledgeBaseID, page, pageSize, keyword, status)
	if err != nil {
		log.Printf("获取文档列表失败: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "获取文档列表失败"})
		return
	}

	ctx.JSON(http.StatusOK, result)
}

// GetDocument 获取文档详情
func (c *DocumentController) GetDocument(ctx *gin.Context) {
	if !c.checkKBAccess(ctx) {
		return
	}
	idStr := ctx.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || id == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "文档 ID 不合法"})
		return
	}

	doc, err := c.documentService.GetDocument(uint(id))
	if err != nil {
		log.Printf("获取文档详情失败: %v", err)
		ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, doc)
}

// CreateDocument 创建文档
func (c *DocumentController) CreateDocument(ctx *gin.Context) {
	if !c.checkKBAccess(ctx) {
		return
	}
	var req struct {
		KnowledgeBaseID uint   `json:"knowledge_base_id" binding:"required"`
		Title           string `json:"title" binding:"required"`
		Content         string `json:"content" binding:"required"`
		Summary         string `json:"summary"`
		Type            string `json:"type"`
		Status          string `json:"status"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	doc, err := c.documentService.CreateDocument(service.CreateDocumentInput{
		KnowledgeBaseID: req.KnowledgeBaseID,
		Title:           req.Title,
		Content:         req.Content,
		Summary:         req.Summary,
		Type:            req.Type,
		Status:          req.Status,
	})
	if err != nil {
		log.Printf("创建文档失败: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, doc)
}

// UpdateDocument 更新文档
func (c *DocumentController) UpdateDocument(ctx *gin.Context) {
	if !c.checkKBAccess(ctx) {
		return
	}
	idStr := ctx.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || id == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "文档 ID 不合法"})
		return
	}

	var req struct {
		Title   *string `json:"title"`
		Content *string `json:"content"`
		Summary *string `json:"summary"`
		Type    *string `json:"type"`
		Status  *string `json:"status"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	doc, err := c.documentService.UpdateDocument(uint(id), service.UpdateDocumentInput{
		Title:   req.Title,
		Content: req.Content,
		Summary: req.Summary,
		Type:    req.Type,
		Status:  req.Status,
	})
	if err != nil {
		log.Printf("更新文档失败: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, doc)
}

// DeleteDocument 删除文档
func (c *DocumentController) DeleteDocument(ctx *gin.Context) {
	if !c.checkKBAccess(ctx) {
		return
	}
	idStr := ctx.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || id == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "文档 ID 不合法"})
		return
	}

	if err := c.documentService.DeleteDocument(uint(id)); err != nil {
		log.Printf("删除文档失败: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}

// SearchDocuments 向量检索搜索文档
func (c *DocumentController) SearchDocuments(ctx *gin.Context) {
	if !c.checkKBAccess(ctx) {
		return
	}
	query := ctx.Query("query")
	topKStr := ctx.DefaultQuery("top_k", "5")
	kbIDStr := ctx.Query("knowledge_base_id")

	if query == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "查询内容不能为空"})
		return
	}

	topK, _ := strconv.Atoi(topKStr)
	if topK <= 0 {
		topK = 5
	}

	var knowledgeBaseID *uint
	if kbIDStr != "" {
		id, err := strconv.ParseUint(kbIDStr, 10, 64)
		if err == nil {
			kbID := uint(id)
			knowledgeBaseID = &kbID
		}
	}

	docs, err := c.documentService.SearchDocuments(query, topK, knowledgeBaseID)
	if err != nil {
		log.Printf("搜索文档失败: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "向量检索失败: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"count":     len(docs),
		"documents": docs,
	})
}

// HybridSearchDocuments 混合检索搜索文档（当前实现与向量检索相同）
func (c *DocumentController) HybridSearchDocuments(ctx *gin.Context) {
	c.SearchDocuments(ctx)
}

// UpdateDocumentStatus 更新文档状态
func (c *DocumentController) UpdateDocumentStatus(ctx *gin.Context) {
	if !c.checkKBAccess(ctx) {
		return
	}
	idStr := ctx.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || id == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "文档 ID 不合法"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.documentService.UpdateDocumentStatus(uint(id), req.Status); err != nil {
		log.Printf("更新文档状态失败: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "更新成功"})
}

// PublishDocument 发布文档
func (c *DocumentController) PublishDocument(ctx *gin.Context) {
	if !c.checkKBAccess(ctx) {
		return
	}
	idStr := ctx.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || id == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "文档 ID 不合法"})
		return
	}

	if err := c.documentService.PublishDocument(uint(id)); err != nil {
		log.Printf("发布文档失败: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "发布成功"})
}

// UnpublishDocument 取消发布文档
func (c *DocumentController) UnpublishDocument(ctx *gin.Context) {
	if !c.checkKBAccess(ctx) {
		return
	}
	idStr := ctx.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || id == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "文档 ID 不合法"})
		return
	}

	if err := c.documentService.UnpublishDocument(uint(id)); err != nil {
		log.Printf("取消发布文档失败: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "取消发布成功"})
}
