/**
 * AI-CS 访客聊天小窗插件
 * 可嵌入到任何网站中，提供客服聊天功能
 * 
 * 使用方法：
 * <script src="https://your-domain.com/widget.js"></script>
 * <script>
 *   AICSWidget.init({
 *     apiUrl: 'https://your-api-domain.com',
 *     position: 'bottom-right' // 可选：'bottom-right' | 'bottom-left'
 *   });
 * </script>
 */

(function() {
  'use strict';

  // 配置（从全局变量或默认值读取后端端口）
  const getDefaultBackendPort = () => {
    // 优先使用全局变量（可在页面中通过 script 标签设置）
    if (typeof window !== 'undefined' && window.AICS_BACKEND_PORT) {
      return window.AICS_BACKEND_PORT;
    }
    // 默认端口 18080（避免与常用端口冲突）
    return '18080';
  };

  const defaultConfig = {
    apiUrl: 'http://localhost:' + getDefaultBackendPort(),
    position: 'bottom-right', // 'bottom-right' | 'bottom-left'
    theme: 'default'
  };

  let config = { ...defaultConfig };
  let widgetContainer = null;
  let isInitialized = false;

  /**
   * 创建浮动按钮
   */
  function createFloatingButton() {
    const button = document.createElement('button');
    button.className = 'ai-cs-widget-button';
    button.setAttribute('aria-label', '打开客服聊天');
    button.innerHTML = `
      <svg class="ai-cs-widget-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
      </svg>
    `;
    
    // 样式
    const position = config.position === 'bottom-left' ? 'left: 1rem;' : 'right: 1rem;';
    button.style.cssText = `
      position: fixed;
      bottom: 1rem;
      ${position}
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 9999px;
      background-color: #3b82f6;
      color: white;
      border: none;
      cursor: pointer;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s;
    `;
    
    button.onmouseover = function() {
      this.style.transform = 'scale(1.1)';
      this.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
    };
    
    button.onmouseout = function() {
      this.style.transform = 'scale(1)';
      this.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
    };

    button.onclick = function() {
      toggleWidget();
    };

    return button;
  }

  /**
   * 创建聊天窗口 iframe
   */
  function createChatWindow() {
    const iframe = document.createElement('iframe');
    iframe.id = 'ai-cs-widget-iframe';
    iframe.src = config.chatPageUrl || `${config.apiUrl.replace('/api', '')}/chat`;
    iframe.style.cssText = `
      position: fixed;
      bottom: 5rem;
      ${config.position === 'bottom-left' ? 'left: 1rem;' : 'right: 1rem;'}
      width: 400px;
      max-width: calc(100vw - 2rem);
      height: 600px;
      max-height: calc(100vh - 6rem);
      border: none;
      border-radius: 0.5rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      z-index: 9998;
      display: none;
      background: white;
    `;
    return iframe;
  }

  /**
   * 切换聊天窗口显示/隐藏
   */
  function toggleWidget() {
    const iframe = document.getElementById('ai-cs-widget-iframe');
    if (iframe) {
      const isVisible = iframe.style.display !== 'none';
      iframe.style.display = isVisible ? 'none' : 'block';
      
      // 更新按钮图标
      const button = document.querySelector('.ai-cs-widget-button');
      if (button) {
        const icon = button.querySelector('.ai-cs-widget-icon');
        if (icon) {
          if (isVisible) {
            // 显示聊天图标
            icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>';
          } else {
            // 显示关闭图标
            icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>';
          }
        }
      }
    }
  }

  /**
   * 初始化插件
   */
  function init(userConfig) {
    if (isInitialized) {
      console.warn('AI-CS Widget 已经初始化');
      return;
    }

    // 合并配置
    config = { ...defaultConfig, ...userConfig };

    // 创建容器
    widgetContainer = document.createElement('div');
    widgetContainer.id = 'ai-cs-widget-container';
    widgetContainer.style.cssText = 'position: fixed; bottom: 0; z-index: 9999;';

    // 创建浮动按钮
    const button = createFloatingButton();
    widgetContainer.appendChild(button);

    // 创建聊天窗口
    const iframe = createChatWindow();
    widgetContainer.appendChild(iframe);

    // 添加到页面
    document.body.appendChild(widgetContainer);

    isInitialized = true;
    console.log('AI-CS Widget 初始化成功');
  }

  /**
   * 销毁插件
   */
  function destroy() {
    if (widgetContainer && widgetContainer.parentNode) {
      widgetContainer.parentNode.removeChild(widgetContainer);
      widgetContainer = null;
      isInitialized = false;
      console.log('AI-CS Widget 已销毁');
    }
  }

  // 暴露全局 API
  window.AICSWidget = {
    init: init,
    destroy: destroy,
    toggle: toggleWidget
  };

  // 如果 DOM 已加载，自动初始化（使用默认配置）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      // 不自动初始化，需要用户手动调用 AICSWidget.init()
    });
  }
})();

