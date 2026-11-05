# The Last Lantern · turn-based 3D delivery

2026-11-05 · Primary-session implementation and self-review. **Candidate, not live.**
Recommendation: **keep demo-only**, behind the existing default-off flag and explicit
3D opt-in. The turn conversion, original models and offline review artifact work;
campaign difficulty, external art acceptance and broader hardware performance remain open.

## Open the result

- Double-click `/Users/bao/taskbar-hero-turn3d/docs/turn3d/index.html`.
- [Offline source and review guide](https://github.com/ntbaoheyhey/taskbar-hero/tree/ai/codex-turn3d-2026-11-05/docs/turn3d).
- Or `pnpm demo` from the turn3d worktree, then
  `http://127.0.0.1:5391/?demo&squad=1&squad3d=1&squadDebug=1`.
- [Running turn UI](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/turn3d-evidence-2026-11-05/reports/turn3d/shots/regrade-opening.png),
  [live x1 effects video](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/turn3d-evidence-2026-11-05/reports/turn3d/video/live-self-review.mp4),
  [four separate self-review passes](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/turn3d-evidence-2026-11-05/reports/turn3d/FRESH-EYES.md).

Delivery commit: `e1731dc2660e6ad7a60d797d45a965e6a8ba67f5`. All eight open drafts were
re-read after creation; `DELIVERY-PRS.json` records refs, SHAs and line counts.

The single HTML embeds the actual rules, UI, Three.js, twelve GLBs, 29 evidence images
and MIT license texts. Size: **10,086,768 bytes** (about 10.09 MB),
below 25 MB. Runtime SHA: `372c65a89ac6dc6bb7e35db40fcfa3575236740f`. Build receipt and SHA256 live in
`reports/turn3d/demo-build.json`; offline browser receipt in `demo-check.json`.
Final file check: 29 images decode; all 35 effects, 12 models/10 clips and keyboard
Bash work. Full Auto campaign wins in 163 slots, zero fallen cats, 90.236 seconds at
×4; all three viewports pass with zero network/storage/runtime errors. Final HTML
SHA256: `cebd2a75f0ca1c3e009e18d66d9466145698e41a33e6edc104b0ace9ffbfdd3d`.
Demo/model-rebuild stdout is archived separately in `raw/demo-logs.tar.gz`.

The demo has the encounter, all-effects loop, model/clip viewer, real 2D/3D comparison,
provenance, measurements and known limits. REFERENCE lines are at the top.

## Preserved base and branch discipline

Newest pushed squad tip was `41a6aa3` on `ai/codex-squad-slice-2026-11-05` (#291),
with runtime `1604c70`; the open draft stack #287–#291 was read. No fallback or rebuild
from an older base. Work remains in `/Users/bao/taskbar-hero-turn3d` on the original
`ai/codex-turn3d-2026-11-05` branch. Original commits and drafts were retained.
Remote main remains `340f88b`; the main checkout's pre-existing local HEAD `6144d42`
was not checked out, reset or stashed. Ledger edits name only this report and optional steps.

| Draft layer | PR | Changed text lines |
|---|---|---:|
| Turn core, skills, design and properties | [#292](https://github.com/ntbaoheyhey/taskbar-hero/pull/292) | 1360 |
| Effect recipes and event-only presenter | [#293](https://github.com/ntbaoheyhey/taskbar-hero/pull/293) | 237 |
| Three.js scene and lifecycle | [#294](https://github.com/ntbaoheyhey/taskbar-hero/pull/294) | 363 |
| Original models, pipeline and provenance | [#295](https://github.com/ntbaoheyhey/taskbar-hero/pull/295) | 1370 |
| Turn UI and self-review fixes | [#296](https://github.com/ntbaoheyhey/taskbar-hero/pull/296) | 380 |
| Proof tools, balance and raw test archive | [#297](https://github.com/ntbaoheyhey/taskbar-hero/pull/297) | 1415 |
| Measured performance, frames and video | [#298](https://github.com/ntbaoheyhey/taskbar-hero/pull/298) | 1170 |
| Self-contained demo and file checks | [#299](https://github.com/ntbaoheyhey/taskbar-hero/pull/299) | 624 |

All are stacked drafts. No merge or auto-merge; both Vercel roots disable these branch
refs, and the Supabase deployment workflow is main-only. No deployment command issued.

## Gates: what works and what does not

| Gate | Status | Evidence / limitation |
|---|---|---|
| P0 baseline / P1 committed design | Met | 421 baseline E2E; all baseline typecheck/lint/unit/build pass; no base-fix needed |
| T1 strictly sequential turns | Met | Pure TS initiative, legal choices, next-eight preview, committed intents, deterministic replay; controller drains one event plan at a time |
| T2 content conversion | Met | Three basics, nine activated abilities, three passives, all enemy roles and three boss moves; real-number descriptions and turn costs |
| T2 satisfying balance / human pacing | **Not met** | All campaign conditions 30/30 wins; 6–8 minute human playtime not established |
| T3 five-beat action coverage | Met structurally | 35 recipes × 5 frames, exact repeated hashes; x1 live review video; no audio beyond authored slots |
| T3 beautiful/memorable acceptance | **Subjective / open** | Self-score 7.8 effects, 7.9 art/judge; some reused melee arcs and dense multi-hit text |
| T4 real 3D scene / fallback | Met locally | Event snapshots only, fixed camera, original props, context loss/missing-WebGL DOM fallback, reduced motion |
| T5 original assets / animations | Met | 12 GLBs, 120 clips, 48 turnaround frames, reproducible hashes and manifest; no imported art |
| T5 clearly better than pixel | **Self-preference only** | I prefer the new silhouettes/gear; actual matched-action captures provided; 2D remains the default without extra opt-in |
| T6 readable turn UI | Met locally | Order, intents, legal targets, AoE preview, status/charge cards, per-cat Auto, keyboard and skip/fast/speed controls |
| Performance / memory budgets | Partly met | Metal passes on this M3 Pro; software renderer fails p95. GPU memory/overdraw are not hardware-counter measurements |
| Isolation | Met with disclosed size delta | Default off; no Three/GLB startup requests; zero turn storage writes/server mutations; +1,565 gzip startup bytes |
| Offline demo | Met after file check | Actual campaign, all 35 recipes, 12 models/10 clips; 1024/1280/1440; no external requests/storage writes |
| T7 extra Training Yard | Deferred | Both compositions work; no new full behavior-selectable training page claimed |

## Validation counts and real output

| Check | Base | Final |
|---|---:|---:|
| Rules | 546 pass | **578 pass** |
| Rules inherited expected failures / skips | 2 / 11 | 2 / 11 |
| Web | 1509 pass / 136 files | **1556 pass / 140 files** |
| Backend mocks | 581 | 581 |
| Auth / chain / API contract | 24 / 32 / 16 | 24 / 32 / 16 |
| Root script checks | 11 pass | Baseline receipt; no root script logic changed |
| Full inherited Playwright | 421 / 3.7 min | **421 / 4.5 min** |
| Final focused UI/presenter/fixtures | — | **47 pass / 4 files**, included in web count |
| Typecheck / existing lint / production Vite build | Pass | Pass |

The final full workspace run had 1552 web tests; four subsequent regression tests and
renderer corrections were followed by a complete 1556-test web run and the final
47-test targeted run. The full inherited E2E was not relabeled as a new turn-specific
suite. New browser checks are recorded separately in `ui-proof.json` and `demo-check.json`.
Known resize-burst flakiness did not reproduce. No contract code changed; chain counts
above are the chain package tests, not a newly run on-chain deployment or hardware test.

Raw stdout/stderr is delivered in `raw/test-logs.tar.gz` with 27 named log hashes in
`raw/test-logs-index.json`. Baseline/intermediate trials remain archived, including the
rejected harsh balance trial and the mismatched-config bundle comparison. Browser
screenshots/video and JSON receipts show running behavior, not just asset existence.

## Performance: actual new production renderer

15-second ultimate with six enemies, ordinary browser RAF cadence, DPR 1. Full Chromium
Metal reports `ANGLE (Apple, ANGLE Metal Renderer: Apple M3 Pro, Unspecified Version)`.
SwiftShader is a separate software run. Machine: M3 Pro arm64, 36 GiB RAM, Node 24.22.2.
These are not GPU timestamps or proof about a midrange Windows laptop.

| Backend | Viewport | p50 / p95 / max | Renderer TaskDuration | End JS heap |
|---|---|---|---:|---:|
| M3 Pro / Metal | 1280x720 | 16.7 / 16.7 / 16.8 ms | 6.703% | 19.73 MiB |
| M3 Pro / Metal | 1440x900 | 16.7 / 16.7 / 16.8 ms | 6.542% | 16.58 MiB |
| SwiftShader | 1280x720 | 33.3 / 33.4 / 83.4 ms | 99.922% | 20.46 MiB |
| SwiftShader | 1440x900 | 33.3 / 33.4 / 50.1 ms | 99.945% | 20.63 MiB |

Peak instrumented workload: **206 calls / 34,852 triangles**; budgets <220 / <100k.
Estimated geometry+glow asset bytes **1,323,623**; approximate sampled framebuffers
9,144,320 bytes at 1280×720 and 17,905,200 at 1440×900. Driver memory is excluded.
The stage uses one procedural 64px radial glow texture; renderer instrumentation
counts five texture objects including internal resources. Particles use a bounded
96-instance pool. Intended translucent layering is bounded, but no per-pixel alpha
counter was read. No real bloom pass is claimed.

Paused renderer task: **0.701% / 0.642%** Metal at the two sizes (<2% budget).
Waiting for a player's decision still animates breathing/ears: **4.752% / 4.737%**.
This is renderer TaskDuration, not whole-machine power, idle battery life or CPU watts.
Local 3D entry resource: **689,962 bytes**, fetch duration **21.7 / 20.7 ms** on localhost;
this is neither internet download time nor parse-to-first-frame latency.

Ten-minute production soak: **617.292 s**, 11 explicit-GC samples,
**1,757,312 bytes / 1.68 MiB** retained-heap range after warm-up,
zero browser errors. First-to-last retained heap +1,670,112 bytes includes
warm-up/model caches; no monotonic leak trend observed. It does not prove indefinite stability.
Hidden lifecycle proof synthetically overrides `document.hidden` and dispatches the
actual visibility handler: zero new frames/turns. It is not an OS background-tab test.

## Isolation and bundle comparison

Identical guest-v2 Vite settings: flag-off initial JS **2,328,306 → 2,333,556 raw bytes**;
**377,725 → 379,290 gzip bytes**. Delta: **5,250 raw / 1,565 gzip** for shared config/entry
dispatch. Three/GLTF implementation and models are absent from the initial graph and
no squad assets are requested. The before/after flag-off screenshots are exactly
SHA256-identical (`9c09c28bb2a5642154aa0c2cd6d9b2cb96f3b6f9fbad1a7d7aa92986dca5a5a5`).
This one captured screen and the inherited E2E suite do not prove every possible state;
do not call the bundles byte-identical.

An earlier comparison mixed VITE_GAME_V2 settings and loaded the legacy Phaser entry;
its raw receipt is retained but excluded. The same-settings measurements resolve that
false alarm. Flag-on runtime recorded zero local/session/IndexedDB writes and zero
non-GET server requests; the ordinary application shell requests existing Google fonts.
The offline document embeds all resources, uses system fonts and a no-network CSP.

No economy numbers, forge/market/chain logic, save adapters, server grants, migrations
or secrets changed. Six pure-turn imports were added to generated Deno import maps
because config.ts re-exports the turn config; no Supabase handler changed or deployed.
The original 2D runtime remains available. Both squad and 3D choices require explicit
local guest opt-in; default `squadCombat: false` remains.

## Balance: exact 360-run simulation

Seeds 1–30 for every encounter × two compositions × Auto/active-priority condition.
Turns include all actor slots. Deaths are fallen party members; first deaths list runs
whose first fallen cat was Soot (no first Mochi/Clover deaths in these conditions).
`boss wins/reached` is not applicable to patrol (shown as 0/0). Complete action histories
and failed tuning trials are preserved in `raw/*.json.gz` with hashes.

| Encounter | Composition | Policy | Wins | Mean turns | Total deaths | First death | Boss wins/reached |
|---|---|---|---|---:|---:|---|---|
| patrol | hearthkeepers | auto | 30/30 | 65.93 | 0 | 0 Soot | 0/0 |
| patrol | hearthkeepers | active | 30/30 | 56.7 | 0 | 0 Soot | 0/0 |
| patrol | lanternbreakers | auto | 30/30 | 53.8 | 0 | 0 Soot | 0/0 |
| patrol | lanternbreakers | active | 30/30 | 47.43 | 0 | 0 Soot | 0/0 |
| boss | hearthkeepers | auto | 27/30 | 108.77 | 14 | 6 Soot | 27/30 |
| boss | hearthkeepers | active | 24/30 | 105.3 | 20 | 7 Soot | 24/30 |
| boss | lanternbreakers | auto | 30/30 | 69.07 | 0 | 0 Soot | 30/30 |
| boss | lanternbreakers | active | 30/30 | 71 | 0 | 0 Soot | 30/30 |
| campaign | hearthkeepers | auto | 30/30 | 160.47 | 0 | 0 Soot | 30/30 |
| campaign | hearthkeepers | active | 30/30 | 153.93 | 2 | 1 Soot | 30/30 |
| campaign | lanternbreakers | auto | 30/30 | 132.47 | 3 | 3 Soot | 30/30 |
| campaign | lanternbreakers | active | 30/30 | 122.5 | 1 | 1 Soot | 30/30 |

Auto wins most runs, but campaign is too easy. Active-priority reduces campaign turn
counts yet performs worse for standalone Hearthkeepers boss. No claim of universally
stronger tactics. Source tuning lives in turn/config.ts and policy.ts, re-exported from
config.ts; original economy and real-time numbers are unchanged. Exact decisions are
in `DECISIONS.md` and the committed three-page design note.

The separate active self-play took 173 slots, zero fallen cats, 92.53 seconds at ×4
after three manual choices. Offline Auto completion is recorded separately in
`demo-check.json`. Neither is a human ×1 timing study.

## Four fresh-eyes passes, all self-grades

Each pass began in the running build in a fresh browser, without needing the combat
log. Separate source reread covered initiative, targets, engine, presenter, controller
and scene. No other agent graded this work.

| Lens | Before → after / 10 | Evidence / fixes |
|---|---:|---|
| First-time player | 7.2 → 8.1 | six-role labels no longer overlap; first actor, skill choices and committed targets visible; `fresh-pass-1*`, `regrade-opening.png` |
| Skeptical three-minute judge | 7.5 → 7.9 | readable gear/faces and cohesive table; actual same-action 2D/3D comparisons, not equal panel sizes |
| Active player | 7.7 → 8.0 | canceled charge, row Snare, healing choice and completed campaign; `active-review.json` |
| Effects director | 7.1 → 7.8 | 175 five-beat captures plus x1 video; shield/flame/flask/petal geometry, corrected heal/KO reaction and multihit totals |

Mean **7.375 → 7.95/10**. These are self-scores, not independent acceptance. Weakest
remaining effects: similar Rally/Hearthwall, generic shared small melee arcs, Storm's
brief white core over back-row faces, dense Nine-Lives numbers, boss Sweep contact.
Status/passive/KO/wave/win plans are intentionally quieter. 175/175 exact repeated frame
hashes validate deterministic captures; still frames do not prove enjoyment.

## Assets, tools and earlier helper contributions

[Machine-readable manifest](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-turn3d-2026-11-05/docs/turn3d/ASSET-MANIFEST.json)
and `assets/provenance/turn3d.md` record tool/source/parameters/date/author/license/hash
for every model and the stage/VFX. Twelve GLBs total **2,073,028 raw / 539,750 gzip bytes**
(<6 MB target); ten named clips each. Cats ≤6k, small enemies ≤3k, elite ≤8k, boss ≤20k
triangles, all verified. 48 turnarounds show front/three-quarter/side/back. Models use
matte vertex colors, so no shared texture atlas is needed.

Original geometry/scripts only; no reference-game inputs, downloaded models/textures,
tracing or image-model calls. All original art is marked CC0-1.0. Procedural stage,
64px glow and shield/flame/flask/petal paths are in scene.ts. Libraries: three 0.180.0,
React/React DOM 19.3.1 (MIT); build Vite 8.3.5, @types/three 0.180.0, TypeScript 5.9.3
(MIT for Vite/types, Apache-2.0 for TypeScript). Existing Phaser is used only for the old
comparison path. Blender was unavailable; glTF Transform 4.5.1 was detected but the
production pipeline uses GLTFExporter/GLTFLoader directly. Command: `pnpm art:turn3d`.

No installed SKILL.md workflow was invoked for this task. Tools used: local Node/Python,
pnpm/TypeScript/Vitest/Playwright, Three.js GLTF pipeline, screenshot/video capture and
ffmpeg encoding; Git and the GitHub connector for draft delivery. No extra model
requests, helper agents, parallel codex exec or scheduler after the user's prohibition.

Earlier permitted helper work, all stopped at **16:33:40 Asia/Ho_Chi_Minh**:

| Extra agent | Preserved work before stop | Not delivered by that helper |
|---|---|---|
| Turn-core helper | Initial config.ts, engine.ts, initiative.ts, targeting.ts, config re-export and CORE-NOTES.md | Policy, tests, balance and final review |
| Model helper | geometry.mjs, cast.mjs, twelve original procedural definitions | GLBs, animation/export, manifest, captures, validation |
| Effects first attempt and retry | Read-only investigation; first attempt hit gateway failure | No source files |

`HELPER-STOP.json` has exact PIDs, stop time and source hashes. The primary session
preserved those partial contributions, completed all remaining work in order, and
performed all integration/testing/grades. Ordinary local test/browser/build processes
are not model-request agents. No prior work was restarted or discarded.

## Known omissions and risks

No independent human playtest, real audio, free camera, GPU compatibility matrix,
measured alpha-overdraw counter or proven human pacing. Training Yard refinement was
cut. No incomplete feature is exposed as finished, and no WIP runtime was included.
Original 3D art adds no Avalanche integration by itself. Asset weight and WebGL support
remain practical risks, mitigated by lazy loading, explicit opt-in and a playable DOM
fallback. No feature is enabled in production and no owner action is required.

Optional next steps are in `reports/OPTIONAL-USER-STEPS.md`: open the local artifact,
try both squads, and later commission human playtests/broader GPU measurements if desired.

## Final delivery check

Finished within the six-hour wall-clock limit (started 16:17; delivered around 20:00
Asia/Ho_Chi_Minh). Candidate branch is clean and pushed; only named report/optional
step files were added to the ledger. Remote main was rechecked at `340f88b`. No
additional model-request agents remain from this task. Local preview servers can be
left running for review; no scheduler or remote deployment was started.
