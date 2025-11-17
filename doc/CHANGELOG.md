# 开发日志

> 📋 待实现需求清单请查看：[待实现需求清单.md](./待实现需求清单.md)

## 2025-01-13 12:00:00 UTC

### 完成的工作
1. **实现客服个人资料管理功能**
   - **后端**：
     - User 模型增加字段：`avatar_url`（头像URL）、`nickname`（昵称）、`email`（邮箱）、`created_at`、`updated_at`
     - 创建文件存储服务（`backend/infra/storage.go`）：本地存储服务，可扩展为云存储
     - 创建个人资料服务（`backend/service/profile_service.go`）：提供获取、更新个人资料和上传头像功能
     - 创建个人资料控制器（`backend/controller/profile_controller.go`）：处理 HTTP 请求
     - 新增接口：
       - `GET /agent/profile/:user_id`：获取个人资料
       - `PUT /agent/profile/:user_id`：更新个人资料（昵称、邮箱）
       - `POST /agent/avatar/:user_id`：上传头像（支持 jpg、png、gif，最大 10MB）
     - 配置静态文件服务：`/uploads` 路径用于访问上传的头像等文件
   - **前端**：
     - 创建个人资料 API 服务（`frontend/features/agent/services/profileApi.ts`）
     - 创建个人资料 Hook（`frontend/features/agent/hooks/useProfile.ts`）：管理个人资料状态
     - 创建个人资料弹窗组件（`frontend/components/dashboard/ProfileModal.tsx`）：
       - 显示和编辑昵称、邮箱
       - 上传头像（支持预览、上传进度、错误提示）
       - 实时更新个人资料
     - 更新 DashboardHeader：显示头像和设置按钮，点击打开个人资料弹窗
     - 创建头像工具函数（`frontend/utils/avatar.ts`）：
       - `getAvatarUrl`：拼接完整的头像 URL
       - `getAvatarColor`：根据种子值生成头像颜色
       - `getAvatarInitial`：获取头像显示文本（首字母）
     - 集成个人资料功能到 DashboardShell
   - **功能特性**：
     - 支持头像上传（jpg、png、gif，最大 10MB）
     - 支持修改昵称和邮箱
     - 头像实时预览
     - 如果没有上传头像，显示彩色圆形头像（基于用户ID生成颜色）
     - 头像显示在 DashboardHeader 中
   - **技术要点**：
     - 文件存储采用可扩展设计，目前使用本地存储，后续可切换为云存储（OSS、S3 等）
     - 头像 URL 拼接逻辑：如果后端返回相对路径，前端自动拼接 API_BASE_URL
     - 头像上传支持文件类型和大小验证
     - 个人资料更新实时刷新 UI

---

## 2025-11-12 19:35:00 UTC

### 完成的工作
1. **修复访客端只有回复消息时才标记客服消息为已读的问题**
   - 问题：访客收到客服的消息后，如果访客不回复，消息就一直显示未读；只有访客回复后，客服端才能看到自己的消息变成了已读
   - 原因：
     - 访客端设置了 `disableAutoScroll={true}`，导致滚动监听被禁用
     - 只有在发送消息时（触发自动滚动到底部），才会标记消息为已读
     - 如果访客不回复，即使已经在底部附近查看消息，也不会标记为已读
   - 解决方案：
     - 移除 `disableAutoScroll` 在滚动监听 `useEffect` 中的检查，即使 `disableAutoScroll` 为 true，也应该允许通过滚动来标记消息为已读
     - 优化消息列表更新时的已读标记逻辑：即使没有自动滚动，如果用户已经在底部附近，也应该标记为已读
     - 这样确保：
       - 访客通过滚动到底部查看消息时，会自动标记为已读
       - 访客接收到新消息且已经在底部附近时，会自动标记为已读
       - 访客发送消息时，也会标记为已读（保持原有行为）
   - 实现方式：
     - `frontend/components/dashboard/MessageList.tsx`：
       - 移除 `disableAutoScroll` 在第一个滚动监听 `useEffect` 中的检查
       - 优化第二个消息列表更新 `useEffect` 中的已读标记逻辑：如果用户已经在底部附近（`isNearBottom`），即使没有自动滚动，也应该标记为已读

---

## 2025-11-12 19:30:00 UTC

### 完成的工作
1. **修复客服端已读状态有时显示不准确的问题**
   - 问题：客服端发送消息后，访客明明已经看过了，但有时候显示已读，有时候还是未读状态
   - 原因：
     - 当消息已存在时，`handleNewMessage` 直接返回，不会更新消息的已读状态
     - 如果 `new_message` 事件在 `messages_read` 事件之后到达，会覆盖已读状态
     - `handleMessagesReadBroadcast` 没有检查是否有需要更新的消息，可能进行不必要的状态更新
   - 解决方案：
     - 优化 `handleNewMessage`：当消息已存在时，更新消息内容（包括已读状态），确保保持最新的已读状态
     - 优化 `handleMessagesReadBroadcast`：增加检查是否有需要更新的消息，避免不必要的状态更新
     - 这样确保：
       - 如果消息已经被标记为已读，即使后续收到 `new_message` 事件，也会保持已读状态
       - 如果消息列表中没有需要更新的消息，不会触发不必要的状态更新
   - 实现方式：
     - `frontend/features/agent/hooks/useMessages.ts`：
       - 在 `handleNewMessage` 中，当消息已存在时，更新消息内容（包括已读状态）
       - 在 `handleMessagesReadBroadcast` 中，增加检查是否有需要更新的消息，避免不必要的状态更新

---

## 2025-11-12 15:25:00 UTC

### 完成的工作
1. **修复客服端已读状态不实时更新的问题**
   - 问题：客服端发送消息后，必须手动刷新网页，消息才会变成已读状态
   - 原因：
     - 后端在广播 `messages_read` 事件时，payload 中没有包含 `conversation_id`
     - 前端的 `handleMessagesReadBroadcast` 在更新消息列表时，没有检查 `conversation_id` 是否匹配当前对话
   - 解决方案：
     - 后端：在 `messages_read` 事件的 payload 中添加 `conversation_id` 字段
     - 前端：在 `handleMessagesReadBroadcast` 中，只有当 `conversation_id === conversationId` 时才更新消息列表
     - 这样确保只有当前对话的消息才会被更新，避免误更新其他对话的消息
   - 实现方式：
     - `backend/service/message_service.go`：
       - 在 `MarkMessagesRead` 方法中，在广播 `messages_read` 事件时，在 payload 中添加 `conversation_id` 字段
     - `frontend/features/agent/hooks/useMessages.ts`：
       - 在 `handleMessagesReadBroadcast` 中，添加 `conversation_id === conversationId` 的检查，只有当匹配时才更新消息列表

---

## 2025-11-12 15:20:00 UTC

### 完成的工作
1. **修复访客端发送消息后不自动滚动的问题**
   - 问题：访客端发送完消息后不会自动滚动到底部
   - 原因：访客端使用了 `disableAutoScroll={true}`，导致整个滚动逻辑被禁用
   - 解决方案：
     - 修改 `disableAutoScroll` 的行为：不再完全禁用滚动逻辑
     - 当 `disableAutoScroll` 为 true 时，只禁用"收到对方消息时的自动滚动"
     - 当最后一条消息是自己发送的时，无论 `disableAutoScroll` 是什么值，都会自动滚动到底部
     - 这样确保：
       - 查看历史消息时（`disableAutoScroll` 为 true），收到对方消息不会自动滚动
       - 自己发送消息后，无论 `disableAutoScroll` 是什么值，都会自动滚动到底部
   - 实现方式：
     - `frontend/components/dashboard/MessageList.tsx`：
       - 移除 `disableAutoScroll` 在 `useEffect` 开头的早期返回
       - 修改滚动判断逻辑：`shouldAutoScroll = hasNewMessage && (isLastMessageFromCurrentUser || (!disableAutoScroll && isNearBottom))`
       - 这样确保自己发送的消息总是会触发滚动，而对方发送的消息只有在 `disableAutoScroll` 为 false 且在底部附近时才会滚动

---

## 2025-11-12 15:15:00 UTC

### 完成的工作
1. **优化滚动逻辑，改善查看历史消息的体验**
   - 问题：在查看历史消息时，收到对方发送的新消息会自动滚动到底部，打断用户的浏览
   - 需求：
     - 查看历史消息时，收到对方消息不应该自动滚动到底部
     - 自己发送消息后，应该自动滚动到底部
   - 解决方案：
     - 在消息更新时，通过比较消息ID和数量检查是否有新消息
     - 使用 `requestAnimationFrame` 确保 DOM 已更新后再检查位置
     - 在 DOM 更新后检查当前位置（距离底部 < 100px 视为在底部附近）
     - 滚动逻辑：
       1. 如果最后一条消息是自己发送的，无论在哪里都自动滚动到底部
       2. 如果最后一条消息是对方发送的，只有在底部附近时才自动滚动到底部（保持底部状态）
       3. 如果没有新消息（例如只是消息状态更新），不改变滚动位置
     - 这样确保：
       - 查看历史消息时（不在底部），收到对方消息不会自动滚动，不会打断浏览
       - 自己发送消息后，会自动滚动到底部，可以看到自己发送的消息
       - 如果已经在底部查看最新消息，收到对方消息时保持滚动到底部
   - 实现方式：
     - `frontend/components/dashboard/MessageList.tsx`：
       - 添加 `lastMessageIdRef` 和 `lastMessageCountRef` 来跟踪最后一条消息
       - 在消息更新时检查是否有新消息（通过比较消息ID和数量）
       - 使用 `requestAnimationFrame` 确保 DOM 已更新后再检查位置和决定是否滚动
       - 优化滚动逻辑，区分自己发送的消息和对方发送的消息
       - 在 `requestAnimationFrame` 回调中从 `containerRef.current` 重新获取容器，确保使用最新的 DOM 元素

---

## 2025-11-12 15:00:00 UTC

### 完成的工作
1. **修复已读状态逻辑问题**
   - 问题1：访客端的已读状态不更新，即使客服已经读取了消息，访客端仍然显示未读，需要刷新页面才能显示已读
   - 问题2：客服端的已读逻辑不正确，加载消息时自动标记为已读，但实际上应该在滚动到底部时才标记为已读
   - 问题3：访客端收到客服消息时自动标记为已读，但实际上应该在滚动到底部时才标记为已读
   - 解决方案：
     - 移除加载消息时自动标记为已读的逻辑（客服端和访客端）
     - 移除收到新消息时自动标记为已读的逻辑（客服端和访客端）
     - 在 `MessageList` 组件中添加滚动检测逻辑，当用户滚动到底部附近（距离底部 < 100px）时，延迟 500ms 后标记未读消息为已读
     - 当消息列表更新且自动滚动到底部时，延迟 800ms 后标记未读消息为已读（避免频繁调用，至少间隔 2 秒）
     - 修复访客端的 WebSocket `messages_read` 事件处理，确保正确更新已读状态
     - 修复客服端的 WebSocket `messages_read` 事件处理，确保只更新客服消息的已读状态（当 `reader_is_agent === false` 时）
   - 实现方式：
     - `frontend/app/chat/page.tsx`：移除自动标记为已读的逻辑，添加 `onMarkMessagesRead` 回调
     - `frontend/app/agent/chat/[conversationId]/page.tsx`：移除自动标记为已读的逻辑，修复 `handleMessagesReadEvent` 函数
     - `frontend/features/agent/hooks/useMessages.ts`：移除自动标记为已读的逻辑
     - `frontend/components/dashboard/MessageList.tsx`：添加滚动检测逻辑，当滚动到底部时标记消息为已读
     - `frontend/components/dashboard/DashboardShell.tsx`：传递 `onMarkMessagesRead` 回调给 `MessageList` 组件

---

## 2025-11-12 14:45:00 UTC

### 完成的工作
1. **优化日志记录，仅保留关键错误**
   - 问题：日志过于详细，包含大量正常流程的日志，影响性能和可读性
   - 解决方案：移除详细日志，仅保留关键错误和警告日志
   - 实现方式：
     - 后端：移除正常流程的详细日志（收到发送消息请求、消息创建成功、客户端连接、客户端断开、广播消息等）
     - 后端：保留关键错误日志（创建消息失败、WebSocket Hub 为空、广播消息失败、发送消息失败、WebSocket 读取错误、WebSocket 写入错误、发送 ping 失败）
     - 后端：保留关键警告日志（客户端断开时未找到、客户端断开时对话不存在、发送消息失败）
     - 前端：移除正常流程的详细日志（发送消息、消息发送成功、收到 WebSocket 消息、处理 WebSocket 消息、处理新消息、处理已读事件、添加新消息等）
     - 前端：保留关键错误日志（发送消息失败、解析 WebSocket 消息失败、WebSocket 错误、创建 WebSocket 连接失败、WebSocket 重连次数已达上限）
     - 前端：移除连接成功的日志（WebSocket 连接成功、WebSocket 连接关闭等）

2. **修复通道关闭问题**
   - 问题：通道可能被重复关闭，导致 panic
   - 解决方案：在关闭通道前检查通道是否已经关闭
   - 实现方式：
     - 在 `Hub.unregister` 中，使用 `select` 检查通道是否已经关闭
     - 如果通道已经关闭，不再关闭
     - 如果通道未关闭，关闭它

3. **优化 WebSocket 连接管理**
   - 问题：在开发模式下，大量 WebSocket 连接可能导致问题
   - 解决方案：改进断开连接逻辑，确保连接正确关闭
   - 实现方式：
     - 在 `WSClient.disconnect` 中，设置 `reconnectAttempts = maxReconnectAttempts` 避免重连
     - 在关闭连接前，检查连接状态
     - 移除断开连接的详细日志

---

## 2025-11-12 14:30:00 UTC

### 完成的工作
1. **添加详细日志用于调试消息广播问题**
   - 问题：用户报告访客端发送消息后，客服端没有收到（后续确认消息发送正常）
   - 解决方案：添加详细的日志来跟踪消息发送和广播过程，便于未来调试
   - 注意：后续优化为仅保留关键错误日志（见 2025-11-12 14:45:00 UTC）

### 技术细节
- 修改文件：
  - `backend/controller/message_controller.go`：添加消息创建日志
  - `backend/service/message_service.go`：添加消息广播日志
  - `backend/websocket/hub.go`：添加广播消息日志、修复通道关闭问题
  - `backend/websocket/client.go`：添加 WebSocket 发送消息日志、修复通道关闭问题
  - `frontend/features/agent/services/messageApi.ts`：添加消息发送日志
  - `frontend/app/chat/page.tsx`：添加消息发送和处理日志
  - `frontend/features/agent/hooks/useMessages.ts`：添加消息处理日志
  - `frontend/lib/websocket.ts`：添加 WebSocket 消息接收日志、优化断开连接逻辑

### 调试步骤
1. **测试消息发送**：
   - 在访客端发送消息
   - 查看浏览器控制台日志：
     - 应该看到 `📨 开始发送消息: 对话ID=X, 内容="..."`
     - 应该看到 `📤 发送消息: 对话ID=X, 是客服=false, 发送者ID=0, 内容长度=X`
     - 应该看到 `✅ 消息发送成功: 对话ID=X`
   - 查看后端日志：
     - 应该看到 `📨 收到发送消息请求: 对话ID=X, 发送者ID=0, 是客服=false, 内容长度=X`
     - 应该看到 `✅ 消息创建成功: 消息ID=X, 对话ID=X, 已广播`
     - 应该看到 `📤 准备通过 WebSocket 广播消息: 消息ID=X, 对话ID=X`
     - 应该看到 `📤 准备广播消息: 对话ID=X, 类型=new_message`
     - 应该看到 `📢 广播消息: 对话ID=X, 类型=new_message, 客户端数=X`
     - 应该看到 `📤 WebSocket 消息已发送: 对话ID=X, 类型=new_message, 是访客=false`（客服端）
     - 应该看到 `✅ 消息广播完成: 对话ID=X, 成功=X, 失败=0`

2. **测试消息接收**：
   - 在客服端查看浏览器控制台日志：
     - 应该看到 `📨 收到 WebSocket 消息: 对话ID=X, 类型=new_message`
     - 应该看到 `📨 处理 WebSocket 消息（客服端）: 对话ID=X, 类型=new_message`
     - 应该看到 `📨 处理新消息（客服端）: {...}`
     - 应该看到 `✅ 添加新消息: 消息ID=X, 内容="..."`

3. **如果消息没有发送**：
   - 检查浏览器控制台是否有错误
   - 检查网络请求（Network 标签）是否有 `POST /messages` 请求
   - 检查请求状态码（应该是 200）

4. **如果消息发送了但没有广播**：
   - 检查后端日志是否有 `📤 准备通过 WebSocket 广播消息` 日志
   - 检查后端日志是否有 `📢 广播消息` 日志
   - 检查后端日志是否有 `⚠️ WebSocket Hub 为空` 日志（如果有，说明 Hub 没有正确初始化）

5. **如果消息广播了但没有收到**：
   - 检查后端日志是否有 `📤 WebSocket 消息已发送` 日志
   - 检查后端日志是否有 `⚠️ 发送消息失败` 日志
   - 检查前端日志是否有 `📨 收到 WebSocket 消息` 日志
   - 检查 WebSocket 连接是否正常（查看浏览器 Network 标签中的 WebSocket 连接）

### 后续优化
- 检查开发模式下大量 WebSocket 连接的问题（可能是 Next.js 热重载导致的）
- 优化连接管理，减少重复连接
- 添加连接数限制，防止连接数过多

---

## 2025-11-12 14:00:00 UTC

### 完成的工作
1. **修复 WebSocket 错误处理问题**
   - 问题：WebSocket 连接错误显示为 `{}`，错误信息不够详细
   - 解决方案：改进错误处理，提供更详细的错误信息
   - 实现方式：
     - 在 `onerror` 事件中检查 `readyState` 和 `url`，提供详细的错误信息
     - 在 `onclose` 事件中获取关闭代码和原因，提供详细的关闭信息
     - 只有在非正常关闭时才尝试重连（避免在开发模式下频繁重连）
     - 使用 `useRef` 存储回调函数，避免因回调函数变化导致重新连接
     - 在连接前检查是否已存在连接，避免重复连接

### 技术细节
- 修改文件：
  - `frontend/lib/websocket.ts`：改进错误处理和关闭处理
  - `frontend/features/agent/hooks/useWebSocket.ts`：使用 `useRef` 存储回调函数
  - `frontend/app/chat/page.tsx`：明确设置 `isVisitor: true`
- 实现原理：
  - 在 `onerror` 事件中，检查 `readyState` 和 `url`，提供详细错误信息
  - 在 `onclose` 事件中，获取关闭代码（`code`）、原因（`reason`）和是否干净关闭（`wasClean`）
  - 只有在 `!wasClean && code !== 1000` 时才尝试重连
  - 使用 `useRef` 存储回调函数，避免因回调函数变化导致 `useEffect` 重新执行
  - 在 `connect()` 方法中，检查是否已存在连接，如果存在则先断开
- ✅ `npm run lint`（frontend，无警告）

### 错误处理改进
- ✅ 提供详细的错误信息（状态、URL等）
- ✅ 提供详细的关闭信息（关闭代码、原因、是否干净关闭）
- ✅ 避免在开发模式下频繁重连
- ✅ 避免因回调函数变化导致重新连接
- ✅ 避免重复连接

### 测试状态
✅ 手动验证：WebSocket 错误处理和关闭处理正常，错误信息详细

---

## 2025-11-12 13:30:00 UTC

### 完成的工作
1. **修复输入框失去焦点问题**
   - 问题：在访客端和客服端，发送完一条消息后，输入框失去焦点，需要再次点击输入框才能继续输入
   - 解决方案：在 `MessageInput` 组件中添加自动聚焦功能
   - 实现方式：
     - 使用 `useRef` 引用输入框元素
     - 使用 `useEffect` 监听 `sending` 状态变化
     - 当 `sending` 从 `true` 变为 `false` 时（发送完成），自动聚焦到输入框
     - 使用 `setTimeout` 确保 DOM 更新完成后再聚焦

### 技术细节
- 修改文件：
  - `frontend/components/dashboard/MessageInput.tsx`：添加自动聚焦功能
- 实现原理：
  - 使用 `useRef` 创建输入框引用 `inputRef`
  - 使用 `useRef` 记录上一次的 `sending` 状态 `prevSendingRef`
  - 在 `useEffect` 中监听 `sending` 状态变化
  - 当 `prevSendingRef.current === true && sending === false` 时，说明刚刚发送完成
  - 调用 `inputRef.current?.focus()` 聚焦到输入框
  - 使用 `setTimeout(..., 0)` 确保 DOM 更新完成后再聚焦
- ✅ `npm run lint`（frontend，无警告）

### 测试状态
✅ 手动验证：发送消息后，输入框自动聚焦，可以直接继续输入

### 用户体验改进
- ✅ 发送消息后，输入框自动聚焦，无需再次点击
- ✅ 用户可以连续发送多条消息，无需每次点击输入框
- ✅ 提升聊天体验，减少操作步骤

---

## 2025-11-12 13:00:00 UTC

### 完成的工作
1. **更新测试指南文档**
   - 添加完整的测试指南，覆盖所有已实现功能
   - 添加访客端测试流程（8个测试项）
   - 添加客服端测试流程（16个测试项）
   - 添加实时通信测试（WebSocket 实时推送、已读状态同步、在线状态更新）
   - 添加搜索功能测试（关键词高亮、自动定位）
   - 添加访客信息测试（信息收集、联系信息编辑）
   - 添加界面交互测试（滚动行为、响应式布局）
   - 添加错误处理测试（网络错误、数据验证）
   - 添加性能测试（加载性能、实时性能）
   - 添加兼容性测试（浏览器兼容、数据持久化）
   - 添加快速测试流程（核心功能验证，约30分钟）
   - 添加高级测试场景（8个场景：多访客、并发、长时间连接、网络中断、大量消息、搜索性能、并发编辑、多访客状态）
   - 添加调试技巧（浏览器开发者工具、控制台、网络请求、后端日志）
   - 添加常见问题（10个常见问题及解决方案）
   - 添加完整测试检查清单（8个测试类别，100+ 测试项）
   - 添加测试结果记录模板

### 技术细节
- 修改文件：
  - `doc/测试指南.md`：完整重写，添加所有已实现功能的测试指南
- 文档结构：
  - 一、准备工作（数据库配置、快速开始）
  - 二、启动后端
  - 三、启动前端
  - 四、访客端测试流程（8个测试项）
  - 五、客服端测试流程（16个测试项）
  - 六、调试技巧
  - 七、常见问题（10个常见问题）
  - 八、完整测试检查清单（8个测试类别）
  - 九、快速测试流程（核心功能验证）
  - 十、高级测试场景（8个场景）
  - 十一、测试结果记录

### 测试覆盖
- ✅ 基础功能测试（访客端、客服端）
- ✅ 实时通信测试（WebSocket 实时推送、已读状态同步、在线状态更新）
- ✅ 搜索功能测试（关键词高亮、自动定位）
- ✅ 访客信息测试（信息收集、联系信息编辑）
- ✅ 界面交互测试（滚动行为、响应式布局）
- ✅ 错误处理测试（网络错误、数据验证）
- ✅ 性能测试（加载性能、实时性能）
- ✅ 兼容性测试（浏览器兼容、数据持久化）
- ✅ 高级测试场景（多访客、并发、长时间连接、网络中断、大量消息、搜索性能、并发编辑、多访客状态）

### 后续优化
- 添加自动化测试（E2E 测试）
- 添加性能测试报告
- 添加测试覆盖率报告

---

## 2025-11-12 12:00:00 UTC

### 完成的工作
1. **对话状态管理（在线/离线）实时更新**
   - 后端：WebSocket 连接建立时标记访客在线，断开时标记离线
   - 后端：通过 WebSocket 推送 `visitor_status_update` 事件到客服端
   - 后端：在 `ConversationService` 中添加 `UpdateVisitorOnlineStatus` 和 `UpdateLastSeenAt` 方法
   - 后端：在 `Hub` 中添加回调机制，在客户端连接/断开时调用回调函数
   - 后端：在 `Client` 中添加 `isVisitor` 字段，区分访客和客服
   - 前端：WebSocket 客户端添加 `isVisitor` 参数，默认值为 `true`
   - 前端：客服端 WebSocket 连接设置 `isVisitor=false`
   - 前端：客服端接收 `visitor_status_update` 事件，刷新对话详情
   - 前端：在对话列表中显示在线/离线图标（绿色圆点表示在线）

### 技术细节
- 修改文件：
  - 后端：`backend/service/conversation_service.go`、`backend/websocket/hub.go`、`backend/websocket/client.go`、`backend/websocket/handler.go`、`backend/main.go`
  - 前端：`frontend/lib/websocket.ts`、`frontend/features/agent/hooks/useWebSocket.ts`、`frontend/features/agent/hooks/useMessages.ts`、`frontend/features/agent/types.ts`、`frontend/components/dashboard/ConversationListItem.tsx`
- ✅ `npm run lint`（frontend，无警告）
- ✅ `gofmt`（backend，无错误）

### 实现原理
- 当访客连接 WebSocket 时，后端会调用 `UpdateVisitorOnlineStatus(conversationID, true)` 更新在线状态
- 当访客断开 WebSocket 时，后端会检查该对话是否还有其他访客连接，如果没有，则调用 `UpdateVisitorOnlineStatus(conversationID, false)` 更新离线状态
- 后端通过 WebSocket 广播 `visitor_status_update` 事件到该对话的所有客户端（包括客服）
- 客服端在收到 `visitor_status_update` 事件时，刷新当前对话详情，更新在线状态
- 对话列表中显示在线/离线图标（基于 `status === "open"` 判断）

### 测试状态
✅ 手动验证：访客连接/断开 WebSocket 时，客服端实时更新在线状态

### 后续优化
- 实现心跳机制（定期更新 `last_seen_at`）
- 根据 `last_seen_at` 判断是否在线（例如，如果 `last_seen_at` 在最近 60 秒内，则认为在线）
- 在 `ConversationSummary` 中添加 `last_seen_at` 字段，以便在对话列表中显示最后活跃时间
- 定期轮询对话列表，更新所有对话的状态

---

## 2025-11-12 11:10:00 UTC

### 完成的工作
1. **修复已读状态同步问题**
   - 访客端：修复 `handleMessagesReadEvent` 未判断 `reader_is_agent`，导致客服读取访客消息后，访客端无法更新已读状态
   - 客服端：修复 `handleMessagesReadBroadcast` 未判断 `reader_is_agent`，导致访客读取客服消息后，客服端无法更新已读状态
   - 访客端：只有当 `reader_is_agent === true` 时，才更新访客消息（`sender_is_agent === false`）的已读状态
   - 客服端：只有当 `reader_is_agent === false` 时，才更新客服消息（`sender_is_agent === true`）的已读状态

### 技术细节
- 修改文件：`frontend/app/chat/page.tsx`、`frontend/features/agent/hooks/useMessages.ts`
- ✅ `npm run lint`（frontend，无警告）

### 问题原因
- 后端通过 WebSocket 推送 `messages_read` 事件时，会包含 `reader_is_agent` 字段，表示读取者是客服还是访客
- 前端在接收 `messages_read` 事件时，没有判断 `reader_is_agent`，导致错误地更新了消息的已读状态
- 对于访客端：只有当客服读取了访客的消息（`reader_is_agent === true`）时，才应该更新访客消息的已读状态
- 对于客服端：只有当访客读取了客服的消息（`reader_is_agent === false`）时，才应该更新客服消息的已读状态

### 测试状态
✅ 手动验证：访客发送消息后，客服查看消息，访客端显示双对勾（已读状态）

---

## 2025-11-11 08:00:00 UTC

### 完成的工作
1. **访客联系信息编辑闭环**
   - 后端新增 `PUT /conversations/:id/contact` 接口，`ConversationService.UpdateConversationContact` 落库邮箱/电话/备注
   - 前端 `VisitorDetailPanel` 增加弹窗编辑，支持新增、修改、清空邮箱/电话/备注并即时刷新
2. **服务与 Hook 扩展**
   - `conversationApi.updateConversationContact` 封装更新接口，统一返回结构
   - `useMessages` 暴露 `updateContactInfo`，`DashboardShell` 和 `VisitorDetailPanel` 通过钩子完成联动

### 技术细节
- 新增/修改文件：`backend/controller/conversation_controller.go`、`backend/service/conversation_service.go`、`backend/router/router.go`、`backend/service/types.go`
- 前端涉及文件：`features/agent/services/conversationApi.ts`、`features/agent/hooks/useMessages.ts`、`components/dashboard/VisitorDetailPanel.tsx`
- ✅ `npm run lint`（frontend）

### 测试状态
✅ 手动验证：客服工作台编辑邮箱/电话/备注，数据保存后右栏即时更新

---

## 2025-11-10 07:30:00 UTC

### 完成的工作
1. **客服工作台前端架构拆分**
   - `app/agent/dashboard/page.tsx` 只保留页面入口，改由 `DashboardShell` 负责布局编排
   - 新增 `components/dashboard/*`，将导航栏、会话列表、消息区、访客详情拆分为独立组件
   - 新增 `features/agent/hooks` 与 `features/agent/services`，分别承载状态逻辑与 API 调用
   - 新增 `utils/format.ts`、`utils/highlight.tsx`、`utils/storage.ts`，统一时间格式、关键词高亮与本地存储操作

2. **会话/消息状态管理优化**
   - `useAuth` 统一处理本地登录信息与退出逻辑
   - `useConversations` 负责对话列表、搜索、防抖与排序
   - `useMessages` + `useWebSocket` 负责消息拉取、已读回执、WebSocket 广播与高亮定位

3. **TypeScript 类型补全**
   - `features/agent/types.ts` 汇总会话、消息、用户等公共类型
   - `lib/websocket.ts`、`useWebSocket`、`useMessages` 改用强类型定义，消除 `any`

4. **旧版客服聊天页迁移**
   - `/agent/chat/[conversationId]` 复用统一的消息组件、输入框与 WebSocket 逻辑
   - 接入服务层 API 与 Hook，移除旧版冗余状态/样式代码
   - 支持快速返回工作台，交互体验与四栏布局保持一致

5. **访客聊天页重构**
   - `/chat` 页面改用统一的 `MessageList`、`MessageInput` 组件和消息服务
   - 对话初始化、WebSocket、已读回执与客服端共享实现，减少重复逻辑
   - 保留访客视角的气泡样式与默认提示，UI/状态与客服端保持一致

### 技术细节
- 新增目录：`components/dashboard/`、`features/agent/hooks/`、`features/agent/services/`、`utils/`
- 复用工具函数：消息预览截断、时间格式化、关键词高亮、localStorage 操作
- ESLint：`npm run lint` 通过

### 测试状态
✅ `npm run lint`（frontend，无警告）

### 下一步计划
- 继续补充自动化测试（组件级、hook 级单元测试）
- 为 `services` 层补充基础错误处理与重试策略
- 为文件上传、AI 客服等后续功能预留组件与 Hook 模板

## 2025-11-10 05:00:00 UTC

### 完成的工作
1. **访客信息采集落地**
   - 后端 `InitConversation` 接口接收并保存网站、来源、浏览器、系统、语言、IP 等信息
   - 访客前端自动采集页面 URL、Referrer、User-Agent、语言信息并随初始化请求提交
   - 对话表新增字段，支持持久化访客技术信息及联系信息占位
   - 会话 `last_seen_at` 字段初始化，便于后续在线状态展示

2. **系统消息写入与展示**
   - 消息表新增 `message_type` 字段，区分普通消息与系统消息
   - 新对话自动生成系统消息（访问入口、来源页面）
   - 客服工作台中，系统消息以灰色气泡居中展示，支持关键词高亮与定位

3. **客服工作台访客详情完善**
   - 新增 `GET /conversations/:id` 接口返回完整访客信息
   - 右侧访客详情面板展示网站、来源、浏览器、系统、语言、IP、最后活跃等数据
   - 联系信息区域展示实际数据（暂无信息时提供提示），保留后续编辑入口
   - 聊天头部显示更准确的 last seen 信息

4. **搜索体验优化**
   - 搜索匹配的系统消息支持高亮与自动定位
   - WebSocket 收到新消息时自动刷新会话详情，保持访客信息实时

5. **消息已读/未读状态（基础版）**
   - 数据库新增 `is_read` / `read_at` 字段，支持已读记录
   - 新增 `PUT /messages/read` 接口及 WebSocket `messages_read` 事件，同步状态
   - 客服端/访客端聊天气泡显示单/双对勾，已读回执实时可见
   - 对话列表同步显示最后一条消息的已读状态

### 技术细节
- MySQL 表结构：`conversations` 新增多项访客字段，`messages` 新增 `message_type`
- 后端：新增 `ConversationDetailRes`、`GetConversationDetail`，并统一时间格式输出
- 前端：新增访客详情状态管理、系统消息渲染分支、技术信息展示组件
- WebSocket：收到新消息后同步刷新会话详情，确保右侧数据与消息流一致

### 测试状态
✅ 通过手动测试：访问 `/chat` 生成新对话，确认数据库记录访客信息与系统消息  
✅ 通过客服工作台验证：系统消息样式正常，访客详情与数据库数据一致  
✅ 搜索“关键词”后点击结果，可自动定位系统消息并高亮

### 下一步计划
- 实现客服端联系信息的手动添加/编辑
- 基于 `last_seen_at` 和 WebSocket 心跳完成在线状态实时更新
- 继续扩展系统消息（如客服加入/离开、对话状态变化）
- 访客位置字段对接外部服务（基于 IP 定位）

## 2025-01-16 18:00:00 UTC

### 完成的工作
1. **客服工作台四栏布局实现**
   - 实现最左侧导航菜单栏（固定宽度 64px，浅灰色背景）
   - 实现左侧对话列表栏（固定宽度 320px，显示所有对话）
   - 实现中间聊天内容栏（自适应宽度，集成完整聊天功能）
   - 实现右侧访客详情栏（固定宽度 320px，显示联系信息和技术信息）
   - 统一顶部栏高度（h-16），确保三栏对齐

2. **中间栏聊天功能集成**
   - 集成消息显示功能（客服消息在右，访客消息在左）
   - 集成消息发送功能（支持实时发送）
   - 集成 WebSocket 实时通信（自动接收新消息）
   - 实现自动滚动到底部（新消息自动可见）
   - 实现智能时间格式化（今天显示时间，更早显示日期+时间）
   - 实现消息加载状态和发送状态

3. **右侧栏访客详情实现**
   - 显示访客头像（基于 visitor_id 生成颜色）
   - 显示在线/离线状态（基于对话状态）
   - 显示联系信息（邮箱、电话、备注，支持添加按钮）
   - 显示技术信息（网站、来源、位置等，占位待实现）
   - 实现刷新按钮（可刷新消息）

4. **UI 优化**
   - 移除右侧栏重复的基础信息（对话ID、状态等已在左侧显示）
   - 统一联系信息的交互方式（邮箱、电话、备注都有"+ Add"按钮）
   - 优化导航栏颜色（与聊天内容背景一致）
   - 优化对话列表显示（头像、ID、状态、时间）

### 技术细节
- 使用 React 状态管理多个对话和消息
- 使用 `useEffect` 实现对话切换时自动加载消息
- 使用 WebSocket 实现实时消息推送
- 使用 `useRef` 实现自动滚动功能
- 使用 Tailwind CSS 实现响应式布局
- 对话切换时自动清空消息列表并重新加载

### 用户体验
- 无需跳转页面，在同一页面内切换对话
- 实时接收新消息，无需手动刷新
- 消息发送后立即显示，体验流畅
- 界面布局清晰，信息层次分明
- 右侧栏专注于显示左侧看不到的详细信息

### 测试状态
✅ 功能测试通过：四栏布局、对话切换、消息发送、实时通信均正常工作

### 下一步计划
- 实现会话搜索功能（左侧栏搜索框）
- 实现客服个人资料管理（头像上传、信息修改）
- 实现访客信息自动收集（技术信息、来源页面等）
- 实现对话状态管理（在线/离线状态实时更新）

## 2025-01-15 21:00:00 UTC

### 完成的工作
1. **WebSocket 实时通信功能**
   - 实现后端 WebSocket Hub 管理器：管理所有客户端连接，按对话ID分组
   - 实现 WebSocket 客户端处理：处理连接、心跳检测、消息发送
   - 实现 WebSocket 路由处理：升级 HTTP 连接为 WebSocket 连接
   - 集成消息推送：消息创建后自动通过 WebSocket 推送给所有相关客户端
   - 实现前端 WebSocket 客户端：封装连接、自动重连、消息接收
   - 访客端和客服端都支持实时消息推送

2. **技术实现**
   - 后端使用 `gorilla/websocket` 库
   - 前端使用原生 WebSocket API
   - 实现心跳检测（Ping/Pong）保持连接活跃
   - 实现自动重连机制（最多 5 次）
   - 消息去重，避免重复显示

3. **文档更新**
   - 创建 `doc/WebSocket学习笔记.md`：详细解释 WebSocket 工作原理
   - 包含前后端代码示例和完整流程说明

### 技术细节
- WebSocket 路由：`/ws?conversation_id=<对话ID>`
- 消息格式：`{ type: "new_message", conversation_id: number, data: Message }`
- 连接升级：HTTP 连接升级为 WebSocket 连接（101 状态码）
- 心跳间隔：每 54 秒发送一次 Ping
- 重连策略：断开后等待 3 秒，最多重试 5 次

### 用户体验改进
- ✅ 访客发送消息后，客服立即看到（无需刷新）
- ✅ 客服发送消息后，访客立即看到（无需刷新）
- ✅ 真正的实时双向通信
- ✅ 连接断开后自动重连

### 测试状态
✅ 功能实现完成，待测试

## 2025-01-15 20:00:00 UTC

### 完成的工作
1. **客服端功能完整实现**
   - 实现客服登录页面（`/`）：使用默认管理员账号（admin/admin123）登录
   - 实现对话列表页面（`/agent/conversations`）：显示所有未关闭的对话，支持点击进入聊天
   - 实现客服聊天页面（`/agent/chat/[conversationId]`）：客服可以查看和回复访客消息
   - 实现登录状态检查：未登录自动跳转到登录页
   - 实现退出登录功能：清除登录状态并跳转

2. **消息显示优化**
   - 客服端消息布局：客服消息在右侧（蓝色气泡），访客消息在左侧（白色气泡）
   - 从客服视角优化 UI，符合客服使用习惯

3. **后端功能完善**
   - 实现默认管理员账号自动创建（首次启动时创建 admin/admin123）
   - 实现对话列表查询接口（`GET /conversations`）：返回所有未关闭的对话
   - 实现创建客服账号接口（`POST /admin/users`）：管理员可以创建新的客服/管理员账号
   - 实现退出登录接口（`POST /logout`）：用于前端清除登录状态

4. **文档更新**
   - 更新测试指南：添加完整的客服端测试流程
   - 更新 CHANGELOG：记录客服端开发过程

### 技术细节
- 使用 `localStorage` 存储客服登录信息（`agent_user_id`、`agent_username`、`agent_role`）
- 使用 Next.js 路由保护：检查登录状态，未登录自动跳转
- 客服聊天页面复用访客聊天页面的核心逻辑，调整消息显示位置
- 后端使用 `initDefaultAdmin` 函数在首次启动时自动创建默认管理员

### 用户体验
- 客服登录流程简单：使用默认账号即可登录
- 对话列表清晰：显示对话状态、访客ID、时间等信息
- 客服聊天界面直观：客服消息在右，访客消息在左
- 登录状态管理完善：未登录自动跳转，退出登录清除状态

### 测试状态
✅ 功能测试通过：登录、对话列表、客服聊天、退出登录均正常工作

### 下一步计划
- 添加实时消息推送（WebSocket）
- 添加对话状态管理（关闭对话、重新打开等）
- 优化 UI 和用户体验

## 2025-01-15 18:00:00 UTC

### 完成的工作
1. **访客聊天页面完整实现**
   - 实现消息发送功能（`POST /messages`）
   - 实现消息拉取功能（`GET /messages`）
   - 实现消息列表展示（区分访客和客服消息）
   - 实现自动滚动到底部（新消息自动可见）
   - 实现时间格式化显示（今天显示时间，更早显示日期+时间）
   - 优化 UI：删除多余标签，位置已能区分发送者

2. **代码优化和注释**
   - 为所有代码添加详细的中文注释，解释每行代码的作用
   - 使用通俗易懂的类比（如"数据盒子"、"书签"等）帮助理解
   - 优化代码结构，确保逻辑清晰

3. **文档完善**
   - 创建 `doc/前端学习笔记.md`：核心概念解释、英文单词记忆、常见错误
   - 创建 `doc/测试指南.md`：完整的测试步骤和问题排查指南
   - 创建 `doc/系统角色说明.md`：解释访客和客服的区别
   - 修复测试指南中的 localStorage 说明（同一浏览器标签页共享）

4. **Bug修复**
   - 修复 `.env` 文件 UTF-8 BOM 编码问题（godotenv 不支持 BOM）
   - 添加后端 `.env` 文件加载的详细调试信息
   - 修复代码结构问题（消息列表和输入框位置错误）

### 技术细节
- 使用 `useState` 管理消息列表、输入框、加载状态
- 使用 `useEffect` 实现自动拉取消息和自动滚动
- 使用 `useRef` 实现自动滚动到底部的功能
- 使用 `localStorage` 持久化访客ID（同一浏览器标签页共享）

### 用户体验
- 访客无需登录，直接访问 `/chat` 即可使用
- 发送消息后自动滚动到底部，无需手动滚动
- 时间显示智能优化：今天只显示时间，更早显示日期+时间
- UI 简洁：位置已能区分发送者，无需额外标签

### 测试状态
✅ 功能测试通过：消息发送、接收、显示、自动滚动均正常工作

### 下一步计划
- 开发客服端功能（客服登录、对话列表、客服聊天页面）
- 或优化现有功能（消息状态、错误重试、UI 优化等）

## 2025-01-15 10:00:00 UTC

### 完成的工作
1. 前端配置化改进
   - 创建 `frontend/lib/config.ts` 统一管理 API 地址配置
   - 使用环境变量 `NEXT_PUBLIC_API_BASE_URL` 配置后端地址
   - 移除前端所有硬编码 API 地址
   - 支持通过 `.env.local` 配置不同环境的后端地址
2. 更新文档
   - README 添加前端环境变量配置说明
   - 补充部署环境切换的使用说明

### 意义
- 本地开发：无需配置，默认使用 `http://127.0.0.1:8080`
- 生产部署：只需修改 `.env.local` 中的 `NEXT_PUBLIC_API_BASE_URL` 为实际域名
- 好处：类比后端数据库配置，前端 API 配置也可通过环境变量灵活切换

## 2025-10-30 12:00:00 UTC

### 完成的工作
1. 统一后端接口路径与方法
   - 新增规范路由：`POST /conversation/init`、`POST /messages`、`GET /messages`
   - 删除旧路由：`/initconversation`、`/createmessage`、`/listmessage`
2. 数据库配置改为环境变量
   - 从 `.env` 读取 `DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME`
   - 移除硬编码 DSN，提升安全性与可配置性
3. 更新 README
   - 补充接口文档与后端环境变量示例，增加 `.env` 使用说明

### 风险与注意
- 该变更为不向后兼容的变更，请确保前端使用新路由
- 需要在 `backend/.env` 正确配置数据库连接参数

## 2024-12-19 15:30:00 UTC

### 完成的工作
1. **完善对话初始化功能**
   - 修复了 `InitConversation` 函数中不完整的代码逻辑
   - 添加了完整的错误处理和响应返回
   - 实现了查找现有对话或创建新对话的逻辑

2. **创建项目文档**
   - 编写了详细的 README.md 文件
   - 包含项目结构、功能说明、API接口文档
   - 添加了对话初始化逻辑的详细解释

3. **代码优化**
   - 统一了变量命名（req 替代 in）
   - 改进了错误提示信息
   - 添加了详细的中文注释

### 技术细节
- 对话初始化逻辑：先查找访客的现有开放对话，如果没有则创建新对话
- 使用 GORM 进行数据库操作
- 实现了完整的错误处理机制

### 下一步计划
- 完善发送消息功能
- 实现拉取消息功能
- 添加前端界面

