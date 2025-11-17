# AI-CS 智能客服系统

## 项目简介

这是一个基于Go后端和Next.js前端的智能客服系统，用于处理访客与客服之间的对话交流。

## 项目结构

```
AI-CS/
├── backend/          # Go后端服务
│   ├── controller/   # 控制器层
│   ├── models/       # 数据模型
│   ├── service/      # 业务逻辑层
│   ├── repository/   # 数据访问层
│   ├── middleware/   # 中间件
│   ├── router/       # 路由配置
│   ├── infra/        # 基础设施（数据库等）
│   └── utils/        # 工具函数
└── frontend/         # Next.js前端应用
    ├── app/          # 应用页面
    ├── public/       # 静态资源
    └── ...
```

## 核心功能

### 1. 用户管理
- **用户注册** (`Register`): 创建新用户账户
- **用户登录** (`Login`): 验证用户身份

### 2. 对话管理
- **初始化对话** (`InitConversation`): 为访客创建或获取现有对话
- **发送消息**: 处理消息发送
- **拉取消息**: 获取对话历史

## 数据模型

### User (用户)
```go
type User struct {
    ID       uint   `json:"id" gorm:"primarykey"`
    Username string `json:"username" gorm:"unique"`
    Password string `json:"password"`
    Role     string `json:"role"`
}
```

### Conversation (对话)
```go
type Conversation struct {
    ID        uint      `json:"id" gorm:"primaryKey"`
    VisitorID uint      `json:"visiter_id"`
    AgentID   uint      `json:"agent_id"`
    Status    string    `json:"status"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}
```

### Message (消息)
```go
type Message struct {
    ID             uint      `json:"id" gorm:"primarykey"`
    ConversationID uint      `json:"conversation_id"`
    SenderID       uint      `json:"sender_id"`
    SenderIsAgent  bool      `json:"sender_is_agent"`
    Content        string    `json:"content"`
    CreatedAt      time.Time `json:"created_at"`
}
```

## API接口说明

### 用户相关接口

#### 用户注册
- **路径**: `POST /register`
- **参数**: 
  ```json
  {
    "username": "用户名",
    "password": "密码",
    "role": "角色"
  }
  ```
- **返回**: 注册成功或失败信息

#### 用户登录
- **路径**: `POST /login`
- **参数**:
  ```json
  {
    "username": "用户名",
    "password": "密码"
  }
  ```
- **返回**: 登录成功或失败信息

### 对话相关接口

#### 初始化对话
- **路径**: `POST /conversation/init`
- **参数**:
  ```json
  {
    "visitor_id": 访客ID
  }
  ```
- **返回**:
  ```json
  {
    "conversation_id": 对话ID,
    "status": "对话状态"
  }
  ```

#### 发送消息
- **路径**: `POST /messages`
- **参数**:
  ```json
  {
    "conversation_id": 对话ID,
    "content": "消息内容",
    "sender_is_agent": 是否客服,
    "sender_id": 发送者ID（客服必填，访客可省略或传0）
  }
  ```
- **返回**: { "message": "创建消息成功" }

#### 拉取消息
- **路径**: `GET /messages?conversation_id=对话ID`
- **返回**: 消息数组，按创建时间升序

## 对话初始化逻辑详解

当你调用对话初始化接口时，系统会执行以下步骤：

1. **检查现有对话**: 系统会查找该访客是否已有未关闭的对话
2. **复用或创建**: 
   - 如果找到现有对话，直接返回该对话信息
   - 如果没有找到，创建一个新的对话并返回

这就像你去银行办事：
- 如果之前有没办完的业务，继续办理
- 如果没有，开一个新的业务单

## 技术栈

### 后端
- **语言**: Go
- **框架**: Gin (Web框架)
- **数据库**: GORM (ORM)
- **密码加密**: bcrypt

### 前端
- **框架**: Next.js
- **语言**: TypeScript
- **样式**: CSS

## 开发环境设置

### 后端启动
```bash
cd backend
cp .env.example .env  # 按需修改数据库配置
go mod tidy
go run main.go
```

### 前端启动
```bash
cd frontend
cp .env.local.example .env.local  # 可选：如需自定义 API 地址
npm install
npm run dev
```

## 注意事项

1. 确保数据库连接配置正确（后端从环境变量读取）
2. 用户密码会自动加密存储
3. 对话状态包括: "open"(开放), "closed"(关闭)
4. 消息发送者通过 `SenderIsAgent` 字段区分是访客还是客服

### 后端环境变量
在 `backend/.env` 中配置以下变量（主进程会自动加载）：

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=CS
```

### 前端环境变量（可选）
在 `frontend/.env.local` 中配置以下变量（不配置则使用默认值）：

```
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8080
```

说明：本地开发无需配置，已默认 `http://127.0.0.1:8080`。部署到生产环境时修改为实际后端地址（如 `https://api.yourdomain.com`）。

## 更新日志

详见 `doc/CHANGELOG.md` 文件

