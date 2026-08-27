# Assets

**Art direction:** Field Day Scrappy Charm — a warm tactile eucalyptus-grove arcade diorama with deep teal framing, olive ground, terracotta clay-ring holes, chalk-cream HUD plaques, orange koalas, and Koala Coral impact feedback. The scene is viewed from a fixed, slightly elevated third-person arcade camera, with nine clearly spaced holes and one koala emerging at a time.

## Generated assets

| Asset | Runtime role | Storage URL | Notes |
|---|---|---|---|
| `koala-whack-reference.png` | Visual QA target | `/manus-storage/koala-whack-reference_2d233ce2.png` | 16:9 in-game screenshot defining camera, density, palette, hole layout, and HUD. |
| `koala-character-cutout.png` | Koala target texture | `/manus-storage/koala-character-cutout_a9e925f7.png` | Front-facing transparent cutout; mapped to a billboard plane that rises from each hole. |
| `eucalyptus-ground-texture.png` | Playfield surface texture | `/manus-storage/eucalyptus-ground-texture_d0f4d1a9.png` | Tileable olive eucalyptus earth texture for the procedural ground mesh. |
| `koala-whack-logo.png` | Brand emblem and favicon | `/manus-storage/koala-whack-logo_50229f11.png` | Transparent koala-ear / sunglasses / impact-star symbol, used at readable size in the HUD. |
| `koala-whack-arcade-loop.wav` | Looping background music | `/manus-storage/koala-whack-engagement-loop-32s_50bcff19.wav` | Original 158 BPM royalty-safe instrumental arcade loop with frequent small rhythmic variations; 32s PCM WAV for seamless looping. |

## Runtime asset rules

All generated assets are referenced by the exact storage URLs above. No large images are copied into `client/public` or `client/src`. Procedural geometry provides the clay rims, dark hole interiors, dust puffs, foliage accents, score bursts, and all other small scene elements so the scene remains lightweight and responsive.
