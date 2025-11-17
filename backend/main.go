package main

import (
	"log"
	"os"
	"path/filepath"

	"github.com/2930134478/AI-CS/backend/controller"
	"github.com/2930134478/AI-CS/backend/infra"
	"github.com/2930134478/AI-CS/backend/middleware"
	"github.com/2930134478/AI-CS/backend/models"
	"github.com/2930134478/AI-CS/backend/repository"
	appRouter "github.com/2930134478/AI-CS/backend/router"
	"github.com/2930134478/AI-CS/backend/service"
	"github.com/2930134478/AI-CS/backend/websocket"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

// 初始化默认管理员账号（如果不存在）
// 默认账号：admin / admin123
func initDefaultAdmin(userRepo *repository.UserRepository) {
	if _, err := userRepo.FindByUsername("admin"); err == nil {
		log.Println("✅ 管理员账号已存在")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("⚠️ 创建默认管理员失败：密码加密错误 %v", err)
		return
	}

	admin := &models.User{
		Username: "admin",
		Password: string(hash),
		Role:     "admin",
	}

	if err := userRepo.Create(admin); err != nil {
		log.Printf("⚠️ 创建默认管理员失败：%v", err)
		return
	}

	log.Println("✅ 默认管理员账号创建成功")
	log.Println("   用户名: admin")
	log.Println("   密码: admin123")
	log.Println("   ⚠️ 请首次登录后立即修改密码！")
}

func main() {

	// 加载 .env 文件
	// 获取当前工作目录
	wd, _ := os.Getwd()
	envPath := filepath.Join(wd, ".env")

	// 检查文件是否存在
	if _, err := os.Stat(envPath); os.IsNotExist(err) {
		log.Printf("⚠️ .env 文件不存在: %s", envPath)
		log.Println("当前工作目录:", wd)
	} else {
		log.Printf("✅ 找到 .env 文件: %s", envPath)
	}

	// 尝试加载 .env 文件
	// 注意：godotenv 不支持 UTF-8 BOM，如果文件有 BOM 会失败
	if err := godotenv.Load(envPath); err != nil {
		log.Printf("❌ 加载 .env 文件失败: %v", err)
		log.Println("⚠️ 提示：如果看到 'unexpected character' 错误，可能是文件编码问题（UTF-8 BOM）")
		log.Println("   解决方法：用文本编辑器（如 VS Code）打开 .env，另存为 UTF-8 编码（不要 BOM）")
		log.Println("将使用系统环境变量")
	} else {
		log.Println("✅ .env 文件加载成功")
	}

	db, err := infra.NewDB()
	if err != nil {
		log.Fatalf("数据库连接失败：%v", err)
	}

	//根据结构体定义自动创建更新表
	if err := db.AutoMigrate(&models.User{}, &models.Conversation{}, &models.Message{}); err != nil {
		log.Fatalf("自动创建表失败： %v", err)
	}

	userRepo := repository.NewUserRepository(db)
	conversationRepo := repository.NewConversationRepository(db)
	messageRepo := repository.NewMessageRepository(db)

	// 初始化默认管理员账号（如果不存在）
	initDefaultAdmin(userRepo)

	//gin路由初始化
	r := gin.Default()

	//使用日志中间件
	r.Use(middleware.Logger())

	//跨域配置
	r.Use(middleware.CORS())

	// 初始化存储服务（本地存储）
	// 存储目录：backend/uploads（相对于工作目录）
	// 公共访问路径：/uploads（用于构建URL）
	// 复用之前获取的工作目录 wd（已在第 56 行声明）
	uploadDir := filepath.Join(wd, "uploads")
	publicPath := "/uploads"
	storageService := infra.NewLocalStorageService(uploadDir, publicPath)

	// 初始化服务层
	authService := service.NewAuthService(userRepo)
	conversationService := service.NewConversationService(conversationRepo, messageRepo)
	profileService := service.NewProfileService(userRepo, storageService)

	// 声明 Hub 变量（用于在回调函数中访问）
	var wsHub *websocket.Hub

	// 创建 WebSocket Hub，设置回调函数来处理客户端连接/断开事件
	// 使用闭包来访问 conversationService 和 wsHub
	onConnect := func(conversationID uint, isVisitor bool, visitorCount int) {
		if isVisitor {
			if err := conversationService.UpdateVisitorOnlineStatus(conversationID, true); err != nil {
				log.Printf("更新访客在线状态失败: %v", err)
				return
			}
			// 广播状态更新到所有客服端（不管连接到哪个对话）
			wsHub.BroadcastToAllAgents("visitor_status_update", map[string]interface{}{
				"conversation_id": conversationID,
				"is_online":       true,
				"visitor_count":   visitorCount,
			})
		}
	}

	onDisconnect := func(conversationID uint, isVisitor bool, visitorCount int) {
		if isVisitor {
			if visitorCount == 0 {
				if err := conversationService.UpdateVisitorOnlineStatus(conversationID, false); err != nil {
					log.Printf("更新访客离线状态失败: %v", err)
					return
				}
				// 广播状态更新到所有客服端（不管连接到哪个对话）
				wsHub.BroadcastToAllAgents("visitor_status_update", map[string]interface{}{
					"conversation_id": conversationID,
					"is_online":       false,
					"visitor_count":   0,
				})
			} else {
				// 还有访客在线，只更新最后活跃时间
				if err := conversationService.UpdateLastSeenAt(conversationID); err != nil {
					log.Printf("更新最后活跃时间失败: %v", err)
					return
				}
			}
		}
	}

	// 创建 Hub（回调函数通过闭包访问 wsHub）
	wsHub = websocket.NewHub(onConnect, onDisconnect)
	go wsHub.Run() // 启动 Hub（在后台运行）

	messageService := service.NewMessageService(conversationRepo, messageRepo, wsHub)

	// 初始化控制器
	authController := controller.NewAuthController(authService)
	conversationController := controller.NewConversationController(conversationService)
	messageController := controller.NewMessageController(messageService)
	adminController := controller.NewAdminController(authService)
	profileController := controller.NewProfileController(profileService)

	appRouter.RegisterRoutes(
		r,
		appRouter.ControllerSet{
			Auth:         authController,
			Conversation: conversationController,
			Message:      messageController,
			Admin:        adminController,
			Profile:      profileController,
		},
		websocket.HandleWebSocket(wsHub),
	)

	// 配置静态文件服务（用于访问上传的头像等文件）
	// 静态文件路径：/uploads -> backend/uploads
	r.Static("/uploads", uploadDir)

	//启动服务器)
	log.Println("🚀 服务器启动成功，监听 :8080")
	log.Println("📡 WebSocket 服务已启动，路径: /ws?conversation_id=<对话ID>")
	r.Run(":8080")
}
