import { useCallback, useEffect, useRef, useState } from "react";
import { unlockSound } from "@/utils/sound";

export function useSoundNotification(initialEnabled: boolean = true) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // 尝试解锁音频（多数浏览器需用户交互后才能真正响）
    void unlockSound();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [enabled]);

  const play = useCallback(() => {
    if (enabled && audioRef.current) {
      audioRef.current.play().catch(() => {
        // 忽略播放错误
      });
    }
  }, [enabled]);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      if (next) void unlockSound();
      return next;
    });
  }, []);

  return { enabled, toggle, play };
}
