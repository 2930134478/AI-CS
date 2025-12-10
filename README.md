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

## 🚀 快速开始

### 环境要求

- Go 1.21 或更高版本
- Node.js 18+ 和 npm/yarn
- MySQL 8.0 或更高版本

### 1. 克隆项目

```bash
git clone https://github.com/2930134478/AI-CS.git
cd AI-CS
```

### 2. 配置后端

```bash
cd backend

# 创建 .env 文件
cat > .env << EOF
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ai_cs

# 管理员账号配置（必填）
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_admin_password

# 服务器配置
SERVER_HOST=0.0.0.0
SERVER_PORT=8080
GIN_MODE=debug

# 加密密钥（用于加密 AI API Keys，可选）
ENCRYPTION_KEY=$(openssl rand -hex 32)
EOF

# 安装依赖
go mod tidy

# 启动服务（默认端口 8080）
go run main.go
```

> ⚠️ **重要**：`ADMIN_PASSWORD` 是必填项，如果不设置，系统不会创建默认管理员账号。

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

### 5. 默认管理员账号

系统会在首次启动时自动创建管理员账号（如果不存在）。

### 后端环境变量

在 `backend/.env` 中配置：

```env
# 数据库配置
DB_HOST=localhost          # 数据库主机
DB_PORT=3306              # 数据库端口
DB_USER=root              # 数据库用户名
DB_PASSWORD=your_password # 数据库密码
DB_NAME=ai_cs             # 数据库名称

# 管理员账号配置
ADMIN_USERNAME=admin                    # 管理员用户名（可选，默认为 admin）
ADMIN_PASSWORD=your_admin_password      # ⚠️ 管理员密码（必填）

# 服务器配置
SERVER_HOST=0.0.0.0                    # 服务器监听地址
SERVER_PORT=8080                        # 服务器端口
GIN_MODE=debug                          # 运行模式（debug/release）

# 加密密钥（用于加密 AI API Keys）
ENCRYPTION_KEY=your_32_byte_key         # 使用 openssl rand -hex 32 生成
```

**重要提示**：
- `ADMIN_PASSWORD` 是必填项，如果不设置，系统不会创建默认管理员账号
- 生产环境请使用强密码并设置 `GIN_MODE=release`

### 前端环境变量（可选）

在 `frontend/.env.local` 中配置（不配置则使用默认值）：

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8080
```

> 本地开发无需配置，已默认 `http://127.0.0.1:8080`。生产环境请修改为实际后端地址。

## 🔌 集成客服插件到你的网站

#### 步骤 1：在 HTML 中添加代码

在你的网站 HTML 的 `</body>` 标签之前添加：

```html
<!-- 浮动按钮和聊天窗口 -->
<div id="ai-cs-widget" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999;">
  <!-- 浮动按钮 -->
  <button 
    id="ai-cs-toggle-btn" 
    style="width: 56px; height: 56px; border-radius: 50%; background: #3b82f6; color: white; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"
    onclick="toggleChat()"
  >
    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
    </svg>
  </button>
  
  <!-- 聊天窗口 iframe -->
  <iframe 
    id="ai-cs-chat-iframe"
    src="https://your-domain.com/chat" 
    style="display: none; position: fixed; bottom: 80px; right: 20px; width: 400px; height: 600px; max-width: calc(100vw - 40px); max-height: calc(100vh - 100px); border: none; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);"
    allow="microphone"
  ></iframe>
</div>

<script>
  function toggleChat() {
    const iframe = document.getElementById('ai-cs-chat-iframe');
    const btn = document.getElementById('ai-cs-toggle-btn');
    const isVisible = iframe.style.display !== 'none';
    
    iframe.style.display = isVisible ? 'none' : 'block';
    
    // 切换按钮图标
    if (isVisible) {
      btn.innerHTML = '<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>';
    } else {
      btn.innerHTML = '<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
    }
  }
</script>
```

#### 步骤 2：修改域名

将代码中的 `https://your-domain.com` 替换为你的实际域名（部署 AI-CS 的域名）。

**示例**：
```html
<!-- 如果你的 AI-CS 部署在 https://cs.example.com -->
<iframe src="https://cs.example.com/chat" ...></iframe>
```

### 响应式设计

插件会自动适配不同设备：

- **移动端**：小窗宽度自适应，最大高度优化
- **平板端**：中等尺寸窗口
- **桌面端**：完整尺寸窗口


### 自定义样式

如果需要自定义样式，可以通过 CSS 覆盖：

```css
/* 自定义浮动按钮 */
#ai-cs-toggle-btn {
  background-color: #your-color !important;
  width: 60px !important;
  height: 60px !important;
}

/* 自定义聊天窗口 */
#ai-cs-chat-iframe {
  border-radius: 16px !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
}
```


## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

[MIT](LICENSE) © 2025 2930134478

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

---

**最后更新**: 2025-01-XX
