package controller

import (
	"log"
	"net/http"
	"strconv"

	"github.com/2930134478/AI-CS/backend/service"
	"github.com/gin-gonic/gin"
)

// KnowledgeBaseController 知识库控制器
type KnowledgeBaseController struct {
	knowledgeBaseService   *service.KnowledgeBaseService
	embeddingConfigService *service.EmbeddingConfigService
}

// NewKnowledgeBaseController 创建知识库控制器实例
func NewKnowledgeBaseController(knowledgeBaseService *service.KnowledgeBaseService, embeddingConfigService *service.EmbeddingConfigService) *KnowledgeBaseController {
	return &KnowledgeBaseController{
		knowledgeBaseService:   knowledgeBaseService,
		embeddingConfigService: embeddingConfigService,
	}
}

// checkKBAccess 校验当前用户是否允许使用知识库（请求头须带 X-User-Id；未带则放行以兼容旧前端）
func (c *KnowledgeBaseController) checkKBAccess(ctx *gin.Context) bool {
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

// ListKnowledgeBases 获取知识库列表
func (c *KnowledgeBaseController) ListKnowledgeBases(ctx *gin.Context) {
	if !c.checkKBAccess(ctx) {
		return
	}
	kbs, err := c.knowledgeBaseService.ListKnowledgeBases()
	if err != nil {
		log.Printf("获取知识库列表失败: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "获取知识库列表失败"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"knowledge_bases": kbs,
	})
}

// GetKnowledgeBase 获取知识库详情
func (c *KnowledgeBaseController) GetKnowledgeBase(ctx *gin.Context) {
	if !c.checkKBAccess(ctx) {
		return
	}
	idStr := ctx.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || id == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "知识库 ID 不合法"})
		return
	}

	kb, err := c.knowledgeBaseService.GetKnowledgeBase(uint(id))
	if err != nil {
		log.Printf("获取知识库详情失败: %v", err)
		ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, kb)
}

// CreateKnowledgeBase 创建知识库
func (c *KnowledgeBaseController) CreateKnowledgeBase(ctx *gin.Context) {
	if !c.checkKBAccess(ctx) {
		return
	}
	var req struct {
		Name        string `json:"name" binding:"required"`
		Description string `json:"description"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	kb, err := c.knowledgeBaseService.CreateKnowledgeBase(service.CreateKnowledgeBaseInput{
		Name:        req.Name,
		Description: req.Description,
	})
	if err != nil {
		log.Printf("创建知识库失败: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, kb)
}

// UpdateKnowledgeBase 更新知识库
func (c *KnowledgeBaseController) UpdateKnowledgeBase(ctx *gin.Context) {
	if !c.checkKBAccess(ctx) {
		return
	}
	idStr := ctx.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || id == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "知识库 ID 不合法"})
		return
	}

	var req struct {
		Name        *string `json:"name"`
		Description *string `json:"description"`
		RAGEnabled  *bool   `json:"rag_enabled"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	kb, err := c.knowledgeBaseService.UpdateKnowledgeBase(uint(id), service.UpdateKnowledgeBaseInput{
		Name:        req.Name,
		Description: req.Description,
		RAGEnabled:  req.RAGEnabled,
	})
	if err != nil {
		log.Printf("更新知识库失败: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, kb)
}

// DeleteKnowledgeBase 删除知识库
func (c *KnowledgeBaseController) DeleteKnowledgeBase(ctx *gin.Context) {
	if !c.checkKBAccess(ctx) {
		return
	}
	idStr := ctx.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || id == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "知识库 ID 不合法"})
		return
	}

	if err := c.knowledgeBaseService.DeleteKnowledgeBase(uint(id)); err != nil {
		log.Printf("删除知识库失败: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}

// UpdateKnowledgeBaseRAGEnabled 仅更新知识库「参与 RAG」开关。
func (c *KnowledgeBaseController) UpdateKnowledgeBaseRAGEnabled(ctx *gin.Context) {
	if !c.checkKBAccess(ctx) {
		return
	}
	idStr := ctx.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || id == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "知识库 ID 不合法"})
		return
	}
	var req struct {
		RAGEnabled bool `json:"rag_enabled"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	kb, err := c.knowledgeBaseService.UpdateKnowledgeBase(uint(id), service.UpdateKnowledgeBaseInput{
		RAGEnabled: &req.RAGEnabled,
	})
	if err != nil {
		log.Printf("更新知识库 RAG 开关失败: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, kb)
}

// ListDocumentsByKnowledgeBase 获取知识库的文档列表
func (c *KnowledgeBaseController) ListDocumentsByKnowledgeBase(ctx *gin.Context) {
	if !c.checkKBAccess(ctx) {
		return
	}
	// 这个功能由 DocumentController 实现，这里可以重定向或调用
	ctx.JSON(http.StatusOK, gin.H{"message": "请使用 /documents?knowledge_base_id=:id"})
}
