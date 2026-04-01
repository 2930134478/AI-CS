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
  wsToken?: string; // 客服 WS 令牌（登录后下发）
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
  private wsToken?: string; // 客服 WS 令牌
  private onMessage?: (message: WSMessage<T>) => void;
  private onError?: (error: Event) => void;
  private onClose?: () => void;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private reconnectDelay = 3000; // 初始 3 秒
  private maxReconnectDelay = 30000; // 最长 30 秒
  private manualDisconnect = false;
  private logPrefix = "❌ WebSocket 错误";

  constructor(options: WSOptions<T>) {
    this.conversationId = options.conversationId;
    this.isVisitor = options.isVisitor !== undefined ? options.isVisitor : true;
    this.agentId = options.agentId;
    this.wsToken = options.wsToken;
    this.onMessage = options.onMessage;
    this.onError = options.onError;
    this.onClose = options.onClose;
  }

  // 连接 WebSocket
  connect() {
    this.manualDisconnect = false;
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
      if (this.wsToken) {
        wsUrl += `&ws_token=${encodeURIComponent(this.wsToken)}`;
      }
    }

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0; // 重置重连次数
        this.reconnectDelay = 3000; // 连接恢复后重置退避时间
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
        // 主动断开或连接已进入关闭态时，浏览器仍可能触发 onerror，这属于预期行为，避免误报。
        if (this.manualDisconnect || state === WebSocket.CLOSING || state === WebSocket.CLOSED) {
          return;
        }
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
          `${this.logPrefix}: 对话ID=${this.conversationId}, 状态=${stateText}, URL=${url}`,
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
        // 除主动断开外，任意关闭都重连（代理空闲断开通常是 clean close）。
        if (!this.manualDisconnect) {
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
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
    // 指数退避，避免网络波动时过于频繁重连
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
  }

  // 断开连接
  disconnect() {
    this.manualDisconnect = true;
    // 取消重连
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // 关闭 WebSocket 连接
    if (this.ws) {
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

