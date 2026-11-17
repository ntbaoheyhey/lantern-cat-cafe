# V0 — motion study and implementation map

Completed 2026-11-17. No application code or art changed. Reference frames stay in ignored `work/v5/CXV/learn/ref/` and are never generator inputs. Sources below were accessed through the connected public search service; the generic web route returned `404 route_not_found`.

## Reference evidence

Input: `/Users/bao/Downloads/1794839260117_4283331764508693014_g7637148592472214939.mp4`, ffprobe duration **52.425292 s**, encoded **848×480**, rotation displayed **480×848**, **30 fps**. Overview: `overview-01.jpg` through `overview-03.jpg`, 1 fps, 5×4 tiles. Three detailed sheets: 10 fps, 5×6 tiles, read left-to-right/top-to-bottom. Each sample spans 100 ms / 3 source frames. Timing estimates below have at least ±100 ms uncertainty; this is a handheld recording of manually scrubbed parameters, not an instrumented spring trace.

| Window / sheet | Layers and order | Delay, overshoot, settling observed |
| --- | --- | --- |
| **7.0–10.0 s body sway**, `sway-07-10.jpg` | Torso/head lean together; skirt hem and collar follow; tail finishes its wide sweep after the torso reverses. Teapot hand follows the arm with much less rotation than the tail. Feet remain the visual reference. | Torso direction changes around 8.5 s; tail reverses across the following 2–3 samples (200–300 ms, 6–9 source frames). Cloth follows within roughly 1–2 samples. Tail crosses back once, then its excursion becomes smaller near 9.5 s: roughly 700–1000 ms to appear settled. Exact overshoot percentage is not recoverable from the moving camera and continuing control input. |
| **32.0–35.0 s head turn**, `turn-32-35.jpg` | Around 32.7–32.9 s the muzzle/eyes move toward screen right within the head outline; far cheek/ear narrow. Neck/collar remain under the chin. Around 33.6–33.8 s the face returns. | Facial parts respond within the same sample (0–100 ms / 0–3 source frames). Cowlick/ear adjustment trails by no more than about 1–2 samples. No unambiguous head overshoot; the return appears settled within 200–400 ms. Do not translate the entire head sprite to imitate this depth change. |
| **35.0–38.0 s blink / expression**, `blink-35-38.jpg` | Lids start closing near 36.3 s, closed around 36.4–36.6 s; cheeks lift and ears flatten outward. Reopening begins about 36.7 s; another closure near 37.6–37.8 s shows continued manual expression input. Eye-open channels are separate. | Lid closure takes ~1 sample (100 ms / 3 source frames), closed hold ~200 ms, reopening ~200–300 ms. Ear fold follows within 0–1 sample and recovers with the eyes. No measurable autonomous overshoot; this window does **not** establish a natural blink interval. Use the requested 2–6 s interval as our design requirement. |

The overview confirms a parameter-driven Live2D viewer demonstration, not a skill reel. The toolbar says 1000 ms fading; that is not evidence that every spring settles in one second. Visible movement groups include hair, ears, leaf collar, clothing, tail, face, and held accessories; the exact number of meshes cannot be determined from the video.

AG1's existing [L1 study](/Users/bao/th-v5-ag1/reports/v5/AG1/L1-REFERENCE.md) was read after its mailbox delivery. It covers the broader 0–12 / 12–24 / 25–31 / expression windows and identifies the XY control pad. This report adds three narrow timestamped windows and the runtime mapping; it does not repeat AG1's sheets. AG1's exact overshoot percentages and proposed spring constants are useful tuning hypotheses, not independently measured values in CXV's samples.

## Source table

**S = supported source content. A = our concrete adaptation**, not a numeric prescription claimed from a tutorial. No tutorials or reference art are copied into game assets. Chinese sources are marked ZH. Search-index text is explicitly distinguished from a watched video or fetched page.

| ID / primary source / access | Concrete techniques (2–3 each) |
| --- | --- |
| S1 [Reddit author's workflow](https://www.reddit.com/r/ClaudeAI/comments/1xwlfsn/for_those_who_asked/) — page reachable | **S:** author separates concept, model, rig/scene, lighting and render review; describes 8 IK legs, 12 scripted shots and 4 revisions. **A:** split our work into timing data, socket placement and visual review; use 12 repeatable hero-action captures; keep feet fixed while secondary layers move. Generated models, paid rendering and audio are outside CXV scope. |
| S2 [Live2D 关于物理模拟](https://docs.live2d.com/zh-CHS/cubism-editor-manual/physics-operation/) — ZH, fetched | **S:** separate physics groups per hair/skirt part; normalized position/angle inputs with influence weights; selectable 15/30/60/120 fps, with 60 fps recommended when undecided. **A:** deterministic fixed 1/60 s spring step; head-driven hair and body-driven cloth; per-layer bounded outputs rather than one shared sine wave. |
| S3 [Live2D 如何设置物理模拟](https://docs.live2d.com/zh-CHS/cubism-editor-manual/physical-operation-setting/) — ZH, fetched | **S:** head/body angle inputs can be replaced by body Y or arm parameters; influence changes how hair/ribbon follow; output pendulum mapping permits multi-stage followers. **A:** hair delay 1–2 simulation ticks, cloth 3–5, tail 5–8; tune stiffness/damping independently; seed and replay a 3 s idle twice. These delays are our starting settings. |
| S4 [Live2D 摇摆运动的自动生成](https://docs.live2d.com/zh-CHS/cubism-editor-manual/auto-generation-of-sway-motion/) — ZH, fetched | **S:** pivot can be top/bottom/right/left; left/right settings may be asymmetric; automatic deformation applies to warp deformers and has limits for complex motion. **A:** reuse exported pivots; attach hair at the root and accessories at their belt/hand joint; bound secondary rotation to roughly 2–5° initially instead of copying large manual scrubs. |
| S5 [Live2D 标准参数列表](https://docs.live2d.com/4.2/zh-CHS/cubism-editor-manual/standard-parametor-list/) — ZH, fetched | **S:** independent eye channels; body XYZ ranges −10..10; hair channels −1..1 and breath 0..1. **A:** normalize target-facing yaw to −1..1; keep left/right eyelid values separate for crit wink; apply 1–2% torso breathing above fixed foot anchors. |
| S6 [Douyin creator: 序列帧是什么，怎么添加和使用](https://www.douyin.com/video/7234082584882335009?source=Baiduspider-sdc) — ZH, indexed tutorial text; direct open inaccessible | **S:** ordered filenames determine frame order; duration is frame count / fps (60 frames at 30 fps = 2 s; 10 at 16 fps = 625 ms); playback controller can disable autoplay and run once. **A:** clamp flipbook index to count−1; trigger from absolute timeline time; use a one-shot 8–12 frame impact burst whose rate derives from its declared duration. No video/subtitles claimed watched. |
| S7 [Bilibili original creator: 如何增加打击感，实现弹刀、粘刀、顿帧](https://www.bilibili.com/video/BV1fR4y1y7vT/) — ZH, indexed title/description; direct fetch 412 | **S:** treats contact pause and rebound/stick as distinct hit-feel mechanisms. **A:** contact-only 40–80 ms stop, with 60 ms hit flash and 120 ms knockback/squash; leave anticipation moving so contact reads as a contrast in timing. Exact values come from the work order, not the unavailable video. |
| S8 [Bilibili original creator: PS–ComfyUI辅助关键帧特效动画](https://www.bilibili.com/video/BV1eo78zqEY6/) — ZH, indexed creator page; no playback/subtitles | **S:** presents PS/ComfyUI assistance for effect keyframes, rather than a runtime particle system. **A:** AG2's original frames remain optional texture inputs; author 3 timing beats in code independently; validate frame grid/count before use and retain procedural shapes if absent. No model is installed or called. |
| S9 [Unity Trail Renderer manual](https://docs.unity3d.com/cn/2023.2/Manual/class-TrailRenderer.html) — ZH/English, fetched official documentation | **S:** point lifetime controls trail persistence; minimum vertex distance controls sampling; width/color curves are sampled along vertices. **A:** bounded 8–16 samples per slash, tapered width and alpha, 120–200 ms trail lifetime; start at the hand/weapon socket and end at the actual target contact, including Yarn basic. |
| S10 [MDN Optimizing canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) — fetched official documentation | **S:** pre-render repeated primitives offscreen; avoid repeated scaled drawing work; integer pixel placement can reduce rasterization work. **A:** share cached motif stamps; use fixed-capacity particle storage instead of creating particles per frame; cap backing pixel ratio at the existing 2× policy. Keep continuous character motion subpixel-smooth, applying rounding only to suitable cached stamps. |

### Coverage and access limits

Searched the requested Chinese topics across Bilibili, Zhihu, Xiaohongshu and Douyin, including skill tutorials, AI/ComfyUI sequence frames, hit-stop/shake, slash trails, healing, Spine particles, Live2D physics and browser performance. Zhihu-specific searches returned no relevant accessible tutorial text; no Zhihu technique is asserted. Xiaohongshu returned unrelated results and its public search page was inaccessible. Bilibili's direct video fetches returned 412; creator-index text supplied discovery only, not unobserved frame timings. The indexed Spine translation points to an external original author, so it is not used as primary evidence. Healing search hits were mostly showcases; Clover timing is derived from our requirements and existing `healing-leaves.ts`, not invented tutorial content. No login attempted.

## Existing-code map and technique → card

Paths below are relative to `apps/web/src/game/`; all proposed implementation paths are CXV-owned unless explicitly delegated.

| Technique / evidence | Where in our code | Card |
| --- | --- | --- |
| One 3-beat schedule: charge 120–250 ms, contact, fade 300–600 ms | `cardrpg/spine/vfx-registry.ts`; new `cardrpg/vfx-layered/skill-timeline.ts` | V1 |
| Absolute-time sampling, seek/replay without accumulated drift | existing `cardrpg/vfx-layered/timeline.ts` and `player.ts`; new timeline sampler | V1 |
| Preserve fixed rules contact at 350 / 1100 ms; charge ends at that event | `cardrpg/battle-v3/sequence.ts` (`ACTION_TIMING`); registry integration | V1 |
| Ground/caster/recipient anchoring and one dominant motif | `cardrpg/spine/vfx.ts`, `vfx-registry.ts`, `vfx-stamps.ts` | V1 |
| Optional original flipbooks, count/fps validation and fallback | new timeline texture registration; **CXI** owns `/vfx/v5/manifest.json` fetch/decode; REQ sent | V1 |
| Hit-stop 40–80 ms, small shake, alpha ≤0.3 under reduced motion | `cardrpg/battle-v3/presentation.ts`, `sequence.ts`, timeline feedback sample | V1/V5 |
| Fixed 60 Hz spring solver and delayed input per layer | new `rig/secondary-motion.ts`; existing `rig/cutout.ts` bone evaluation | V2 |
| Reuse pivots, move upper layers only and keep feet planted | `rig/cutout.ts`, `rig/drawing-layer.ts`; existing `rig/poses.ts` foot/upper-body distinction | V2 |
| Target-facing parallax is part-relative, not root translation | `rig/cutout.ts` head/face bone groups; narrow scene target hook if needed | V2 |
| Independent seeded blink and crit/hit expressions | existing `rig/cutout.ts` `blinkAt` / `faceAt`; expression adapter | V2 |
| Attack-to-contact trail and visible Yarn weapon overlap | `cardrpg/vfx-craft/yarn-surge.ts`, `drawn-poses.ts`; actor contact placement | V3 |
| Timed flash → squash → recover → dissolve states | `cardrpg/battle-v3/body-fx.ts`, `cardrpg/vfx-craft/paint-death.ts`; new pure reaction state | V3 |
| Boss screen build-up restrained outside contact | `cardrpg/vfx-craft/yarn-surge.ts`, `cardrpg/battle-v3/field-vfx.ts` / `post-fx.ts` | V3 |
| Evidence-based polish from AG1/owner notes | owned motion/effect paths, severity checklist in `reports/v5/CXV/V4.md` | V4 |
| Cached motifs, bounded trails and pooled particles | `cardrpg/battle-v3/field-pool.ts`, `field-vfx.ts`, `spine/vfx-stamps.ts` | V5 |

`PaintTimeline` already has milliseconds, start/end, easing, blend, socket anchors and flipbook support; its current validator requires 6–10 authored texture layers. The V5 data should extend the existing registry/playback flow without treating missing textures as a load failure. `FieldVfx` already owns bounded ground/element pools, and `BattlePostFx` deliberately bypasses fixed-timing plans. `CraftEncounter` loads only encounter owners; do not create a second eager effect loader. `rig/cutout.ts` is the layered runtime (the older 32-pixel `poses.ts` is not the primary scene rig).

The previous ART A9 notes retain fixed 800/2200 ms actions and warn that color/shape alone may not distinguish effects. Yarn basic visual contact and Mochi/Panko basic range remain open motion issues; they are not claimed fixed by this research.

## V0 gate

PASS: 10 sources, 8 Chinese or Chinese-localized sources; 3 independently reviewed timestamped windows; 15 techniques mapped to implementation paths across V1–V5 (14 include V1–V4); no application code changes. Contact sheets remain local; this text report is the deliverable.
