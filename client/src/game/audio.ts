/**
 * Field Day Scrappy Charm reminder: audio should feel like a tiny tactile
 * cabinet—bright hit chirps, a soft comic miss, a quick koala pop, and a
 * compact energetic backing loop. Keep music underneath gameplay feedback.
 * All cues are synthesized in-browser; original music loops are loaded lazily
 * after a user gesture so autoplay restrictions never block the game.
 */

type AudioListener = (muted: boolean) => void;
type AudioContextConstructor = typeof AudioContext;

const GAME_OVER_SOUND_URL = "/manus-storage/VN20260827_233353_e3326c82.mp3";

const MUSIC_URLS = [
  "/manus-storage/koala-whack-engagement-loop-32s_50bcff19.wav",
  "/manus-storage/koala-whack-alt-gumleaf-32s_8873fbd1.wav",
  "/manus-storage/koala-whack-alt-sapling-32s_3ecdc972.wav",
] as const;

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
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private readonly musicBuffers = new Map<string, AudioBuffer>();
  private readonly musicLoads = new Map<string, Promise<void>>();
  private musicSource: AudioBufferSourceNode | null = null;
  private gameOverSound: HTMLAudioElement | null = null;
  private gameOverPlayed = false;
  private musicRequested = false;
  private requestedMusicUrl: string | null = null;
  private nextTrackIndex = 0;
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

  startMusic() {
    this.resetGameOverSound();
    this.musicRequested = true;
    this.requestedMusicUrl = MUSIC_URLS[this.nextTrackIndex % MUSIC_URLS.length];
    this.nextTrackIndex = (this.nextTrackIndex + 1) % MUSIC_URLS.length;
    this.stopCurrentMusicSource();
    this.resumeRequestedMusic();
  }

  stopMusic() {
    this.musicRequested = false;
    this.requestedMusicUrl = null;
    this.stopCurrentMusicSource();
  }

  playGameOverOnce() {
    if (this.gameOverPlayed || this.muted || typeof Audio === "undefined") return;
    this.gameOverPlayed = true;
    const sound = this.gameOverSound ?? new Audio(GAME_OVER_SOUND_URL);
    this.gameOverSound = sound;
    sound.preload = "auto";
    sound.loop = false;
    sound.currentTime = 0;
    sound.volume = 1;
    void sound.play().catch(() => {
      // Browser autoplay policy may block playback; never retry on this screen.
    });
  }

  resetGameOverSound() {
    this.gameOverPlayed = false;
    if (this.gameOverSound) {
      this.gameOverSound.pause();
      this.gameOverSound.currentTime = 0;
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    try {
      window.localStorage.setItem("koala-whack-muted", String(muted));
    } catch {
      // Private browsing or blocked storage should not break the game.
    }
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(muted ? 0 : 1, this.context.currentTime, 0.018);
    }
    if (!muted && this.musicRequested) this.resumeRequestedMusic();
    this.listeners.forEach((listener) => listener(this.muted));
  }

  toggle() {
    this.setMuted(!this.muted);
  }

  playAppear() {
    if (this.muted) return;
    const context = this.ensureContext();
    if (!context) return;
    const now = context.currentTime;
    this.tone({ type: "sine", frequency: 230, endFrequency: 420, start: now, duration: 0.09, volume: 0.2 });
    this.tone({ type: "triangle", frequency: 420, endFrequency: 560, start: now + 0.035, duration: 0.08, volume: 0.12 });
  }

  playHit(points = 10) {
    if (this.muted) return;
    const context = this.ensureContext();
    if (!context) return;
    const now = context.currentTime;
    const pitch = Math.min(1.28, 1 + (points - 10) * 0.012);
    this.tone({ type: "triangle", frequency: 510 * pitch, endFrequency: 820 * pitch, start: now, duration: 0.13, volume: 0.3 });
    this.tone({ type: "sine", frequency: 830 * pitch, endFrequency: 1120 * pitch, start: now + 0.07, duration: 0.18, volume: 0.17 });
  }

  playScore(points = 10) {
    if (this.muted) return;
    const context = this.ensureContext();
    if (!context) return;
    const now = context.currentTime + 0.015;
    const pitch = Math.min(1.3, 1 + (points - 10) * 0.01);
    this.tone({ type: "sine", frequency: 880 * pitch, endFrequency: 1320 * pitch, start: now, duration: 0.11, volume: 0.11 });
  }

  playMiss() {
    if (this.muted) return;
    const context = this.ensureContext();
    if (!context) return;
    const now = context.currentTime;
    this.tone({ type: "sine", frequency: 210, endFrequency: 115, start: now, duration: 0.16, volume: 0.14 });
  }

  playGameOver() {
    if (this.muted) return;
    const context = this.ensureContext();
    if (!context) return;
    const now = context.currentTime;
    this.tone({ type: "triangle", frequency: 420, endFrequency: 330, start: now, duration: 0.2, volume: 0.2 });
    this.tone({ type: "triangle", frequency: 310, endFrequency: 220, start: now + 0.17, duration: 0.25, volume: 0.18 });
    this.tone({ type: "sine", frequency: 196, endFrequency: 146, start: now + 0.38, duration: 0.38, volume: 0.15 });
  }

  dispose() {
    this.stopMusic();
    this.resetGameOverSound();
    this.gameOverSound = null;
    if (this.context) void this.context.close();
    this.context = null;
    this.master = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.musicBuffers.clear();
    this.musicLoads.clear();
    this.listeners.clear();
  }

  private ensureContext() {
    if (this.context) return this.context;
    const Context = getAudioContextConstructor();
    if (!Context) return null;
    try {
      this.context = new Context();
      this.master = this.context.createGain();
      this.sfxGain = this.context.createGain();
      this.musicGain = this.context.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      // Keep the music around one third of the gameplay feedback level.
      this.sfxGain.gain.value = 0.82;
      this.musicGain.gain.value = 0.28;
      this.sfxGain.connect(this.master);
      this.musicGain.connect(this.master);
      this.master.connect(this.context.destination);
      return this.context;
    } catch {
      this.context = null;
      this.master = null;
      this.sfxGain = null;
      this.musicGain = null;
      return null;
    }
  }

  private resumeRequestedMusic() {
    const context = this.ensureContext();
    if (!context || this.muted || !this.musicRequested || !this.requestedMusicUrl) return;
    const url = this.requestedMusicUrl;
    const cached = this.musicBuffers.get(url);
    if (cached) {
      this.playMusic(context, cached, url);
      return;
    }
    if (!this.musicLoads.has(url)) {
      const load = this.loadMusic(context, url);
      this.musicLoads.set(url, load);
      void load.finally(() => this.musicLoads.delete(url));
    }
  }

  private async loadMusic(context: AudioContext, url: string) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Music request failed: ${response.status}`);
      const bytes = await response.arrayBuffer();
      const buffer = await context.decodeAudioData(bytes);
      if (this.context !== context) return;
      this.musicBuffers.set(url, buffer);
      if (this.musicRequested && this.requestedMusicUrl === url && !this.muted) {
        this.playMusic(context, buffer, url);
      }
    } catch {
      // Gameplay remains fully usable if a browser blocks or cannot decode music.
    }
  }

  private playMusic(context: AudioContext, buffer: AudioBuffer, url: string) {
    if (!this.musicGain || this.muted || !this.musicRequested || this.requestedMusicUrl !== url) return;
    this.stopCurrentMusicSource();
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(this.musicGain);
    source.onended = () => {
      if (this.musicSource === source) this.musicSource = null;
    };
    source.start(0);
    this.musicSource = source;
  }

  private stopCurrentMusicSource() {
    if (this.musicSource) {
      try {
        this.musicSource.stop();
      } catch {
        // A source that already ended is safe to discard.
      }
      this.musicSource.disconnect();
      this.musicSource = null;
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
    if (!this.context || !this.sfxGain) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, endFrequency), start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(this.sfxGain);
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
