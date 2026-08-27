/*
 * Field Day Scrappy Charm reminder: keep gameplay brisk, tactile, and legible.
 * This module owns arcade rules only; it must stay independent from React/Babylon.
 */

export type GameMode = "menu" | "playing" | "gameover";

export interface GameSnapshot {
  mode: GameMode;
  score: number;
  level: number;
  combo: number;
  misses: number;
  maxMisses: number;
  timeLeft: number;
  activeTargets: number;
  lastHit: number;
}

export interface Difficulty {
  spawnInterval: number;
  visibleDuration: number;
  maxTargets: number;
}

type Listener = (snapshot: GameSnapshot) => void;

export class GameState {
  private readonly listeners = new Set<Listener>();
  private mode: GameMode = "menu";
  private score = 0;
  private level = 1;
  private combo = 0;
  private misses = 0;
  private readonly maxMisses = 3;
  private timeLeft = 30;
  private activeTargets = 0;
  private lastHit = 0;

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): GameSnapshot {
    return {
      mode: this.mode,
      score: this.score,
      level: this.level,
      combo: this.combo,
      misses: this.misses,
      maxMisses: this.maxMisses,
      timeLeft: Math.max(0, this.timeLeft),
      activeTargets: this.activeTargets,
      lastHit: this.lastHit,
    };
  }

  getDifficulty(): Difficulty {
    return {
      spawnInterval: Math.max(0.52, 1.18 - (this.level - 1) * 0.08),
      visibleDuration: Math.max(0.68, 1.34 - (this.level - 1) * 0.065),
      maxTargets: this.level >= 4 ? 2 : 1,
    };
  }

  start() {
    this.mode = "playing";
    this.score = 0;
    this.level = 1;
    this.combo = 0;
    this.misses = 0;
    this.timeLeft = 30;
    this.activeTargets = 0;
    this.lastHit = 0;
    this.emit();
  }

  restart() {
    this.start();
  }

  update(deltaSeconds: number) {
    if (this.mode !== "playing") return;
    this.timeLeft -= deltaSeconds;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.mode = "gameover";
    }
    this.emit();
  }

  setActiveTargets(count: number) {
    if (count !== this.activeTargets) {
      this.activeTargets = count;
      this.emit();
    }
  }

  registerHit() {
    if (this.mode !== "playing") return;
    this.combo += 1;
    const comboBonus = Math.min(18, Math.max(0, this.combo - 1) * 2);
    this.score += 10 + comboBonus;
    this.level = Math.min(9, 1 + Math.floor(this.score / 50));
    this.lastHit = Date.now();
    this.emit();
  }

  registerMiss() {
    if (this.mode !== "playing") return;
    this.misses += 1;
    this.combo = 0;
    if (this.misses >= this.maxMisses) {
      this.mode = "gameover";
    }
    this.emit();
  }

  forceGameOver() {
    if (this.mode === "playing") {
      this.mode = "gameover";
      this.emit();
    }
  }

  isPlaying() {
    return this.mode === "playing";
  }

  private emit() {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}
