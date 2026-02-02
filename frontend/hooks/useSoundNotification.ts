import { useCallback, useEffect, useRef, useState } from "react";

export function useSoundNotification(initialEnabled: boolean = true) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    if (!audioRef.current) {
      audioRef.current = new Audio("/notification.mp3");
      audioRef.current.volume = 0.5;
    }

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
    setEnabled((prev) => !prev);
  }, []);

  return { enabled, toggle, play };
}
