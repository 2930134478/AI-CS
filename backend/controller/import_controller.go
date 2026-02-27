package controller

import (
	"context"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/2930134478/AI-CS/backend/service"
	"github.com/gin-gonic/gin"
)

// ImportController 导入控制器
type ImportController struct {
	importService          *service.ImportService
	embeddingConfigService *service.EmbeddingConfigService
}

// NewImportController 创建导入控制器实例
func NewImportController(importService *service.ImportService, embeddingConfigService *service.EmbeddingConfigService) *ImportController {
	return &ImportController{
		importService:          importService,
		embeddingConfigService: embeddingConfigService,
	}
}

func (c *ImportController) checkKBAccess(ctx *gin.Context) bool {
	userID := getUserIDFromHeader(ctx)
	if userID == 0 {
		// ⚠️ 修复：改为拒绝访问，而不是允许
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "未授权访问，请提供 X-User-Id 请求头"})
		return false
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

	// ⚠️ 添加：文件类型验证
	allowedExts := map[string]bool{
		".md":   true,
		".txt":  true,
		".pdf":  true,
		".doc":  true,
		".docx": true,
	}

	// 保存文件到临时目录
	filePaths := make([]string, 0, len(files))
	for _, file := range files {
		// ⚠️ 添加：验证文件类型
		ext := strings.ToLower(filepath.Ext(file.Filename))
		if !allowedExts[ext] {
			log.Printf("不支持的文件类型: %s (扩展名: %s)", file.Filename, ext)
			continue
		}

		// ⚠️ 添加：清理文件名，防止路径遍历攻击
		safeFilename := filepath.Base(file.Filename)
		safeFilename = strings.ReplaceAll(safeFilename, "..", "")
		safeFilename = strings.ReplaceAll(safeFilename, "/", "")
		safeFilename = strings.ReplaceAll(safeFilename, "\\", "")
		// 限制文件名长度
		if len(safeFilename) > 255 {
			safeFilename = safeFilename[:255]
		}

		// 保存文件
		filePath := "/tmp/" + safeFilename
		if err := ctx.SaveUploadedFile(file, filePath); err != nil {
			log.Printf("保存文件失败: %v", err)
			continue
		}
		filePaths = append(filePaths, filePath)
	}

	if len(filePaths) == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "没有有效的文件（所有文件都被拒绝或保存失败）"})
		return
	}

	// ⚠️ 添加：导入后清理临时文件
	defer func() {
		for _, path := range filePaths {
			if err := os.Remove(path); err != nil {
				log.Printf("清理临时文件失败: %v", err)
			}
		}
	}()

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
		URLs            []string `json:"urls" binding:"required"`
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
