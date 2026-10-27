import { useEffect } from "react";

let ctx: AudioContext | null = null;

/** Short two-beep alert + vibration. Call from effects/handlers only. */
export function alertPulse() {
  try {
    navigator.vibrate?.([200, 100, 200]);
  } catch {}
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    [0, 0.3].forEach((offset) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = "square";
      osc.frequency.value = 880;
      const t = ctx!.currentTime + offset;
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  } catch {}
}

/** Unlock audio on a user tap (browsers block sound until then). */
export function primeAudio() {
  try {
    ctx ??= new AudioContext();
    void ctx.resume();
  } catch {}
}

/** Keep the screen on while `active`; re-acquires when the tab becomes visible again. */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request("screen");
        if (cancelled) void lock.release();
      } catch {}
    };
    const onVis = () => {
      if (document.visibilityState === "visible") void acquire();
    };
    void acquire();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      void lock?.release();
    };
  }, [active]);
}
