# V3-A2 measured battle research — 13 November 2026
Evidence recomputed 2026-11-13T02:40:53.844321+00:00 at ae12e046f.
Reference use: measurement and private comparison only. No reference pixels entered an asset generator. Reproduce with scripts/v3a2/ref-metrics.mjs and baseline-metrics.py. See REF-METRICS.json, OURS-BASELINE.json and R/baseline-review.jpg.

| Metric | Reference median / observation | Ours now | Target |
|---|---:|---:|---:|
| Core height / viewport | .20946 | .32083 | .15710–.26183; aim .20946 |
| Core p10 | .16723 | .30158 | retain per-unit normalization |
| Core p90 | .22247 | .34682 | boss separately 1.7–1.95× |
| Annotated bodies | 44 / 11 frames | 24 projected cores | >=40 / >=10 reference |
| Windows | 12 × 10 s | 3 × 30 s | same three fixtures |
| Confirmed plate windows | 6 | 3 fixtures | >=6 reference |
| Mean luma frame difference | 22.565 | 9.651 | >=15.796 |
| Actor travel / 10 s | .667 confirmed lower bound | 0 | >=2; never count summons |
| Climax changed-pixel coverage | .87437 | .70523 | >=.61206 plus full-width edges |
| Peak luma | 255 | 243 | element climax near white |
| White-out frame fraction | .0594 | 0 | authored one-frame flash |
| Dominant hue clusters | 3 | 3 | distinct compositions, not recolours |
| Complete plate duration | 2.60 s (4 complete) | 2.20 s | ~2.3 s plus field beats |
| Damage ink height at 720p | 46.22 px | 21.58 px | 34.66–57.77; normal 40–48 |
| Annotated reference numbers | 33 | 915 atlas-ink samples | >=30 reference |
| Max simultaneous numbers | 9 | 5 | stacks with .06 s stagger |
| Impact numbers / second | 4.286 | 4.5 | >=3 plus visual readability |
| Visible non-number words | 13 median | 21 median / 27 max | <=8 maximum |
| Audio normal onsets / s | 5.544 | 7.463 combined | >=4.776 cue events / s |
| Audio ultimate onsets / s | 6.822 | combined above | >=4.776 cue events / s |
| Sustained pitch contours / min | 2 | 0 | every active/ult voiced; barks 7–8 s |
| Cue attempts / played per s | acoustic proxy only | 14.63 / 11.10 | no duplicate fallback callouts |

Reference caveats: V2 is x3 PvP, with no confirmed boss or normal campaign wave. V1 overview confirms early x2 campaign play, but later large characters are menus or bandit-mode targets, not verified boss battles. This sampling limitation remains explicit; no hero is relabelled a boss. Four manually followed actor pairs across three full windows give a conservative travel lower bound, not exhaustive tracking. Two are stationary; w12 shows a real swordsman dash and return. The minimum target remains two events/10 s and EVERY action must travel >6% viewport width.

Censored plate fragments are joined in absolute video time before duration calculation; remaining open fragments are excluded from duration median. Coverage uses the last field frame (w11 uses the recovered following field, labelled in annotations). Reference core excludes hat/ears/wings/tools; its .20946 median is slightly below the planner's .22–.28 because these are semantic body bounds. Reference numbers agree with the planner's 40–90 px range. Pitch detection is conservative and includes music/commentary; its 2/min is not the planner's perceptual 7–10 s callout cadence. Keep the user's 7–8 s bark and 100% skill-voice requirements. Ours has many cooldown-rejected cue attempts: density alone does not establish pleasing sound.

## Motion research and implementation rules
Read on 13 November: [Jiesang Song, Combat Impact](https://www.gamedeveloper.com/audio/improving-the-combat-impact-of-action-games), [Jonathan Cooper, animation principles](https://www.gamedeveloper.com/production/the-12-principles-of-animation-in-video-games), [Esoteric Software, mesh weights](https://esotericsoftware.com/blog/Mesh-weight-workflows), [Comfy Numbers, turn-based prototype](https://elyadam.wordpress.com/2026/09/25/turn-based-combat-prototype/). These are observations, not runtime dependencies or a Spine licence. Song links readable contact, matched reactions and brief freezes; Cooper motivates anticipation, volume and lag; Esoteric recommends few purposeful bones and extreme-pose testing; the turn-based postmortem warns that uncontrolled travel/timing obscures intent. The following numeric decisions are ours, at 30 fps.

1. Melee anticipation 3–4 frames, torso −7°, squash y=.94/x=1.06.
2. Dash 5–7 frames, cubic ease out, strike point 36 px before target.
3. Three after-images, 1-frame spacing, alpha .24/.16/.08.
4. Strike hold 3–4 frames; freeze presentation only, never the rules clock.
5. Every confirmed hit: 18–30 px away from attacker, settle over 6 frames.
6. Impact white rim 2 frames; crit stagger adds 4° for 4 frames.
7. Return 7–9 frames with a 2-frame landing squash and feet on floor.
8. Ranged cast includes an 80–96 px forward root step at 1280 width to meet the stricter >6% gate; recoil 20 px in 3 frames.
9. Six shapes: dash/slash, leap/slam, spin, throw, staff, summon; leap apex 48 px over 6 frames.
10. Ultimate hero spot before banner: 6 frames in, 8 back; no formation-state mutation.
11. Tail/cloth lag 2–3 frames; breathing .018 scale amplitude, head 2 px, seeded phase.
12. 16–28 purposeful bones, 12 px hidden joint paint; blink 3 frames every seeded 2.5–5 s; mouth attack/open, ultimate/shout; audit eight extremes.

## Biscuit split pilots (R-c)
Three locally rendered, original-art experiments are in R/pilots/*-extremes.png and pilot-metrics.json; eight poses each at a common 640 px hole-test canvas. Each method used less than 30 minutes of active work.
- Generated rig-ready master + polygon split: separate props and clear limbs, but 1,763 maximum interior-hole pixels; shoulder voids and poor provisional hand/weapon attachment. Master generation prompt/provenance retained.
- Local Telea/NS fill on our concept: 111 maximum hole pixels; retains painted face, but smears apron details and leaves a baked hand/handle copy.
- Small matched repaint + local fill: 111 maximum hole pixels; better hidden apron/cotton continuity, independent eyes/mouth/tail. The duplicated handle and one shoulder seam still need cleanup.
Selected: method 3, with a full hand/weapon split and explicit hidden-joint painting in M2. None of these prototypes is a completed production rig. Hole count alone misses duplicated features; visual review remains mandatory.

## Ultimate layer plan (R-d)
Cost is peak approximate primitives/draws per plate; composited videos carry no live particle cost. All art uses our assets or original generation with provenance.

| Layer type | Construction / cost | Intended skills |
|---|---|---|
| Speed lines | shader; 1 pass | Soot, Cinnamon |
| Radial burst | painted alpha; 1 quad | Biscuit, Marigold |
| Ground cracks | original line mesh; 80 segments | Panko, Yarn Giant |
| Shockwave ring | analytic ellipse; 2 quads | Mochi, Mallow |
| Slash arcs | painted flipbook; 3 quads | Soot, Velvet |
| Sparks | pooled points; 120 | Biscuit, Cinnamon |
| Embers | pooled sprites; 60 | Cinnamon, Panko |
| Smoke puffs | painted atlas; 24 | Panko, Yarn Giant |
| Light shafts | additive triangles; 16 | Marigold, Mochi |
| Lens flare | painted star; 4 quads | Velvet, Marigold |
| Glyph circles | procedural paths; 2 layers | Inkcap, Sorrel |
| Debris | pooled triangles; 80 | Biscuit, Yarn Giant |
| After-images | caster snapshots; 3 quads | Soot, Velvet |
| Colour flash | screen fill; 1 pass | every active/ultimate |
| Vignette pulse | shader; 1 pass | all 13 ultimates |
| White-out | one screen fill; 1 frame | Mochi, Mallow, Sorrel |
| Element impact frame | per-plate shape; 1 frame | all 13, unique silhouettes |
| Summoned motif | original painting; 1–3 quads | teapot dragon / yarn whale / cranes |
| Distortion | radial UV shader; 1 pass | Inkcap, Clover |
| Petals / steam | pooled sprites; 120 | Clover, Brioche |

## Review and score
Current scale hides the floor; masks wash out bodies; numbers lack hierarchy; labels occupy faces; movement is absent; plate edges stay dark; caster pose is static; motifs repeat structurally; audio attempts overstate useful layers; generated split seams remain visible. These ten observations are backed by the comparison and pilot sheets. Research quality 7/10 pending shared browser gate; no >=8 claim or done state without checker PASS. Next: viewport scaling, six unique enemy seats, and alpha-aware face occlusion.
