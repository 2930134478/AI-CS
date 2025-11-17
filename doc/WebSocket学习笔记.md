# WebSocket 学习笔记（通俗版）

## 一、什么是 WebSocket？

### 1. 类比理解

**HTTP 就像"打电话"**：
- 你打电话 → 对方接听 → 你说完挂断
- 每次都要重新拨号才能通话
- 不能一直保持连接

**WebSocket 就像"对讲机"**：
- 你按住按钮说话 → 对方立即听到
- 连接一直保持，随时可以说话
- 不需要每次都"拨号"

### 2. 为什么需要 WebSocket？

**传统 HTTP 的问题**：
- 访客发送消息 → 后端收到 → 但客服不知道有新消息
- 客服必须手动刷新页面才能看到新消息
- 无法实时推送消息

**WebSocket 的解决方案**：
- 访客发送消息 → 后端收到 → 后端立即"喊话"给所有连接的客户端
- 客服不需要刷新，消息自动显示
- 真正的实时通信！

## 二、WebSocket 工作原理（整体流程）

### 1. 连接建立过程

```
1. 前端：我要连接 WebSocket（就像敲门）
   ws = new WebSocket("ws://127.0.0.1:8080/ws?conversation_id=123")

2. 后端：检查请求，同意连接（就像开门）
   → 升级 HTTP 连接为 WebSocket 连接

3. 前端：连接成功！（可以开始"对话"了）
   ws.onopen = () => { console.log("连接成功") }
```

**关键点**：
- 第一次连接还是用 HTTP（就像敲门）
- 后端"升级"这个连接为 WebSocket（就像开门让你进来）
- 之后就可以双向通信了

### 2. 消息发送和接收

```
前端发送消息：
  前端 → [HTTP POST] → 后端 → 保存到数据库 → 通过 WebSocket 广播

后端推送消息：
  后端 → [WebSocket] → 所有连接的客户端 → 自动显示新消息
```

## 三、后端 WebSocket 工作原理

### 1. Hub（中心管理器）

**类比**：就像"会议室管理员"

```go
// backend/websocket/hub.go
type Hub struct {
    // 每个对话ID对应哪些客户端连接
    // 就像：会议室1有哪些人在里面
    conversations map[uint]map[*Client]bool
    
    // 注册新客户端（有人要加入）
    register chan *Client
    
    // 注销客户端（有人要离开）
    unregister chan *Client
    
    // 广播消息（有新消息要告诉所有人）
    broadcast chan *Message
}
```

**工作流程**：
```
1. 有人连接 → 发到 register 通道
2. Hub 收到 → 把这个客户端加到对应对话的列表里
3. 有新消息 → 发到 broadcast 通道
4. Hub 收到 → 找到这个对话的所有客户端 → 发送消息给每个人
```

### 2. Client（客户端连接）

**类比**：就像"会议室里的一个人"

```go
// backend/websocket/client.go
type Client struct {
    hub            *Hub           // 属于哪个 Hub
    conn           *websocket.Conn // WebSocket 连接
    send           chan *Message   // 发送消息的通道
    conversationID uint            // 属于哪个对话
}
```

**两个重要方法**：
- `ReadPump()`：从客户端读取消息（比如心跳包）
- `WritePump()`：向客户端发送消息（比如新消息推送）

### 3. Handler（处理函数）

**类比**：就像"门卫"，检查谁要进来

```go
// backend/websocket/handler.go
func HandleWebSocket(hub *Hub) gin.HandlerFunc {
    return func(c *gin.Context) {
        // 1. 从 URL 获取对话ID
        conversationID := c.Query("conversation_id")
        
        // 2. 升级 HTTP 连接为 WebSocket 连接
        conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
        
        // 3. 创建客户端
        client := NewClient(hub, conn, conversationID)
        
        // 4. 注册到 Hub
        hub.register <- client
        
        // 5. 启动读写循环
        go client.WritePump()
        go client.ReadPump()
    }
}
```

**关键步骤**：
1. `upgrader.Upgrade()`：把 HTTP 连接"升级"成 WebSocket 连接
2. `hub.register <- client`：告诉 Hub "我来了"
3. `go client.WritePump()`：启动一个 goroutine（后台线程）来发送消息
4. `go client.ReadPump()`：启动一个 goroutine 来接收消息

### 4. 消息推送流程

```go
// backend/service/service.go
func CreateMessage(db *gorm.DB, hub BroadcastHub) {
    // 1. 创建消息
    msg := models.Message{...}
    db.Create(&msg)
    
    // 2. 通过 WebSocket 推送
    hub.BroadcastMessage(conversationID, "new_message", msg)
}
```

**推送过程**：
```
1. CreateMessage 调用 hub.BroadcastMessage()
2. Hub 收到消息，放到 broadcast 通道
3. Hub.Run() 循环检测到有新消息
4. 找到这个对话的所有客户端
5. 把消息发送给每个客户端（通过 client.send 通道）
6. 每个客户端的 WritePump() 收到消息，通过 WebSocket 发送给前端
```

## 四、前端 WebSocket 工作原理

### 1. WebSocket 客户端类

**类比**：就像"对讲机"

```typescript
// frontend/lib/websocket.ts
class WSClient {
    private ws: WebSocket | null = null;
    private conversationId: number;
    private onMessage?: (message: WSMessage) => void;
    
    // 连接
    connect() {
        // 1. 创建 WebSocket 连接
        const wsUrl = "ws://127.0.0.1:8080/ws?conversation_id=123";
        this.ws = new WebSocket(wsUrl);
        
        // 2. 设置事件监听
        this.ws.onopen = () => {
            console.log("连接成功");
        };
        
        this.ws.onmessage = (event) => {
            // 收到消息
            const message = JSON.parse(event.data);
            if (this.onMessage) {
                this.onMessage(message);
            }
        };
        
        this.ws.onerror = (error) => {
            console.error("连接错误", error);
        };
        
        this.ws.onclose = () => {
            console.log("连接关闭");
            // 尝试重连
            this.attemptReconnect();
        };
    }
}
```

**关键点**：
- `new WebSocket(url)`：创建连接（会自动发送 HTTP 升级请求）
- `ws.onopen`：连接成功时触发
- `ws.onmessage`：收到消息时触发
- `ws.onclose`：连接关闭时触发

### 2. 在 React 组件中使用

```typescript
// frontend/app/chat/page.tsx
useEffect(() => {
    if (conversationId === null) return;
    
    // 创建 WebSocket 客户端
    const wsClient = new WSClient({
        conversationId: conversationId,
        // 收到消息时的回调
        onMessage: (message) => {
            if (message.type === "new_message") {
                // 把新消息添加到消息列表
                setMessages((prevMessages) => {
                    const newMsg = message.data;
                    // 检查是否已存在（避免重复）
                    const exists = prevMessages.some((msg) => msg.id === newMsg.id);
                    if (exists) return prevMessages;
                    // 添加到列表
                    return [...prevMessages, newMsg];
                });
            }
        },
    });
    
    // 建立连接
    wsClient.connect();
    
    // 组件卸载时断开连接
    return () => {
        wsClient.disconnect();
    };
}, [conversationId]);
```

**工作流程**：
1. 页面加载时，创建 WebSocket 客户端
2. 建立连接（自动发送请求到后端）
3. 收到消息时，自动更新 React 状态（`setMessages`）
4. React 自动重新渲染，显示新消息
5. 页面关闭时，断开连接

## 五、完整的消息流程（从发送到接收）

### 场景：访客发送消息，客服立即看到

```
步骤 1：访客发送消息
  前端 → [HTTP POST /messages] → 后端
  {
    conversation_id: 123,
    content: "你好",
    sender_is_agent: false
  }

步骤 2：后端处理
  后端 → 保存到数据库 → 调用 hub.BroadcastMessage()

步骤 3：Hub 广播消息
  Hub → 找到对话 123 的所有客户端（访客和客服）
      → 通过 WebSocket 发送给每个客户端

步骤 4：前端接收消息
  访客端：收到消息 → 自动显示（自己发的）
  客服端：收到消息 → 自动显示（访客发的）

步骤 5：完成
  访客看到自己的消息
  客服立即看到访客的消息（无需刷新！）
```

## 六、WebSocket vs HTTP

### HTTP（传统方式）

```
访客发送消息：
  前端 → [HTTP POST] → 后端 → 保存 → 返回成功

客服查看消息：
  前端 → [HTTP GET /messages] → 后端 → 返回所有消息
  （需要手动刷新或定时轮询）
```

**问题**：
- 客服不知道什么时候有新消息
- 必须定时刷新（浪费资源）
- 不是实时的

### WebSocket（实时方式）

```
访客发送消息：
  前端 → [HTTP POST] → 后端 → 保存 → [WebSocket 推送] → 客服端

客服查看消息：
  客服端 → [WebSocket 连接] → 后端
  后端 → [有新消息时自动推送] → 客服端 → 自动显示
```

**优势**：
- 实时推送，无需刷新
- 节省资源（不需要定时轮询）
- 双向通信（可以前后端互相发送）

## 七、技术细节

### 1. 连接升级（Upgrade）

**HTTP 请求头**：
```
GET /ws?conversation_id=123 HTTP/1.1
Host: 127.0.0.1:8080
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==
Sec-WebSocket-Version: 13
```

**HTTP 响应头**：
```
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: HSmrc0sMlYUkAGmm5OPpG2HaGWk=
```

**101 状态码**：表示协议切换成功（从 HTTP 切换到 WebSocket）

### 2. 心跳检测（Ping/Pong）

**为什么需要心跳**：
- 保持连接活跃（防止被防火墙关闭）
- 检测连接是否断开

**工作原理**：
```
后端 → [每 54 秒发送 Ping] → 前端
前端 → [收到 Ping，回复 Pong] → 后端
```

如果前端没有回复 Pong，后端就知道连接断开了。

### 3. 自动重连

```typescript
// frontend/lib/websocket.ts
private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        return; // 超过最大重试次数，停止重连
    }
    
    this.reconnectAttempts++;
    setTimeout(() => {
        this.connect(); // 重新连接
    }, 3000); // 等待 3 秒后重连
}
```

**重连策略**：
- 连接断开时自动尝试重连
- 最多重试 5 次
- 每次等待 3 秒

## 八、记忆口诀

1. **WebSocket = 对讲机**：一直保持连接，随时可以说话
2. **HTTP = 打电话**：每次都要重新拨号
3. **Hub = 会议室管理员**：管理所有连接的人
4. **Client = 会议室里的人**：每个人都有自己的连接
5. **Upgrade = 开门**：把 HTTP 连接"升级"成 WebSocket
6. **Ping/Pong = 心跳**：保持连接活跃
7. **Broadcast = 广播**：把消息发送给所有人

## 九、常见问题

### 1. WebSocket 和 HTTP 可以同时使用吗？

**可以！** 就像：
- HTTP：用来发送消息、获取列表等
- WebSocket：用来接收实时推送

### 2. 为什么需要心跳检测？

**防止连接被关闭**：
- 有些防火墙/代理会关闭长时间不活动的连接
- 心跳告诉它们"我还活着"

### 3. 如果 WebSocket 连接失败怎么办？

**自动降级**：
- 可以继续使用 HTTP 轮询（定时刷新）
- 或者显示错误提示，让用户手动刷新

### 4. WebSocket 比 HTTP 快吗？

**不一定**：
- WebSocket 的优势是"实时推送"，不是速度
- 第一次建立连接需要时间
- 但之后推送消息非常快（不需要重新建立连接）

## 十、代码示例总结

### 后端关键代码

```go
// 1. 创建 Hub
wsHub := websocket.NewHub()
go wsHub.Run() // 启动 Hub

// 2. 注册 WebSocket 路由
r.GET("/ws", websocket.HandleWebSocket(wsHub))

// 3. 推送消息
hub.BroadcastMessage(conversationID, "new_message", msg)
```

### 前端关键代码

```typescript
// 1. 创建客户端
const wsClient = new WSClient({
    conversationId: conversationId,
    onMessage: (message) => {
        // 处理收到的消息
    },
});

// 2. 建立连接
wsClient.connect();

// 3. 断开连接（组件卸载时）
return () => {
    wsClient.disconnect();
};
```

---

## 总结

**WebSocket 就像"对讲机"**：
- 建立连接后，一直保持
- 后端可以随时"喊话"给前端
- 前端可以随时"回复"给后端
- 真正的实时双向通信！

**我们项目的实现**：
- 后端用 Hub 管理所有连接
- 消息创建后自动推送
- 前端自动接收并显示
- 无需手动刷新，真正的实时体验！

**记住**：WebSocket 不是用来替代 HTTP 的，而是用来补充 HTTP 的实时推送能力！

---

**学习建议**：
1. 先理解整体流程（连接 → 发送 → 接收）
2. 再看代码实现（Hub、Client、Handler）
3. 运行项目，观察日志和浏览器控制台
4. 尝试修改代码，看看效果

**调试技巧**：
- 打开浏览器控制台（F12），查看 WebSocket 连接状态
- 查看后端日志，看连接和消息推送情况
- 使用 `ws.onmessage` 打印收到的消息

祝你学习愉快！🚀

