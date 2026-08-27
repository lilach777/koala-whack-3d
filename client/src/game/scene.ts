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
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import { createArena } from "@/game/arena";
import { EffectsManager } from "@/game/effects";
import { GameState, type GameSnapshot } from "@/game/gameState";
import { KoalaTarget } from "@/game/target";

const KOALA_TEXTURE_URL = "/manus-storage/koala-character-cutout_a9e925f7.png";
const GROUND_TEXTURE_URL = "/manus-storage/eucalyptus-ground-texture_d0f4d1a9.png";

export type GameEvent =
  | { type: "hit"; x: number; y: number; z: number; points: number }
  | { type: "miss" }
  | { type: "mode"; mode: GameSnapshot["mode"] };

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

  const demoParam = new URLSearchParams(window.location.search).get("demo");
  const demo = demoParam !== null;
  const demoSequence = [4, 1, 7, 2, 8, 5, 0, 6, 3];
  let demoIndex = 0;
  let spawnTimer = 0.3;
  let demoHitTimer = 0;
  let lastSpawnId = -1;
  let disposed = false;
  let lastMode = state.getSnapshot().mode;

  const countActiveTargets = () => targets.reduce((count, target) => count + (target.isActive() ? 1 : 0), 0);

  const emitModeIfChanged = () => {
    const mode = state.getSnapshot().mode;
    if (mode !== lastMode) {
      lastMode = mode;
      emitEvent(listeners, { type: "mode", mode });
    }
  };

  const chooseHole = () => {
    if (demo) {
      const id = demoSequence[demoIndex % demoSequence.length];
      demoIndex += 1;
      return targets[id];
    }
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
    target.spawn(demo ? Math.max(difficulty.visibleDuration, 2.1) : difficulty.visibleDuration);
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

  const tryHit = (x: number, y: number) => {
    if (!state.isPlaying()) return;
    const pick = scene.pick(x, y, (mesh) => Boolean(mesh.metadata?.koalaHitCollider));
    const pickedTarget = pick.pickedMesh?.metadata?.koalaHitCollider as KoalaTarget | undefined;
    if (pickedTarget && hitTarget(pickedTarget)) return;

    // No fallback or distance test: only the dedicated visible koala collider can
    // score. Ground, rims, holes, empty space, and unrelated meshes are misses.
    emitEvent(listeners, { type: "miss" });
  };

  const pointerObserver = scene.onPointerObservable.add((pointerInfo) => {
    if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
      tryHit(scene.pointerX, scene.pointerY);
    }
  });

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
    demoIndex = 0;
    lastSpawnId = -1;
    spawnTimer = 0.24;
    demoHitTimer = 0;
    state.start();
    if (demo && demoParam !== "gameover") {
      spawnTarget();
      spawnTimer = state.getDifficulty().spawnInterval;
    }
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
        // Keep probing while a target is finishing its retreat so demo mode and
        // natural play never leave a long empty gap between koalas.
        spawnTimer = countActiveTargets() > beforeCount ? state.getDifficulty().spawnInterval : 0.14;
      }
      if (demo) {
        demoHitTimer += delta;
        if (demoHitTimer >= 1.55) {
          const visible = targets.find((target) => target.isHittable());
          if (visible && hitTarget(visible)) demoHitTimer = 0;
        }
      }
    }

    targets.forEach((target) => {
      const result = target.update(delta);
      if (result.expired) {
        state.registerMiss();
        effects.dust(target.x, target.z);
        emitEvent(listeners, { type: "miss" });
      }
    });
    state.setActiveTargets(countActiveTargets());
    effects.update(delta);
  });

  if (demo) {
    start();
    if (demoParam === "gameover") {
      for (let i = 0; i < 6; i += 1) state.registerHit();
      state.forceGameOver();
      emitModeIfChanged();
    }
  }

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
      scene.onPointerObservable.remove(pointerObserver);
      scene.onBeforeRenderObservable.remove(updateObserver);
      window.removeEventListener("keydown", keydown);
      targets.forEach((target) => target.dispose());
      arena.dispose();
      scene.dispose();
      void canvas;
    },
  };
}
