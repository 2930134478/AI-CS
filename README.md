# AI-CS 智能客服系统

> 一个融合 AI 技术与人工客服的现代化智能客服解决方案

## ✨ 核心特性

- 🤖 **AI 客服支持**：支持多厂商 AI 模型，可配置 API 和模型选择
- 👥 **人工客服**：实时在线状态显示，支持多客服协作
- 💬 **实时通信**：基于 WebSocket 的双向实时消息推送
- 📁 **文件传输**：支持图片、文档上传和预览
- 📚 **FAQ 管理**：知识库管理，关键词搜索
- 👤 **用户管理**：完整的用户权限管理系统
- 🎨 **现代化 UI**：基于 Shadcn UI 的响应式设计
- 🔌 **访客小窗插件**：可嵌入任何网站的客服小窗组件
- 🌐 **产品官网**：内置产品展示页面

## 🏗️ 技术栈

### 后端
- **语言**: Go 1.21+
- **框架**: Gin (Web 框架)
- **ORM**: GORM
- **数据库**: MySQL 8.0+
- **实时通信**: WebSocket (gorilla/websocket)
- **密码加密**: bcrypt
- **文件存储**: 本地存储（可扩展为云存储）

### 前端
- **框架**: Next.js 14+ (App Router)
- **语言**: TypeScript
- **UI 组件**: Shadcn UI
- **样式**: Tailwind CSS
- **状态管理**: React Hooks
- **实时通信**: WebSocket Client

## 📁 项目结构

```
AI-CS/
├── backend/              # Go 后端服务
│   ├── controller/       # 控制器层（HTTP 处理）
│   ├── service/          # 业务逻辑层
│   ├── repository/       # 数据访问层
│   ├── models/           # 数据模型
│   ├── router/           # 路由配置
│   ├── middleware/       # 中间件（认证、CORS、日志）
│   ├── websocket/        # WebSocket Hub
│   ├── infra/            # 基础设施（数据库、存储）
│   ├── utils/            # 工具函数（加密、验证等）
│   └── main.go           # 入口文件
├── frontend/             # Next.js 前端应用
│   ├── app/              # 页面和路由
│   │   ├── page.tsx      # 官网首页
│   │   ├── chat/         # 访客聊天页面
│   │   └── agent/        # 客服工作台
│   ├── components/       # React 组件
│   │   ├── ui/           # Shadcn UI 基础组件
│   │   ├── dashboard/    # 客服端组件
│   │   ├── visitor/      # 访客端组件
│   │   └── layout/       # 布局组件
│   ├── features/         # 功能模块
│   │   ├── agent/        # 客服端功能
│   │   └── visitor/      # 访客端功能
│   └── lib/              # 工具库和配置
├── doc/                  # 项目文档
│   ├── CHANGELOG.md      # 更新日志
│   ├── 测试指南.md       # 测试文档
│   ├── 后端学习笔记.md   # 后端架构说明
│   └── 前端学习笔记.md   # 前端架构说明
└── README.md             # 本文件
```

## 🚀 快速开始

### 环境要求

- Go 1.21 或更高版本
- Node.js 18+ 和 npm/yarn
- MySQL 8.0 或更高版本

### 1. 克隆项目

```bash
git clone <repository-url>
cd AI-CS
```

### 2. 配置后端

```bash
cd backend

# 创建 .env 文件
cat > .env << EOF
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ai_cs
EOF

# 安装依赖
go mod tidy

# 启动服务（默认端口 8080）
go run main.go
```

### 3. 配置前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器（默认端口 3000）
npm run dev
```

### 4. 访问应用

- **官网首页**: http://localhost:3000
- **访客聊天**: http://localhost:3000/chat
- **客服登录**: http://localhost:3000/agent/login

### 5. 默认账号

系统会自动创建默认管理员账号：
- **用户名**: `admin`
- **密码**: `admin123`

> ⚠️ 生产环境请务必修改默认密码！

## 📖 主要功能

### 访客端
- 人工/AI 客服模式切换
- 实时消息收发
- 文件/图片上传
- 在线客服列表查看
- 访客小窗插件（可嵌入第三方网站）

### 客服端
- 对话列表管理（全部/我的/他人的对话）
- 实时消息推送
- 访客信息查看和编辑
- 在线状态显示
- 消息已读状态同步
- AI 配置管理（多厂商支持）
- FAQ 知识库管理
- 用户权限管理
- 个人资料管理

## ⚙️ 配置说明

### 后端环境变量

在 `backend/.env` 中配置：

```env
DB_HOST=localhost          # 数据库主机
DB_PORT=3306              # 数据库端口
DB_USER=root              # 数据库用户名
DB_PASSWORD=your_password # 数据库密码
DB_NAME=ai_cs             # 数据库名称
```

### 前端环境变量（可选）

在 `frontend/.env.local` 中配置（不配置则使用默认值）：

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8080
```

> 本地开发无需配置，已默认 `http://127.0.0.1:8080`。生产环境请修改为实际后端地址。


## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

[待添加]

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

---

**最后更新**: 2025-01-XX
