# Koala Whack 3D — Development Memory

## Current decisions

The project is a WebDev static React host with Babylon.js as the 3D renderer. The chosen direction is Field Day Scrappy Charm. The provided brief is the gameplay source of truth: nine holes, koalas rising vertically, one-hit scoring, visible reaction, progressive difficulty, and clear start/game-over/restart flow.

The uploaded directory contained the text brief but no separate koala image file. The generated front-facing cutout therefore follows the brief's explicit character details: grey fur, large round ears, black nose, pixel sunglasses, orange hoodie, orange pants, and orange sneakers. The cutout is used as a camera-facing plane so it remains recognizable while still participating in the 3D scene and emerging naturally from the hole depth.

## Non-negotiables

Keep the canvas full-screen and use a fixed readable arcade camera. Keep the playfield unobstructed. Do not use a generic mole, random walking, 2D-only gameplay, upside-down or sideways targets, duplicate hit scoring, or unreachable spawn patterns. Keep large runtime art in WebDev storage URLs.

## Known implementation choices

The scene uses procedural meshes for the arena and effects, an alpha-enabled generated PNG for the koala, a generated ground texture, and a generated logo. The gameplay state is framework-agnostic and the React HUD observes events. A `?demo` query parameter provides deterministic active gameplay for visual verification.

## Next steps

Install Babylon.js, implement the scene/game modules and React HUD, then run type-check/build and capture desktop/mobile screenshots for start, active, and game-over states. If the generated image job replaces its reserved placeholders later, the same storage URLs remain valid.
