# Repair log

U0 in progress. No published Lane U milestone yet.

- U0-HARNESS / FIXED: `pnpm --dir apps/web exec vite --config ../../tools/ui-v3/vite.config.ts` failed to resolve a package-directory import. Removed unnecessary defineConfig import; explicit repository root and own dependency symlink. HTTP200 verified. No runtime change.

- U1-FOCUS / FIXED pending rerun: shell.spec Escape focus check failed because opening a sheet unmounts the dock button. Preserve its destination and restore focus to the remounted control. No gameplay effect. Exact spec + G1 rerun.
- U0-PUBLISH / FIXED: connector create returned ReadTimeout and immediate search returned empty (index lag). CLI create guard found existing draft #428; no duplicate created.

- U1-DEV / FIXED pending G1: Utility.test expected legacy reviewer grants without dev=1. User section1 now explicitly forbids this. Kept all grant assertions; supplied the required dev=1 in that reviewer fixture. No test disabled or quarantined. Player gating remains tested separately.
- U1-FOCUS verification: exact browser rerun2/2PASS (u1/shell-repair.log); initial failure retained.

- U2-HOME-PERF / OPEN: CPU4 headless development-page 3D trial (tools/ui-v3/perf.mjs 3d) draws77–82 (PASS90) but cold long tasks4357–5196ms and steady855–885ms (MISS50); navigation→visible756–849ms. Renderer initialization/steady software-WebGL cost dominates. Smallest approved fix: use a B-stage poster plus B portraits; final production/offline timing remains mandatory. No timing denominator changed; development timings are not compared as production acceptance.
- U2-POSTER / FIXED: stage-only render timed out at miniature preparation. Scene defaults preload generic actor rigs; the poster has no actors. Supplied public warmModelIds=[]; exact render completed (21 source-stage draws), cafe.webp 50KB. B source unchanged.
- U2-HOME-PERF / PARTIAL until offline: fallback reduces draws to0 and steady maximum long task to0 (60s). Cold maximum task118–139ms, navigation→visible720–793ms on dev modules. G1 PASS1867, browser6/6; G7 loaded entry−3B; protected231sources exact. Offline cold acceptance stays223.3ms and must be rerun in U8.
- U3-TYPES / FIXED pending G1: the shared crew list is readonly while crewHintsV5 accepts a mutable array. Copy the list at the presentation boundary; no rule changes. Exact web typecheck and G1 queued.
- U3-HARNESS / FIXED pending rerun: Playwright loads this repository's TS config as CommonJS, so import.meta.url in the report-path correction fails before test collection. Use its actual __dirname with path.resolve. No test expectations changed; exact full new-suite rerun queued.
- U3-GUIDE / FIXED pending recheck: source review caught overly broad Spread help. Corrected to the actual Marked-knockout condition and half-stack nearest-neighbour transfer from skills-v5/reactions.ts. Uses shared V5 keyword names and status rules; no policy or gameplay edits.
- U3-SHEET / FIXED pending recheck: cafe-news actions call m.go directly; local Events state otherwise kept covering the destination. Clear Events when model screen changes away from hub. Preserve existing actions.
- U3-VISUAL / FIXED pending check:1280 screenshot exposed inherited Look portrait specificity making Team cards too tall. Scope the portrait height under .uv-app and make the detail panel independently scrollable. Existing controls stay reachable; retain initial shots and capture repaired views. Recheck full G1 and new browser suite.
- U3 final verification: source G1 passes at u3-final/ and u3-layout/ (1867webtests); full new suite11/11; accessibility20pairs0serious/critical. Corrected Team screenshot reviewed. All U3 issues above FIXED.
- U3-ROUTE-CONTROLS / OPEN → U4: presentation review found advanced chapter/band/daily/Tower controls absent from the compact Home. Restore in Route tab, preserve HomeV4 default route/band calculation through a read-only selector; no rules changes.
- U4-CTA / FIXED pending final recheck: screenshot prepare-on.webp exposed legacy global hover turning Fight purple. Added scoped primary hover tokens; no rules changed. Recheck U4 screenshots/browser and G1.
- U3-ROUTE-CONTROLS / FIXED: Route tab now preserves challenge band, chapter, daily and Tower controls; two new encounter click tests PASS. Prepare uses original model preparation API; Result shows model-derived outcome/MVP and returns Home.
- U4 final verification: G1 all PASS (u4-final/checks.txt),13browser tests PASS,24axe pairs clean; repaired gold Fight hover screenshot reviewed. U4-CTA FIXED.
- U5-HARNESS / attempt1: battle-hud on1024 passed all overlaps then rejected boss heal ultimate because no enemy plate was visible during its friendly close-up. Gate is zero intersections of visible plates, not forcing off-screen enemies into a close-up. Preserve ready-state plate presence assertion; cast state checks all visible geometry and the ultimate banner. Initial trace/context retained until compact failure receipt is extracted. No visual gate moved.
- U5-BANNER / attempt1: screenshot showed inherited cream caster text on the gold banner. Scope ink caster text; recheck both looks and G1.
- U5-HARNESS / attempt2: on1280 ready-state sampled before renderer anchor placement (source sceneReady does not guarantee plates placed). Add explicit visible-plate readiness wait before geometry capture. Gate remains 0 pixel intersection. Initial compact failure contexts and logs retained; large uncommitted traces removed to stay under35MB.
- U5-PARTY / attempt1:1440 boss-cast shot exposed Panko status badges over ultimate text. Reserve a dedicated24px status row inside taller bottom cards; keep the arena outside that region. Legacy damage source also needs preserving when hiding the legacy action caption: add event-derived labels through U's overlay using B's read-only event adapter.
- U5-GUIDE / attempt1: Escape during battle also ran the hidden shell's sheet-close handler. Guard shell keyboard handling while battle is active and handle guide Escape locally. Exact guide test + G1 + full battle geometry rerun.

- U5 final verification / FIXED: explicit plate readiness, dedicated status row, ink banner text and isolated battle-guide Escape all pass exact checks plus G1. Full20/20browser suite at u5-final/browser.log; repaired1440boss cast screenshot visually checked.

- U6-HARNESS / attempt1: ceremony observer attached before lazy Recruit mounted; added stage readiness. Ten-pull fixture had500stamps against1500cost; fund it with5000 before the identical legacy/V3 comparison. Exact browser rerun and G1 queued; no costs or expectations changed.

- U6-CAPTURE / attempt1: clock-frozen reveal screenshot landed on the initial opacity0 animation frame. Advance100ms into each beat before capture; keep real-time duration assertions unchanged.

- U6-ODDS / attempt2: rewards/gear/pity are exactly equal, but legacy odds labels visually capitalize rarity. Restore that presentation in V3; retain the strict rendered-table assertion.
- U6-CAPTURE / attempt2: Playwright virtual timers do not advance CSS animation composition consistently; finite animations are completed for each screenshot while the real phase clock is preserved. This is screenshot-only.

- U7-DEV-BOUNDARY / attempt1 (found during U6 final check): prepared developer-tool adapter imported outside-product TS sources and pulled their separate React type context into web tsc. Keep their existing Vite module boundary via lazy glob loaders; no B/tool-source edits. Re-run G1 before U6 publication.

- U7-DEV-BOUNDARY / REJECTED: do not couple the product shell to offline-only lab modules. Unused trial adapter removed; existing Feel lab/Before-after retained. Extra offline lab controls belong in the U8 demo entry. G1 rerun covers the clean product boundary.

- U6 final / FIXED: strict ceremony/parity suite3/3; screenshot capture corrected and inspected; final G1 type/lint/unit/build0 in u6-gates/. Earlier failed receipts retained.

- U7-DOTS / attempt1: source audit found Recruit dot at1stamp though pull costs150, task dots ignored daily-cap claimability, and two event bubbles could push fixed controls to11. Use read-only actual previews and a prioritized single event bubble. Verify red dots and raw count without changing gates.

- U7-DOTS / attempt2: direct model notifications can retain state identity, leaving useMemo stale. Include model revision; add separate local viewing hints for newly acquired cats/gear. Exact dot/reward tests + G1 scheduled.
- U7-FIRST-FIGHT / OPEN: real2click practice test exceeded25s with Round1/full HP. Ranked hypotheses:1 inherited scene-ready/auto scheduling;2 U overlay notifications;3 cold compilation. Measure model/scene state at5s intervals in both shells; no forced skip/speed or raised timeout.

- U7-FIRST-FIGHT diagnosis: default headless software renderer spends~20s compiling/warming and renders2–3fps; legacy also misses25s. V3 software probe was interrupted by Vite HMR when dot fix landed, so its reset tail is INVALID, retained. Compare both using the same --use-angle=metal backend as Lane A timing; keep source frozen during that run.

- U7-FIRST-FIGHT / FIXED harness attribution: Metal probe finishes V3 by20s and legacy by15s, both in2rounds/5choices. The default software GL backend was the cause; use the Lane A macOS Metal backend in our browser config, with no simulation/speed edits. Exact25s gate retained; complete U7 suite rerun next.

- U7-FRESH-EYES / attempt1:1280 Home screenshot exposed an eight-word heading and unreadably faint locked chest caption. Shortened heading to “Your evening crew” and keep the disabled chest’s caption at full contrast. Third concern is inherited stage/portrait art, pending B art PASS. Recheck G1, axe, first-five/polish and screenshot before publication.

- U7 final / FIXED:36/36 new browser checks; exact16/16 polish/first-five rechecks after fresh-eyes fix;24axe pairs zero serious/critical; G1 all0 (1867webtests). Home screenshot visually inspected at u7-close/home.webp. First-fight software backend limitation stays explicit; no gate or rule changed.

- U8-G6 / attempt1: first file:// CPU4 run is interactive at2475ms, cold frameMAX100ms, cold long task102ms, idleMAX0ms, draws0. The literal223.3ms interactive gate fails; do not substitute the passing frame metric. Attribute mandatory4ms timer after each of291assets (~1.16s floor). Smallest owned fix: copy the existing loader into tools/ui-v3 and yield by an8ms work budget instead of every asset; keep every asset restored identically. Preserve all three baseline observations, then rerun exact offline gate + G1.

- U8-OFFLINE-HARNESS / attempt1: offline check passed loading and natural fight, then strict Odds selector matched both the parent and nested probability summary. Scope to the direct child; retain legal odds table assertion. Exact flow rerun with G6 and G1; no product change.

- U8-G6 / attempt1 PARTIAL:8ms budget yields produced2243/2224.4/2206.9ms, little benefit; cold frameMAX83.4ms, idle0. Attribution now shows serialized decompression dominates. Attempt2:decode8 independent asset entries concurrently, restore/publish in original manifest order and retain8ms yielding. No asset keys, decoded bytes or rules change. Re-run the same three cold contexts and60s idle plus exact play flow/G1.
- U8-OFFLINE-HARNESS / FIXED: strict direct-child Odds selector passes; natural fight14260ms, no remote fetches/errors, dev-only labs open and close.

- U8-G6 / PARTIAL:8-way transport decoding yields2143.5/2158.4/2139.6ms (gate223.3). ColdframeMAX83.4ms, coldlongtaskMAX93ms, steady0ms, draws0. Startup includes parsing31.2MB plus291asset restores and app evaluation. Retain all observations; no passing-frame substitution or further sample reroll. G1PASS; exact offlineflowPASS14219ms; compatibility hashes/source exact. Further startup work requires a larger packaging design.

- U8-VISUAL / attempt1: review of actual offline captures found discovery toast covering Fight and Result screenshot still in lazy “Opening…” state. CSS in U scope reserves sheet-header centre for compact toast (Home uses the free strip above dock); no reward/ack timing changes. Harness waits for specific rendered content, and captures battle at45%of the current cast. Preserve failed shots, rerun geometry+G1, rebuild and recapture.

- U8-VISUAL-HARNESS / attempt1: first toast geometry passed but cleanup used unsupported Playwright clock.uninstall. Install once per test (navigation retains the clock); remove nonexistent cleanup. Assertions unchanged. Exact encounter suite and G1 rerun.

- U8-BASELINE-CAPTURE / attempt1: original U0 Result images were also captured during lazy loading. Reproduce archived U0 source f2df22b20 under /tmp/ui-v3-baseline and wait for Victory. Initial archive server missed React imports after late dependency symlink; configure explicit original package aliases and separate temp cache. No baseline application code changed; original failed shots retained.

- U8-VISUAL / FIXED: exact encounter3/3, complete new37/37, axe24pairs clean, G1PASS1867webtests. Rebuilt artifact e5a63e7e… has56settledAFTERcaptures/0errors; Prepare and Result visually inspected. Offline practice14.285s, no remote fetches/errors. G6 stillPARTIAL2,141.1–2,191.3ms; original runs retained.

- U8-BASELINE-CAPTURE / attempt2 diagnosis: archived server lacked read-only report assets imported by original Battle and blocked symlinked assets. Supply existing reports and explicit fs allow-list limited to own source/temp. Original source remains unchanged. The diagnostic retry did not alter its renderer.

- U8-BASELINE-CAPTURE / FIXED: corrected archive dependencies/allow-list; four original-U0 Result captures now wait for Victory,0browsererrors (u8-visual/baseline-archive-verify.log). Original unsettled images retained; baseline runtime was not edited. Rebuilt56paircontactpage. Two setup fixes, then successful verification; failed diagnostic runs retained.

- U9-SCORE / one additional pass: preliminary8.30/10; weakest gamefeel7.5 and performance7.0. Hypotheses ranked:1flat poster lacks local warmth/motion;2data-URL fetch per291transportitems adds avoidable decoding overhead;3full31MB packaging imposes an irreducible parse cost. Smallest owned changes: original CSS lanterns/motes (no assets/hit targets; both reduced-motion settings), native base64 byte decode before gzip. Preserve prior artifact and all measurements; require all decoded asset SHA256 values exact, G1,37UIchecks,axe/offline/perf and updatedshots. Gate remains223.3ms.

- U9-G10 / PASS: complete existing suite421/421, no retries or skips, matching published baseline (u9/existing-e2e.json). Source08057b245; further changes only lazyuiV3 and its offline builder. No product/default logic changes.

- U9-FRESH-EYES / attempt1: final legacy-look Home screenshot shows the smaller old portrait art inside the same boxes, making cats visibly undersized. Apply1.3xvisualscale only to legacy Home images (same layout/focus/hit targets, no B asset edit). Preserve first-passshots and rerun first-five/polish+G1, offline acceptance and affected shots before publish. This completes the same required single improvement pass.

- U9-G6 / PARTIAL after the single score-improvement pass: native base64 transport reduced CPU4 startup from2,141.1–2,191.3ms to1,358.6–1,358.9ms (~37%). Literal223.3ms gate unchanged. All291assets exact; G1PASS;37UIchecks plus16affected rechecks;axe24clean;offline13.983s. No further packaging attempt this phase.
- U9-FRESH-EYES / FIXED: Home-only legacy1.3xportraitscale verified in final1280-off-home.webp;16/16affectedchecks, G1,24axe scans,56captures/0errors and offline/assetparity PASS. Final score8.475/10 remains below8.5 and is reported as is.
