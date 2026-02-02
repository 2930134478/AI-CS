// 声音通知工具函数
export function playNotificationSound() {
  try {
    const audio = new Audio("/notification.mp3");
    audio.volume = 0.5;
    audio.play().catch(() => {
      // 忽略播放错误（用户可能未交互）
    });
  } catch (error) {
    // 忽略错误
  }
}

export function playMessageSound() {
  try {
    const audio = new Audio("/message.mp3");
    audio.volume = 0.3;
    audio.play().catch(() => {
      // 忽略播放错误
    });
  } catch (error) {
    // 忽略错误
  }
}
