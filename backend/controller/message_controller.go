package controller

import (
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
	messageService *service.MessageService
	storageService infra.StorageService
}

// NewMessageController 创建 MessageController 实例。
func NewMessageController(messageService *service.MessageService, storageService infra.StorageService) *MessageController {
	return &MessageController{
		messageService: messageService,
		storageService: storageService,
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
func (mc *MessageController) UploadFile(c *gin.Context) {
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

	// 验证文件类型
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

	// 获取对话ID（可选）
	var conversationID uint
	if conversationIDStr := c.PostForm("conversation_id"); conversationIDStr != "" {
		if id, err := strconv.ParseUint(conversationIDStr, 10, 64); err == nil {
			conversationID = uint(id)
		}
	}

	// 打开文件
	src, err := file.Open()
	if err != nil {
		log.Printf("❌ 打开文件失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "打开文件失败"})
		return
	}
	defer src.Close()

	// 保存文件
	fileURL, err := mc.storageService.SaveMessageFile(conversationID, src, file.Filename)
	if err != nil {
		log.Printf("❌ 保存文件失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "保存文件失败"})
		return
	}

	// 判断文件类型
	fileType := "document"
	mimeType := file.Header.Get("Content-Type")
	if strings.HasPrefix(mimeType, "image/") {
		fileType = "image"
	}

	// 返回文件信息
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"file_url":  fileURL,
			"file_type": fileType,
			"file_name": file.Filename,
			"file_size": file.Size,
			"mime_type": mimeType,
		},
	})
}
