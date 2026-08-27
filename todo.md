# Koala Whack 3D — Hit Detection and Emergence Fix

- [x] Audit the current target, hole, and pointer-hit implementation against the attached reference brief.
- [x] Replace the global forgiving fallback hit with a dedicated visible-koala collider raycast.
- [x] Ensure ground, hole, rim, empty space, and unrelated objects register MISS without changing score or target state.
- [x] Remove all orange/yellow ring or arch visuals and keep physical hole rims/depth.
- [x] Correct koala hidden position, vertical emergence, same-hole retreat, and occlusion.
- [x] Test direct hit, misses, multi-target isolation, duplicate-hit protection, and regression flows.
- [x] Run type-check/build, capture verification states, and save the corrected checkpoint.
