/*
 * Field Day Scrappy Charm reminder: audio should feel like a tiny tactile
 * cabinet—bright hit chirps, a soft comic miss, and a clear descending finish.
 * All cues are synthesized in-browser so the game stays self-contained.
 */

type AudioListener = (muted: boolean) => void;

type AudioContextConstructor = typeof AudioContext;

function getAudioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === "undefined") return null;
  const browserWindow = window as Window & typeof globalThis & {
    webkitAudioContext?: AudioContextConstructor;
  };
  return window.AudioContext ?? browserWindow.webkitAudioContext ?? null;
}

export class ArcadeAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private readonly listeners = new Set<AudioListener>();
  private muted = this.readMutedPreference();

  isMuted() {
    return this.muted;
  }

  subscribe(listener: AudioListener) {
    this.listeners.add(listener);
    listener(this.muted);
    return () => this.listeners.delete(listener);
  }

  unlock() {
    const context = this.ensureContext();
    if (!context) return;
    if (context.state === "suspended") void context.resume();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    try {
      window.localStorage.setItem("koala-whack-muted", String(muted));
    } catch {
      // Private browsing or blocked storage should not break the game.
    }
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.18, this.context.currentTime, 0.018);
    }
    this.listeners.forEach((listener) => listener(this.muted));
  }

  toggle() {
    this.setMuted(!this.muted);
  }

  playHit(points = 10) {
    if (this.muted) return;
    const context = this.ensureContext();
    if (!context) return;
    const now = context.currentTime;
    const pitch = Math.min(1.28, 1 + (points - 10) * 0.012);
    this.tone({ type: "triangle", frequency: 510 * pitch, endFrequency: 820 * pitch, start: now, duration: 0.13, volume: 0.24 });
    this.tone({ type: "sine", frequency: 830 * pitch, endFrequency: 1120 * pitch, start: now + 0.07, duration: 0.18, volume: 0.15 });
  }

  playMiss() {
    if (this.muted) return;
    const context = this.ensureContext();
    if (!context) return;
    const now = context.currentTime;
    this.tone({ type: "sine", frequency: 210, endFrequency: 115, start: now, duration: 0.16, volume: 0.12 });
  }

  playGameOver() {
    if (this.muted) return;
    const context = this.ensureContext();
    if (!context) return;
    const now = context.currentTime;
    this.tone({ type: "triangle", frequency: 420, endFrequency: 330, start: now, duration: 0.2, volume: 0.18 });
    this.tone({ type: "triangle", frequency: 310, endFrequency: 220, start: now + 0.17, duration: 0.25, volume: 0.17 });
    this.tone({ type: "sine", frequency: 196, endFrequency: 146, start: now + 0.38, duration: 0.38, volume: 0.15 });
  }

  dispose() {
    if (this.context) void this.context.close();
    this.context = null;
    this.master = null;
    this.listeners.clear();
  }

  private ensureContext() {
    if (this.context) return this.context;
    const Context = getAudioContextConstructor();
    if (!Context) return null;
    try {
      this.context = new Context();
      this.master = this.context.createGain();
      this.master.gain.value = this.muted ? 0 : 0.18;
      this.master.connect(this.context.destination);
      return this.context;
    } catch {
      this.context = null;
      this.master = null;
      return null;
    }
  }

  private tone({
    type,
    frequency,
    endFrequency,
    start,
    duration,
    volume,
  }: {
    type: OscillatorType;
    frequency: number;
    endFrequency: number;
    start: number;
    duration: number;
    volume: number;
  }) {
    if (!this.context || !this.master) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, endFrequency), start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  private readMutedPreference() {
    try {
      return window.localStorage.getItem("koala-whack-muted") === "true";
    } catch {
      return false;
    }
  }
}
