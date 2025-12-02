package websocket

import (
	"log"
	"sync"

	"github.com/2930134478/AI-CS/backend/models"
)

// OnClientConnectCallback 客户端连接时的回调函数。
// conversationID: 对话ID
// isVisitor: 是否是访客
// visitorCount: 该对话当前的访客连接数
// agentID: 客服ID（如果是客服连接）
type OnClientConnectCallback func(conversationID uint, isVisitor bool, visitorCount int, agentID uint)

// OnClientDisconnectCallback 客户端断开连接时的回调函数。
// conversationID: 对话ID
// isVisitor: 是否是访客
// visitorCount: 该对话当前的访客连接数（断开后）
type OnClientDisconnectCallback func(conversationID uint, isVisitor bool, visitorCount int)

// Hub 管理所有 WebSocket 连接
// 每个对话（conversation）可以有多个人连接（访客和客服）
type Hub struct {
	// 每个对话ID对应的客户端连接列表
	// conversationID -> []*Client
	conversations map[uint]map[*Client]bool

	// 注册新客户端（当有人连接时）
	register chan *Client

	// 注销客户端（当有人断开连接时）
	unregister chan *Client

	// 广播消息（当有新消息时，推送给所有相关的客户端）
	broadcast chan *Message

	// 互斥锁（保护并发访问）
	mu sync.RWMutex

	// 回调函数
	onConnect    OnClientConnectCallback
	onDisconnect OnClientDisconnectCallback
}

// Message 是要广播的消息
type Message struct {
	ConversationID uint        `json:"conversation_id"`
	Data           interface{} `json:"data"` // 消息内容（可以是 Message 对象）
	Type           string      `json:"type"` // 消息类型：new_message, conversation_update 等
}

// NewHub 创建一个新的 Hub
func NewHub(onConnect OnClientConnectCallback, onDisconnect OnClientDisconnectCallback) *Hub {
	return &Hub{
		conversations: make(map[uint]map[*Client]bool),
		register:      make(chan *Client),
		unregister:    make(chan *Client),
		broadcast:     make(chan *Message, 256),
		onConnect:     onConnect,
		onDisconnect:  onDisconnect,
	}
}

// Run 启动 Hub，处理所有事件
func (h *Hub) Run() {
	for {
		select {
		// 新客户端连接
		case client := <-h.register:
			h.mu.Lock()
			// 如果这个对话还没有客户端，创建一个新的 map
			if h.conversations[client.conversationID] == nil {
				h.conversations[client.conversationID] = make(map[*Client]bool)
			}
			// 把这个客户端加入到对话中
			h.conversations[client.conversationID][client] = true

			// 统计该对话的访客连接数
			visitorCount := 0
			for c := range h.conversations[client.conversationID] {
				if c.isVisitor {
					visitorCount++
				}
			}
			h.mu.Unlock()

			// 调用连接回调函数
			if h.onConnect != nil {
				h.onConnect(client.conversationID, client.isVisitor, visitorCount, client.agentID)
			}

		// 客户端断开连接
		case client := <-h.unregister:
			h.mu.Lock()
			// 从对话中移除这个客户端
			wasVisitor := client.isVisitor
			if clients, ok := h.conversations[client.conversationID]; ok {
				if _, ok := clients[client]; ok {
					delete(clients, client)
					// 关闭发送通道（避免重复关闭导致 panic）
					select {
					case _, ok := <-client.send:
						if !ok {
							// 通道已经关闭，不需要再次关闭
						}
					default:
						// 通道未关闭，关闭它
						close(client.send)
					}

					// 统计该对话的访客连接数（断开后）
					visitorCount := 0
					for c := range clients {
						if c.isVisitor {
							visitorCount++
						}
					}

					// 如果这个对话没有客户端了，删除对话
					if len(clients) == 0 {
						delete(h.conversations, client.conversationID)
					}
					h.mu.Unlock()

					// 调用断开回调函数
					if h.onDisconnect != nil {
						h.onDisconnect(client.conversationID, wasVisitor, visitorCount)
					}
				} else {
					h.mu.Unlock()
					log.Printf("⚠️ 客户端断开时未找到: 对话ID=%d", client.conversationID)
				}
			} else {
				h.mu.Unlock()
				log.Printf("⚠️ 客户端断开时对话不存在: 对话ID=%d", client.conversationID)
			}

		// 广播消息
		case message := <-h.broadcast:
			h.mu.RLock()
			// 找到这个对话的所有客户端
			clients, ok := h.conversations[message.ConversationID]
			if !ok {
				h.mu.RUnlock()
				log.Printf("⚠️ 广播消息失败: 对话ID=%d 没有客户端连接", message.ConversationID)
				continue
			}
			// 创建一个客户端列表的副本（避免在遍历时修改）
			clientList := make([]*Client, 0, len(clients))
			for client := range clients {
				clientList = append(clientList, client)
			}
			h.mu.RUnlock()

			// 给所有客户端发送消息
			for _, client := range clientList {
				select {
				case client.send <- message:
				default:
					// 如果发送失败（客户端可能已经断开），关闭连接
					log.Printf("⚠️ 发送消息失败: 对话ID=%d, 客户端断开", client.conversationID)
					close(client.send)
					h.mu.Lock()
					delete(h.conversations[client.conversationID], client)
					h.mu.Unlock()
				}
			}
		}
	}
}

// BroadcastMessage 广播消息到指定对话的所有客户端
func (h *Hub) BroadcastMessage(conversationID uint, messageType string, data interface{}) {
	h.broadcast <- &Message{
		ConversationID: conversationID,
		Type:           messageType,
		Data:           data,
	}
}

// BroadcastToAllAgents 广播消息到所有客服客户端（不管连接到哪个对话）
// 用于 visitor_status_update 等需要所有客服都收到的事件
func (h *Hub) BroadcastToAllAgents(messageType string, data interface{}) {
	h.mu.RLock()
	// 收集所有客服客户端（isVisitor == false）
	allAgents := make([]*Client, 0)
	for _, clients := range h.conversations {
		for client := range clients {
			if !client.isVisitor {
				allAgents = append(allAgents, client)
			}
		}
	}
	h.mu.RUnlock()

	// 为每个客服客户端创建消息并发送
	for _, client := range allAgents {
		// 如果 data 是 Message 对象，使用消息的 conversation_id
		// 否则使用客户端连接的对话ID
		var conversationID uint
		if msg, ok := data.(*models.Message); ok {
			conversationID = msg.ConversationID
		} else if convID, ok := data.(map[string]interface{})["conversation_id"]; ok {
			if id, ok := convID.(uint); ok {
				conversationID = id
			} else if id, ok := convID.(float64); ok {
				conversationID = uint(id)
			} else {
				conversationID = client.conversationID
			}
		} else {
			conversationID = client.conversationID
		}
		message := &Message{
			ConversationID: conversationID,
			Type:           messageType,
			Data:           data,
		}
		select {
		case client.send <- message:
		default:
			// 如果发送失败（客户端可能已经断开），关闭连接
			log.Printf("⚠️ 发送消息到客服失败: 对话ID=%d, 客户端断开", client.conversationID)
			close(client.send)
			h.mu.Lock()
			if clients, ok := h.conversations[client.conversationID]; ok {
				delete(clients, client)
				if len(clients) == 0 {
					delete(h.conversations, client.conversationID)
				}
			}
			h.mu.Unlock()
		}
	}
}

// GetOnlineAgentIDs 获取所有在线客服的用户ID列表（去重）
// 返回一个 map，key 是 agentID，value 是 true（用于快速查找）
func (h *Hub) GetOnlineAgentIDs() map[uint]bool {
	h.mu.RLock()
	defer h.mu.RUnlock()

	agentIDs := make(map[uint]bool)
	for _, clients := range h.conversations {
		for client := range clients {
			if !client.isVisitor && client.agentID > 0 {
				agentIDs[client.agentID] = true
			}
		}
	}
	return agentIDs
}
