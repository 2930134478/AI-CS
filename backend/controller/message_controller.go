package controller

import (
	"bytes"
	"io"
	"log"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/2930134478/AI-CS/backend/infra"
	"github.com/2930134478/AI-CS/backend/service"
	"github.com/gin-gonic/gin"
)

// MessageController 负责处理消息相关的 HTTP 请求。
type MessageController struct {
	messageService     *service.MessageService
	conversationService *service.ConversationService
	storageService     infra.StorageService
}

// NewMessageController 创建 MessageController 实例。
func NewMessageController(messageService *service.MessageService, conversationService *service.ConversationService, storageService infra.StorageService) *MessageController {
	return &MessageController{
		messageService:     messageService,
		conversationService: conversationService,
		storageService:     storageService,
	}
}

type createMessageRequest struct {
	ConversationID uint    `json:"conversation_id"`
	Content        string  `json:"content"`
	SenderIsAgent  bool    `json:"sender_is_agent"`
	SenderID       uint    `json:"sender_id"`
	// 文件相关字段（可选）
	FileURL  *string `json:"file_url"`
	FileType *string `json:"file_type"`
	FileName *string `json:"file_name"`
	FileSize *int64  `json:"file_size"`
	MimeType *string `json:"mime_type"`
}

// CreateMessage 处理发送消息的请求。
func (mc *MessageController) CreateMessage(c *gin.Context) {
	var req createMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.ConversationID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	// 验证：必须有内容或文件
	if req.Content == "" && req.FileURL == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "消息内容或文件不能同时为空"})
		return
	}

	_, err := mc.messageService.CreateMessage(service.CreateMessageInput{
		ConversationID: req.ConversationID,
		Content:        req.Content,
		SenderID:       req.SenderID,
		SenderIsAgent:  req.SenderIsAgent,
		FileURL:        req.FileURL,
		FileType:       req.FileType,
		FileName:       req.FileName,
		FileSize:       req.FileSize,
		MimeType:       req.MimeType,
	})
	if err != nil {
		log.Printf("❌ 创建消息失败: 对话ID=%d, 错误=%v", req.ConversationID, err)
		switch err {
		case service.ErrConversationClosed:
			c.JSON(http.StatusBadRequest, gin.H{"error": "会话已关闭"})
		case service.ErrConversationNotFound:
			c.JSON(http.StatusBadRequest, gin.H{"error": "会话不存在"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "创建消息失败"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "创建消息成功"})
}

// ListMessages 返回指定会话的消息列表。
// 查询参数：
//   - conversation_id: 会话ID（必需）
//   - include_ai_messages: 是否包含 AI 消息（可选，默认 false）
func (mc *MessageController) ListMessages(c *gin.Context) {
	conversationIDStr := c.Query("conversation_id")
	if conversationIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "会话ID不能为空"})
		return
	}

	conversationID, err := strconv.ParseUint(conversationIDStr, 10, 64)
	if err != nil || conversationID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "会话ID不合法"})
		return
	}

	// 解析 include_ai_messages 参数（默认 false）
	includeAIMessages := c.DefaultQuery("include_ai_messages", "false") == "true"

	messages, err := mc.messageService.ListMessages(uint(conversationID), includeAIMessages)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询消息失败"})
		return
	}

	c.JSON(http.StatusOK, messages)
}

type markMessagesReadRequest struct {
	ConversationID uint `json:"conversation_id"`
	ReaderIsAgent  bool `json:"reader_is_agent"`
}

// MarkMessagesRead 将指定会话的消息标记为已读。
func (mc *MessageController) MarkMessagesRead(c *gin.Context) {
	var req markMessagesReadRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.ConversationID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	result, err := mc.messageService.MarkMessagesRead(req.ConversationID, req.ReaderIsAgent)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新消息状态失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"updated":         len(result.MessageIDs),
		"message_ids":     result.MessageIDs,
		"conversation_id": result.ConversationID,
		"unread_count":    result.UnreadCount,
		"read_at":         formatTimeValue(result.ReadAt),
	})
}

// UploadFile 处理文件上传请求。
// 请求格式：multipart/form-data
//   - file: 文件内容（必需）
//   - conversation_id: 对话ID（可选，用于组织目录）
// 认证方式：
//   - 方式1：提供 X-User-Id 请求头（客服上传）
//   - 方式2：提供 conversation_id 参数（访客上传，会验证对话是否存在且未关闭）
func (mc *MessageController) UploadFile(c *gin.Context) {
	// ⚠️ 认证检查：必须满足以下条件之一
	// 1. 提供 X-User-Id 请求头（客服）
	// 2. 提供 conversation_id 参数（访客）
	userID := getUserIDFromHeader(c)
	conversationIDStr := c.PostForm("conversation_id")
	
	// 如果既没有用户ID，也没有对话ID，拒绝访问
	if userID == 0 && conversationIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权访问，请提供 X-User-Id 请求头或 conversation_id 参数"})
		return
	}
	
	// 如果是访客上传（没有用户ID，但有对话ID），验证对话是否存在且未关闭
	if userID == 0 && conversationIDStr != "" {
		convID, err := strconv.ParseUint(conversationIDStr, 10, 64)
		if err != nil || convID == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "对话ID不合法"})
			return
		}
		// 验证对话是否存在且未关闭
		conv, err := mc.conversationService.GetConversationDetail(uint(convID), 0)
		if err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "对话不存在或已关闭"})
			return
		}
		if conv.Status == "closed" {
			c.JSON(http.StatusForbidden, gin.H{"error": "对话已关闭"})
			return
		}
	}
	
	// 解析文件
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "文件不能为空"})
		return
	}

	// 验证文件大小（10MB）
	const maxFileSize = 10 * 1024 * 1024 // 10MB
	if file.Size > maxFileSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": "文件大小超过限制（最大10MB）"})
		return
	}

	// ⚠️ 加强：验证文件类型（扩展名）
	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowedExts := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".gif":  true,
		".webp": true,
		".pdf":  true,
		".doc":  true,
		".docx": true,
		".txt":  true,
	}
	if !allowedExts[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "不支持的文件类型"})
		return
	}

	// ⚠️ 加强：验证 MIME 类型（防止伪造扩展名）
	mimeType := file.Header.Get("Content-Type")
	allowedMimeTypes := map[string]bool{
		"image/jpeg":      true,
		"image/jpg":       true,
		"image/png":       true,
		"image/gif":       true,
		"image/webp":      true,
		"application/pdf": true,
		"application/msword": true,
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document": true, // .docx
		"text/plain":     true,
	}
	if !allowedMimeTypes[mimeType] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "不支持的文件 MIME 类型: " + mimeType})
		return
	}

	// ⚠️ 加强：清理文件名，防止路径遍历攻击
	safeFilename := filepath.Base(file.Filename)
	safeFilename = strings.ReplaceAll(safeFilename, "..", "")
	safeFilename = strings.ReplaceAll(safeFilename, "/", "")
	safeFilename = strings.ReplaceAll(safeFilename, "\\", "")
	// 移除所有非字母数字、点、下划线、连字符的字符
	var cleaned strings.Builder
	for _, r := range safeFilename {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '.' || r == '_' || r == '-' {
			cleaned.WriteRune(r)
		}
	}
	safeFilename = cleaned.String()
	// 限制文件名长度
	if len(safeFilename) > 100 {
		// 保留扩展名
		ext := filepath.Ext(safeFilename)
		nameWithoutExt := strings.TrimSuffix(safeFilename, ext)
		if len(nameWithoutExt) > 100-len(ext) {
			safeFilename = nameWithoutExt[:100-len(ext)] + ext
		}
	}
	
	// ⚠️ 加强：验证文件内容（magic number 检查，防止伪造扩展名）
	fileContent, err := file.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无法读取文件"})
		return
	}
	defer fileContent.Close()
	
	// 读取文件前几个字节（magic number）
	magicBytes := make([]byte, 12)
	n, err := fileContent.Read(magicBytes)
	if err != nil && err != io.EOF {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无法读取文件内容"})
		return
	}
	
	// 验证文件内容是否匹配扩展名
	if !isValidFileContent(ext, magicBytes[:n]) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "文件内容与扩展名不匹配，可能是伪造的文件类型"})
		return
	}
	
	// 重置文件指针，以便后续保存
	if _, err := fileContent.Seek(0, io.SeekStart); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "无法重置文件指针"})
		return
	}

	// 获取对话ID（如果之前已经解析过，直接使用；否则从表单获取）
	var conversationID uint
	if conversationIDStr != "" {
		if id, err := strconv.ParseUint(conversationIDStr, 10, 64); err == nil {
			conversationID = uint(id)
		}
	}

	// 保存文件（使用清理后的文件名，fileContent 已经在上面打开并验证过）
	fileURL, err := mc.storageService.SaveMessageFile(conversationID, fileContent, safeFilename)
	if err != nil {
		log.Printf("❌ 保存文件失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "保存文件失败"})
		return
	}

	// 判断文件类型
	fileType := "document"
	if strings.HasPrefix(mimeType, "image/") {
		fileType = "image"
	}

	// 返回文件信息（使用清理后的文件名）
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"file_url":  fileURL,
			"file_type": fileType,
			"file_name": safeFilename,
			"file_size": file.Size,
			"mime_type": mimeType,
		},
	})
}

// isValidFileContent 验证文件内容是否与扩展名匹配（通过 magic number 检查）
func isValidFileContent(ext string, magicBytes []byte) bool {
	if len(magicBytes) < 4 {
		return false
	}
	
	ext = strings.ToLower(ext)
	
	// 检查各种文件类型的 magic number
	switch ext {
	case ".jpg", ".jpeg":
		// JPEG: FF D8 FF
		return len(magicBytes) >= 3 && magicBytes[0] == 0xFF && magicBytes[1] == 0xD8 && magicBytes[2] == 0xFF
	case ".png":
		// PNG: 89 50 4E 47
		return len(magicBytes) >= 4 && magicBytes[0] == 0x89 && magicBytes[1] == 0x50 && magicBytes[2] == 0x4E && magicBytes[3] == 0x47
	case ".gif":
		// GIF: 47 49 46 38 (GIF8)
		return len(magicBytes) >= 4 && magicBytes[0] == 0x47 && magicBytes[1] == 0x49 && magicBytes[2] == 0x46 && magicBytes[3] == 0x38
	case ".webp":
		// WebP: RIFF ... WEBP
		if len(magicBytes) >= 12 {
			return bytes.Equal(magicBytes[0:4], []byte("RIFF")) && bytes.Equal(magicBytes[8:12], []byte("WEBP"))
		}
		return false
	case ".pdf":
		// PDF: 25 50 44 46 (%PDF)
		return len(magicBytes) >= 4 && magicBytes[0] == 0x25 && magicBytes[1] == 0x50 && magicBytes[2] == 0x44 && magicBytes[3] == 0x46
	case ".txt":
		// 文本文件：检查是否为可打印字符（ASCII 32-126）或 UTF-8 BOM
		// UTF-8 BOM: EF BB BF
		if len(magicBytes) >= 3 && magicBytes[0] == 0xEF && magicBytes[1] == 0xBB && magicBytes[2] == 0xBF {
			return true
		}
		// 检查前几个字节是否都是可打印字符
		for i := 0; i < len(magicBytes) && i < 10; i++ {
			if magicBytes[i] < 0x20 && magicBytes[i] != 0x09 && magicBytes[i] != 0x0A && magicBytes[i] != 0x0D {
				// 不是可打印字符、制表符、换行符或回车符
				return false
			}
		}
		return true
	case ".doc":
		// DOC (OLE2): D0 CF 11 E0 A1 B1 1A E1
		return len(magicBytes) >= 8 && magicBytes[0] == 0xD0 && magicBytes[1] == 0xCF && magicBytes[2] == 0x11 && magicBytes[3] == 0xE0
	case ".docx":
		// DOCX (ZIP): 50 4B 03 04 (PK..)
		return len(magicBytes) >= 4 && magicBytes[0] == 0x50 && magicBytes[1] == 0x4B && magicBytes[2] == 0x03 && magicBytes[3] == 0x04
	default:
		return false
	}
}
