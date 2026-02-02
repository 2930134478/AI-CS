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
	FAQ              *controller.FAQController
	Document         *controller.DocumentController
	KnowledgeBase    *controller.KnowledgeBaseController
	Import           *controller.ImportController
	Visitor          *controller.VisitorController
	Health           *controller.HealthController
}

// RegisterRoutes 注册 HTTP 路由及对应的处理函数。
func RegisterRoutes(r *gin.Engine, controllers ControllerSet, wsHandler gin.HandlerFunc) {
	// Auth
	r.POST("/login", controllers.Auth.Login)
	r.POST("/logout", controllers.Auth.Logout)

	// Conversation
	r.POST("/conversation/init", controllers.Conversation.InitConversation)
	r.POST("/conversations/internal", controllers.Conversation.InitInternalConversation) // 创建内部对话（知识库测试）
	r.GET("/conversations", controllers.Conversation.ListConversations)
	r.GET("/conversations/:id", controllers.Conversation.GetConversationDetail)
	r.PUT("/conversations/:id/contact", controllers.Conversation.UpdateContactInfo)
	r.GET("/conversations/search", controllers.Conversation.SearchConversations)
	r.GET("/conversations/ai-models", controllers.Conversation.GetPublicAIModels) // 获取开放的模型列表（供访客选择）

	// Message
	r.POST("/messages", controllers.Message.CreateMessage)
	r.POST("/messages/upload", controllers.Message.UploadFile) // 文件上传接口
	r.GET("/messages", controllers.Message.ListMessages)
	r.PUT("/messages/read", controllers.Message.MarkMessagesRead)

	// Admin（用户管理）
	r.GET("/admin/users", controllers.Admin.ListUsers)                    // 获取所有用户列表
	r.GET("/admin/users/:id", controllers.Admin.GetUser)                  // 获取用户详情
	r.POST("/admin/users", controllers.Admin.CreateUser)                  // 创建新用户
	r.PUT("/admin/users/:id", controllers.Admin.UpdateUser)               // 更新用户信息
	r.DELETE("/admin/users/:id", controllers.Admin.DeleteUser)            // 删除用户
	r.PUT("/admin/users/:id/password", controllers.Admin.UpdateUserPassword) // 更新用户密码
	// 兼容旧接口
	r.POST("/admin/agents", controllers.Admin.CreateAgent)                // 创建客服（兼容旧接口）

	// Profile（个人资料）
	r.GET("/agent/profile/:user_id", controllers.Profile.GetProfile)
	r.PUT("/agent/profile/:user_id", controllers.Profile.UpdateProfile)
	r.POST("/agent/avatar/:user_id", controllers.Profile.UploadAvatar)

	// AI Config（AI 配置）
	r.POST("/agent/ai-config/:user_id", controllers.AIConfig.CreateAIConfig)
	r.GET("/agent/ai-config/:user_id", controllers.AIConfig.ListAIConfigs)
	r.GET("/agent/ai-config/:user_id/:id", controllers.AIConfig.GetAIConfig)
	r.PUT("/agent/ai-config/:user_id/:id", controllers.AIConfig.UpdateAIConfig)
	r.DELETE("/agent/ai-config/:user_id/:id", controllers.AIConfig.DeleteAIConfig)

	// Embedding Config（知识库向量模型配置，平台级）
	r.GET("/agent/embedding-config", controllers.EmbeddingConfig.Get)
	r.PUT("/agent/embedding-config", controllers.EmbeddingConfig.Update)

	// FAQ（事件管理/常见问题）
	r.GET("/faqs", controllers.FAQ.ListFAQs)           // 获取 FAQ 列表（支持关键词搜索）
	r.GET("/faqs/:id", controllers.FAQ.GetFAQ)         // 获取 FAQ 详情
	r.POST("/faqs", controllers.FAQ.CreateFAQ)         // 创建 FAQ
	r.PUT("/faqs/:id", controllers.FAQ.UpdateFAQ)      // 更新 FAQ
	r.DELETE("/faqs/:id", controllers.FAQ.DeleteFAQ)   // 删除 FAQ

	// Document（文档管理）
	r.GET("/documents", controllers.Document.ListDocuments)                    // 获取文档列表（支持分页、搜索、状态过滤）
	r.GET("/documents/:id", controllers.Document.GetDocument)                  // 获取文档详情
	r.POST("/documents", controllers.Document.CreateDocument)                  // 创建文档
	r.PUT("/documents/:id", controllers.Document.UpdateDocument)               // 更新文档
	r.DELETE("/documents/:id", controllers.Document.DeleteDocument)            // 删除文档
	r.GET("/documents/search", controllers.Document.SearchDocuments)           // 向量检索搜索文档
	r.GET("/documents/hybrid-search", controllers.Document.HybridSearchDocuments) // 混合检索搜索文档
	r.PUT("/documents/:id/status", controllers.Document.UpdateDocumentStatus)  // 更新文档状态
	r.POST("/documents/:id/publish", controllers.Document.PublishDocument)     // 发布文档
	r.POST("/documents/:id/unpublish", controllers.Document.UnpublishDocument) // 取消发布文档

	// KnowledgeBase（知识库管理）
	r.GET("/knowledge-bases", controllers.KnowledgeBase.ListKnowledgeBases)              // 获取知识库列表
	r.GET("/knowledge-bases/:id", controllers.KnowledgeBase.GetKnowledgeBase)            // 获取知识库详情
	r.POST("/knowledge-bases", controllers.KnowledgeBase.CreateKnowledgeBase)            // 创建知识库
	r.PUT("/knowledge-bases/:id", controllers.KnowledgeBase.UpdateKnowledgeBase)         // 更新知识库
	r.PATCH("/knowledge-bases/:id/rag-enabled", controllers.KnowledgeBase.UpdateKnowledgeBaseRAGEnabled) // 知识库是否参与 RAG
	r.DELETE("/knowledge-bases/:id", controllers.KnowledgeBase.DeleteKnowledgeBase)      // 删除知识库
	r.GET("/knowledge-bases/:id/documents", controllers.KnowledgeBase.ListDocumentsByKnowledgeBase) // 获取知识库的文档列表

	// Import（文档导入）
	r.POST("/import/documents", controllers.Import.ImportDocuments) // 批量导入文档（文件上传）
	r.POST("/import/urls", controllers.Import.ImportFromURLs)       // 批量导入文档（URL 爬取）

	// Visitor（访客相关）
	r.GET("/visitor/online-agents", controllers.Visitor.GetOnlineAgents) // 获取在线客服列表

	// Health（健康检查）
	r.GET("/health", controllers.Health.HealthCheck)       // 健康检查
	r.GET("/health/metrics", controllers.Health.Metrics)   // 性能指标

	// WebSocket
	r.GET("/ws", wsHandler)
}
