package router

import (
	"github.com/2930134478/AI-CS/backend/controller"
	"github.com/gin-gonic/gin"
)

// ControllerSet 用于收集路由需要的控制器集合。
type ControllerSet struct {
	Auth         *controller.AuthController
	Conversation *controller.ConversationController
	Message      *controller.MessageController
	Admin        *controller.AdminController
	Profile      *controller.ProfileController
	AIConfig     *controller.AIConfigController
	FAQ          *controller.FAQController
	Visitor      *controller.VisitorController
}

// RegisterRoutes 注册 HTTP 路由及对应的处理函数。
func RegisterRoutes(r *gin.Engine, controllers ControllerSet, wsHandler gin.HandlerFunc) {
	// Auth
	r.POST("/login", controllers.Auth.Login)
	r.POST("/logout", controllers.Auth.Logout)

	// Conversation
	r.POST("/conversation/init", controllers.Conversation.InitConversation)
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

	// FAQ（事件管理/常见问题）
	r.GET("/faqs", controllers.FAQ.ListFAQs)           // 获取 FAQ 列表（支持关键词搜索）
	r.GET("/faqs/:id", controllers.FAQ.GetFAQ)         // 获取 FAQ 详情
	r.POST("/faqs", controllers.FAQ.CreateFAQ)         // 创建 FAQ
	r.PUT("/faqs/:id", controllers.FAQ.UpdateFAQ)      // 更新 FAQ
	r.DELETE("/faqs/:id", controllers.FAQ.DeleteFAQ)   // 删除 FAQ

	// Visitor（访客相关）
	r.GET("/visitor/online-agents", controllers.Visitor.GetOnlineAgents) // 获取在线客服列表

	// WebSocket
	r.GET("/ws", wsHandler)
}
