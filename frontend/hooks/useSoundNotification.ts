import { useEffect, useRef } from "react";
import { playNotificationSound } from "@/utils/sound";

export function useSoundNotification(enabled: boolean = true) {
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

  const play = () => {
    if (enabled && audioRef.current) {
      audioRef.current.play().catch(() => {
        // 忽略播放错误
      });
    }
  };

  return { play };
}
