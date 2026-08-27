# Koala Whack 3D — Runtime Structure

## Layering

React is the picture frame: it owns the route, HUD, start/game-over overlays, and React state that mirrors game events. Babylon.js is the canvas: it owns the engine, scene graph, camera, lights, procedural meshes, materials, textures, pointer hit testing, and render loop. The gameplay modules are the painting: plain TypeScript classes and data structures that do not import React.

## Modules

| Module | Ownership | Responsibility |
|---|---|---|
| `client/src/components/GameCanvas.tsx` | React/Babylon bridge | Creates exactly one engine, calls `createGameScene`, runs the render loop, resizes, and disposes safely. |
| `client/src/game/scene.ts` | Scene composition | Creates camera, lights, materials, ground, hole field, target controllers, visual feedback, input routing, and the `GameHandle`. |
| `client/src/game/gameState.ts` | Gameplay rules | Owns run mode, score, combo, level, misses, timer, cadence, target selection, and event callbacks. |
| `client/src/game/target.ts` | Target behavior | Owns one koala cutout plane, hidden/visible positions, rise/settle/hit/retreat animation state, and one-hit guard. |
| `client/src/game/arena.ts` | Environment | Creates the nine hole assemblies, ground, rims, interiors, dust anchors, foliage accents, and playfield layout. |
| `client/src/game/effects.ts` | Feedback visuals | Builds pointer ripples, coral impact stars, score pops, and small dust puffs. |
| `client/src/game/audio.ts` | Audio service | Synthesizes short hit, miss, and game-over cues with the Web Audio API, unlocks from user gestures, and persists mute preference in local storage. |
| `client/src/pages/Home.tsx` | React UI | Renders the full-screen game shell and HTML HUD, subscribes to `GameHandle` events, exposes start/restart actions, and owns the mute toggle surface. |
| `client/src/index.css` | Design system | Defines Field Day Scrappy Charm tokens, HUD surfaces, type hierarchy, responsive safe areas, and motion preferences. |

## State flow

`menu` shows the start overlay and a calm idle arena. `playing` enables spawn scheduling, input, timer, and difficulty progression. `gameover` stops spawning, leaves the final score visible, and shows restart. A target follows `hidden → rising → visible → hit/retreat → hidden`; the target controller owns its transition and emits exactly one hit event per appearance.

## Input and audio contract

Pointer and touch events on the canvas route through one normalized screen-coordinate hit test. Space and Enter trigger the deterministic demo/action path for keyboard users. UI buttons call scene methods rather than mutating gameplay internals. `?demo` turns on a deterministic autopilot that spawns and taps targets on a predictable cadence so screenshots expose real gameplay. The audio service creates its context lazily and resumes it from the first user gesture, avoiding browser autoplay violations. Hit, miss, and game-over events are translated to distinct synthesized cues. The mute control uses `aria-pressed` and persists `koala-whack-muted` locally so the preference survives reloads.

## Asset contract

Large images stay outside the project in `/home/ubuntu/webdev-static-assets/` and are referenced by their lifecycle-safe `/manus-storage/...` URLs. Babylon loads the generated koala cutout with an alpha-enabled texture, uses the eucalyptus texture on the ground plane, and keeps the logo in the React HUD and document metadata.

## Verification ownership

The game scene is verified with WebDev screenshots at desktop and mobile viewports, while `pnpm check` and `pnpm build` validate the static bundle. Runtime errors are checked through the managed browser-console log after interacting with start, hit, and restart states.
