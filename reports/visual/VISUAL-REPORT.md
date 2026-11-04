# Visual upgrade — Evening Atelier
2026-11-04 · Candidate build, not live. One agent, no delegation. Not merged, not deployed.

The approved left rail and top HUD now frame a warmer, more legible Cat Café Quest: five original chapter rooms, motivated window/lamp lighting, an expressive Mochi portrait, a physical forge hearth, stronger collectible staging, and bounded combat/reward feedback. Game rules, economy values, contracts and backend code are unchanged.

Open **`/Users/bao/taskbar-hero-visual/docs/visual/index.html`** by double-clicking; keep `img/` beside it. It contains nine before/after comparisons (eight upgraded V2 views plus unchanged classic Upgrade), three desktop sizes, a palette and rarity ladder, five chapter keys, three actual captured animation loops, and provenance. No server, CDN, font download, library or network connection is needed for the gallery.

## Candidate and review stack
- Base: `ai/codex-stack-tip` at `1eefc3e`; #270 `932b6f7` cherry-picked as `05ecd89`, as explicitly requested. Its docs are inherited context, not new product behavior.
- Runtime implementation: `0067d5c`; final art catalog and accessible Market fixture checkpoint: `fb59d8a`. Gallery SHA refers to this checkpoint; subsequent commits contain proof/documentation only.
- Final branch: `ai/codex-visual-2026-11-04`. Draft review order: [#275](https://github.com/ntbaoheyhey/taskbar-hero/pull/275) → [#276](https://github.com/ntbaoheyhey/taskbar-hero/pull/276) → [#277](https://github.com/ntbaoheyhey/taskbar-hero/pull/277) → [#278](https://github.com/ntbaoheyhey/taskbar-hero/pull/278). Four layers keep every diff below 1,500 changed text lines; the last contains proof/docs only.
- Main checkout `/Users/bao/taskbar-hero` was never checked out, reset or stashed. #244, #252 and #257 were not changed. No deploy, database write, signing, wallet transaction or real funds. Local fixture callbacks only.

## Before / after scores
Single-author judgment of stills at 1280×720, 1440×900 and 1920×1080 plus motion, not independent player research. Axis order: focal point / harmony / readability / depth-light / character appeal / motion-feedback / consistency. Overall mean **5.7 → 8.3** across the eight upgraded views.

| View | Before axes | After axes | Mean |
|---|---|---|---|
| Home / living room | 5 / 6 / 8 / 3 / 6 / 5 / 6 | 9 / 9 / 9 / 9 / 8 / 8 / 9 | 5.6 → 8.7 |
| Inventory | 5 / 6 / 8 / 4 / 5 / 5 / 6 | 8 / 8 / 9 / 8 / 8 / 8 / 8 | 5.6 → 8.1 |
| Boss fight | 6 / 6 / 8 / 4 / 6 / 6 / 6 | 9 / 9 / 9 / 9 / 8 / 8 / 8 | 6.0 → 8.6 |
| Forge | 5 / 6 / 8 / 4 / 4 / 5 / 6 | 9 / 9 / 9 / 8 / 8 / 8 / 8 | 5.4 → 8.4 |
| Market | 5 / 6 / 8 / 4 / 5 / 5 / 6 | 8 / 8 / 9 / 8 / 7 / 8 / 8 | 5.6 → 8.0 |
| Gear detail / v2 upgrade path | 5 / 6 / 8 / 4 / 5 / 5 / 6 | 8 / 8 / 9 / 8 / 8 / 8 / 8 | 5.6 → 8.1 |
| Relic detail | 6 / 6 / 8 / 4 / 6 / 5 / 6 | 8 / 8 / 9 / 8 / 8 / 8 / 8 | 5.9 → 8.1 |
| Forge reveal | 6 / 6 / 8 / 4 / 5 / 6 / 6 | 9 / 9 / 9 / 8 / 8 / 8 / 8 | 5.9 → 8.4 |

Every upgraded view averages at least 8.0. The aspirational 9+ means for Home, boss and Forge reveal are **not yet achieved** (8.7 / 8.6 / 8.4). Do not present these as independent approvals. Classic Upgrade belongs to the separate classic layout; its six supplemental PNGs are byte-identical before/after and it is excluded from the improvement mean. In V2, the upgrade path is craft/equip, shown as gear detail.

## Delivered scope and cold review
- **Scene:** original 256×96 chapter rooms, native-resolution alpha light/shade masks, quieter far layers, foreground plants/tea cup, sparse motes, lamp/steam and a tiny mouse cameo. Five moods: amber living room, teal kitchen, reflected-blue bath, wine basement, moonlit rooftops.
- **Character:** 48×48 original portrait with ten blink/breath/tail/ear/curled-nap frames. Existing gameplay actors retain their equipment/class identity and action poses; the shared idle gets a slower blink. Existing household bosses keep distinct silhouettes and chapter palettes; their art was not redrawn.
- **Surfaces:** dusk recess / beveled panel / lit art plinth, scoped palette, larger gear and Relic art, warm selected states, readable labeled rarity frames, bounded shimmer/sparks. Mythic is a gallery design sample only, not a new game tier.
- **Feedback:** 12 damage-label cap, 16 impact particles, bigger gold crits, presentation-only 60 ms crit pause, ≤2 rendered pixel shake, 70 ms hit flash, defeat poof, HP chip trail, acknowledged gain arcs, level ring, forge anticipation/reveal and rarity fanfare. Existing HUD counters remain in use; no invented rewards or replayed initial gains. No audio.
- **Cold-review fixes completed:** enlarged Bag art; showed the complete forge hearth; repaired Market art/name spacing; made the boss arena use integer scene scale with explicit title/HP; reduced secondary-button emphasis; improved rarity contrast and staged the crafted result with actual item art. A later audit repaired the local Market fixture's missing `panel-market` association.
- **Motion safety:** CSS pauses with visibility state; presentation clocks/cues stop or cancel when hidden. Reduced motion removes drift, shimmer, flash and shake while retaining readable results. Sample rune/skill/companion previews stay labeled Sample and default-OFF.

## Assets and exact provenance
All **19 new game PNGs total 14,513 bytes**. Original integer-coordinate drawing only; no copied/traced art, no image model, no tbhindex/REA art input and no new audio. Exact generator: `python3 -B tools/art/visual.py`, seed 0, 32-color `tools/art/visual-palette.json`. `pnpm art:check` rejects unexpected/missing files, palette/dimension/alpha drift and changed generated bytes. Tokens are generated as CSS and TypeScript from the same palette.

| Asset family | Count | Native size | Exact source |
|---|---:|---|---|
| room-1…5.png | 5 | 256×96 | tools/art/visual.py, room() |
| foreground-1…5.png | 5 | 256×96 | tools/art/visual.py, foreground() |
| light-1…5.png + shade.png | 6 | 256×96 | tools/art/visual.py, lightmap(); quantized alpha |
| mochi.png + mochi-idle.png | 2 | 48×48 / 480×48 | tools/art/visual.py, mochi(); ten frames |
| forge-hearth.png | 1 | 160×120 | tools/art/visual.py, forge() |

Full file/byte/SHA-256 table, exact authoring brief and literal script parameters: [asset provenance](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-visual-2026-11-04/reports/visual/asset-provenance.md). Existing art catalog updated through `tools/art/catalog.py`; inherited asset provenance remains intact. [Art bible](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-visual-2026-11-04/reports/visual/ART-BIBLE.md) and [research](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-visual-2026-11-04/reports/visual/RESEARCH.md).

The 57 evidence PNGs (48 V2 stills, 6 classic stills, 3 frame strips) total about 8.3 MiB and are **documentation only**, excluded from the game image payload budget. They are not copied into the web app. Exact hashes: [gallery manifest](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-visual-2026-11-04/reports/visual/gallery-manifest.json). Capture seed 1404; fixed date 2026-11-04 11:30 UTC; existing font URLs and hashes pinned equally on both sides. PNG capture is lossless; no beautification or edits to gameplay screenshots. Market/Relic captures use the existing labeled mock-wallet fixture, with no transaction.

## Validation and performance
| Check | Result / qualification |
|---|---|
| Workspace typecheck / lint | Pass; repository lint is its TypeScript check |
| Browser suite | **399/399** pass, no skips; same product code as final checkpoint |
| Post-fixture Market tests | **4/4** pass, including loading/error/extreme values, keyboard and callbacks |
| Web units | **1,471/1,471** pass on isolated rerun; first concurrent run had one 5-second timeout |
| Other units | scripts 11, auth 24, chain 32, game-rules 431, API contract 16, Supabase mocks 581 pass; inherited game-rules 11 skips and 2 expected failures unchanged |
| Art pipeline | **44/44** tests; `pnpm art:check` verifies 19 assets/32 colors; catalog drift check passes |
| Offline gallery | file:// at 1280/1440/1920; 24 images decode, all capture sizes load, keyboard slider, side-by-side, pause/reduced/hidden pass; 0 network requests, broken links, axe violations or page errors |
| Axe + keyboard | **24/24** views; 0 WCAG A/AA findings, 0 offscreen focus samples, 0 page errors/writes |
| Reduced / hidden motion | 0 running CSS animations in calm/hidden samples; original renderer lifecycle tests remain green |
| Effects script | 1280 and 1600 widths, normal/reduced: ≈60 fps, p95 ≤16.8 ms, **CLS 0** |
| Five-minute Home soak | 59.95–60.00 fps minute averages; p95 ≤16.8 ms |
| Renderer main-thread use | 4.24–6.85% over visible minute windows; hidden 2.48%; reduced 3.81% |
| Retained heap | Warm minute 1: 16,511,316 bytes; minute 5: 16,402,252; no upward retained-heap trend |
| JS gzip | 677,186 → 679,529 bytes, **+2,343 bytes**, limit +153,600 |
| New game images | **14,513 bytes**, limit 1,500,000 |

CPU values are Chromium CDP renderer TaskDuration proportions, not OS/package power. Hidden measurement dispatches synthetic visibility change; it verifies pause behavior, not real device battery life. FPS is from headless Chromium on this workstation, not a promise for every device. Performance was sampled without other active browser tests; a read-only art-catalog refresh ran near the end. Raw [performance](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-visual-2026-11-04/reports/visual/performance.json), [accessibility](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-visual-2026-11-04/reports/visual/accessibility.json), [animation frames](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-visual-2026-11-04/reports/visual/animation-frames.json), and test receipts in `reports/visual/logs/` (complete browser output is losslessly retained as `e2e-full.log.gz`).

Failures were fixed, not hidden: the initial browser pass exposed legacy theme-scope and new-motion assertions plus sizing/contrast issues; final 399 pass retains control, geometry and AA requirements. The catalog initially missed 19 new files; it was regenerated with exact original provenance and all 44 tests pass. The Market fixture's six ARIA findings are resolved. No new skip, timeout increase or broad assertion relaxation.

## How to reproduce
From the visual worktree (dependencies already installed):
```sh
VITE_GAME_V2=1 VITE_ALLOW_MOCK_AUTH=1 VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= \
  pnpm --filter @taskbar-hero/web exec vite --host 127.0.0.1 --port 5380 --strictPort
# Open http://127.0.0.1:5380/?demo#home
pnpm art:check
node tools/visual-shots.mjs after http://127.0.0.1:5380
node tools/visual-frames.mjs http://127.0.0.1:5380
node tools/visual-audit.mjs http://127.0.0.1:5380
node tools/visual-gallery.mjs
node tools/visual-gallery-check.mjs
```
No `pnpm demo` script exists on this branch. The live local demo starts from the game's normal onboarding/save; review fixtures populate deterministic states only in capture browser contexts. For the performance script, use a local production preview of `apps/web/dist-v2/e2e-5371` and retain the baseline build in `dist-visual-before`; run it alone. Axe path may be set via `AXE_PATH`; the tool does not silently download a new dependency. Existing screenshot fonts are fetched by exact known SHA-256 before capture. The delivered gallery itself stays fully offline.

## Open work and merge recommendation
1. Reach independently validated 9+ first-impression quality: unify the gameplay cat with its portrait, redraw household bosses in the locked palette, and test preference with people.
2. Add a distinct great-success forge flourish, more bespoke chapter furniture motion and a fuller loot arc. Existing normal/rarity reveals are complete; no half-wired runtime feature is included.
3. Market remains relatively administrative, with sparse authentic listings. Avoid filling it with fictional live items. Classic Upgrade stays unchanged outside the approved V2 shell.
4. Existing runtime web-font loading remains unchanged; evidence pins it but the product has no new offline font guarantee.
5. Accessibility evidence is automated plus a keyboard sample, not a complete assistive-technology certification. A real hidden-tab/OS energy profile and broader hardware testing remain follow-up work.

Published draft stack: [#275](https://github.com/ntbaoheyhey/taskbar-hero/pull/275) → [#276](https://github.com/ntbaoheyhey/taskbar-hero/pull/276) → [#277](https://github.com/ntbaoheyhey/taskbar-hero/pull/277) → [#278](https://github.com/ntbaoheyhey/taskbar-hero/pull/278). Keep every PR **draft**. After the Vercel cap clears, first follow the existing integration/release runbook for stack dependencies; do not merge the integration stack branch itself. Review visual preference, then accept the visual foundation → scenes → UI/feedback/catalog → proof stack in order, retargeting and rerunning checks against the actual release head after any squash. Preview and production smoke/asset receipts are still required then. No deployment or merge was performed during this task.
