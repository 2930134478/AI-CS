package router

import (
	"github.com/2930134478/AI-CS/backend/controller"
	"github.com/gin-gonic/gin"
)

// ControllerSet 用于收集路由需要的控制器集合。
type ControllerSet struct {
	Auth             *controller.AuthController
	Conversation     *controller.ConversationController
	Message          *controller.MessageController
	Admin            *controller.AdminController
	Profile          *controller.ProfileController
	AIConfig         *controller.AIConfigController
	EmbeddingConfig  *controller.EmbeddingConfigController
	PromptConfig     *controller.PromptConfigController
	FAQ              *controller.FAQController
	Document         *controller.DocumentController
	KnowledgeBase    *controller.KnowledgeBaseController
	Import           *controller.ImportController
	Visitor          *controller.VisitorController
	Health           *controller.HealthController
	Analytics        *controller.AnalyticsController
	SystemLog        *controller.SystemLogController
}

// RegisterRoutes 注册 HTTP 路由及对应的处理函数。
func RegisterRoutes(r *gin.Engine, controllers ControllerSet, wsHandler gin.HandlerFunc) {
	register := func(routes gin.IRoutes) {
		// Auth
		routes.POST("/login", controllers.Auth.Login)
		routes.POST("/logout", controllers.Auth.Logout)

		// Conversation
		routes.POST("/conversation/init", controllers.Conversation.InitConversation)
		routes.POST("/conversations/internal", controllers.Conversation.InitInternalConversation) // 创建内部对话（知识库测试）
		routes.GET("/conversations", controllers.Conversation.ListConversations)
		routes.GET("/conversations/:id", controllers.Conversation.GetConversationDetail)
		routes.POST("/conversations/:id/close", controllers.Conversation.CloseConversation)
		routes.PUT("/conversations/:id/contact", controllers.Conversation.UpdateContactInfo)
		routes.GET("/conversations/search", controllers.Conversation.SearchConversations)
		routes.GET("/conversations/ai-models", controllers.Conversation.GetPublicAIModels) // 获取开放的模型列表（供访客选择）

		// Message
		routes.POST("/messages", controllers.Message.CreateMessage)
		routes.POST("/messages/upload", controllers.Message.UploadFile) // 文件上传接口（支持客服和访客上传）
		routes.GET("/messages", controllers.Message.ListMessages)
		routes.PUT("/messages/read", controllers.Message.MarkMessagesRead)

		// Admin（用户管理）
		routes.GET("/admin/users", controllers.Admin.ListUsers)                       // 获取所有用户列表
		routes.GET("/admin/users/:id", controllers.Admin.GetUser)                     // 获取用户详情
		routes.POST("/admin/users", controllers.Admin.CreateUser)                     // 创建新用户
		routes.PUT("/admin/users/:id", controllers.Admin.UpdateUser)                  // 更新用户信息
		routes.DELETE("/admin/users/:id", controllers.Admin.DeleteUser)               // 删除用户
		routes.PUT("/admin/users/:id/password", controllers.Admin.UpdateUserPassword) // 更新用户密码
		// 兼容旧接口
		routes.POST("/admin/agents", controllers.Admin.CreateAgent) // 创建客服（兼容旧接口）

		// Profile（个人资料）
		routes.GET("/agent/profile/:user_id", controllers.Profile.GetProfile)
		routes.PUT("/agent/profile/:user_id", controllers.Profile.UpdateProfile)
		routes.POST("/agent/avatar/:user_id", controllers.Profile.UploadAvatar)

		// AI Config（AI 配置）
		routes.POST("/agent/ai-config/:user_id", controllers.AIConfig.CreateAIConfig)
		routes.GET("/agent/ai-config/:user_id", controllers.AIConfig.ListAIConfigs)
		routes.GET("/agent/ai-config/:user_id/:id", controllers.AIConfig.GetAIConfig)
		routes.PUT("/agent/ai-config/:user_id/:id", controllers.AIConfig.UpdateAIConfig)
		routes.DELETE("/agent/ai-config/:user_id/:id", controllers.AIConfig.DeleteAIConfig)

		// Embedding Config（知识库向量模型配置，平台级）
		routes.GET("/agent/embedding-config", controllers.EmbeddingConfig.Get)
		routes.PUT("/agent/embedding-config", controllers.EmbeddingConfig.Update)

		// Prompt Config（提示词配置，平台级，仅管理员可更新）
		routes.GET("/agent/prompts", controllers.PromptConfig.Get)
		routes.PUT("/agent/prompts", controllers.PromptConfig.Update)

		// FAQ（事件管理/常见问题）
		routes.GET("/faqs", controllers.FAQ.ListFAQs)         // 获取 FAQ 列表（支持关键词搜索）
		routes.GET("/faqs/:id", controllers.FAQ.GetFAQ)       // 获取 FAQ 详情
		routes.POST("/faqs", controllers.FAQ.CreateFAQ)       // 创建 FAQ
		routes.PUT("/faqs/:id", controllers.FAQ.UpdateFAQ)    // 更新 FAQ
		routes.DELETE("/faqs/:id", controllers.FAQ.DeleteFAQ) // 删除 FAQ

		// Document（文档管理）
		routes.GET("/documents", controllers.Document.ListDocuments)                       // 获取文档列表（支持分页、搜索、状态过滤）
		routes.GET("/documents/:id", controllers.Document.GetDocument)                     // 获取文档详情
		routes.POST("/documents", controllers.Document.CreateDocument)                     // 创建文档
		routes.PUT("/documents/:id", controllers.Document.UpdateDocument)                  // 更新文档
		routes.DELETE("/documents/:id", controllers.Document.DeleteDocument)               // 删除文档
		routes.GET("/documents/search", controllers.Document.SearchDocuments)              // 向量检索搜索文档
		routes.GET("/documents/hybrid-search", controllers.Document.HybridSearchDocuments) // 混合检索搜索文档
		routes.PUT("/documents/:id/status", controllers.Document.UpdateDocumentStatus)     // 更新文档状态
		routes.POST("/documents/:id/publish", controllers.Document.PublishDocument)        // 发布文档
		routes.POST("/documents/:id/unpublish", controllers.Document.UnpublishDocument)    // 取消发布文档

		// KnowledgeBase（知识库管理）
		routes.GET("/knowledge-bases", controllers.KnowledgeBase.ListKnowledgeBases)                               // 获取知识库列表
		routes.GET("/knowledge-bases/:id", controllers.KnowledgeBase.GetKnowledgeBase)                             // 获取知识库详情
		routes.POST("/knowledge-bases", controllers.KnowledgeBase.CreateKnowledgeBase)                             // 创建知识库
		routes.PUT("/knowledge-bases/:id", controllers.KnowledgeBase.UpdateKnowledgeBase)                          // 更新知识库
		routes.PATCH("/knowledge-bases/:id/rag-enabled", controllers.KnowledgeBase.UpdateKnowledgeBaseRAGEnabled)  // 知识库是否参与 RAG
		routes.DELETE("/knowledge-bases/:id", controllers.KnowledgeBase.DeleteKnowledgeBase)                       // 删除知识库
		routes.GET("/knowledge-bases/:id/documents", controllers.KnowledgeBase.ListDocumentsByKnowledgeBase)       // 获取知识库的文档列表

		// Import（文档导入）
		routes.POST("/import/documents", controllers.Import.ImportDocuments) // 批量导入文档（文件上传）
		routes.POST("/import/urls", controllers.Import.ImportFromURLs)       // 批量导入文档（URL 爬取）

		// Visitor（访客相关）
		routes.GET("/visitor/online-agents", controllers.Visitor.GetOnlineAgents)           // 获取在线客服列表
		routes.GET("/visitor/widget-config", controllers.Visitor.GetWidgetConfig)           // 访客小窗配置（联网设置等，无需登录）
		routes.POST("/visitor/analytics/widget-open", controllers.Analytics.PostWidgetOpen) // 访客打开小窗埋点

		// Analytics（数据分析报表，需客服 X-User-Id）
		routes.GET("/agent/analytics/summary", controllers.Analytics.GetSummary)
		routes.GET("/agent/logs/api", controllers.SystemLog.GetLogs)                   // 日志查询（避免与前端 /agent/logs 页面路径冲突）
		routes.GET("/agent/logs/min-level", controllers.SystemLog.GetLogMinLevel)      // 最低落库级别（读）
		routes.PUT("/agent/logs/min-level", controllers.SystemLog.PutLogMinLevel)       // 最低落库级别（写库并生效）
		routes.DELETE("/agent/logs/min-level", controllers.SystemLog.DeleteLogMinLevel) // 恢复为 .env
		routes.POST("/agent/logs/frontend", controllers.SystemLog.ReportFrontendLog)   // 前端日志上报

		// Health（健康检查）
		routes.GET("/health", controllers.Health.HealthCheck)     // 健康检查
		routes.GET("/health/metrics", controllers.Health.Metrics) // 性能指标

		// WebSocket
		routes.GET("/ws", wsHandler)
	}

	// 兼容旧路径（无前缀）
	register(r)
	// 新路径：/api 前缀，便于反向代理“同域 API”
	register(r.Group("/api"))
}
