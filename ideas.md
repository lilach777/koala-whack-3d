# Koala Whack 3D — Design Brainstorm

## Three stylistic approaches

### Theme Name: Field Day Scrappy Charm
Very Brief Intro: A sun-warmed eucalyptus arcade with tactile painted clay, chalky cream UI, and coral impact marks. It should feel like a premium park game with a little handmade mischief rather than a generic neon cabinet.
Probability: 0.07

### Theme Name: Midnight Bounce Lab
Very Brief Intro: A single dark, electric direction with luminous koala silhouettes and reactive glow rings. Fast, high-contrast, and screen-forward, but intentionally reserved for this one option.
Probability: 0.03

### Theme Name: Paper Grove Parade
Very Brief Intro: A bright cut-paper diorama where each hole and koala reads like a layered paper craft. Gentle, storybook, and airy, with almost no visual noise around the playfield.
Probability: 0.08

## Chosen approach: Field Day Scrappy Charm

### Design Movement
Contemporary tactile arcade design with hand-painted board-game materials, soft 3D diorama staging, and editorial sports-poster typography. The scene borrows the friendliness of a neighborhood field day, then sharpens it with arcade timing and punchy feedback.

### Core Principles
1. **Tactile clarity:** Ground, clay rims, koala cutouts, and UI surfaces should feel like physical objects with readable depth and contact shadows.
2. **Playfield first:** The 3 × 3 hole field is the visual anchor. UI frames it without covering it, and every effect reinforces where the player should tap.
3. **Warm contrast:** Teal sky and olive ground create a calm stage for orange koalas and coral hit feedback. No purple gradients or generic cyber glow.
4. **Fast charm:** Animations are snappy and physical—rise, settle, squash, retreat—with small playful flourishes that never slow the game.

### Color Philosophy
The palette is built around a signature **Koala Coral** (#F26B4F), used only for meaningful actions, score bursts, and the brand mark. Deep eucalyptus teal (#153F48) provides a confident dark frame and readable text; olive field green (#52634A) gives the playfield a natural middle tone; chalk cream (#F6E9D3) softens HUD surfaces; tangerine orange (#F47A39) connects directly to the koala's hoodie and sneakers. The emotional intent is energetic warmth: a game that feels outdoorsy and playful, not frantic or synthetic.

### Layout Paradigm
Use a **framed diorama** rather than a centered dashboard. The Babylon canvas owns the full viewport. A narrow top HUD rail floats along the safe area, with score and level on opposite sides. The main scene is given a diagonal visual read from upper-left sky to lower-right playfield, while a compact instruction plaque and start card occupy the lower edge without occluding the holes. The UI should feel pinned to the frame, not stacked into a generic centered column.

### Signature Elements
- **Clay-ring holes:** warm terracotta rims, dark interiors, and little dust puffs make every spawn point tactile.
- **Impact starbursts:** coral-and-cream star marks briefly fan out from successful hits.
- **Field-day tape labels:** small uppercase cream-on-teal tags with notch corners identify SCORE, LEVEL, and the tap instruction.

### Interaction Philosophy
Every player action should receive an immediate physical acknowledgement. A koala rises with a springy settle; a successful tap compresses the koala, throws a coral starburst toward the pointer, increments score with a quick number lift, and sends the koala back below the rim. A miss is quiet and non-punitive early, then introduces a small shake only when the round is genuinely at risk. Touch, mouse, and keyboard input share the same hit path.

### Animation
- Spawn: ease-out vertical rise from below the surface over 220ms, with a 10% overshoot and settle under 120ms.
- Idle: barely perceptible breathing bob and a two-step sunglasses glint every few seconds; keep the silhouette stable.
- Hit: 80ms squash to 92% height / 108% width, a 50ms recoil away from the camera, then a 220ms retreat below the hole.
- Miss: pointer ripple and a restrained 90ms horizontal nudge, never a full-screen shake.
- Difficulty: level plaque flips or lifts only when the level changes; no constant UI motion.
- Respect `prefers-reduced-motion`: freeze non-essential bobs and shorten feedback to opacity/scale transitions.

### Typography System
Use **Bowlby One SC** for display numerals and game labels, with **DM Sans** for supporting copy and buttons. Score values are large, tightly tracked, and dark teal on chalk cream. Labels are uppercase with generous tracking. Helper copy stays sentence case and uses medium weight for comfortable mobile reading.

### Brand Essence
Koala Whack 3D is a fast, tactile hole-tapping arcade game for players who want a bright burst of skillful fun in under a minute; it stands apart through a character-led 3D diorama and warm field-day personality.

Personality adjectives: **cheeky, tactile, brisk**.

### Brand Voice
Headlines sound like a confident game host: short, active, and a little mischievous. CTAs are direct verbs. Microcopy celebrates the player without pretending every run is perfect. Avoid generic filler.

Example headline: “Keep your eyes on the grove.”
Example CTA: “Start the scramble”

### Wordmark & Logo
The wordmark uses a custom blocky uppercase treatment with a clipped corner on the K and A, paired with a small ear-and-sunglasses emblem. The standalone emblem is a bold koala-ear arc intersected by a coral impact star; it is used in the header and favicon, never reduced to an unreadable tiny icon.

### Signature Brand Color
**Koala Coral** — `#F26B4F`. It is reserved for the target character's reaction, the primary start action, and high-value feedback so the color becomes an unmistakable cue for “tap here / you got it.”

## Implementation reminder
Before each CSS, React component, or game module edit, ask: “Does this choice reinforce or dilute our design philosophy?”

## Style Decisions

- Every route and game state must show the framed 3 × 3 diorama, HUD rail, and Koala Whack 3D brand mark immediately; an uninterrupted teal field is never an acceptable primary screen.
- The visual hierarchy must combine deep eucalyptus teal, chalk cream UI, olive field, terracotta clay holes, and reserved Koala Coral action accents, with no single-color state.
- Brand presence is mandatory in non-active-play moments: use the custom blocky wordmark plus koala-ear/sunglasses emblem, paired with short cheeky host copy rather than generic game UI language.
