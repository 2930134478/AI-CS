package websocket

import (
	"encoding/json"
	"log"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

type inboundWSMessage struct {
	Type string                 `json:"type"`
	Data map[string]interface{} `json:"data"`
}

const (
	// 客户端发送 ping 的最大等待时间
	writeWait = 10 * time.Second

	// 从客户端读取 pong 的最大等待时间
	pongWait = 60 * time.Second

	// 发送 ping 的频率（必须小于 pongWait）
	pingPeriod = (pongWait * 9) / 10

	// 最大消息大小
	maxMessageSize = 512 * 1024 // 512KB
)

// Client 是一个 WebSocket 客户端
type Client struct {
	hub *Hub

	// WebSocket 连接
	conn *websocket.Conn

	// 发送消息的通道
	send chan *Message

	// 对话ID（这个客户端属于哪个对话）
	conversationID uint

	// 是否是访客（true 表示访客，false 表示客服）
	isVisitor bool

	// 客服ID（如果是客服连接，存储客服的用户ID）
	agentID uint
}

// NewClient 创建一个新的客户端
func NewClient(hub *Hub, conn *websocket.Conn, conversationID uint, isVisitor bool, agentID uint) *Client {
	return &Client{
		hub:            hub,
		conn:           conn,
		send:           make(chan *Message, 256),
		conversationID: conversationID,
		isVisitor:      isVisitor,
		agentID:        agentID,
	}
}

// ReadPump 从 WebSocket 连接读取消息
func (c *Client) ReadPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	// 设置读取限制和超时
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	// 持续读取消息
	for {
		_, payload, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("⚠️ WebSocket 读取错误: 对话ID=%d, 错误=%v", c.conversationID, err)
			}
			break
		}
		c.handleIncoming(payload)
	}
}

// WritePump 向 WebSocket 连接写入消息
func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// Hub 关闭了通道
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			// 发送消息
			if err := c.conn.WriteJSON(message); err != nil {
				log.Printf("❌ WebSocket 写入错误: 对话ID=%d, 类型=%s, 错误=%v",
					c.conversationID, message.Type, err)
				return
			}

		case <-ticker.C:
			// 定期发送 ping 保持连接
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				log.Printf("❌ 发送 ping 失败: 对话ID=%d, 错误=%v", c.conversationID, err)
				return
			}
		}
	}
}

// SendMessage 发送消息给客户端（用于测试）
func (c *Client) SendMessage(messageType string, data interface{}) error {
	message := &Message{
		ConversationID: c.conversationID,
		Type:           messageType,
		Data:           data,
	}

	messageJSON, err := json.Marshal(message)
	if err != nil {
		return err
	}

	c.conn.SetWriteDeadline(time.Now().Add(writeWait))
	return c.conn.WriteMessage(websocket.TextMessage, messageJSON)
}

func (c *Client) handleIncoming(payload []byte) {
	var in inboundWSMessage
	if err := json.Unmarshal(payload, &in); err != nil {
		return
	}

	switch in.Type {
	case "typing_draft":
		text, _ := in.Data["text"].(string)
		text = strings.TrimSpace(text)
		if text == "" {
			c.hub.BroadcastMessage(c.conversationID, "typing_stop", map[string]interface{}{
				"sender_id":       c.agentID,
				"sender_is_agent": !c.isVisitor,
			})
			return
		}
		// 控制草稿长度，避免超长输入导致 WS 事件过大。
		if len(text) > 300 {
			text = text[:300]
		}
		out := map[string]interface{}{
			"sender_id":       c.agentID,
			"sender_is_agent": !c.isVisitor,
			"text":            text,
		}
		if seq, ok := in.Data["seq"]; ok {
			out["seq"] = seq
		}
		c.hub.BroadcastMessage(c.conversationID, "typing_draft", out)
	case "typing_stop":
		c.hub.BroadcastMessage(c.conversationID, "typing_stop", map[string]interface{}{
			"sender_id":       c.agentID,
			"sender_is_agent": !c.isVisitor,
		})
	default:
		// 忽略未知客户端事件，避免污染服务端日志。
	}
}
