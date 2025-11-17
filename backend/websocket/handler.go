package websocket

import (
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// 允许跨域连接
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// HandleWebSocket 处理 WebSocket 连接
func HandleWebSocket(hub *Hub) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 从查询参数获取对话ID
		conversationIDStr := c.Query("conversation_id")
		if conversationIDStr == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "conversation_id 不能为空"})
			return
		}

		conversationID, err := strconv.ParseUint(conversationIDStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "无效的 conversation_id"})
			return
		}

		// 从查询参数获取是否是访客（默认为 true，因为默认是访客连接）
		isVisitorStr := c.DefaultQuery("is_visitor", "true")
		isVisitor := isVisitorStr == "true" || isVisitorStr == "1"

		// 升级 HTTP 连接为 WebSocket 连接
		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			log.Printf("WebSocket 升级失败: %v", err)
			return
		}

		// 创建客户端
		client := NewClient(hub, conn, uint(conversationID), isVisitor)

		// 注册客户端到 Hub
		client.hub.register <- client

		// 启动两个 goroutine：
		// 1. ReadPump：从客户端读取消息（主要是心跳包）
		// 2. WritePump：向客户端发送消息
		go client.WritePump()
		go client.ReadPump()

		log.Printf("✅ WebSocket 连接已建立: 对话ID=%d, 是访客=%v", conversationID, isVisitor)
	}
}
