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
	// 分布式事件总线（可选，启用后支持多实例广播一致性）
	bus DistributedBus
}

// Message 是要广播的消息
type Message struct {
	ConversationID uint        `json:"conversation_id"`
	Data           interface{} `json:"data"`            // 消息内容（可以是 Message 对象）
	Type           string      `json:"type"`            // 消息类型：new_message, conversation_update 等
	Scope          string      `json:"scope,omitempty"` // conversation | all_agents
	FromRemote     bool        `json:"-"`
}

// NewHub 创建一个新的 Hub
func NewHub(onConnect OnClientConnectCallback, onDisconnect OnClientDisconnectCallback, bus DistributedBus) *Hub {
	h := &Hub{
		conversations: make(map[uint]map[*Client]bool),
		register:      make(chan *Client),
		unregister:    make(chan *Client),
		broadcast:     make(chan *Message, 256),
		onConnect:     onConnect,
		onDisconnect:  onDisconnect,
		bus:           bus,
	}
	if bus != nil {
		bus.Subscribe(func(msg *Message) {
			if msg == nil {
				return
			}
			msg.FromRemote = true
			select {
			case h.broadcast <- msg:
			default:
				log.Printf("⚠️ 分布式消息队列拥塞，丢弃事件: 对话ID=%d, 类型=%s", msg.ConversationID, msg.Type)
			}
		})
	}
	return h
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
			if message == nil {
				continue
			}
			if message.Scope == "all_agents" {
				clients := h.snapshotAllAgents()
				h.sendToClients(clients, message)
			} else {
				clients := h.snapshotConversationClients(message.ConversationID)
				if len(clients) == 0 {
					log.Printf("⚠️ 广播消息失败: 对话ID=%d 没有客户端连接", message.ConversationID)
				} else {
					h.sendToClients(clients, message)
				}
			}
			// 仅本地源事件向分布式总线发布，远端同步过来的事件不再二次发布（避免回环）。
			if h.bus != nil && !message.FromRemote {
				if err := h.bus.Publish(message); err != nil {
					log.Printf("⚠️ 分布式广播失败: 对话ID=%d, 类型=%s, 错误=%v", message.ConversationID, message.Type, err)
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
		Scope:          "conversation",
	}
}

// BroadcastToAllAgents 广播消息到所有客服客户端（不管连接到哪个对话）
// 用于 visitor_status_update 等需要所有客服都收到的事件
func (h *Hub) BroadcastToAllAgents(messageType string, data interface{}) {
	h.broadcast <- &Message{
		ConversationID: conversationIDFromData(data, 0),
		Type:           messageType,
		Data:           data,
		Scope:          "all_agents",
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

func (h *Hub) snapshotConversationClients(conversationID uint) []*Client {
	h.mu.RLock()
	defer h.mu.RUnlock()
	clients := h.conversations[conversationID]
	out := make([]*Client, 0, len(clients))
	for c := range clients {
		out = append(out, c)
	}
	return out
}

func (h *Hub) snapshotAllAgents() []*Client {
	h.mu.RLock()
	defer h.mu.RUnlock()
	out := make([]*Client, 0)
	for _, clients := range h.conversations {
		for c := range clients {
			if !c.isVisitor {
				out = append(out, c)
			}
		}
	}
	return out
}

func (h *Hub) sendToClients(clients []*Client, message *Message) {
	for _, client := range clients {
		select {
		case client.send <- message:
		default:
			log.Printf("⚠️ 发送消息失败: 对话ID=%d, 客户端断开", client.conversationID)
			h.mu.Lock()
			if cc, ok := h.conversations[client.conversationID]; ok {
				delete(cc, client)
				if len(cc) == 0 {
					delete(h.conversations, client.conversationID)
				}
			}
			h.mu.Unlock()
			safeClose(client.send)
		}
	}
}

func safeClose(ch chan *Message) {
	defer func() {
		_ = recover()
	}()
	close(ch)
}

func conversationIDFromData(data interface{}, fallback uint) uint {
	if msg, ok := data.(*models.Message); ok {
		return msg.ConversationID
	}
	if m, ok := data.(map[string]interface{}); ok {
		if convID, ok2 := m["conversation_id"]; ok2 {
			switch v := convID.(type) {
			case uint:
				return v
			case float64:
				return uint(v)
			}
		}
	}
	return fallback
}
