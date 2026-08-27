# Game Plan: Koala Whack 3D

## Risk Tasks

### 1. Babylon.js scene lifecycle inside React 19
- **Why isolated:** StrictMode can mount effects twice, creating duplicate engines and render loops; cleanup must remove listeners and dispose all Babylon resources.
- **Approach:** Keep `GameCanvas` as a lifecycle-safe shell with a started ref. `createGameScene(engine, canvas)` owns the scene and returns a `GameHandle` with explicit `dispose()`. Gameplay stays in plain TypeScript modules under `client/src/game/`.
- **Verify:** Reload the page and confirm one canvas/render loop, no duplicate event handlers, no browser console errors, and clean unmount behavior.

### 2. Procedural 3D hole field and camera readability
- **Why isolated:** Nine repeated hole assemblies must preserve spacing, depth, and occlusion while remaining readable across desktop and narrow mobile viewports.
- **Approach:** Build three rows of three procedural clay-ring holes on a textured ground plane. Use a fixed orthographic camera with a shallow elevated angle, deterministic row/column spacing, and a foreground-safe UI frame. The koala emerges from named spawn anchors centered inside each hole.
- **Verify:** All nine openings are visible at once, rims connect naturally to the ground, dark interiors read as depth, and the koala never floats or appears below the rim incorrectly.

### 3. Procedural character animation and hit state handoff
- **Why isolated:** The character must rise, settle, face the camera, accept one hit, react, retreat, and return to the pool without duplicate scoring or stuck states.
- **Approach:** Use a front-facing transparent cutout plane textured with the generated koala art, parented to a per-hole target controller. Animate local Y and scale with a small state machine: hidden → rising → visible → hit/retreat. Set an `alreadyHit` guard per spawn, and keep a separate invisible collider mesh parented to the koala. The collider is pickable only during the visible phase and is narrower than the hole opening.
- **Verify:** Every spawn rises from below its rim, remains upright and front-facing, only a ray intersecting that target's dedicated collider scores, ground/rim/hole/empty clicks miss, duplicate clicks score once, and the koala squashes before retreating into its own hole.

### 4. Progressive timing and game-over flow
- **Why isolated:** Difficulty must increase gradually without impossible spawn patterns, missed targets must matter, and the run needs a clear finish/restart path.
- **Approach:** Start with one target, 1.25s spawn cadence, 1.25s visible time, and three misses allowed. Reduce cadence and visible time by small score-based steps, open a second target after level 3, avoid immediate same-hole repeats, and end when misses reach three or timer expires.
- **Verify:** Start screen → active run → score/level changes → miss feedback → game over → final score → restart all work with no stale animation, stale score, or stuck overlay.

## Main Build

Build a single-page Babylon.js arcade game with a full-viewport canvas and a React-owned HUD overlay. Procedural meshes provide the diorama: gradient sky panel, eucalyptus ground, nine holes with clay rims and dark interiors, small foliage props, dust puffs, target cutout planes, hit starbursts, and a subtle camera-facing playfield marker. Use pointer, touch, and keyboard input through one semantic action path.

- **Assets needed:** Generated 16:9 art-direction reference, front-facing transparent koala cutout, tileable eucalyptus ground texture, and transparent koala-ear impact logo. Use the generated storage URLs directly; do not commit large media into the project tree.
- **Verify:**
  - Input response is immediate for pointer, touch, and Space/Enter.
  - Spawn/hit/retreat animation transitions are smooth and never leave a koala stuck.
  - HUD is readable, high contrast, responsive, and does not cover the central hole field.
  - Ground texture and koala art load without missing-texture fallbacks.
  - Every hole is a physical brown clay opening with a dark interior; no orange/yellow ring, portal, halo, arch, or spawn marker remains.
  - Game-specific scoring, combo, level, cadence, miss count, target selection, and timer behavior are visible.
  - Gameplay flow matches the provided brief.
  - No visual glitches, clipping, upside-down characters, duplicate scoring, or impossible spawn patterns.
  - No browser console errors during capture.
  - Reference consistency: teal/olive/cream/orange/coral palette, elevated 3D arcade camera, tactile clay holes, and visible HUD rails.
  - **Presentation proof bundle:** WebDev screenshots of start, active play, and game-over states; deterministic `?demo` mode should make active gameplay visible without manual input.
