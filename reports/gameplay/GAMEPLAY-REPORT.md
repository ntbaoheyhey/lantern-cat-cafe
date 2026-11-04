# Gameplay candidate report — Cat Café Quest
2026-11-04 · Candidate build, not live. One agent. Not merged, not deployed.

The candidate makes a fresh guest's first real reward arrive sooner, gives the player a visible next action, redraws Mochi/household enemies/items with original pixels, and clarifies automatic boss telegraphs and equipment trade-offs. It does not retune the server economy or add interactive combat rules. Sustained loot pacing and the visual9+ target remain open.

Open `/Users/bao/taskbar-hero-gameplay/docs/gameplay/index.html` offline with its `img/` folder. There are 12 matched before/after views at 1280×720 and 1920×1080, the eight ordinary views also captured at 1440×900, a ten-minute timeline, four looping sprite previews, six-frame Mochi attack and eight-frame boss/forge strips, a rarity ladder, boss explainer, numeric decisions and per-file provenance. No CDN or network is required by the gallery.

## Review state
Base is visual draft #278, `f8837d6`, branch `ai/codex-visual-2026-11-04`. Candidate branch `ai/codex-gameplay-2026-11-04`. Final runtime `ed87703` preserves the measured `501880e` behavior: all 1,006 compared source/art/test files match after normalizing only the client-helper relocation and import paths (`runtime-equivalence.json`). The relocation keeps the unchanged Deno map generator from including browser-only helpers; no Supabase file changed. Initial published runtime `be4abe9` was byte-identical before that import-map correction. Documentation commits follow the runtime; `delivery.json` records its exact SHA. Draft review stack: [#279](https://github.com/ntbaoheyhey/taskbar-hero/pull/279) guest guidance/claims → [#280](https://github.com/ntbaoheyhey/taskbar-hero/pull/280) original art → [#281](https://github.com/ntbaoheyhey/taskbar-hero/pull/281) item UI/juice → [#282](https://github.com/ntbaoheyhey/taskbar-hero/pull/282) offline demo/proof. Merge order is #275 → #276 → #277 → #278 → #279 → #280 → #281 → #282. Never merge the integration/tip branch directly.

Candidate/ledger branches explicitly disable Vercel Git deployment at both repository and web roots, in addition to the inherited non-main ignore command. No checkout/reset/stash in either unrelated dirty checkout. No changes to contracts, Supabase, DB, protected PRs #244/#252/#257, deployment, wallet signing or funds. Browser fixtures block non-loopback requests and use no real transactions. Server/economy unit and browser tests use local mock services only. All existing Sample rune/skill/pet/companion switches remain default-OFF; no speculative boss-rule fork is shipped.

## Before / after measurements
Two complete normal-clock fresh-guest runs, Math.random seed 1404 and mock-economy seed 1. `before-corrected-run.json` is the baseline; the older `before-run.json` is exploratory with a boss-gate harness bug and is retained, not used for the final comparison.

| Metric | #278 | Candidate |
|---|---:|---:|
| First acknowledged reward / gear drop | 29.542s | 10.042s |
| First available upgrade | 30.196s | 10.146s |
| Scripted first Bag inspection | 46.385s | 46.404s |
| Scripted first equip | 121.298s | 121.419s |
| First boss attempt | 300.820s | 301.095s |
| First boss result / replay duration | Loss / 9.0s | Loss / 9.0s |
| Boss HP remaining after first attempt | 3395 / 3605 | 3395 / 3605 |
| Cat ordinary / critical hit in first boss | 22 / 34 | 22 / 34 |
| Boss ordinary / heavy hit | 25 / 62 | 25 / 62 |
| Accepted claims | 19 | 20 |
| Gear drops | 1 Common | 3 Common |
| Drops per minute | 0.10 | 0.30 |
| Chapter progress kills | 60 | 60 |
| Fish / Yarn / XP earned | 417 / 19 / 1502 | 417 / 18 / 1576 |
| Acknowledged reward gaps >8s | 20 | 21 |
| Longest acknowledged gap | 30.038s | 30.010s |

The first reward improves; the boss time and first-fight outcome do not. Both attempts lose after 9s and retain the key. Extra gear provided slightly more HP but did not cross a survival breakpoint. Only chapter 1 was reached in these real sessions; later-chapter TTK and stat usefulness are not empirically established. Inspection/equip are scripted actions, not human decision-time or retention measurements. The chapter counter stops at its gate and is not total farming kills. Reward gaps are not visually empty time, because combat preview continues, but this is not proof of a meaningful reaction every 8s. The first craft remains unaffordable at 90s in both runs. A single seed cannot establish a loot distribution, wow time or fun score. Accepted-claim boundaries affect random draws; more drops in this run are not a claimed multiplier. Full methodology and event samples are in `timeline-metrics.json` and `tools/gameplay-run.mjs`.

## Strict visual review
Nine axes: focal point / harmony / readability / depth-light / character appeal / motion-feedback / consistency / next-action clarity / item readability. The first seven preserve the prior rubric; both sides are rescored with the two new axes. Overall **8.0 → 8.7** on this rubric (not a direct comparison to the older seven-axis 8.3). Single-author judgment, not independent player research.

| View | Before axes | After axes | Mean |
|---|---|---|---|
| Home | 9 / 9 / 9 / 9 / 8 / 8 / 9 / 6 / 7 | 9 / 9 / 9 / 9 / 9 / 8 / 9 / 9 / 8 | 8.2 → 8.8 |
| Inventory | 8 / 8 / 9 / 8 / 8 / 8 / 8 / 7 / 7 | 8 / 9 / 9 / 8 / 9 / 8 / 9 / 9 / 9 | 7.9 → 8.7 |
| Boss | 9 / 9 / 9 / 9 / 8 / 8 / 8 / 6 / 6 | 9 / 9 / 9 / 9 / 8 / 9 / 9 / 9 / 8 | 8.0 → 8.8 |
| Forge | 9 / 9 / 9 / 8 / 8 / 8 / 8 / 7 / 7 | 9 / 9 / 9 / 8 / 8 / 8 / 9 / 9 / 9 | 8.1 → 8.7 |
| Market | 8 / 8 / 9 / 8 / 7 / 8 / 8 / 7 / 7 | 8 / 9 / 9 / 8 / 8 / 8 / 9 / 8 / 9 | 7.8 → 8.4 |
| Gear detail / V2 upgrade | 8 / 8 / 9 / 8 / 8 / 8 / 8 / 6 / 7 | 8 / 9 / 9 / 8 / 9 / 8 / 9 / 9 / 9 | 7.8 → 8.7 |
| Relic detail | 8 / 8 / 9 / 8 / 8 / 8 / 8 / 7 / 7 | 9 / 9 / 9 / 8 / 9 / 8 / 9 / 8 / 9 | 7.9 → 8.7 |
| Forge reveal | 9 / 9 / 9 / 8 / 8 / 8 / 8 / 7 / 7 | 9 / 9 / 9 / 8 / 8 / 9 / 9 / 9 / 9 | 8.1 → 8.8 |

Home/boss/Forge reveal are 8.8, below 9. Market is 8.4, below 8.5: its sparse authentic table remains more administrative than collectible. These targets are not claimed achieved. Classic Upgrade is unchanged and excluded; V2 upgrade means craft/equip, represented by selected gear detail. Before/after screenshots are unedited browser captures, not promotional composites.

## What shipped and why
- R1/R2: optional three-step contextual coach, permanent dismissal, direct first class choice, exact Now/Soon/Later goals, true boss/key/cooldown gating. Manual Help and later class-change confirmation remain. Demo skip-coach entry is read-only and does not reset a save.
- R1/R7: one 10s first-class claim followed by the normal 30s schedule. Grants still come from the authoritative API/reducer. Duplicate/early calls cannot credit overlapping elapsed time. No direct client grants or new drop table.
- R5/R6/R9: original layered Mochi with eight idle frames, six-frame attack, hurt/victory/nap/equip poses and existing equipment anchors. Twenty-five household creatures use original silhouettes, 4-frame idle and telegraphs; ten boss portraits provide two expressions as review assets. Current Map portrait uses the redrawn idle sprite. Runtime boss animation and facing remain connected to replay.
- R3/R4/R8: forty 32px item silhouettes, rarity text+shape+frame, up to three primary stats, whole-cat ATK/interval and HP/DEF comparison, honest recommendation explanation, unseen-item markers. Existing filters/sort/lock/equip/salvage protections retained. Four original Cat Relics preserve metadata/token URLs and explicitly say they have no combat-stat bonus.
- R5/R7/R10: named quick/heavy/recovery cues and distinct floor markers; replay-derived perfect/close-call/retry labels. Shared bounds for particles, labels, projectiles and tweens; 60ms cosmetic crit pause, 2px shake ceiling, 70ms flash, 650ms chip trail. Great bonus roll means normalized mean ≥80% of the existing bonus ranges, never a new rarity or success outcome. Reduced/hidden states remain calm/paused. No audio.

Exact numeric before/after table: `docs/decisions/gameplay-2026-11-04.md`. All newly introduced timing/threshold/cap settings are in `packages/game-rules/src/config.ts`. Existing backend economy and deterministic event times are unchanged. Unused proposed combo/defeat tunables were removed; they are not half-wired features.

## Fresh-eyes corrections
1. Forge after a result at 720px clipped the last rarity row and insufficient-material guidance. Reduced card padding and removed the duplicate recipe summary only in the short result layout; action and explanation are now visible.
2. Forge selected icon used the older small slot glyph while Bag showed the new art. Both now use the same original ItemIcon silhouettes.
3. A completed chapter without a key/cooldown could say zero foes left. It now routes to real key/retry guidance with a tested gate.
4. Boss help copy described internal verification. It now explains automatic combat, gear-based dodge and the visible floor cue in player language.
5. The selected accessory's raw stats did not explain the whole-cat trade-off. Added offence/survival derivation through the actual capped stat engine, with unchanged detailed bonus comparison below.

Remaining cold-review issues: long Bag detail still scrolls at 720px; Market remains sparse; much of post-first-reward time is passive; a ten-second clip does not independently prove fun. The report does not replace user playtesting.

## Art provenance and payload
`reports/gameplay/asset-provenance.md` extends the visual provenance, with every new/changed path, script, exact parameters, seed/date and hash manifests under `tools/art/`. No external art, tracing, copied palette, reference-game imagery or image generator. Original integer-coordinate recipes, seed 0, Evening Atelier 32-colour palette. Generated Relic SVGs and PNGs contain the same 64px artwork; metadata is unchanged. `pnpm art:check` validates exact bytes, palettes, dimensions and frame clipping. General catalog refreshed without losing inherited provenance.

Application payload: **+26,174 bytes gzip JS** versus #278 (705,592 versus 679,418 total bytes across 18 JS chunks in production mode), below the +120 KB budget. The final production entry chunk is 167,710 versus 130,893 bytes gzip. The earlier optimized `g1-perf` soak build included existing test instrumentation and totaled 705,703 bytes; rebuilding that mode after the module relocation totals 705,732 bytes (+29 bytes). All 264 new/changed public image files, including replacement Relic SVGs, total **243,695 bytes**, below 1.5 MB; this deliberately counts full replacements rather than only their byte delta. Gallery captures are documentation only. Generated TypeScript is counted in the JS build, not image bytes. Details: `performance.json`.

## Validation
- Full browser suite: **399/399 passed**, no skips. Final compact Forge rerun: **5/5 passed** after CSS correction. Initial stale icon/HUD/onboarding assertions were updated to verify current behaviour, retaining keyboard, save-error, CSP and geometry requirements.
- Root `pnpm test` passes: web **1,482/1,482** in 132 files; game-rules 437 passes plus 2 expected failures and 11 pre-existing skips; local backend mocks 581; chain 32; auth 24; API contract 16. No new skipped tests; the inherited 11 game-rule skips and 2 expected failures are unchanged. Full typecheck and lint pass. `pnpm art:check` and **44/44** art pipeline/catalog tests pass. Receipts: `logs/unit-verified.log`, `logs/typecheck-delivery.log`, `logs/lint-delivery.log`, `logs/art-delivery.log`, `logs/art-tests-verified.log`. Initial failures are retained: the craft picker selector still expected an SVG, and the catalog still described old 16px Relic SVGs. Both were corrected to validate the actual icon path and native 64px artwork; no checks were removed.
- Axe+keyboard: **24/24 views**, zero WCAG A/AA violations, zero offscreen focus samples, zero page errors/writes, zero running hidden CSS animations. Reduced-motion samples are static. This is automated plus keyboard sampling, not full assistive-technology certification.
- Separate review layers: G1 workspace typecheck, 46 focused web units and 6 rule/economy tests pass; its full E2E run passed 394 cases, then all 5 failures were corrected and covered by 4 item/journey plus 5 Forge reruns. Four failures came from moving later item-copy assertions too early; compact Forge CSS moved into G1. Art-layer typecheck, all generators, 44 catalog tests and 2 exact class/landing pixel comparisons pass. UI/juice-layer workspace typecheck and 35 focused web tests pass. No assertion was skipped; final integrated behavior matches the original 399/399 full pass after normalizing only the later module relocation. Initial split failures are preserved in `logs/layer1-e2e.log.gz`.
- CI publication fix: initial GitHub jobs found generated Deno import-map drift because the generator scans every non-test module beneath `packages/game-rules/src`, even unexported modules. Read-only presentation helpers now live in `packages/game-rules/client/gameplay.ts`; neither generator nor Supabase maps changed. `pnpm gen:deno` leaves maps clean, workspace typecheck, 6 rule/economy tests and 10 focused web tests pass again, and both production/g1-perf builds pass. Original diagnostic retained in `logs/ci-import-map-failure.log`. GitHub checks are rerunning on the corrected draft heads.
- Economy: 36 class/seed cohorts through the actual server guard/compute/apply functions; repeated/early requests and repeated presentation reads produce identical accepted grants for the same schedule, credit at most 3600s/hour, and preserve key/offline caps. This does not assert identical rolls to the old cadence or verify a deployed backend.
- Offline gallery: **3/3 desktop sizes** pass with both image sizes, keyboard slider, side-by-side, pause/reduced/hidden behavior, 39 decoded image elements, no network requests, broken links, page errors, horizontal overflow or axe A/AA findings (`gallery-check.json`).
- Effects: `tools/effects-test.mjs` passes all 4 normal/reduced-motion cases at 1280×720 and 1600×900: 60.00 FPS, p95 ≤16.8ms, CLS 0, no page errors or writes. Source fixture build uses final application code; original wrong-cwd build failure is retained. Receipts: `effects/fps.json`, `logs/effects.log`.
- Five-minute optimized `g1-perf` build soak at 1280×720 (existing test instrumentation, no HMR): **59.95–60.00 FPS**, p95 16.7ms; renderer main-thread task time **3.46–4.38%**, hidden 2.10%, reduced motion 1.05%. Retained heap at 60s is 17.07 MB and at 300s 16.99 MB (peak 17.52 MB); one document throughout. Hidden/reduced CSS animations: 0; page errors and writes: 0. CPU means Chromium renderer TaskDuration, not OS power; hidden checks dispatch visibilitychange. Receipts: `performance.json`, `logs/performance.log`.

## Local reproduction
```sh
cd /Users/bao/taskbar-hero-gameplay
pnpm demo
# With coach, fresh profile: http://127.0.0.1:5391/?demo#home
# Skip coach: http://127.0.0.1:5391/?demo&coach=off#home
pnpm test
pnpm typecheck
pnpm lint
pnpm art:check
pnpm --filter @taskbar-hero/web exec playwright test --workers=2
node tools/gameplay-shots.mjs after http://127.0.0.1:5391
node tools/gameplay-special.mjs after http://127.0.0.1:5391
node tools/gameplay-frames.mjs http://127.0.0.1:5391
node tools/gameplay-audit.mjs http://127.0.0.1:5391
node tools/gameplay-gallery.mjs
node tools/gameplay-gallery-check.mjs
```

Existing screenshot font files are fetched only from known URLs and verified by SHA-256 equally for both versions. The offline gallery uses system fonts and requests no network resources. `AXE_PATH` points to the already-installed local axe 4.10.3 script; no hidden dependency install. Performance uses local production preview, not Vite HMR, and should run without other browser tests. Kill only the task-owned preview PIDs; never broad-pkill.

## Skills, limits and next work
Used **Sites** (`/Users/bao/.codex/plugins/cache/openai-curated-remote/sites/1.1.3/skills/sites/SKILL.md`) for local-only UI/preview validation. No other skills, image generation, subagents, workers, schedulers or external deployment.

Backlog: meaningful micro-events without reward inflation; multi-seed and human first-session/retention studies; two viable complete builds demonstrated with real unlocked gear; distinct per-chapter interactive mechanics requiring replay/server agreement; loot arcs/300ms defeat sequence beyond inherited effects; richer portrait expression wiring; bespoke time-of-day controls; original muted audio; OS power and broader hardware testing. No new default-on economy or partial mechanic is shipped to imply these are complete.

Needs the user: review the offline candidate's art and feel; decide whether the remaining pacing/9+ gaps warrant another pass. Deployment capacity and later ordered merge/release approval remain separate existing release steps. Top risks are 1) long passive reward gaps, 2) single-seed/subjective quality evidence, 3) any later release must recheck the full unmerged stack against its actual base.
