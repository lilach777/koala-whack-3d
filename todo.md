# Koala Whack 3D — Hammer Hit Bug

- [x] Hammer pointer event, canvas coordinate conversion, active camera, and koala pick predicate trace करना।
- [x] Root cause के अनुसार pointer layer, CSS/render scaling, collider coverage, और mesh metadata ठीक करना।
- [x] Mouse और touch/pen primary pointerdown handling को ठीक करना।
- [x] Koala पर hammer hit, koala के बाहर miss, rapid duplicate click, और mobile tap path verify करना।
- [x] Shader registration और clean runtime rendering recover करना।
- [x] Audio, score, combo, retreat, timer, HUD, और restart regressions check करना।
- [x] Type-check/build चलाना और corrected checkpoint save करना।

# Gameplay Polish Upgrade

- [x] Inspect current timing, difficulty, target animation, and audio architecture.
- [x] Tune emergence/retreat animation to approximately 0.15–0.25 seconds without breaking occlusion.
- [x] Reduce exposure windows and spawn intervals with gradual, fair progression.
- [x] Preserve exact dedicated-collider hit detection and one-hit protection.
- [x] Verify hammer swing responsiveness for mouse, touch, and pen input.
- [x] Generate an original royalty-safe instrumental arcade loop at approximately 140–170 BPM.
- [x] Integrate seamless looping music with conservative volume and mute control.
- [x] Add or refine koala-appear and score feedback sounds while preserving existing hit/miss/game-over SFX.
- [x] Run type-check, production build, gameplay checks, and desktop/mobile visual verification.
- [x] Save a revised checkpoint and report the completed upgrade.

## Completion Notes

- [x] Record the final gameplay tuning values and any audio asset/license provenance.

# Audio-Only Follow-up

- [x] Inspect the existing audio manager and confirm the gameplay and visual files remain untouched.
- [x] Generate or select one original, royalty-safe arcade song/sound layer matching the existing game.
- [x] Integrate only the audio asset and audio playback path without modifying gameplay behavior.
- [x] Verify audio loading, looping, mute behavior, and unchanged hit/miss/gameplay flow.
- [x] Save an audio-only checkpoint and report the result.

# Alternate Track Rotation

- [x] Generate two additional original, royalty-safe arcade loops with distinct moods and compatible loudness.
- [x] Convert each track to an exact loop-safe PCM format and upload the assets.
- [x] Update the audio manager to select a different track on each new round without changing SFX behavior.
- [x] Verify lazy loading, looping, mute persistence, replay rotation, and unchanged gameplay flow.
- [x] Save a rotation-enabled checkpoint and report the result.

# Attached Game Over Audio

- [x] Inspect the existing miss counter, Game Over transition, restart reset, and audio lifecycle.
- [x] Copy and reference VN20260827_233353.mp3 exactly as provided without looping or editing its content.
- [x] Play the MP3 only once on the exact miss #3 transition after the Game Over screen appears.
- [x] Keep misses #1 and #2 silent, prevent replay while Game Over remains visible, and reset playback eligibility on PLAY AGAIN.
- [x] Verify the complete three-miss → Game Over → one-time audio flow and save a checkpoint.

# Mobile Compatibility Follow-up

- [x] Inspect current touch input, viewport, and audio-gesture handling.
- [x] Existing mobile-safe canvas configuration already satisfies this requirement; no gameplay, visual, scoring, or audio source changes were needed.
- [x] Verify touch play, mobile Game Over audio, and unchanged desktop behavior.
- [x] Existing published checkpoint remains mobile-compatible; no runtime checkpoint changes were required.

# Mobile Field Framing Fix

- [x] Inspect the mobile camera framing and identify why the side holes and koala are clipped.
- [x] Apply only a mobile-specific camera/composition adjustment; preserve the desktop camera and behavior.
- [x] Verify the complete 3×3 field is visible and the koala can be tapped on a phone viewport.
- [x] Verify desktop framing remains unchanged and save the corrected checkpoint.
