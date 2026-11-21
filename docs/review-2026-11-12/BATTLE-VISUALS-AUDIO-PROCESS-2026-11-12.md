# Battle visuals, skill cinematics, animation and audio: production process

Date: 2026-11-12. Author: research thread "Research battle visuals, skill effects and audio".
Audience: the main review thread (merges this into the final artifact) and Codex (executes).
Status: sections 0-8 are based on the current code, current review clips and web research; section 9 holds the measured OMG 3Q findings (frames in /mnt/project-files/taskbar-hero/omg-ref-2026-11-12/ and 6 fps bursts in /Users/bao/tools/omg-ref-2026-11-12/burst/). Where section 9 disagrees with an earlier section, section 9 wins.

---

## 0. What the battle looks like today (checked, not guessed)

Evidence: `/Users/bao/art/vfx-2026-11-12/review/*` (clips + film strips), branch `codex/cardrpg-integrate-2026-11-12` (draft #442) in worktree `/Users/bao/taskbar-hero-cardrpg-a6`.

| Area | Current state | Why it reads weak |
|---|---|---|
| Renderer | three.js 0.180 + `@esotericsoftware/spine-threejs` 4.2.120 (not Phaser) in `apps/web/src/game/cardrpg/spine/*` | Fine. No post-processing (no bloom, distortion, grading). |
| Formation | `stage/slots.json`: unitHeight 0.31 of stage; back row x 0.115, front row x 0.36; enemies mirrored; boss alone at x 0.65 | 0.245 stage-width gap between rows, small units, big empty floor. Looks "loose" exactly as the user says. |
| Unit size | Cats visibly differ in core size (Marigold vs Mochi vs Biscuit in `marigold-3-350.png`) | No "core box" rule; art scale is per image. |
| Skill playback | `vfx-layered/timeline.ts`: 6-10 painted layers anchored on caster/target, alpha/scale keys only | Every skill is the same shape: a painted sprite fades in on the target, numbers pop. No caster wind-up, no camera, no screen-space effect. "10 skills look like 1." |
| Camera | `spine/style.ts` PAINT: `maxZoom 1.10`, `zoomInSeconds .18`, `shake 4`, `hitstopMs 60`, `cutinSeconds .8` | Too timid to register. A 10% zoom at 0.18 s is invisible on a 1280 px screen. |
| Cut-in | A small text chip ("Greenhouse morning") in the top-left | Reads like a web toast, not a game ultimate. |
| Damage numbers | Small system font, green/white | Not a game font, no hierarchy (crit vs normal vs DoT). |
| Audio | `squad/turn3d/audio.ts`: WebAudio oscillator + noise beeps, master 0.14. No audio files at all | No music, no voices, no real impacts. This is the biggest single gap. |
| Disk | `/Users/bao/art/vfx-2026-11-12` = 2.1 GB (960 review files, before/after mp4+webm per skill) | Review evidence never pruned. |

---

## 1. Character animation for units the designer will not animate

Facts that drive the decision:
- The designer can hand-animate 3-4 units in Spine. The roster is 12+ cats, 10+ enemies, 3 bosses.
- Shipping any official Spine runtime (spine-threejs, spine-phaser) requires the studio to hold a Spine Editor licence (Essential is enough below US$500k revenue; meshes/weights need Professional in the editor). The Spine Trial grants no runtime rights. Source: Spine licence + Esoteric forum. USER ITEM: confirm the designer/team has a licence that covers the runtime; otherwise buy Essential, or use fallback F below.
- A Spine skeleton is plain JSON. Codex can write a valid Spine 4.2 `skeleton.json` + `.atlas` without the editor. That is the key to scaling.
- Riggy (riggyapp.com, Oct 2026 Phaser tutorial) turns a layered PSD or flat PNG into a Spine 4.2 rig with idle and one-shot animations, US$0.26-0.56 per chat turn, top-up in USDT/USDC, chat UI only (no API). Its own page says hero characters still need a real animator. Useful as a fast check, not as the pipeline.

### Decision: "one skeleton template, many skins of parts"

All cats share ONE bone hierarchy and ONE animation set. Every non-designer cat is a new set of part images placed on that template. Enemies get 3 templates (biped, floating/insect, blob/heavy). Bosses: designer or a dedicated template.

Why: Codex gets lost on open tasks. A fixed template turns "animate 20 characters" into "cut 20 part sheets and fill 20 pivot files", which is checkable.

### Process (Codex follows in this order; each step has a gate)

**A1. Core size rule (do first, blocks everything).**
- Define the core box: head top to feet, excluding ears, hats, weapons, tails, wings.
- Cats and normal enemies: core height = 360 px on the 1024 px master canvas, head height = 0.46 of core (chibi 1:1.15 head:body), feet on y = 900.
- Elite enemies 1.15x core, bosses 1.7-1.95x (keep existing boss ratio).
- Accessories may extend outside the box; the box must match within 2%.
- Gate: script `scripts/art/core-size-check.mjs` measures the alpha bbox of the core layers (head+torso+legs) of every unit and fails if any cat is outside 360 ± 7 px.

**A2. Part list (the template contract).** Cat template, 24 parts, names fixed:
`head, ear_l, ear_r, hair_tuft, brow_l, brow_r, eye_l, eye_r, eye_l_closed, eye_r_closed, mouth_neutral, mouth_open, mouth_shout, torso, apron_or_cloth, arm_upper_l, arm_lower_l, hand_l, arm_upper_r, arm_lower_r, hand_r, leg_l, leg_r, tail_1, tail_2, tail_3, weapon, accessory_1`.
Each part is a separate PNG with the hidden area painted in (overlap margin ≥ 12 px at every joint so rotations of ±20° show no gap).

**A3. Make the parts.**
1. Master illustration in 3/4 front view, neutral A-pose-ish stance (arms slightly away from body, tail visible, mouth closed), on the template canvas. Original art only; no reference images fed to generators; record tool + prompt in `assets/provenance.json`.
2. Split with the existing tool `/Users/bao/tools/psd-split` (used for Mochi V3, 115 layers, and Clover, 139 layers) BUT collapse to the 24-part contract; 115 layers is too many for a shared template.
3. Inpaint occluded regions per part (behind arms, under head, tail root). Gate: rotate every limb ±20° in the viewer; zero transparent holes (script renders 8 poses and counts alpha holes inside the silhouette).

**A4. Rig = write JSON, do not hand-place bones per unit.**
- `art/rig-templates/cat.template.json`: bone tree (root → hip → torso → neck → head → ears/eyes/mouth; torso → shoulders → upper → lower → hand → weapon; hip → legs; hip → tail_1 → tail_2 → tail_3), slot draw order, and the animation set.
- `art/units/<id>/pivots.json`: per-unit pivot (x,y) per part, measured by a script from the part PNGs (joint = centroid of the overlap area between parent and child).
- `scripts/art/build-spine.mjs <id>`: template + pivots + part PNGs → `skeleton.json` + `.atlas` + `page.png` (pack with `free-tex-packer-core` or a small own packer; first atlas line must be the page name).
- Meshes: only for torso breathing and tail if needed; region attachments are enough for 90% of the look.

**A5. Animation set (shared, timings at 30 fps).** Every animation is authored once on the template:

| Anim | Length | Keys |
|---|---|---|
| idle (loop) | 1.8 s | torso scaleY 1.00→1.025, head bob 3 px with 0.1 s lag, ears ±4°, tail sine ±10° with 0.12 s phase lag per segment, random blink every 2.5-5 s (separate track) |
| attack | 0.55 s | anticipation 0.18 s (lean back 8°, squash 0.95/1.05) → strike 0.08 s (lunge +40 px, stretch 1.06/0.95, weapon arc 110°) → hold 0.06 s (event `hit`) → recover 0.23 s |
| cast | 0.6 s | arms up, body rise 10 px, event `cast` at 0.35 s |
| ultimate | 1.0 s | big wind-up 0.4 s, event `ult_release` at 0.55 s, hold pose 0.3 s (camera is on it) |
| hit | 0.25 s | knockback −12 px, squash, white flash via slot color |
| stunned / frozen | loop | stunned: head wobble; frozen: timeScale 0 + ice overlay (see 3) |
| death | 0.7 s | fall back, fade, event `dust` |
| victory | loop | jump + paw raise |
| enter | 0.5 s | run in from off-screen |

Personality without new work: per-unit `style.json` scales amplitudes (energetic ×1.3, calm ×0.7) and picks weapon arcs (slash / thrust / throw / staff-raise).

**A6. QA gates (automatic, then human).**
- Film strip per unit per animation (12 frames) + turntable of idle; side-by-side with one designer unit for style parity.
- Gate script: core-size check, hole check, events present (`hit`, `cast`, `ult_release`), loop seam check (first/last frame pixel diff < 1%).
- Human gate: user/designer approves the first 2 units before batch production.

**F. Fallback if no Spine licence.** The repo already has `apps/web/src/game/rig/index.ts` and `rig/bake.ts`. Extend that into a minimal cut-out runtime (bones + region attachments + linear/bezier keys) reading the same JSON subset. No meshes. Same part images, same template, so switching later costs nothing.

**Designer's 3-4 hand units:** the 4 starting squad cats that appear in the demo first battle. Give the designer the same bone names and event names so code treats designer rigs and template rigs identically.

---

## 2. Skill cinematics: make every ultimate distinct and impressive

### 2.1 Three tiers (only ultimates get the full show)

| Tier | Total | Camera | Screen | Assets |
|---|---|---|---|---|
| Basic attack | 0.6-0.8 s | none (crit: 3 px shake) | none | 1 hit-spark flipbook, 1 impact sfx, number pop |
| Active skill | 1.2-1.6 s | push-in to 1.12 on caster, 0.2 s | dim others 25% | skill VFX clip, 2 sfx, short voice |
| Ultimate | 2.4-3.2 s | full sequence below | dim 70%, element grade, bloom, shockwave | cut-in art, hero VFX clip, 4-6 sfx, voice line, music duck |

### 2.2 Ultimate beat sheet (default; each ultimate overrides values)

KEY FINDING from OMG 3Q (section 9): their ultimate is NOT a camera zoom on the battlefield. After the cut-in banner, the battlefield is replaced by a full-screen, opaque, art-directed 2D clip (dark or white background, speed lines, giant glowing caster silhouette, slash arcs, a 1-frame inverted black/white "impact frame", shards, white-out), then it cuts back to the field for the damage. Because that plate is opaque, it can be a PRE-RENDERED VIDEO. That is how we get "a video of the skill effect" with high quality and zero runtime cost. See 2.4 option 0.

| Beat | Time (s) | What happens |
|---|---|---|
| 0 Trigger | 0.00-0.15 | Freeze world (timeScale 0.05), dim background to 30% brightness, vignette in; sfx "charge sting"; music ducks −8 dB |
| 1 Cut-in | 0.15-0.90 | Diagonal banner slides in from screen edge (0.12 s, ease-out back) with the cat's splash art (bust, 2× portrait size), element colour band, speed lines behind, skill name in display font with stroke + gradient; voice line starts; banner slides out 0.12 s |
| 2 Focus | 0.60-1.20 | Camera dolly to caster: zoom 1.0 → 1.40 (ease-out cubic 0.35 s), slight dutch tilt ±3° if the skill's camera preset says so; caster plays `ultimate` wind-up; aura ring + rising particles under caster |
| 3 Release | 1.20-1.60 | On Spine event `ult_release`: camera whips to target area (0.18 s, ease-in-out), motion blur / radial blur 0.1 s; projectile or beam or summon clip plays |
| 4 Impact | ~1.60 | Hitstop 100 ms (everything paused except VFX additive layer), 1-frame white flash at 35%, shake 10-14 px decaying over 0.3 s, ShockWave distortion from impact point, chromatic aberration spike 0.08 s, big stacked damage numbers, targets play `hit`, impact sfx layered (body + tail) |
| 5 Aftermath | 1.70-2.60 | Lingering decal (scorch / frost / petals), status icons appear, camera returns to 1.0 (0.35 s ease-in-out), dim fades out, music returns |

Change `spine/style.ts` PAINT accordingly: ultimate maxZoom 1.40-1.50, shake 10-14, hitstopMs 100, cutinSeconds 0.75. Keep a "calm mode" setting that halves shake and removes flash (accessibility).

### 2.3 Distinctness rule (fixes "10 look like 1")

Each ultimate has a signature card in `skills/<id>/signature.json` with 5 fields. No two ultimates may share more than 2 of the 5:
1. **Element palette + grade**: fire (orange/red, warm LUT), frost (cyan/white, cold LUT), nature, arcane, light, shadow, sugar/sweet (pink/cream).
2. **Camera preset**: `push_in`, `whip_pan`, `dutch_push`, `drop_from_above` (start zoomed on sky, fall to target), `orbit_parallax` (layers move at different speeds), `pull_out_wide` (for AoE).
3. **VFX motif** (shape language): slash arcs, falling meteors, ground eruption, beam, summon (giant paw / teapot / yarn whale), vortex, rain of needles, shield dome.
4. **Target shape**: single, row, column, all, random bounce.
5. **Sound kit**: distinct charge, release and impact samples.

A validator script fails CI if a pair collides on 3+ fields.

### 2.4 How to actually make the VFX clips (process, ranked)

0. **Ultimate cinematic plates = pre-rendered full-screen clips (new, primary for ultimates).** 1.6-2.4 s, 1280x720, 30 fps, opaque. Codex builds a small deterministic compositor page (`tools/cinematic-compositor/`): a canvas/three.js scene driven by a JSON timeline (layers: background plate, speed-line shader, caster silhouette/bust from the unit's own art with rim glow, flipbooks from option 1, particles, screen flashes, inverted impact frame, colour grade). Headless Chromium renders frame-by-frame (fixed timestep, no realtime), ffmpeg encodes WebM VP9 (+ MP4 H.264 fallback), target <= 600 KB per clip. Runtime plays the clip in a full-screen layer ABOVE the battlefield and BELOW the HUD, synced to audio, then cuts back to the field for impact. Same compositor renders the cut-in banners if wanted. Every plate is re-renderable from source JSON, so fixes are cheap.

1. **Flipbook sprite sheets rendered in Blender headless** (Codex scripts it; Blender was already used on the Mac). For each motif: a small Blender scene (emission shaders + toon ramp + Freestyle outline for the cartoon look), animate 16-24 frames, render 512×512 RGBA, pack to atlas. Smoke/fire: animated noise-displaced meshes or Mantaflow at low res. Slashes: curved ribbon mesh with gradient alpha texture. Rings, beams, shards: simple meshes. This gives consistent, original, reusable clips.
2. **Shaders in three.js** for things that must react to position: dissolve, fresnel aura, scrolling-noise beam, radial speed lines, ground decal circles, ice overlay. One `ShaderMaterial` per family, parameterised by element palette.
3. **GPU particles** with `three.quarks` (MIT, three.js VFX/particle system) for sparks, embers, petals, snow, dust.
4. **Post-processing** with pmndrs `postprocessing` (one `EffectComposer`; never mix with three's own composer): selective Bloom, ShockWave (`explode()` at impact), ChromaticAberration, Vignette, LUT colour grade per element.
5. **AI image generation only for painted stills**: cut-in splash art, decals, element backdrops. Do NOT use AI video for frame sequences (no clean alpha, no consistency).

Layer recipe for a hero clip (each ultimate needs all 6): anticipation charge (at caster), travel (projectile/beam/summon), impact core (bright flipbook, additive), impact secondary (debris/sparks particles), ground decal, lingering ambience (embers/frost mist).

### 2.5 Data format (Codex extends the existing `PaintTimeline`)

`SkillSequence` JSON with tracks: `camera` (keys: zoom, x, y, tilt), `time` (timeScale keys), `dim`, `cutin`, `casterAnim`, `targetAnim`, `vfx[]` (flipbook/shader/particle, anchor, blend), `postfx` (bloom, shockwave, aberration keys), `audio[]` (cue id, time, bus), `damage[]` (time, target, split). Impact time stays bound to the rules engine like `paintTime()` does now.

A preview page `docs/vfx-lab/index.html` (static, saved in repo per the DEMO RULE) with a scrubber, x0.25 speed, and side-by-side "before / after". Gate per ultimate: human approves 3 pilots (one per element) before batch.

---

## 3. Formation: dense two rows

Current `slots.json`: unitHeight 0.31, rows 0.245 apart. Proposal (normalized stage, feet y):

| Slot | x | y | note |
|---|---|---|---|
| FRONT-UP | 0.34 | 0.66 | |
| FRONT-DOWN | 0.37 | 0.94 | front row slightly staggered |
| BACK-UP | 0.20 | 0.58 | half a slot higher than front |
| BACK-DOWN | 0.23 | 0.86 | |
| enemies | mirrored around 0.5 | | |

- unitHeight 0.31 → 0.42 (≈ +35%). Allow 15-25% visual overlap between back and front units; depth-sort by feet y; back row 0.94 scale and 8% darker for depth.
- Camera framing: lower the horizon so the floor fills ~70% of the frame; crop the window wall. Use `fitStageCamera` with margin 16 instead of 32.
- Soft contact shadows under every unit + element-coloured base ring (thin, 30% alpha).
- Enemy side must be as full as the player side: 4 enemies in the same pattern; a boss takes the 2 front slots and stands at front centre with 2 minions behind.
- Team size: rules use 4. OMG-style 6 (3+3) fills more but changes balance. Recommendation for MVP: keep 4 in rules, apply the denser layout; revisit 5-6 after submission. (Main thread decides.)

---

## 4. Battle HUD, status effects, portraits

Layout (desktop 1280×720 base):
- **Top bar (thin, 44 px):** round counter "Round 3/15", wave dots, speed x1/x2/x3, Auto toggle, pause. Nothing else. Remove the helper bar and any text log from the default view (log behind a button).
- **Over each unit:** HP bar 64×7 px (player green, enemy red, white "recent damage" chip that drains after 0.4 s), rage bar 64×3 px under it (gold, glows when full), up to 3 status icons 18 px above the bar with stack count; extra statuses collapse into "+2".
- **Bottom strip:** 4 hero portraits 84 px with circular rage ring; at 100% the portrait pulses and glows; click = cast ultimate when Auto is off. HP mini-bar under each portrait.
- **Damage numbers:** bitmap font (section 5). Normal white-gold 28 px; crit orange 40 px with "CRIT" tag and a little rotation; heal green with "+"; DoT small purple/orange 20 px; miss grey "MISS". Numbers rise 30 px and fade in 0.7 s; stacks offset to avoid overlap (existing `layoutLabels` can do this).
- **Status visuals on the body (must be readable at a glance):**
  - Burn: flame flipbook at the feet + orange tint pulse 0.6 s + ember particles.
  - Freeze: ice crystal overlay sprite + cyan tint + animation timeScale 0 + crack shatter VFX on break.
  - Poison/Bitter: green bubbles + green tint pulse.
  - Bleed: red drip particles.
  - Stun/Daze: 3 stars orbiting the head.
  - Shield: translucent bubble (fresnel shader) with HP shown as a white overlay on the HP bar.
  - Buffs: upward arrows + soft glow; debuffs: downward arrows + dark smoke.
- **Portraits:** render from the unit's own art (head + shoulders, 3/4), not separate drawings, so they always match. Square 256 master, element-coloured gradient background, rarity frame (grey/green/blue/purple/gold), star row. Rule: eyes at 40% from the top, head fills 65% of the frame width.

---

## 5. Icons and game fonts

**Fonts (all SIL OFL, self-hosted via Fontsource):**
- Display / titles / skill names: Baloo 2 ExtraBold (confirmed Vietnamese subset). Always rendered with a game treatment: 2-stop vertical gradient fill, 3-4 px dark outline, 2 px drop shadow; never plain.
- Body UI: Nunito (check its Vietnamese subset before use).
- Numbers: a bitmap/MSDF font baked from Baloo 2 Black digits with gradient + outline baked in (`msdf-bmfont-xml`), so damage numbers render fast in three.js.
- One `typography.css` token file + a three.js text factory; ban system fonts in battle and menus (lint rule: no `font-family` outside tokens).

**Icons:**
- One style sheet: 128 px master, chunky painted style, 3 px dark outline, light from top-left, slight 3/4 perspective, consistent palette per category.
- Categories: currencies, materials, gear by slot, relics, status effects, nav/menu.
- Status-effect and nav icons: Codex draws them as SVG (crisp at 18-24 px, no generated noise). Items, gear and currencies: painted with a fixed prompt template + palette, then cleaned and outlined.
- Rarity frames are separate layers so one item icon serves all rarities.
- Gate: icon sheet review at 24 px, 48 px and 96 px on dark and light backgrounds.

---

## 6. Audio (the user calls this the most important part)

### 6.1 What is needed

| Bus | Content | Count (MVP) |
|---|---|---|
| Music | landing/menu theme, home loop, battle loop, boss loop, victory sting, defeat sting, gacha/forge reveal sting | 4 loops + 3 stings |
| Ambience | cafe room tone (soft chatter, cups, rain on window) | 1-2 loops |
| UI | click, hover, open/close panel, tab, reward fly, coin, level up, gacha reveal per rarity (5 tiers rising) | ~15 |
| Combat | whoosh (3), impact by type (blunt, slash, magic, heavy; 3 variants each), crit, block, heal, death poof | ~20 |
| Skills | per ultimate: charge, release, impact, tail (4) + per active skill 2 | ~4×13 + 2×13 |
| Status | burn crackle loop, freeze crack + shatter, poison bubble, shield on/off, stun chirp | ~8 |
| Voice | per cat: select, 3 attack grunts, skill call, ultimate line, hit, death, victory (9) | 9 × roster |

### 6.2 Sources (license recorded per file in `assets/audio/LICENSES.json`)

- **SFX free:** Kenney audio packs (CC0: RPG Audio, Impact Sounds, Interface Sounds); Sonniss GDC bundles (royalty-free, commercial OK, no attribution; NOT for AI training; read the licence in the year's bundle); Freesound only CC0 files.
- **SFX/voices generated:** ElevenLabs sound effects + voice design. Free plan is non-commercial only; Starter (≈US$5-6/month) or higher allows commercial use. USER ITEM: buy one month and generate in one batch.
- **Music:** Suno Pro/Premier gives commercial-use rights for songs made while subscribed (ownership wording disputed, so keep the subscription receipt and generation dates). Alternative: CC0/CC-BY game music packs. USER ITEM: choose.
- **Cat voices:** cats speak "cat-language": short meow-like syllables + 1-2 real words for the ultimate call ("Burn it!", "Shields up!"). Generate with ElevenLabs voice design (one distinct voice per cat), or record friends and pitch up 3-5 semitones. Cheap fallback: syllable-based gibberish synthesizer (Animalese-style) driven by the line text, so every cat still "talks".

### 6.3 Implementation

- Replace oscillator beeps with sample playback; keep the synth only as a last fallback.
- Buses: master / music / ambience / sfx / voice / ui, each with a settings slider; ducking: music −8 dB during ultimates and voice lines.
- Limits: 1 voice line at a time (priority: ultimate > skill > death > grunt), max 10 concurrent sfx, same-sample cooldown 50 ms, random pitch ±4% and volume ±1.5 dB on repeated sfx.
- Format: Opus in WebM (96 kbps music, 64 kbps sfx) with MP3 fallback for Safari; audio sprites per pack. Budget ≤ 12 MB total.
- Loudness: music −18 LUFS integrated, voice −16, sfx peaks ≤ −1 dBTP. Script with `ffmpeg -af loudnorm` in the asset build.
- Unlock: the landing page "Connect wallet / Play as guest" click unlocks the AudioContext, so the game starts with sound.
- Sync: skill audio cues live in the `SkillSequence` audio track and fire on the same clock as VFX (pause and x2/x3 aware).
- Gate: a "sound board" page in `docs/audio-lab/` that plays every cue, and a 60 s recorded battle clip with sound for user review.

---

## 7. Work order for the 2 Codex sessions (visual/audio part only)

Each session starts with the disk check (section 8). One long self-repairing prompt per lane; re-paste the same prompt when cut.

**Session V (visuals)**
1. V1 Core-size rule + formation density + camera framing + HUD declutter (fast, visible win; 1 day).
2. V2 Post-processing stack + `SkillSequence` format + cinematic compositor (2.4 option 0) + cut-in banners + total-damage banner + vfx-lab page + 3 pilot ultimates (fire, frost, nature), user gate.
3. V3 Remaining ultimates from signature cards (validator enforces distinctness), active skills, basic attacks.
4. V4 Status-effect visuals, damage-number bitmap font, portraits from rigs.
5. V5 Rig template + build-spine script + 2 pilot cats (user gate), then batch the rest; designer units drop in when ready.

**Session S (sound + fonts + icons)**, in parallel:
1. S1 Audio engine (buses, ducking, limits, sprites, loudness script) + Kenney/Sonniss SFX mapped to every combat and UI event.
2. S2 Music + ambience (after the user picks Suno or CC0), voice lines (after the ElevenLabs decision; gibberish fallback first so nothing waits).
3. S3 Fonts + typography tokens + lint rule.
4. S4 Icon system: SVG status/nav icons, painted item/currency icons, rarity frames.
5. S5 Skill sound kits wired to the `SkillSequence` audio tracks from session V.

Dependency: S5 needs V2's format; everything else runs in parallel.

---

## 8. Disk rule (start of every session)

1. `du -sh` on the worktree, `node_modules`, `/Users/bao/art/*`, `/Users/bao/Documents/Codex/*`; print the top 20.
2. Keep: source art masters, accepted runtime assets, final review strips (png).
3. Delete after acceptance: before/after mp4/webm review clips (the vfx-2026-11-12 folder alone is 2.1 GB), Playwright traces, `dist-*` builds, duplicate worktree `node_modules` of stopped lanes.
4. Never delete anything another project uses; never `pkill` broadly.

---

## 9. OMG 3Q video study (findings, measured)

Material: video 2 (battle, 14:45) sampled every 3 s (58 sheets x 9 frames) plus 6 fps bursts at 26-36 s and 44-54 s; video 1 (45-min newbie guide) sampled every 12 s. Learn structure and timing only; never trace, copy or feed frames to a generator.

### 9.1 Ultimate anatomy (burst at 44 s, skill "Long Đảm Lược Trận", game at x3 speed; cinematics are not sped up)

| t (s) | Frames | What happens | What we copy as a technique |
|---|---|---|---|
| 0.00-0.50 | 3 | Cut-in: horizontal banner over ~55% of the screen width with the hero's large bust art, speed lines streaking away, skill name in big gold-gradient outlined text; frame 1 has a radial burst ring over the art; battlefield behind dimmed ~60% | Banner cut-in with own bust art, alternate left/right side per hero |
| 0.50-0.83 | 2 | Back to the dimmed field; bright charge flash on the caster | Caster charge at 0.5 s |
| 0.83-1.00 | 1 | White/cyan streak wipe fills the screen | Whip transition into the plate |
| 1.00-1.33 | 2 | Black screen, golden slash arcs | Opaque plate, dark background |
| 1.33-1.67 | 2 | Giant glowing caster silhouette (ice aura), zoomed far beyond the field scale | Hero silhouette hero-shot |
| 1.67-2.00 | 2 | White burst, then a single cyan slash line on black | Contrast flip |
| 2.00-2.50 | 3 | Blue tornado / vortex | Signature motif |
| 2.50-2.67 | 1 | Inverted black/white "impact frame" with radial cracks | 1-frame anime impact frame |
| 2.67-3.00 | 2 | Crystal shards burst outward | Debris burst |
| 3.00-3.33 | 2 | White-out | Flash out |
| 3.33-3.67 | 2 | Cut back to the field: vortex lands on the enemy group, ground crater decal, damage numbers on all targets | Return to field for impact |
| 3.67-4.70 | ~6 | "Tổng Sát Thương" (total damage) banner with big gold digits at the lower left of the field while the fight resumes | Total-damage banner after every ultimate |

Total ≈ 4 s from cut-in to resume. The bottom portrait strip and top bar stay visible the whole time.
Other ultimates in the sample differ by: cut-in side (left or right), full-screen colour (white, blue, purple, gold), and SUMMONED BEASTS (phoenix, white tiger, serpent/fish) that fly across the plate. That is how "every skill feels different". For us: summons fit the theme (giant yarn whale, teapot dragon, paper-crane flock, ghost cat), and each ultimate gets a unique plate.

Normal attacks and active skills stay on the field with no cut-in: the unit dashes to its target (~0.5 s), crescent slash flipbook, small hit sparks; some active skills fire a screen-wide beam across the field (~0.5 s).

Update to section 2.2: keep the beat sheet but replace beats 2-3 (camera dolly) with: cut-in 0.5 s → caster charge 0.3 s → cinematic plate 1.6-2.4 s → field impact 0.4 s → total-damage banner 1.0 s (overlapping resumed play). Ultimate total target 3.0-4.0 s; add a setting "Ultimate cinematics: Full / Short (cut-in only) / Off" and auto-skip repeats after the player has seen a plate 3 times in a session (OMG shows a "Bỏ qua" skip button).

### 9.2 Formation density
- 6 units per side in two staggered rows (3 front, 3 back). Formation editor = 6 numbered parallelogram tiles in an isometric 2x3 grid.
- Units are ~22-25% of screen height and overlap each other 30-40%; each team block covers ~40% of screen width; the centre gap is only ~10-15% of width, so the two teams almost touch. Large decorative statues frame both edges, so there is no empty floor.
- Effect: "full". Our version: unitHeight 0.42, overlap 20-30%, centre gap <= 15% of width, decorative foreground props at both edges (counter, plant pots) to frame the field. The 4-vs-6 team size question stays with the main thread; even with 4, adopt these densities.

### 9.3 Battle HUD
- Top: tiny hourglass round counter "1/20", team power numbers, wave "1/1". Thin and low-contrast.
- Bottom centre: 6 square hero portraits (~6% of screen width each); gold glowing frame when the ultimate is ready; grayscale when dead; green HP and orange rage micro-bars under each portrait.
- Bottom left: big "x3" speed label in gold outlined text; bottom right: "Bỏ qua" (skip) button.
- Over units: small HP bar + rage bar, status as small icons (shield, crossed swords, coloured orbs) above the head, coloured auras on the body.
- Damage numbers: very large, gold/orange, italic condensed, thick dark outline; heals green with "+"; crit/specials red.
- ANTI-PATTERN: OMG also floats long buff/debuff words ("Tăng Miễn Thương", "Giảm Miễn Thương", "Hấp Thụ") in big letters; with 12 units they pile into unreadable stacks. The user asked for "easy to follow", so we use icons + short 1-word chips only, max 1 floating word per unit per 0.5 s, and never in the centre of the screen during an ultimate.

### 9.4 Portraits, fonts, icons and UI chrome (video 1)
- Portraits: bust crops of the same character art, consistent head size and eye line, coloured background by quality, framed squares.
- Fonts: titles and result banners ("Thắng", "Lên Cấp", "Ưu đãi 1500%") use a heavy condensed display face with gold-to-orange gradient, dark brown outline, outer glow and a ribbon/burst behind. Body text is a condensed sans, always light on dark panels. No plain system font anywhere. Our equivalent: section 5 (Baloo 2 treatment) plus a condensed body face; use the same gradient+outline recipe for result banners.
- Buttons: orange-red pill with bevel and white outlined label; secondary in muted gold.
- Panels: dark navy/brown with ornate gold corner frames and a tab strip; a character mascot leans in from the panel's left edge with a speech bubble (nice touch for our cat shopkeeper).
- Icons: square tiles with a rarity-coloured border, quantity bottom-right, small "shard" badge for fragments; currencies are round coins/ingots; nav icons on the home screen are small painted 3D-ish objects with a label under each and red notification dots.
- Home screen: hero/team on a round stage in the centre, nav icons around the edges, event timers, currency bar with "+" buttons at the top.
- Results: victory ribbon with a radial light burst behind the winning hero.

### 9.5 Audio (video 2, spectrogram of 0-30 s)
- Audio is continuous and full-band (music plus dense combat SFX) with almost no silence except short cuts.
- Clear pitch-contour sweeps at ~6.0 s, ~13.8 s and ~22 s look like voice lines, i.e. about one voice line every 7-8 s in auto battle. I cannot hear the audio, so I can only confirm density and the cadence, not the content.
- Takeaway for us: music never stops in battle, every hit has a sound, ultimates carry a voice line, and voice lines are rate-limited (one every ~6-8 s), matching section 6.3.

## 10. User-only items from this area

1. Spine licence: does the designer/team hold Essential or Professional that covers runtime use? If not, buy Essential or approve fallback F.
2. Audio budget: ElevenLabs Starter (1 month) and/or Suno Pro (1 month), or "free only" (Kenney/Sonniss/CC0 + gibberish voices).
3. Approve 3 pilot ultimates and 2 pilot template cats before batch production.

## Sources

- Spine runtime licensing: https://en.esotericsoftware.com/spine-editor-license , https://en.esotericsoftware.com/forum/d/17246-license-for-runtimes
- Riggy (PSD/PNG → Spine 4.2): https://riggyapp.com/ , https://phaser.io/news/2026/10/riggy-spine-animation-phaser-tutorial
- pmndrs postprocessing (Bloom, ShockWave, ChromaticAberration): https://github.com/pmndrs/postprocessing
- Kenney CC0 audio: https://kenney.nl/assets/rpg-audio
- Sonniss GDC 2026 bundle: https://rekkerd.org/sonniss-releases-gdc-2026-game-audio-bundle/
- ElevenLabs sound-effects terms: https://elevenlabs.io/sound-effects-terms
- Suno commercial rights summary: https://dynamoi.com/learn/ai-music-distribution/suno-commercial-rights-explained
- Baloo 2 (Vietnamese subset): https://fonts.google.com/specimen/Baloo+2/about
- Game feel layering (hitstop + shake + flash + sound): https://uhiyama-lab.com/en/notes/ue/game-feel-hit-feedback/
