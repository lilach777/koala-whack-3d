/*
 * Field Day Scrappy Charm reminder: React is the frame; Babylon is the playfield.
 * This module owns the 3D arena, input, timing, target lifecycle, and feedback.
 */

import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import "@babylonjs/core/Shaders/default.vertex";
import "@babylonjs/core/Shaders/default.fragment";
import "@babylonjs/core/Culling/ray";
import { createArena } from "@/game/arena";
import { EffectsManager } from "@/game/effects";
import { GameState, type GameSnapshot } from "@/game/gameState";
import { KoalaTarget } from "@/game/target";

const KOALA_TEXTURE_URL = "/manus-storage/koala-character-cutout_a9e925f7.png";
const GROUND_TEXTURE_URL = "/manus-storage/eucalyptus-ground-texture_d0f4d1a9.png";

export type GameEvent =
  | { type: "hit"; x: number; y: number; z: number; points: number }
  | { type: "miss"; misses: number; maxMisses: number }
  | { type: "appear"; x: number; z: number }
  | { type: "mode"; mode: GameSnapshot["mode"]; misses: number; maxMisses: number };

type SnapshotListener = (snapshot: GameSnapshot) => void;
type EventListener = (event: GameEvent) => void;

export interface GameHandle {
  scene: Scene;
  start(): void;
  restart(): void;
  subscribe(listener: SnapshotListener): () => void;
  onEvent(listener: EventListener): () => void;
  dispose(): void;
}

function emitEvent(listeners: Set<EventListener>, event: GameEvent) {
  listeners.forEach((listener) => listener(event));
}

export async function createGameScene(engine: Engine, canvas: HTMLCanvasElement): Promise<GameHandle> {
  const scene = new Scene(engine);
  const camera = new FreeCamera("arcade-camera", new Vector3(0, 8.8, -15.8), scene);
  camera.setTarget(new Vector3(0, 0.45, -0.35));
  camera.fov = 0.72;
  camera.minZ = 0.1;
  camera.maxZ = 100;
  scene.activeCamera = camera;

  const skyLight = new HemisphericLight("grove-sky-light", new Vector3(0, 1, 0), scene);
  skyLight.intensity = 1.08;
  skyLight.diffuse = Color3.FromHexString("#F6E9D3");
  skyLight.groundColor = Color3.FromHexString("#173A3D");

  const warmLight = new DirectionalLight("warm-sun", new Vector3(-0.35, -1, 0.5), scene);
  warmLight.position = new Vector3(-5, 11, -7);
  warmLight.intensity = 1.25;
  warmLight.diffuse = Color3.FromHexString("#FFD2A0");

  const arena = createArena(scene, GROUND_TEXTURE_URL);
  const effects = new EffectsManager(scene);
  const state = new GameState();
  const listeners = new Set<EventListener>();
  const targets = arena.holes.map((hole) => new KoalaTarget(scene, {
    ...hole,
    groundY: 0.18,
    textureUrl: KOALA_TEXTURE_URL,
  }));
  targets.forEach((target) => target.forceHide());

  let spawnTimer = 0.3;
  let lastSpawnId = -1;
  let disposed = false;
  let lastMode = state.getSnapshot().mode;

  const countActiveTargets = () => targets.reduce((count, target) => count + (target.isActive() ? 1 : 0), 0);

  const emitModeIfChanged = () => {
    const mode = state.getSnapshot().mode;
    if (mode !== lastMode) {
      lastMode = mode;
      const snapshot = state.getSnapshot();
      emitEvent(listeners, { type: "mode", mode, misses: snapshot.misses, maxMisses: snapshot.maxMisses });
    }
  };

  const chooseHole = () => {
    const available = targets.filter((target) => !target.isActive() && target.id !== lastSpawnId);
    const pool = available.length > 0 ? available : targets.filter((target) => !target.isActive());
    return pool[Math.floor(Math.random() * Math.max(1, pool.length))] ?? targets[0];
  };

  const spawnTarget = () => {
    if (!state.isPlaying()) return;
    const difficulty = state.getDifficulty();
    if (countActiveTargets() >= difficulty.maxTargets) return;
    const target = chooseHole();
    if (!target || target.isActive()) return;
    lastSpawnId = target.id;
    target.spawn(difficulty.visibleDuration);
    emitEvent(listeners, { type: "appear", x: target.x, z: target.z });
    effects.dust(target.x, target.z);
  };

  const hitTarget = (target: KoalaTarget) => {
    if (!target.hit()) return false;
    const before = state.getSnapshot().score;
    state.registerHit();
    const after = state.getSnapshot().score;
    effects.impact(target.x, target.visibleY + 0.45, target.z);
    emitEvent(listeners, { type: "hit", x: target.x, y: target.visibleY + 0.45, z: target.z, points: after - before });
    return true;
  };

  const tryHit = (clientX: number, clientY: number) => {
    if (!state.isPlaying()) return;
    const rect = canvas.getBoundingClientRect();
    // Babylon's native picker expects on-screen CSS coordinates and applies
    // the engine's hardware-scaling conversion internally. Do not multiply by
    // render-buffer size here or HiDPI devices will double-scale the pointer.
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    scene.pointerX = x;
    scene.pointerY = y;
    scene.updateTransformMatrix(true);
    targets.forEach((target) => target.hitCollider.computeWorldMatrix(true));

    // Use Babylon's stable native CSS-space picking path with the active camera.
    const activeCamera = scene.activeCamera ?? camera;
    const pick = scene.pick(x, y, (mesh) => Boolean(mesh.metadata?.koalaHitCollider), false, activeCamera);
    const pickedTarget = pick?.pickedMesh?.metadata?.koalaHitCollider as KoalaTarget | undefined;

    if (pickedTarget && hitTarget(pickedTarget)) return;

    // No fallback or distance test: only the dedicated visible koala collider can
    // score. Ground, rims, holes, empty space, and unrelated meshes are misses.
    state.registerMiss();
    const snapshot = state.getSnapshot();
    emitEvent(listeners, { type: "miss", misses: snapshot.misses, maxMisses: snapshot.maxMisses });
  };

  const onCanvasPointerDown = (event: PointerEvent) => {
    // Mouse button 0 is primary; touch and pen pointers commonly report -1.
    // Reject only non-primary mouse buttons so mobile hammer taps are valid.
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    tryHit(event.clientX, event.clientY);
  };
  canvas.addEventListener("pointerdown", onCanvasPointerDown, { passive: false });

  const keydown = (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const visible = targets.find((target) => target.isHittable());
      if (visible) hitTarget(visible);
    }
  };
  window.addEventListener("keydown", keydown);

  const start = () => {
    targets.forEach((target) => target.forceHide());
    lastSpawnId = -1;
    // The 0.12s launch delay plus the 0.2s rise places the first visible
    // koala inside the requested 0.3–0.5s window.
    spawnTimer = 0.12;
    state.start();
    emitModeIfChanged();
  };

  const restart = () => start();

  state.subscribe(() => emitModeIfChanged());

  const updateObserver = scene.onBeforeRenderObservable.add(() => {
    if (disposed) return;
    const delta = Math.min(0.05, engine.getDeltaTime() / 1000);
    state.update(delta);
    emitModeIfChanged();

    if (state.isPlaying()) {
      spawnTimer -= delta;
      if (spawnTimer <= 0) {
        const beforeCount = countActiveTargets();
        spawnTarget();
        if (countActiveTargets() > beforeCount) {
          // Small timing variation keeps the field lively without making the
          // next appearance feel random in an unfair, unreadable way.
          const jitter = 0.86 + Math.random() * 0.24;
          spawnTimer = state.getDifficulty().spawnInterval * jitter;
        } else {
          // Probe quickly while a target is finishing its retreat.
          spawnTimer = 0.1 + Math.random() * 0.08;
        }
      }
    }

    targets.forEach((target) => {
      const result = target.update(delta);
      if (result.expired) {
        state.registerMiss();
        effects.dust(target.x, target.z);
        const snapshot = state.getSnapshot();
        emitEvent(listeners, { type: "miss", misses: snapshot.misses, maxMisses: snapshot.maxMisses });
      }
    });
    state.setActiveTargets(countActiveTargets());
    effects.update(delta);
  });

  return {
    scene,
    start,
    restart,
    subscribe: (listener) => state.subscribe(listener),
    onEvent: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose: () => {
      disposed = true;
      canvas.removeEventListener("pointerdown", onCanvasPointerDown);
      scene.onBeforeRenderObservable.remove(updateObserver);
      window.removeEventListener("keydown", keydown);
      targets.forEach((target) => target.dispose());
      arena.dispose();
      scene.dispose();
      void canvas;
    },
  };
}
