package main

import (
	"context"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/2930134478/AI-CS/backend/controller"
	"github.com/2930134478/AI-CS/backend/infra"
	"github.com/2930134478/AI-CS/backend/middleware"
	"github.com/2930134478/AI-CS/backend/models"
	"github.com/2930134478/AI-CS/backend/repository"
	appRouter "github.com/2930134478/AI-CS/backend/router"
	"github.com/2930134478/AI-CS/backend/service"
	"github.com/2930134478/AI-CS/backend/service/embedding"
	"github.com/2930134478/AI-CS/backend/service/rag"
	"github.com/2930134478/AI-CS/backend/websocket"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

// 初始化默认管理员账号（如果不存在）
// 用户名从环境变量 ADMIN_USERNAME 读取（默认：admin）
// 密码从环境变量 ADMIN_PASSWORD 读取（必须设置）
func initDefaultAdmin(userRepo *repository.UserRepository) {
	// 从环境变量读取管理员用户名和密码
	adminUsername := os.Getenv("ADMIN_USERNAME")
	if adminUsername == "" {
		adminUsername = "admin" // 默认用户名
	}

	adminPassword := os.Getenv("ADMIN_PASSWORD")
	if adminPassword == "" {
		log.Println("⚠️ 警告：未设置 ADMIN_PASSWORD 环境变量，跳过创建默认管理员账号")
		log.Println("   请在 .env 文件中设置 ADMIN_PASSWORD 后重启服务")
		return
	}

	// 检查管理员账号是否已存在
	if _, err := userRepo.FindByUsername(adminUsername); err == nil {
		log.Printf("✅ 管理员账号 '%s' 已存在", adminUsername)
		return
	}

	// 加密密码
	hash, err := bcrypt.GenerateFromPassword([]byte(adminPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("⚠️ 创建默认管理员失败：密码加密错误 %v", err)
		return
	}

	admin := &models.User{
		Username: adminUsername,
		Password: string(hash),
		Role:     "admin",
	}

	if err := userRepo.Create(admin); err != nil {
		log.Printf("⚠️ 创建默认管理员失败：%v", err)
		return
	}

	log.Printf("✅ 默认管理员账号创建成功")
	log.Printf("   用户名: %s", adminUsername)
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
	if err := db.AutoMigrate(&models.User{}, &models.Conversation{}, &models.Message{}, &models.AIConfig{}, &models.FAQ{}, &models.KnowledgeBase{}, &models.Document{}, &models.EmbeddingConfig{}, &models.QuickReply{}); err != nil {
		log.Fatalf("自动创建表失败： %v", err)
	}

	userRepo := repository.NewUserRepository(db)
	conversationRepo := repository.NewConversationRepository(db)
	messageRepo := repository.NewMessageRepository(db)
	aiConfigRepo := repository.NewAIConfigRepository(db)
	faqRepo := repository.NewFAQRepository(db)
	kbRepo := repository.NewKnowledgeBaseRepository(db)
	docRepo := repository.NewDocumentRepository(db)
	embeddingConfigRepo := repository.NewEmbeddingConfigRepository(db)
	quickReplyRepo := repository.NewQuickReplyRepository(db)
	statisticsRepo := repository.NewStatisticsRepository(db)

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

	// 初始化 Milvus 客户端（向量数据库）
	milvusClient, err := infra.NewMilvusClient()
	if err != nil {
		log.Fatalf("连接 Milvus 失败: %v", err)
	}
	defer milvusClient.Close()

	// 检查 Milvus 健康状态
	if err := infra.HealthCheck(milvusClient); err != nil {
		log.Fatalf("Milvus 健康检查失败: %v", err)
	}
	log.Println("✅ Milvus 连接成功")

	// 嵌入服务按需从 DB 配置获取（保存即生效，无需重启）
	embeddingConfigService := service.NewEmbeddingConfigService(embeddingConfigRepo, userRepo)
	embeddingFactory := embedding.NewEmbeddingFactory()
	embeddingProvider := service.NewConfigBackedEmbeddingProvider(embeddingConfigService, embeddingFactory)

	// 启动时获取一次维度用于创建/校验向量集合
	initCtx := context.Background()
	initSvc, _ := embeddingProvider.Get(initCtx)
	if initSvc != nil {
		log.Printf("✅ 嵌入服务按需从「知识库向量配置」加载，模型: %s (维度: %d)，修改配置后立即生效", initSvc.GetModelName(), initSvc.GetDimension())
	} else {
		log.Printf("⚠️ 未配置嵌入服务；知识库/RAG 需在「设置 - 知识库向量模型」中配置 API 后再使用")
	}
	dimension := 1536
	if initSvc != nil {
		dimension = initSvc.GetDimension()
	}

	// 向量存储：迁移时通过 getEmbedding 从当前配置重新向量化
	getEmbedding := func(ctx context.Context) (infra.EmbeddingService, error) {
		svc, err := embeddingProvider.Get(ctx)
		if err != nil || svc == nil {
			return nil, err
		}
		return svc, nil
	}
	vectorStore, err := infra.NewVectorStore(milvusClient, "documents", dimension, getEmbedding)
	if err != nil {
		log.Fatalf("创建向量存储失败: %v", err)
	}
	vectorStoreService := rag.NewVectorStoreService(vectorStore)

	// 文档向量化 / RAG 检索 / 健康检查均使用 provider，配置保存即生效
	documentEmbeddingService := rag.NewDocumentEmbeddingService(vectorStoreService, embeddingProvider)
	retrievalService := rag.NewRetrievalService(vectorStoreService, embeddingProvider, docRepo, kbRepo)
	retrievalService.EnableCache(5 * time.Minute)
	healthChecker := rag.NewHealthChecker(embeddingProvider, vectorStoreService)

	// 初始化服务层
	authService := service.NewAuthService(userRepo)
	conversationService := service.NewConversationService(conversationRepo, messageRepo, aiConfigRepo, userRepo)
	profileService := service.NewProfileService(userRepo, storageService)
	aiConfigService := service.NewAIConfigService(aiConfigRepo, userRepo)
	aiService := service.NewAIService(aiConfigRepo, messageRepo, conversationRepo, retrievalService)           // 添加 RAG 检索服务
	userService := service.NewUserService(userRepo)                                                            // 用户管理服务
	faqService := service.NewFAQService(faqRepo, retrievalService, documentEmbeddingService)                   // FAQ 管理服务
	documentService := service.NewDocumentService(docRepo, kbRepo, documentEmbeddingService, retrievalService) // 文档管理服务
	knowledgeBaseService := service.NewKnowledgeBaseService(kbRepo, docRepo)                                   // 知识库管理服务
	importService := service.NewImportService(docRepo, kbRepo, documentService, documentEmbeddingService)      // 导入服务
	quickReplyService := service.NewQuickReplyService(quickReplyRepo)                                          // 快捷回复服务
	statisticsService := service.NewStatisticsService(statisticsRepo)                                          // 统计服务

	// 声明 Hub 变量（用于在回调函数中访问）
	var wsHub *websocket.Hub

	// 创建 WebSocket Hub，设置回调函数来处理客户端连接/断开事件
	// 使用闭包来访问 conversationService、messageService、userRepo 和 wsHub
	onConnect := func(conversationID uint, isVisitor bool, visitorCount int, agentID uint) {
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
		} else if agentID > 0 {
			// 客服连接：创建系统消息 "{客服名}加入了会话"
			// 但需要检查是否已经存在该客服的加入消息，避免重复创建
			// 获取客服信息
			agent, err := userRepo.GetByID(agentID)
			if err != nil {
				log.Printf("获取客服信息失败: %v", err)
				return
			}
			// 确定显示名称：优先使用昵称，如果没有则使用用户名
			agentName := agent.Nickname
			if agentName == "" {
				agentName = agent.Username
			}
			// 检查是否已经存在该客服的加入消息
			hasJoinMessage, err := messageRepo.HasAgentJoinMessage(conversationID, agentID, agentName)
			if err != nil {
				log.Printf("检查客服加入消息失败: %v", err)
				return
			}
			// 如果已经存在加入消息，不再创建
			if hasJoinMessage {
				log.Printf("客服 %s 已经加入过对话 %d，跳过创建系统消息", agentName, conversationID)
				return
			}
			// 创建系统消息
			// 需要获取对话信息以确定当前模式
			conv, err := conversationRepo.GetByID(conversationID)
			if err != nil {
				log.Printf("获取对话信息失败: %v", err)
				return
			}
			now := time.Now()
			chatMode := conv.ChatMode
			if chatMode == "" {
				chatMode = "human" // 默认人工模式
			}
			systemMessage := &models.Message{
				ConversationID: conversationID,
				SenderID:       agentID,
				SenderIsAgent:  true,
				Content:        agentName + "加入了会话",
				MessageType:    "system_message",
				ChatMode:       chatMode, // 记录系统消息发送时的对话模式
				IsRead:         true,     // 系统消息默认已读
				ReadAt:         &now,
			}
			if err := messageRepo.Create(systemMessage); err != nil {
				log.Printf("创建客服加入系统消息失败: %v", err)
				return
			}
			// 延迟一小段时间后广播系统消息，确保客服的 WebSocket 连接已经完全建立
			// 这样可以确保系统消息能够被客服接收到
			go func() {
				time.Sleep(100 * time.Millisecond)
				wsHub.BroadcastMessage(conversationID, "new_message", systemMessage)
				log.Printf("✅ 客服加入系统消息已创建并广播: 对话ID=%d, 客服=%s", conversationID, agentName)
			}()
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

	messageService := service.NewMessageService(conversationRepo, messageRepo, wsHub, aiService)
	visitorService := service.NewVisitorService(userRepo, wsHub)

	// 初始化控制器
	authController := controller.NewAuthController(authService)
	conversationController := controller.NewConversationController(conversationService, aiConfigService)
	messageController := controller.NewMessageController(messageService, conversationService, storageService)
	adminController := controller.NewAdminController(authService, userService)
	profileController := controller.NewProfileController(profileService)
	aiConfigController := controller.NewAIConfigController(aiConfigService)
	faqController := controller.NewFAQController(faqService)
	documentController := controller.NewDocumentController(documentService, embeddingConfigService)
	embeddingConfigController := controller.NewEmbeddingConfigController(embeddingConfigService)
	knowledgeBaseController := controller.NewKnowledgeBaseController(knowledgeBaseService, embeddingConfigService)
	importController := controller.NewImportController(importService, embeddingConfigService) // 导入控制器
	visitorController := controller.NewVisitorController(visitorService)
	healthController := controller.NewHealthController(healthChecker, retrievalService) // 健康检查控制器
	quickReplyController := controller.NewQuickReplyController(quickReplyService)       // 快捷回复控制器
	statisticsController := controller.NewStatisticsController(statisticsService)       // 统计控制器

	appRouter.RegisterRoutes(
		r,
		appRouter.ControllerSet{
			Auth:              authController,
			Conversation:      conversationController,
			Message:           messageController,
			Admin:             adminController,
			Profile:           profileController,
			AIConfig:          aiConfigController,
			EmbeddingConfig:   embeddingConfigController,
			FAQ:               faqController,
			Document:          documentController,
			KnowledgeBase:     knowledgeBaseController,
			Import:            importController, // 导入控制器
			Visitor:           visitorController,
			Health:            healthController, // 健康检查控制器
			QuickReply:        quickReplyController,       // 快捷回复控制器
			Statistics:        statisticsController,       // 统计控制器
		},
		websocket.HandleWebSocket(wsHub),
	)

	// 配置静态文件服务（用于访问上传的头像等文件）
	// 静态文件路径：/uploads -> backend/uploads
	r.Static("/uploads", uploadDir)

	//启动服务器
	// 监听所有网络接口（0.0.0.0），允许外部设备访问
	// 如果只想本地访问，可以改为 "127.0.0.1:8080" 或 ":8080"
	host := os.Getenv("SERVER_HOST")
	if host == "" {
		host = "0.0.0.0" // 默认监听所有网络接口，允许外部访问
	}
	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080"
	}
	addr := host + ":" + port
	log.Println("🚀 服务器启动成功，监听 " + addr)
	log.Println("📡 WebSocket 服务已启动，路径: /ws?conversation_id=<对话ID>")
	log.Println("💡 提示：如需限制为仅本地访问，请设置环境变量 SERVER_HOST=127.0.0.1")
	r.Run(addr)
}
