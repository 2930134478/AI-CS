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

	// Message
	r.POST("/messages", controllers.Message.CreateMessage)
	r.GET("/messages", controllers.Message.ListMessages)
	r.PUT("/messages/read", controllers.Message.MarkMessagesRead)

	// Admin
	r.POST("/admin/users", controllers.Admin.CreateAgent)

	// Profile（个人资料）
	r.GET("/agent/profile/:user_id", controllers.Profile.GetProfile)
	r.PUT("/agent/profile/:user_id", controllers.Profile.UpdateProfile)
	r.POST("/agent/avatar/:user_id", controllers.Profile.UploadAvatar)

	// WebSocket
	r.GET("/ws", wsHandler)
}
