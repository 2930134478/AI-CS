package controller

import (
	"net/http"

	"github.com/2930134478/AI-CS/backend/service"
	"github.com/2930134478/AI-CS/backend/utils"
	"github.com/gin-gonic/gin"
)

// ConversationController 负责处理会话相关的 HTTP 请求。
type ConversationController struct {
	conversationService *service.ConversationService
}

// NewConversationController 创建 ConversationController 实例。
func NewConversationController(conversationService *service.ConversationService) *ConversationController {
	return &ConversationController{conversationService: conversationService}
}

type initConversationRequest struct {
	VisitorID uint   `json:"visitor_id"`
	Website   string `json:"website"`
	Referrer  string `json:"referrer"`
	Browser   string `json:"browser"`
	OS        string `json:"os"`
	Language  string `json:"language"`
}

type updateContactRequest struct {
	Email *string `json:"email"`
	Phone *string `json:"phone"`
	Notes *string `json:"notes"`
}

// InitConversation 为访客初始化或恢复会话。
func (cc *ConversationController) InitConversation(c *gin.Context) {
	var req initConversationRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.VisitorID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	browser := req.Browser
	os := req.OS
	if browser == "" || os == "" {
		parsedBrowser, parsedOS := utils.ParseUserAgent(c.GetHeader("User-Agent"))
		if browser == "" {
			browser = parsedBrowser
		}
		if os == "" {
			os = parsedOS
		}
	}

	result, err := cc.conversationService.InitConversation(service.InitConversationInput{
		VisitorID: req.VisitorID,
		Website:   req.Website,
		Referrer:  req.Referrer,
		Browser:   browser,
		OS:        os,
		Language:  req.Language,
		IPAddress: utils.GetClientIP(c),
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建对话失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"conversation_id": result.ConversationID,
		"status":          result.Status,
	})
}

// UpdateContactInfo 用于更新访客的联系信息。
func (cc *ConversationController) UpdateContactInfo(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "会话ID不合法"})
		return
	}

	var req updateContactRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	if req.Email == nil && req.Phone == nil && req.Notes == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "至少提供一个需要更新的字段"})
		return
	}

	result, err := cc.conversationService.UpdateConversationContact(service.UpdateConversationContactInput{
		ConversationID: uint(id),
		Email:          req.Email,
		Phone:          req.Phone,
		Notes:          req.Notes,
	})
	if err != nil {
		if err == service.ErrConversationNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "会话不存在"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "更新失败"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"email": result.Email,
		"phone": result.Phone,
		"notes": result.Notes,
	})
}

// ListConversations 返回当前活跃会话的列表。
func (cc *ConversationController) ListConversations(c *gin.Context) {
	conversations, err := cc.conversationService.ListConversations()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询对话列表失败"})
		return
	}

	items := make([]gin.H, 0, len(conversations))
	for _, conv := range conversations {
		item := gin.H{
			"id":           conv.ID,
			"visitor_id":   conv.VisitorID,
			"agent_id":     conv.AgentID,
			"status":       conv.Status,
			"created_at":   formatTimeValue(conv.CreatedAt),
			"updated_at":   formatTimeValue(conv.UpdatedAt),
			"unread_count": conv.UnreadCount,
		}

		// 添加 last_seen_at 字段（用于判断在线状态）
		if lastSeen := formatTimePointer(conv.LastSeenAt); lastSeen != "" {
			item["last_seen_at"] = lastSeen
		}

		if conv.LastMessage != nil {
			item["last_message"] = gin.H{
				"id":              conv.LastMessage.ID,
				"content":         conv.LastMessage.Content,
				"sender_is_agent": conv.LastMessage.SenderIsAgent,
				"message_type":    conv.LastMessage.MessageType,
				"is_read":         conv.LastMessage.IsRead,
				"read_at":         formatTimePointer(conv.LastMessage.ReadAt),
				"created_at":      formatTimeValue(conv.LastMessage.CreatedAt),
			}
		}
		items = append(items, item)
	}

	c.JSON(http.StatusOK, items)
}

// GetConversationDetail 返回会话的详细信息。
func (cc *ConversationController) GetConversationDetail(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "会话ID不合法"})
		return
	}

	detail, err := cc.conversationService.GetConversationDetail(uint(id))
	if err != nil {
		if err == service.ErrConversationNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "会话不存在"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "查询失败"})
		}
		return
	}

	response := gin.H{
		"id":           detail.ID,
		"visitor_id":   detail.VisitorID,
		"agent_id":     detail.AgentID,
		"status":       detail.Status,
		"website":      detail.Website,
		"referrer":     detail.Referrer,
		"browser":      detail.Browser,
		"os":           detail.OS,
		"language":     detail.Language,
		"ip_address":   detail.IPAddress,
		"location":     detail.Location,
		"email":        detail.Email,
		"phone":        detail.Phone,
		"notes":        detail.Notes,
		"created_at":   formatTimeValue(detail.CreatedAt),
		"updated_at":   formatTimeValue(detail.UpdatedAt),
		"unread_count": detail.UnreadCount,
	}
	if lastSeen := formatTimePointer(detail.LastSeen); lastSeen != "" {
		response["last_seen_at"] = lastSeen
	}
	if detail.LastMessage != nil {
		response["last_message"] = gin.H{
			"id":              detail.LastMessage.ID,
			"content":         detail.LastMessage.Content,
			"sender_is_agent": detail.LastMessage.SenderIsAgent,
			"message_type":    detail.LastMessage.MessageType,
			"is_read":         detail.LastMessage.IsRead,
			"read_at":         formatTimePointer(detail.LastMessage.ReadAt),
			"created_at":      formatTimeValue(detail.LastMessage.CreatedAt),
		}
	}

	c.JSON(http.StatusOK, response)
}

// SearchConversations 根据关键字进行会话的模糊搜索。
func (cc *ConversationController) SearchConversations(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "搜索关键词不能为空"})
		return
	}

	conversations, err := cc.conversationService.SearchConversations(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "搜索失败"})
		return
	}

	items := make([]gin.H, 0, len(conversations))
	for _, conv := range conversations {
		item := gin.H{
			"id":           conv.ID,
			"visitor_id":   conv.VisitorID,
			"agent_id":     conv.AgentID,
			"status":       conv.Status,
			"created_at":   formatTimeValue(conv.CreatedAt),
			"updated_at":   formatTimeValue(conv.UpdatedAt),
			"unread_count": conv.UnreadCount,
		}

		// 添加 last_seen_at 字段（用于判断在线状态）
		if lastSeen := formatTimePointer(conv.LastSeenAt); lastSeen != "" {
			item["last_seen_at"] = lastSeen
		}

		if conv.LastMessage != nil {
			item["last_message"] = gin.H{
				"id":              conv.LastMessage.ID,
				"content":         conv.LastMessage.Content,
				"sender_is_agent": conv.LastMessage.SenderIsAgent,
				"message_type":    conv.LastMessage.MessageType,
				"is_read":         conv.LastMessage.IsRead,
				"read_at":         formatTimePointer(conv.LastMessage.ReadAt),
				"created_at":      formatTimeValue(conv.LastMessage.CreatedAt),
			}
		}
		items = append(items, item)
	}

	c.JSON(http.StatusOK, items)
}
