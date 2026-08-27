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

## Next steps

Run final type-check/build and capture desktop/mobile screenshots for the updated HUD. Verify the mute toggle manually once in a browser with sound enabled; the game remains fully playable when audio is unavailable or muted.
