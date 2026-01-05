// WebSocket 客户端工具
// 用于连接后端 WebSocket 服务，接收实时消息

// WebSocket 消息类型
export interface WSMessage<T = unknown> {
  type: string; // "new_message" | "conversation_update" 等
  conversation_id: number;
  data: T; // 消息内容（Message 对象）
}

// WebSocket 连接选项
export interface WSOptions<T = unknown> {
  conversationId: number; // 对话ID
  isVisitor?: boolean; // 是否是访客（默认为 true）
  agentId?: number; // 客服ID（如果是客服连接，需要传递）
  onMessage?: (message: WSMessage<T>) => void; // 收到消息时的回调
  onError?: (error: Event) => void; // 连接错误时的回调
  onClose?: () => void; // 连接关闭时的回调
}

// WebSocket 客户端类
export class WSClient<T = unknown> {
  private ws: WebSocket | null = null;
  private conversationId: number;
  private isVisitor: boolean;
  private agentId?: number; // 客服ID
  private onMessage?: (message: WSMessage<T>) => void;
  private onError?: (error: Event) => void;
  private onClose?: () => void;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3秒

  constructor(options: WSOptions<T>) {
    this.conversationId = options.conversationId;
    this.isVisitor = options.isVisitor !== undefined ? options.isVisitor : true;
    this.agentId = options.agentId;
    this.onMessage = options.onMessage;
    this.onError = options.onError;
    this.onClose = options.onClose;
  }

  // 连接 WebSocket
  connect() {
    // 如果已经连接，先断开
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      this.ws.close();
      this.ws = null;
    }

    // 使用相对路径构建 WebSocket URL（自动适配当前域名和协议）
    // 根据当前页面的协议自动选择 ws:// 或 wss://
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = typeof window !== 'undefined' ? window.location.host : '';
    let wsUrl = `${protocol}//${host}/ws?conversation_id=${this.conversationId}&is_visitor=${this.isVisitor}`;
    // 如果是客服连接，添加 agent_id 参数
    if (!this.isVisitor && this.agentId) {
      wsUrl += `&agent_id=${this.agentId}`;
    }

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0; // 重置重连次数
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WSMessage<T> = JSON.parse(event.data);
          if (this.onMessage) {
            this.onMessage(message);
          }
        } catch (error) {
          console.error(
            `❌ 解析 WebSocket 消息失败: 对话ID=${this.conversationId}`,
            error
          );
        }
      };

      this.ws.onerror = (error) => {
        const state = this.ws?.readyState;
        const stateText =
          state === WebSocket.CONNECTING
            ? "连接中"
            : state === WebSocket.OPEN
              ? "已连接"
              : state === WebSocket.CLOSING
                ? "关闭中"
                : state === WebSocket.CLOSED
                  ? "已关闭"
                  : "未知";
        const url = this.ws?.url || wsUrl;
        console.error(
          `❌ WebSocket 错误: 对话ID=${this.conversationId}, 状态=${stateText}, URL=${url}`,
          error
        );
        if (this.onError) {
          this.onError(error);
        }
      };

      this.ws.onclose = (event) => {
        this.ws = null;
        if (this.onClose) {
          this.onClose();
        }
        // 只有在非正常关闭时才尝试重连（避免在开发模式下频繁重连）
        const code = event.code;
        const wasClean = event.wasClean;
        if (!wasClean && code !== 1000) {
          this.attemptReconnect();
        }
      };
    } catch (error) {
      console.error(
        `❌ 创建 WebSocket 连接失败: 对话ID=${this.conversationId}, URL=${wsUrl}`,
        error
      );
      if (this.onError) {
        // 创建一个错误事件对象
        const errorEvent = new Event("error");
        this.onError(errorEvent);
      }
    }
  }

  // 尝试重连
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`❌ WebSocket 重连次数已达上限，停止重连: 对话ID=${this.conversationId}`);
      return;
    }

    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
  }

  // 断开连接
  disconnect() {
    // 取消重连
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // 关闭 WebSocket 连接
    if (this.ws) {
      // 设置标志，避免重连
      this.reconnectAttempts = this.maxReconnectAttempts;
      // 关闭连接
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
  }

  // 检查是否已连接
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

