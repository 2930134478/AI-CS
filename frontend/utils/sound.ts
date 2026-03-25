let audioCtx: AudioContext | null = null;
let unlocked = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (audioCtx) return audioCtx;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  audioCtx = new Ctx();
  return audioCtx;
}

/** 尝试解锁音频播放（需用户手势触发更稳定）。 */
export async function unlockSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    // 轻触发一次极低音量，避免某些浏览器仍阻止后续播放
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0.00001;
    osc.type = "sine";
    osc.frequency.value = 440;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.01);
    unlocked = true;
  } catch {
    // ignore
  }
}

function playTone(opts: { frequency: number; durationMs: number; volume: number; type?: OscillatorType; whenMs?: number }) {
  const ctx = getAudioContext();
  if (!ctx) return;
  // 未解锁时也尝试播放；如果被阻止，保持静默（不抛错）
  const startAt = ctx.currentTime + (opts.whenMs ?? 0) / 1000;
  const endAt = startAt + opts.durationMs / 1000;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(opts.frequency, startAt);

  // 快速起音 + 平滑衰减（避免“哔”得刺耳）
  gain.gain.setValueAtTime(0.00001, startAt);
  gain.gain.linearRampToValueAtTime(opts.volume, startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.00001, endAt);

  osc.connect(gain);
  gain.connect(ctx.destination);

  try {
    osc.start(startAt);
    osc.stop(endAt);
  } catch {
    // ignore
  }
}

/** 新消息提示音（蜂鸣：两段短音）。 */
export function playNotificationSound() {
  // 默认音量尽量克制；用户可通过系统音量调节
  const volume = 0.08;
  playTone({ frequency: 880, durationMs: 70, volume, type: "sine" });
  playTone({ frequency: 660, durationMs: 90, volume: volume * 0.9, type: "sine", whenMs: 90 });
}

/** 轻提示音（更柔和，用于非关键提示）。 */
export function playMessageSound() {
  const volume = 0.05;
  playTone({ frequency: 520, durationMs: 80, volume, type: "triangle" });
}
