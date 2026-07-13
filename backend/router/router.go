package router

import (
	"github.com/2930134478/AI-CS/backend/controller"
	"github.com/2930134478/AI-CS/backend/middleware"
	"github.com/gin-gonic/gin"
)

// ControllerSet 用于收集路由需要的控制器集合。
type ControllerSet struct {
	Auth              *controller.AuthController
	Conversation      *controller.ConversationController
	Message           *controller.MessageController
	Admin             *controller.AdminController
	Profile           *controller.ProfileController
	AIConfig          *controller.AIConfigController
	EmbeddingConfig   *controller.EmbeddingConfigController
	EmailNotification *controller.EmailNotificationConfigController
	PromptConfig      *controller.PromptConfigController
	FAQ               *controller.FAQController
	Document          *controller.DocumentController
	KnowledgeBase     *controller.KnowledgeBaseController
	Import            *controller.ImportController
	DocumentChunk     *controller.DocumentChunkController
	Visitor           *controller.VisitorController
	Health            *controller.HealthController
	Analytics         *controller.AnalyticsController
	SystemLog         *controller.SystemLogController
}

// RegisterRoutes 注册 HTTP 路由及对应的处理函数。
func RegisterRoutes(r *gin.Engine, controllers ControllerSet, wsHandler gin.HandlerFunc) {
	registerPublic := func(routes gin.IRoutes) {
		// Auth（公开）
		routes.POST("/login", controllers.Auth.Login)
		routes.POST("/logout", controllers.Auth.Logout)

		// Conversation（访客 / 混合，控制器内校验 access_token 或登录令牌）
		routes.POST("/conversation/init", controllers.Conversation.InitConversation)
		routes.GET("/conversations/:id", controllers.Conversation.GetConversationDetail)
		routes.PUT("/conversations/:id/contact", controllers.Conversation.UpdateContactInfo)
		routes.GET("/conversations/ai-models", controllers.Conversation.GetPublicAIModels)

		// Message（访客 access_token 或客服登录令牌，控制器内校验）
		routes.POST("/messages", controllers.Message.CreateMessage)
		routes.POST("/messages/upload", controllers.Message.UploadFile)
		routes.GET("/messages", controllers.Message.ListMessages)
		routes.PUT("/messages/read", controllers.Message.MarkMessagesRead)

		// Visitor（公开）
		routes.GET("/visitor/online-agents", controllers.Visitor.GetOnlineAgents)
		routes.GET("/visitor/widget-config", controllers.Visitor.GetWidgetConfig)
		routes.POST("/visitor/analytics/widget-open", controllers.Analytics.PostWidgetOpen)

		// Health（公开）
		routes.GET("/health", controllers.Health.HealthCheck)
		routes.GET("/health/metrics", controllers.Health.Metrics)

		// WebSocket
		routes.GET("/ws", wsHandler)
	}

	registerAgent := func(group *gin.RouterGroup) {
		group.Use(middleware.AgentAuth())

		// Conversation（客服）
		group.POST("/conversations/internal", controllers.Conversation.InitInternalConversation)
		group.GET("/conversations", controllers.Conversation.ListConversations)
		group.GET("/conversations/search", controllers.Conversation.SearchConversations)
		group.POST("/conversations/:id/close", controllers.Conversation.CloseConversation)
		group.GET("/conversations/maintenance/auto-close-days", controllers.Conversation.GetAutoCloseConversationDaysPolicy)
		group.PUT("/conversations/maintenance/auto-close-days", controllers.Conversation.PutAutoCloseConversationDaysPolicy)
		group.DELETE("/conversations/maintenance/auto-close-days", controllers.Conversation.DeleteAutoCloseConversationDaysPolicy)

		// Admin（用户管理）
		group.GET("/admin/users", controllers.Admin.ListUsers)
		group.GET("/admin/users/:id", controllers.Admin.GetUser)
		group.POST("/admin/users", controllers.Admin.CreateUser)
		group.PUT("/admin/users/:id", controllers.Admin.UpdateUser)
		group.DELETE("/admin/users/:id", controllers.Admin.DeleteUser)
		group.PUT("/admin/users/:id/password", controllers.Admin.UpdateUserPassword)
		group.POST("/admin/agents", controllers.Admin.CreateAgent)

		// Profile
		group.GET("/agent/profile/:user_id", controllers.Profile.GetProfile)
		group.PUT("/agent/profile/:user_id", controllers.Profile.UpdateProfile)
		group.POST("/agent/avatar/:user_id", controllers.Profile.UploadAvatar)

		// AI Config
		group.POST("/agent/ai-config/:user_id", controllers.AIConfig.CreateAIConfig)
		group.GET("/agent/ai-config/:user_id", controllers.AIConfig.ListAIConfigs)
		group.GET("/agent/ai-config/:user_id/:id", controllers.AIConfig.GetAIConfig)
		group.PUT("/agent/ai-config/:user_id/:id", controllers.AIConfig.UpdateAIConfig)
		group.DELETE("/agent/ai-config/:user_id/:id", controllers.AIConfig.DeleteAIConfig)

		// Embedding Config
		group.GET("/agent/embedding-config", controllers.EmbeddingConfig.Get)
		group.PUT("/agent/embedding-config", controllers.EmbeddingConfig.Update)

		// Email Notification
		group.GET("/agent/email-notification-config", controllers.EmailNotification.Get)
		group.PUT("/agent/email-notification-config", controllers.EmailNotification.Update)
		group.DELETE("/agent/email-notification-config", controllers.EmailNotification.Reset)
		group.POST("/agent/email-notification-config/test", controllers.EmailNotification.SendTest)

		// Prompt Config
		group.GET("/agent/prompts", controllers.PromptConfig.Get)
		group.PUT("/agent/prompts", controllers.PromptConfig.Update)

		// FAQ
		group.GET("/faqs", controllers.FAQ.ListFAQs)
		group.GET("/faqs-search", controllers.FAQ.QuickSearch)
		group.GET("/faqs/:id", controllers.FAQ.GetFAQ)
		group.POST("/faqs", controllers.FAQ.CreateFAQ)
		group.PUT("/faqs/:id", controllers.FAQ.UpdateFAQ)
		group.DELETE("/faqs/:id", controllers.FAQ.DeleteFAQ)

		// Document
		group.GET("/documents", controllers.Document.ListDocuments)
		group.GET("/documents/:id", controllers.Document.GetDocument)
		group.POST("/documents", controllers.Document.CreateDocument)
		group.PUT("/documents/:id", controllers.Document.UpdateDocument)
		group.DELETE("/documents/:id", controllers.Document.DeleteDocument)
		group.GET("/documents/search", controllers.Document.SearchDocuments)
		group.GET("/documents/hybrid-search", controllers.Document.HybridSearchDocuments)
		group.PUT("/documents/:id/status", controllers.Document.UpdateDocumentStatus)
		group.POST("/documents/:id/publish", controllers.Document.PublishDocument)
		group.POST("/documents/:id/unpublish", controllers.Document.UnpublishDocument)
		group.POST("/documents/:id/chunks", controllers.DocumentChunk.ExecuteChunking)
		group.GET("/documents/:id/chunks", controllers.DocumentChunk.GetChunks)
		group.PUT("/documents/:id/chunks/:chunkId", controllers.DocumentChunk.UpdateChunk)
		group.DELETE("/documents/:id/chunks", controllers.DocumentChunk.DeleteChunks)

		// KnowledgeBase
		group.GET("/knowledge-bases", controllers.KnowledgeBase.ListKnowledgeBases)
		group.GET("/knowledge-bases/:id", controllers.KnowledgeBase.GetKnowledgeBase)
		group.POST("/knowledge-bases", controllers.KnowledgeBase.CreateKnowledgeBase)
		group.PUT("/knowledge-bases/:id", controllers.KnowledgeBase.UpdateKnowledgeBase)
		group.PATCH("/knowledge-bases/:id/rag-enabled", controllers.KnowledgeBase.UpdateKnowledgeBaseRAGEnabled)
		group.DELETE("/knowledge-bases/:id", controllers.KnowledgeBase.DeleteKnowledgeBase)
		group.GET("/knowledge-bases/:id/documents", controllers.KnowledgeBase.ListDocumentsByKnowledgeBase)

		// Import
		group.POST("/import/documents", controllers.Import.ImportDocuments)
		group.POST("/import/urls", controllers.Import.ImportFromURLs)

		// Analytics & Logs
		group.GET("/agent/analytics/summary", controllers.Analytics.GetSummary)
		group.GET("/agent/logs/api", controllers.SystemLog.GetLogs)
		group.GET("/agent/logs/min-level", controllers.SystemLog.GetLogMinLevel)
		group.PUT("/agent/logs/min-level", controllers.SystemLog.PutLogMinLevel)
		group.DELETE("/agent/logs/min-level", controllers.SystemLog.DeleteLogMinLevel)
		group.POST("/agent/logs/frontend", controllers.SystemLog.ReportFrontendLog)
	}

	// 兼容旧路径（无前缀）
	registerPublic(r)
	registerAgent(r.Group(""))
	// 新路径：/api 前缀
	registerPublic(r.Group("/api"))
	registerAgent(r.Group("/api"))
}
