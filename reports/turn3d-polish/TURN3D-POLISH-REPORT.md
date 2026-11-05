# Turn3D polish delivery · 2026-11-05

Candidate branch: `ai/codex-turn3d-polish-2026-11-05`. Base: `e1731dc2660e6ad7a60d797d45a965e6a8ba67f5` / draft #299. Runtime source: `08e5595fe570c885bffb782518d2414637f1f74e` (later commits package proof and the demo). Main remains `340f88b92405ceb6b5421b207307fdbb283b2ca3`. No merge, deployment, server grant, migration or contract action.

## Result and recommendation
A complete local round-based run now includes preparation, 30 equipment items, real skill properties, three sets, seeded loot after each wave, cafe rest, five finite consumables and an end summary. Twelve rebuilt original figures and 43 five-beat effects replace the previous primitive presentation. Keep this as a draft prototype: measured functional and Metal gates pass, but the absolute premium-art/every-effect-distinct subjective gates and software-renderer performance do not fully pass. No human playtest is claimed.

## Open and reproduce
- Double-click `docs/turn3d-polish/index.html` in the candidate checkout. Self-contained 23,264,467 bytes (22.19 MiB), below 25 MiB; CSP blocks networking.
- Artifact SHA256: `9332257a56a6e0aefe9fcdc7f825978d8c336c111d0357e1d12a40548327edd1`. `demo-build.json` records the exact source revision.
- `pnpm demo`, then `?demo&squad=1&squad3d=1&squadDebug=1` for the development UI. Flags default off.
- `node tools/turn3d/polish-demo.mjs` rebuilds the artifact; `node tools/turn3d/polish-demo-check.mjs` checks the real file:// runtime.
- Proof tools under `tools/turn3d/polish-*.mjs` use local Node/Playwright/Vite. They contain no model requests. Contact sheets use Pillow in an isolated environment.

## Round-system proof
The old fractional scheduler is removed and replaced by `rounds.ts`. Every living actor acts once per numbered round; higher integer Initiative goes first, seeded ties then actor ID. The order bar shows the current remaining actors and the next round. Quicken and Push Back move pending actors in whole steps; Quicken is capped per target per round. Summons enter next round. Status duration, boss countdown and cooldowns use rounds. Cosmetic playback only drains the presenter.

`round-grep.json` records zero matches for `\b(speed|interval|clock)\b|\bat:` across current turn rules, current 3D UI and new round/gear design notes. Historical 2D comparison, old offline artifact and before screenshots retain their old terminology intentionally. Replay tests compare complete event streams including loadout/loot/rest and forced burn/wave boundaries.

## Gates
| Gate | Status | Evidence / limit |
|---|---|---|
| Round-based deterministic core | Met | Current/next order, whole-step effects, replay tests, clean current-source grep |
| Local equipment and full loop | Met | 24 class + 6 shared items; 4 slots; 3 sets; 5 consumables; three loot/rest transitions and summary |
| Gear visible on figures and cards | Met | 4 weapons + 4 outfits per role, shared charms/relics, merged attachment meshes, rarity accents and set aura |
| Original upgraded models within budgets | Met technically; subjective partial | 12 GLBs, 22 clips each, procedural materials/AO; original transform-node rigs, not skinned meshes |
| Premium art / every model above mean | Partial | Faces and silhouettes improved; Binding Thread and Cushion rebuilt but still below model-average self-score |
| 43 five-beat effect recipes and portraits | Met technically; subjective partial | 430 frames, separate glyphs/paths, shared machinery remains visible |
| Renderer features | Partial | Bloom/grade/ripple, ribbons, instancing, branching bolts, shader flame/water. Soft alpha particles are not depth-aware intersection fading; no physically simulated fluid/yarn |
| Muted original audio | Met technically | Six synthesized families and cafe bed; explicit gesture; blocked-audio path; peak/RMS measured only |
| Desktop layout and fallback | Met in tested cases | 1024×600, 1280×720, 1440×900; keyboard, reduced motion, missing/lost WebGL |
| No label overlap | Met in captured cases | 430 five-beat frames plus 129 three-size impact trials; no missing/overlapping cards; no universal-motion proof |
| Starter Auto campaign 55–75% | Met | Both compositions 17/30 = 56.67% |
| Active policy improves wins | Met in simulation | 23/30 and 26/30; proxy policy, not human play |
| First deaths vary | Partial | Other roles sometimes first; Soot is still disproportionately first |
| Campaign around 6–8 minutes | Estimate only | Winning means 7.55/7.92 min; individual runs can exceed eight minutes |
| Metal frame and geometry budgets | Met on one machine | M3 Pro, 16.7–16.8 ms p95; captured peak 223 primary draws + post, 96,728 triangles |
| Software Low frame budget | Not met | Active p95 83.4/100 ms; works without page errors, DOM fallback available |
| Ten-minute stability | Met for sampled duration | 602.237 s, zero errors; 2.15 MiB retained-heap range after warmup |
| Flag-off isolation | Met in measured scope | Same-settings screenshots pixel-identical; no Three/GLB/synth startup; nonzero bundle delta reported |
| Offline demo / draft stack / ledger | Met at delivery | file:// tested at all sizes; draft-only stack and this report |

## Validation counts
| Check | Before | After |
|---|---:|---:|
| Rules | 578 passed | 614 passed |
| Inherited expected failures / skips | 2 / 11 | 2 / 11 |
| Web unit tests | 1556 / 140 files | 1566 / 143 files |
| Inherited browser E2E | 421 | 421 |
| Backend mocks | 581 | 581 |
| Auth / chain / API contract | 24 / 32 / 16 | 24 / 32 / 16 |
| Root Node tests | 11 | 11 |
| Typecheck / lint / production build | pass | pass |

The combined final `pnpm test` run had one inherited StageLayout timeout during resource contention. The isolated full-web rerun passed all 1566 tests; after the final viewer-option change, all 57 focused turn3d checks passed again. Both failed and passing output are retained in `raw/validation-logs.tar.gz`; do not interpret the combined command as a clean first pass. The new browser proof is a separate seven-scenario script, not silently added to the 421 inherited E2E count.

## Balance and pacing
36 conditions × 30 seeds = 1,080 complete deterministic simulations. Raw histories and config are in `raw/balance-final.json.gz`; failed tuning tables and initial trials are retained. The active proxy uses visible intents/loot and does not inspect future random rolls. Standalone boss practice is explicitly scaled because it omits campaign loot. All tunables stay inside the squad sandbox.

| Encounter | Composition | Policy | Gear | Wins / 30 | Mean rounds | First deaths G/W/A |
|---|---|---|---|---:|---:|---|
| patrol | hearthkeepers | auto | off | 30 | 15.77 | 0/0/0 |
| patrol | hearthkeepers | auto | starter | 30 | 13.43 | 0/0/0 |
| patrol | hearthkeepers | auto | high | 30 | 9.03 | 0/0/0 |
| patrol | hearthkeepers | active | off | 30 | 14.43 | 0/0/0 |
| patrol | hearthkeepers | active | starter | 30 | 11.37 | 0/0/0 |
| patrol | hearthkeepers | active | high | 30 | 8.83 | 0/0/0 |
| patrol | lanternbreakers | auto | off | 30 | 15.6 | 0/0/0 |
| patrol | lanternbreakers | auto | starter | 30 | 13.53 | 0/0/0 |
| patrol | lanternbreakers | auto | high | 30 | 9.1 | 0/0/0 |
| patrol | lanternbreakers | active | off | 30 | 14.6 | 0/0/0 |
| patrol | lanternbreakers | active | starter | 30 | 11.67 | 0/0/0 |
| patrol | lanternbreakers | active | high | 30 | 8.83 | 0/0/0 |
| boss | hearthkeepers | auto | off | 1 | 24.53 | 5/23/2 |
| boss | hearthkeepers | auto | starter | 28 | 20.3 | 0/1/1 |
| boss | hearthkeepers | auto | high | 30 | 13.57 | 0/0/0 |
| boss | hearthkeepers | active | off | 1 | 24.53 | 5/23/2 |
| boss | hearthkeepers | active | starter | 28 | 20.3 | 0/1/1 |
| boss | hearthkeepers | active | high | 30 | 13.57 | 0/0/0 |
| boss | lanternbreakers | auto | off | 0 | 20.37 | 2/27/1 |
| boss | lanternbreakers | auto | starter | 27 | 18.1 | 0/3/0 |
| boss | lanternbreakers | auto | high | 30 | 13.8 | 0/0/0 |
| boss | lanternbreakers | active | off | 0 | 20.37 | 2/27/1 |
| boss | lanternbreakers | active | starter | 27 | 18.1 | 0/3/0 |
| boss | lanternbreakers | active | high | 30 | 13.8 | 0/0/0 |
| campaign | hearthkeepers | auto | off | 0 | 38.47 | 6/24/0 |
| campaign | hearthkeepers | auto | starter | 17 | 36.47 | 2/13/0 |
| campaign | hearthkeepers | auto | high | 30 | 24.43 | 0/0/0 |
| campaign | hearthkeepers | active | off | 1 | 39.7 | 11/19/0 |
| campaign | hearthkeepers | active | starter | 23 | 32.77 | 1/7/1 |
| campaign | hearthkeepers | active | high | 30 | 24.57 | 0/0/0 |
| campaign | lanternbreakers | auto | off | 0 | 36.53 | 8/22/0 |
| campaign | lanternbreakers | auto | starter | 17 | 35.6 | 1/10/3 |
| campaign | lanternbreakers | auto | high | 30 | 24.67 | 0/0/0 |
| campaign | lanternbreakers | active | off | 0 | 36.77 | 10/20/0 |
| campaign | lanternbreakers | active | starter | 26 | 33.27 | 0/9/0 |
| campaign | lanternbreakers | active | high | 30 | 24.97 | 0/1/0 |

Starter standalone-boss Auto: 28/30 vs 27/30 (3.33 percentage points apart). Campaign Auto: 17/30 vs 17/30; active: 23/30 vs 26/30 (10 points apart). High gear remains close to guaranteed success; gear-off is intentionally harsh. This is a narrow sandbox balance, not live economy tuning.

| Winning starter active-proxy run | Measured presenter mean | Mean hero choices | Estimated total |
|---|---:|---:|---:|
| hearthkeepers | 235.25 s | 86.26 | 7.55 min |
| lanternbreakers | 249.10 s | 90.65 | 7.92 min |

Estimate adds 2 seconds per hero decision and 45 seconds total for setup/loot/rest. Presenter durations were measured by draining real event streams in 10ms increments at x1, not inferred from a fixed arbitrary action count. This does not establish human reading speed.

## Performance, isolation and sound
Apple M3 Pro, Darwin arm64, Chromium ANGLE Metal. Production build; RAF frame cadence and CDP renderer TaskDuration, not GPU timestamps or whole-machine CPU.

| Size | Mode | p95 ms | Renderer task % | Draw calls | Triangles |
|---|---|---:|---:|---:|---:|
| 1280x720 | ultimate-six-enemies | 16.7 | 9.061 | 217 | 93716 |
| 1280x720 | paused | 16.8 | 0.7 | 217 | 93644 |
| 1280x720 | waiting-for-player | 16.7 | 6.055 | 172 | 67308 |
| 1440x900 | ultimate-six-enemies | 16.8 | 8.981 | 219 | 93752 |
| 1440x900 | paused | 16.8 | 1.013 | 218 | 93656 |
| 1440x900 | waiting-for-player | 16.8 | 7.249 | 172 | 67308 |

Soak: 602.237 seconds; 0 page errors; retained-heap range 2.15 MiB after warmup. Geometry-buffer memory estimates exclude textures and post targets and are lower bounds, not measured VRAM. Four post draws are separate from instrumented primary-scene counts.

| Flag-off startup JS, same build settings | Before | After | Delta |
|---|---:|---:|---:|
| Raw bytes | 2,333,591 | 2,335,487 | +1,896 |
| Gzip bytes | 379,307 | 379,900 | +593 |

Final d7b81c8a same-settings rebuild: flag-off screenshots are pixel-identical after awaiting font readiness (zero differing pixels). The final gzip delta is +593 bytes; the earlier runtime snapshot measured +584 bytes and is retained in `raw/isolation-runtime-snapshot.json.gz`. See `final-head-verification.json` and the final build/isolation logs. The bundle is not byte-identical. No squad/GLB requests and no Three.js markers in fetched startup chunks. Flag-on proof recorded no local/session/IndexedDB writes or server mutations; the normal app still fetches its pre-existing Google Fonts. The offline artifact makes zero external requests and zero storage writes.

Synthesized WebAudio only. Measured cue/stinger peaks -27.45 to -26.56 dBFS, RMS -52.82 to -50.22 dBFS, no PCM clipping in these fixtures. No listening test or professional audio quality claim.

## Art and provenance
Twelve GLBs total 6,688,932 bytes before transport compression; every model is within its budget. Every recorded model/portrait/source-family hash was rechecked. No downloaded models, textures or samples; no image-generation calls. All art is original CC0-1.0. Three.js 0.180.0, React and runtime libraries: MIT. Build-only TypeScript: Apache-2.0; Pillow contact sheets: HPND. Blender was unavailable; no Blender or glTF Transform use is claimed.

| Model | Triangles | Budget | GLB bytes |
|---|---:|---:|---:|
| Mochi | 14,020 | 25,000 | 809,448 |
| Soot | 14,666 | 25,000 | 866,884 |
| Clover | 12,998 | 25,000 | 805,704 |
| Button Guard | 4,564 | 10,000 | 431,432 |
| Sock Skipper | 3,724 | 10,000 | 378,768 |
| Spool Ram | 4,414 | 10,000 | 357,196 |
| Needle Moth | 5,164 | 10,000 | 433,984 |
| Teacup Healer | 4,708 | 10,000 | 387,180 |
| Kettle Knight | 6,032 | 20,000 | 517,792 |
| Yarn Giant | 20,050 | 60,000 | 828,464 |
| Binding Thread | 6,416 | 10,000 | 404,304 |
| Practice Cushion | 5,628 | 10,000 | 467,776 |

Manifest: `docs/turn3d/ASSET-MANIFEST.json`; human provenance: `assets/provenance/turn3d.md`; original pipeline: `tools/art3d/`. Smooth geometry, six expression states, secondary motion and 22 authored transform clips are actual code assets. AO is a baked analytic approximation, contact shadows are procedural, and skeleton-like named node articulation is not skinning.

## Five fresh-eyes passes
Separate passes by the same primary agent, not independent reviewers. Full per-model findings and all 43 weakest-to-strongest effect ranks: `FRESH-EYES.md` and `fresh-eyes.json`.

| Pass | Before | After self-grade |
|---|---:|---:|
| First-time player | not measured | 8.4 |
| Skeptical three-minute judge | 7.9 | 8.4 |
| Active player | not measured | 8.5 |
| Effects director | 7.8 | 8.3 |
| Art director | 7.9 reference | 8.4 |
| Mean of five after passes | prior reported mean 7.95, different review set | 8.4 |

The weakest two models were rebuilt. Quiet bottom-third effects received larger grounded signatures and offset emblems; reused rendering primitives still show family resemblance. The premium-art judgment remains subjective and is a reason to keep the work as a prototype.

## Evidence index
- 96 before captures at two sizes from unchanged e1731dc.
- 430 final effect captures = 43 × 5 × 2; 215/215 exact immediate repeat hashes at 1280×720. Cross-driver screenshot identity is not claimed.
- 849 model captures: twelve four-angle turnarounds, every 22-clip set at three times, plus three gear variants per hero.
- 129 impact label audits across three sizes and full five-beat capture bounding-box checks, no missing/overlapping actor cards in those frames.
- Three 20-second x1 hero turntable/action videos and an x1 full-round recording. They are recorded playback, not human playtesting.
- `ui-proof.json`: equipment/keyboard, all loot/rest transitions to summary, missing/lost WebGL, reduced motion, denied audio.
- `demo-check.json`: all three file:// sizes, 31 decoded images, 43 effects, 12 models, 22 clips, 30 catalog items, equipment/keyboard and complete three-wave loop to boss defeat; no network/storage/errors.
- `raw/validation-logs.tar.gz`: lossless terminal output, including failures and final successful reruns; `raw/balance-final.json.gz`: exact simulation histories.

## Boundaries and unfinished scope
No real inventory, Relic, wallet, save, forge, market or chain adapter. The “Avalanche Relic” flavor label adds no Avalanche integration. Optional cat level-ups were not implemented. No mobile claim, external art judge, human balance/pacing study, broad GPU matrix, depth-aware soft particles, physically simulated cloth/fluid, true depth-of-field blur or skinned mesh rig. Software rendering misses the performance target. No half-wired feature is exposed.

Skills used: none. One model-driven primary agent only; local code, Playwright, Three.js, Python/Pillow and ffmpeg do not create model requests. No subagents, workers, schedulers or image models. Missing historical DECISIONS.md and /mnt prior prompt were disclosed at baseline; current source/design/report supplied the context.

## Draft stack
All drafts stack on #299 and are under 1,500 changed text lines each; binary art/evidence are counted separately. No auto-merge. See `delivery-stack.json` for exact heads, sizes and URLs.

- #300: Baseline and deploy guard — https://github.com/ntbaoheyhey/taskbar-hero/pull/300
- #301: Shared numbered rounds — https://github.com/ntbaoheyhey/taskbar-hero/pull/301
- #302: Equipment and systems rules — https://github.com/ntbaoheyhey/taskbar-hero/pull/302
- #303: Original model pipeline and rework — https://github.com/ntbaoheyhey/taskbar-hero/pull/303
- #304: Effects, post and synthesized audio — https://github.com/ntbaoheyhey/taskbar-hero/pull/304
- #305: Loadout/loot/rest UI — https://github.com/ntbaoheyhey/taskbar-hero/pull/305
- #306: Balance, replay and viewer repair — https://github.com/ntbaoheyhey/taskbar-hero/pull/306
- #307: Proof tooling and self-review — https://github.com/ntbaoheyhey/taskbar-hero/pull/307
- #308: Captured evidence and receipts — https://github.com/ntbaoheyhey/taskbar-hero/pull/308
- #309: Offline playable demo — https://github.com/ntbaoheyhey/taskbar-hero/pull/309
