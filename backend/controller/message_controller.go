package controller

import (
	"log"
	"net/http"
	"strconv"

	"github.com/2930134478/AI-CS/backend/service"
	"github.com/gin-gonic/gin"
)

// MessageController 负责处理消息相关的 HTTP 请求。
type MessageController struct {
	messageService *service.MessageService
}

// NewMessageController 创建 MessageController 实例。
func NewMessageController(messageService *service.MessageService) *MessageController {
	return &MessageController{messageService: messageService}
}

type createMessageRequest struct {
	ConversationID uint   `json:"conversation_id"`
	Content        string `json:"content"`
	SenderIsAgent  bool   `json:"sender_is_agent"`
	SenderID       uint   `json:"sender_id"`
}

// CreateMessage 处理发送消息的请求。
func (mc *MessageController) CreateMessage(c *gin.Context) {
	var req createMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.ConversationID == 0 || req.Content == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	_, err := mc.messageService.CreateMessage(service.CreateMessageInput{
		ConversationID: req.ConversationID,
		Content:        req.Content,
		SenderID:       req.SenderID,
		SenderIsAgent:  req.SenderIsAgent,
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

	messages, err := mc.messageService.ListMessages(uint(conversationID))
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
