/*
 * Field Day Scrappy Charm reminder: the HUD is a field-day tape label around
 * the playfield—not a generic dashboard. Keep stats bold, copy concise, and
 * the center holes unobstructed.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Crosshair, MousePointer2, RotateCcw, Sparkles, Timer, Trophy, Volume2, VolumeX, Zap } from "lucide-react";
import GameCanvas from "@/components/GameCanvas";
import type { GameHandle } from "@/game/scene";
import type { GameSnapshot } from "@/game/gameState";
import { ArcadeAudio } from "@/game/audio";

const LOGO_URL = "/manus-storage/koala-whack-logo_50229f11.png";

const INITIAL_STATE: GameSnapshot = {
  mode: "menu",
  score: 0,
  level: 1,
  combo: 0,
  misses: 0,
  maxMisses: 3,
  timeLeft: 30,
  activeTargets: 0,
  lastHit: 0,
};

function StatPill({ icon, label, value, accent = false }: { icon: ReactNode; label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`stat-pill ${accent ? "stat-pill--accent" : ""}`}>
      <div className="stat-pill__icon">{icon}</div>
      <div className="stat-pill__copy">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function MissMeter({ misses, maxMisses }: { misses: number; maxMisses: number }) {
  return (
    <div className="miss-meter" aria-label={`${misses} of ${maxMisses} misses`}>
      <span className="miss-meter__label">MISSES</span>
      <div className="miss-meter__dots">
        {Array.from({ length: maxMisses }).map((_, index) => (
          <span key={index} className={`miss-dot ${index < misses ? "miss-dot--used" : ""}`} />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const audioRef = useRef<ArcadeAudio | null>(null);
  if (!audioRef.current) audioRef.current = new ArcadeAudio();
  const audio = audioRef.current;
  const [muted, setMuted] = useState(audio.isMuted());
  const [handle, setHandle] = useState<GameHandle | null>(null);
  const [snapshot, setSnapshot] = useState<GameSnapshot>(INITIAL_STATE);
  const [hitBanner, setHitBanner] = useState<{ key: number; points: number } | null>(null);
  const [missKey, setMissKey] = useState(0);
  const [hammerPosition, setHammerPosition] = useState(() => ({ x: window.innerWidth / 2, y: window.innerHeight / 2 }));
  const [hammerSwingKey, setHammerSwingKey] = useState(0);
  const lastHitRef = useRef(0);

  const onReady = useCallback((nextHandle: GameHandle | null) => {
    setHandle(nextHandle);
    if (!nextHandle) setSnapshot(INITIAL_STATE);
  }, []);

  useEffect(() => {
    const unsubscribeAudio = audio.subscribe(setMuted);
    return () => {
      unsubscribeAudio();
    };
  }, [audio]);

  useEffect(() => {
    return () => audio.dispose();
  }, [audio]);

  useEffect(() => {
    const moveHammer = (event: PointerEvent) => {
      setHammerPosition({ x: event.clientX, y: event.clientY });
    };
    const swingHammer = () => {
      if (snapshot.mode === "playing") setHammerSwingKey((value) => value + 1);
    };
    window.addEventListener("pointermove", moveHammer, { passive: true });
    window.addEventListener("pointerdown", swingHammer);
    return () => {
      window.removeEventListener("pointermove", moveHammer);
      window.removeEventListener("pointerdown", swingHammer);
    };
  }, [snapshot.mode]);

  useEffect(() => {
    if (!handle) return;
    const unsubscribe = handle.subscribe((nextSnapshot) => {
      setSnapshot(nextSnapshot);
      if (nextSnapshot.lastHit && nextSnapshot.lastHit !== lastHitRef.current) {
        lastHitRef.current = nextSnapshot.lastHit;
      }
    });
    const offEvent = handle.onEvent((event) => {
      if (event.type === "hit") {
        audio.unlock();
        audio.playHit(event.points);
        setHitBanner({ key: Date.now(), points: event.points });
        window.setTimeout(() => setHitBanner(null), 520);
      }
      if (event.type === "miss") {
        audio.unlock();
        audio.playMiss();
        setMissKey((value) => value + 1);
      }
      if (event.type === "mode" && event.mode === "gameover") {
        audio.unlock();
        audio.playGameOver();
      }
    });
    return () => {
      unsubscribe();
      offEvent();
    };
  }, [handle]);

  const startGame = () => {
    audio.unlock();
    handle?.start();
  };
  const restartGame = () => {
    audio.unlock();
    handle?.restart();
  };
  const toggleMute = () => {
    audio.unlock();
    audio.toggle();
  };

  return (
    <main className={`game-shell ${snapshot.mode === "playing" ? "game-shell--playing" : ""}`}>
      <GameCanvas onReady={onReady} />
      {snapshot.mode === "playing" && (
        <div
          className="hammer-cursor"
          style={{ left: hammerPosition.x, top: hammerPosition.y }}
          aria-hidden="true"
        >
          <div key={hammerSwingKey} className={`hammer-cursor__motion ${hammerSwingKey ? "hammer-cursor__motion--swing" : ""}`}>
            <span className="hammer-cursor__head" />
            <span className="hammer-cursor__handle" />
          </div>
        </div>
      )}
      <div className="screen-grain" aria-hidden="true" />
      <div className="sky-vignette" aria-hidden="true" />

      <section className="hud-layer" aria-label="Game interface">
        <header className="hud-topbar">
          <div className="brand-lockup">
            <img className="brand-mark" src={LOGO_URL} alt="" />
            <div>
              <div className="brand-wordmark">KOALA <span>//</span> WHACK</div>
              <div className="brand-kicker">FIELD DAY EDITION</div>
            </div>
          </div>

          <div className="round-stamp" aria-live="polite">
            <span className="round-stamp__dot" />
            <span>{snapshot.mode === "playing" ? "GROVE LIVE" : "GROVE READY"}</span>
          </div>

          <div className="hud-actions">
            <div className="hud-stats">
              <StatPill icon={<Trophy size={16} strokeWidth={2.4} />} label="SCORE" value={String(snapshot.score).padStart(4, "0")} accent />
              <StatPill icon={<Sparkles size={16} strokeWidth={2.4} />} label="LEVEL" value={String(snapshot.level).padStart(2, "0")} />
              <StatPill icon={<Timer size={16} strokeWidth={2.4} />} label="TIME" value={`${String(Math.ceil(snapshot.timeLeft)).padStart(2, "0")}s`} />
            </div>
            <button className="mute-toggle" type="button" onClick={toggleMute} aria-pressed={muted} aria-label={muted ? "Turn sound on" : "Mute sound"}>
              {muted ? <VolumeX size={16} strokeWidth={2.4} /> : <Volume2 size={16} strokeWidth={2.4} />}
              <span>{muted ? "SOUND OFF" : "SOUND ON"}</span>
            </button>
          </div>
        </header>

        <div className="hud-side-note hud-side-note--left">
          <span className="hud-side-note__line" />
          <span>KEEP YOUR EYES<br />ON THE GROVE</span>
        </div>

        <div className="hud-side-note hud-side-note--right">
          <Crosshair size={14} />
          <span>3 × 3<br />TARGET FIELD</span>
        </div>

        <div className="hud-bottombar">
          <MissMeter misses={snapshot.misses} maxMisses={snapshot.maxMisses} />
          <div className={`tap-prompt ${snapshot.mode === "playing" ? "tap-prompt--active" : ""}`}>
            <MousePointer2 size={17} strokeWidth={2.5} />
            <span>{snapshot.mode === "playing" ? "TAP THE KOALA" : snapshot.mode === "gameover" ? "ROUND OVER" : "READY WHEN YOU ARE"}</span>
            {snapshot.mode === "playing" && snapshot.combo > 1 && <strong className="combo-badge"><Zap size={13} fill="currentColor" /> COMBO {snapshot.combo}</strong>}
          </div>
          <div className="keyboard-hint"><kbd>SPACE</kbd><span>quick catch</span></div>
        </div>

        {hitBanner && (
          <div key={hitBanner.key} className="hit-banner" aria-live="assertive">
            <span>+{hitBanner.points}</span>
            <small>GOTCHA</small>
          </div>
        )}

        {missKey > 0 && snapshot.mode === "playing" && (
          <div key={missKey} className="miss-flash" aria-hidden="true">TOO SLOW</div>
        )}

        {snapshot.mode === "menu" && (
          <div className="modal-wrap">
            <div className="game-card game-card--start">
              <div className="card-eyebrow"><span /> ARCADE GROVE / 01</div>
              <h1>Keep your eyes<br /><em>on the grove.</em></h1>
              <p className="game-card__copy">A very quick game of reflexes, round ears, and questionable sunglasses. Catch the koala before it ducks back underground.</p>
              <button className="primary-button" onClick={startGame} disabled={!handle}>
                {handle ? "START THE SCRAMBLE" : "LOADING THE GROVE"}
                <span>↗</span>
              </button>
              <div className="card-meta"><span>30 SEC ROUND</span><span>•</span><span>3 MISSES ALLOWED</span></div>
            </div>
          </div>
        )}

        {snapshot.mode === "gameover" && (
          <div className="modal-wrap modal-wrap--gameover">
            <div className="game-card game-card--gameover">
              <div className="card-eyebrow"><span /> RUN COMPLETE / {String(snapshot.level).padStart(2, "0")}</div>
              <div className="gameover-title"><span>THE GROVE</span><strong>WINS.</strong></div>
              <p className="game-card__copy">The koalas have regrouped. Your reflexes did not go unnoticed.</p>
              <div className="final-score"><small>FINAL SCORE</small><strong>{String(snapshot.score).padStart(4, "0")}</strong></div>
              <div className="gameover-row"><span><Trophy size={15} /> BEST RUN</span><strong>{snapshot.score > 90 ? "GROVE LEGEND" : snapshot.score > 40 ? "QUICK PAWS" : "WARM-UP ROUND"}</strong></div>
              <button className="primary-button" onClick={restartGame}>
                <RotateCcw size={17} /> PLAY AGAIN <span>↗</span>
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
