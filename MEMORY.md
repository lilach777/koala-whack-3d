# Koala Whack 3D — Development Memory

## Current decisions

The project is a WebDev static React host with Babylon.js as the 3D renderer. The chosen direction is Field Day Scrappy Charm. The provided brief is the gameplay source of truth: nine holes, koalas rising vertically, one-hit scoring, visible reaction, progressive difficulty, and clear start/game-over/restart flow.

The uploaded directory contained the text brief but no separate koala image file. The generated front-facing cutout therefore follows the brief's explicit character details: grey fur, large round ears, black nose, pixel sunglasses, orange hoodie, orange pants, and orange sneakers. The cutout is used as a camera-facing plane so it remains recognizable while still participating in the 3D scene and emerging naturally from the hole depth.

## Non-negotiables

Keep the canvas full-screen and use a fixed readable arcade camera. Keep the playfield unobstructed. Do not use a generic mole, random walking, 2D-only gameplay, upside-down or sideways targets, duplicate hit scoring, or unreachable spawn patterns. Keep large runtime art in WebDev storage URLs.

## Known implementation choices

The scene uses procedural meshes for the arena and effects, an alpha-enabled generated PNG for the koala, a generated ground texture, and a generated logo. The gameplay state is framework-agnostic and the React HUD observes events. A `?demo` query parameter provides deterministic active gameplay for visual verification.

## Audio follow-up

The game now includes a self-contained `ArcadeAudio` service that synthesizes distinct hit, miss, and game-over cues with the Web Audio API. Audio is created lazily and resumed from the first user gesture to comply with browser autoplay rules. A `SOUND ON` / `SOUND OFF` HUD toggle uses `aria-pressed` and persists the mute preference under `koala-whack-muted` in local storage. The audio manager is owned by the React game page and disposed with the page lifecycle.

## Hit detection and emergence fix

Pointer picks now filter exclusively for a dedicated invisible `koalaHitCollider` parented to the active koala. The previous global fallback that scored any click while a koala was visible has been removed. The collider is narrower than the hole, is pickable only during the visible phase, and is disabled immediately after a successful hit, so ground, hole, rim, empty, unrelated, and duplicate clicks remain misses. Hole visuals now use dark matte octagonal clay geometry with a deep opening and a foreground lip; all torus-based ring/portal/halo meshes were removed. Targets start below the ground surface, rise vertically from their own hole, and sink back into it.

## Hammer cursor and pacing follow-up

The visible-koala collider is now 2.02 × 2.58 × 0.66 units, covering ears, head, face, sunglasses, hoodie, and visible body while remaining narrower than the hole. It stays pickable only during the visible phase and is disabled on hit/retreat. Active gameplay renders a pointer-events-none CSS hammer overlay owned by React; the browser cursor is hidden across the active shell, the head center is aligned to the pointer, and each pointer press remounts a 145ms swing animation. The initial spawn timer is 0.12 seconds plus a 0.2-second rise. Level-one cadence is 0.64 seconds with a 1.12-second visible window, jittered by 0.86–1.10×; the late-game floor is 0.28 seconds and 0.62 seconds respectively, with two active targets from level 3.

## Gameplay polish and music update

The game now uses a faster arcade curve: 200ms rise, 130ms hit recoil, 160–180ms retreat, level-one 640ms spawn cadence with slight fair jitter, 1.12s exposure, and progressively faster 280ms cadence with 620ms exposure floor. Level 3 unlocks two active targets while random hole selection continues to avoid immediate repeats. The dedicated collider and one-hit protection are unchanged.

The audio manager rotates three original royalty-safe instrumental loops after the first game gesture: the 158 BPM engagement loop, the 146 BPM warm gumleaf loop, and the 168 BPM punchier sapling loop. Each track is loaded lazily, cached by URL, and looped through the music gain at 28%; gameplay feedback remains on a separate 82% SFX gain. Appear pop and score ding cues remain synthesized alongside the existing hit and game-over cues; ordinary misses are silent. The user-provided `/manus-storage/VN20260827_233353_e3326c82.mp3` is reserved for the exact third-miss transition, played once through a non-looping HTML audio element after the existing Game Over screen appears. A per-round guard prevents replay while Game Over remains visible and resets only when a new round starts.

## Next steps

The remaining maintenance check is to keep the timing values and storage URL synchronized if the difficulty curve or music asset is replaced. The game remains fully playable when audio is unavailable or muted.

## Raycast pipeline diagnosis — Aug 27, 2026

The reported click failure was traced through the browser runtime log. The attempted `pickWithRay`/`createPickingRay` path required Babylon’s ray registration side effect and triggered a runtime exception; stale Vite optimized dependencies then produced shader failures and a blank active playfield. The stable implementation keeps Babylon’s existing native `scene.pick` path, passes the explicit active camera, uses CSS-space coordinates from a direct canvas `pointerdown` listener, refreshes scene and collider world matrices before picking, and preserves the exact collider-only predicate with no fallback or distance scoring. The ray module import and development diagnostics were removed before final validation. Vite’s optimized dependency cache was cleared before the final clean runtime check.
