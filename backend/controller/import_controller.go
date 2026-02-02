package controller

import (
	"context"
	"log"
	"net/http"
	"strconv"

	"github.com/2930134478/AI-CS/backend/service"
	"github.com/gin-gonic/gin"
)

// ImportController 导入控制器
type ImportController struct {
	importService         *service.ImportService
	embeddingConfigService *service.EmbeddingConfigService
}

// NewImportController 创建导入控制器实例
func NewImportController(importService *service.ImportService, embeddingConfigService *service.EmbeddingConfigService) *ImportController {
	return &ImportController{
		importService:         importService,
		embeddingConfigService: embeddingConfigService,
	}
}

func (c *ImportController) checkKBAccess(ctx *gin.Context) bool {
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

// ImportDocuments 批量导入文档（文件上传）
func (c *ImportController) ImportDocuments(ctx *gin.Context) {
	if !c.checkKBAccess(ctx) {
		return
	}
	// 获取知识库 ID
	kbIDStr := ctx.PostForm("knowledge_base_id")
	if kbIDStr == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "知识库 ID 不能为空"})
		return
	}

	kbID, err := strconv.ParseUint(kbIDStr, 10, 64)
	if err != nil || kbID == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "知识库 ID 不合法"})
		return
	}

	// 获取上传的文件
	form, err := ctx.MultipartForm()
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "获取文件失败"})
		return
	}

	files := form.File["files"]
	if len(files) == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "未上传文件"})
		return
	}

	// 保存文件到临时目录
	filePaths := make([]string, 0, len(files))
	for _, file := range files {
		// 保存文件
		filePath := "/tmp/" + file.Filename
		if err := ctx.SaveUploadedFile(file, filePath); err != nil {
			log.Printf("保存文件失败: %v", err)
			continue
		}
		filePaths = append(filePaths, filePath)
	}

	// 导入文件
	result, err := c.importService.ImportFiles(context.Background(), uint(kbID), filePaths)
	if err != nil {
		log.Printf("导入文件失败: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "批量导入失败: " + err.Error()})
		return
	}

	result.Message = "导入完成"
	ctx.JSON(http.StatusOK, result)
}

// ImportFromURLs 批量导入文档（URL 爬取）
func (c *ImportController) ImportFromURLs(ctx *gin.Context) {
	if !c.checkKBAccess(ctx) {
		return
	}
	var req struct {
		KnowledgeBaseID uint     `json:"knowledge_base_id" binding:"required"`
		URLs           []string `json:"urls" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误: " + err.Error()})
		return
	}

	result, err := c.importService.ImportFromUrls(context.Background(), req.KnowledgeBaseID, req.URLs)
	if err != nil {
		log.Printf("导入 URL 失败: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "批量导入失败: " + err.Error()})
		return
	}

	result.Message = "导入完成"
	ctx.JSON(http.StatusOK, result)
}
