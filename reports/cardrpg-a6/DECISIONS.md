# Lane A6 decisions

- Reuse the existing clean A6 worktree on the requested branch; no checkout, reset, or stash.
- Keep Q0 limited to setup; defer gameplay behavior and Q1–Q16 to STEP 2.
- Add gameplayA6 beside cardRpgEnabled in apps/web/src/game/cardrpg/gate.ts; exact ?a6=1 opt-in, no build override and no attached behavior.
- Reuse existing actual-rule sim loaders and seeded battle/run APIs for a future single tool; do not re-run prior acceptance evidence in Q0.

## Q1
- Keep one simulation entry point and one development seed range, 1–500. Preserve the final seed block for Q15.
- Test all seeds on a fixed candidate-team sample, including the four authored V5 crews. Report coverage instead of claiming an exhaustive ranking.
- Define seven-day economy visits as four-minute check-ins with real commands; preserve unfinished patrols between visits.
- Memoize the old fixed-seed advisor only when builds and legal level-up choices match; restore the real account's stale-click guard.
- Authored animation time includes action anticipation and defeats. Browser overhead and human enjoyment require separate checks.

## Q2
- A6 opts into the existing V5 automatic rules and Living Cafe shell. Product default stays OFF. Committed routes retain their rules through save/import.
- Keep rage capped at one hundred; one outgoing hit gain per action prevents multi-hit kits from flooding rage. Emit full/cast events rather than changing the canvas.
- Three numeric tunes are enough for this checkpoint: G1 passes, G2 partial is explicit. Keep economy/first-session work at its queued priority.
- Legacy hashes remain exact; no expected receipts were updated.

## Q3 bonds
- Collection ownership grants half a percent HP and attack per completed set; nine sets cap the bonus at 4.5 percent. Equipped and benched cats contribute equally.
- Eight authored pairs trigger after a partner acts from round three, once per pair, requiring both alive. Existing V5 status and damage functions resolve the combo; no second combat engine.
- Events-v2 carries the pair name/contributors for future B-owned effects. A6 owns the mint DOM announcement and Bond Book only.
- The reusable first-session harness clicks real UI and observes the review hook without mutating it. One browser stays alive across two fifteen-minute timing-lock leases.

## Q4
- A6 Power is one full-health stat score for allies and foes. HP loss does not change it; it describes strength rather than guaranteeing a win.
- Quick upgrade compares real legal transactions by Power gain per weighted material cost; previews never spend.
- Auto-equip may use reserve gear but never removes an active teammate’s item.
- The A6 loss advisor checks at most twelve legal changes and prefers cheap options reaching eight wins in ten forecast fights. Generic fallback claims no win guarantee.

## Q5
- Reuse existing V4 loadout slots for Campaign/Daily/Tower; keep saved gear restores at home and use only rows/plan during preparation.
- Suggestions prioritize three play styles without running combat on the main thread; use the existing worker forecast for the matchup hint.
- With only three owned cats, suggestions share the roster and change standing plans. With enough eligible cats, prefer different rosters.

## Q10
- One selected Fuji Relic adds two to eight percent to the active team’s HP, attack and defense; holdings and copies do not stack. A6 keeps ordinary cat gear; OFF keeps the existing lead-cat effect.
- Reuse the existing read-only, pinned-block ABI adapter. Clear stale holdings on wallet/network changes and reject stale responses. Demo holdings require the offline component; the normal sandbox URL keeps product wallet behavior.

## Q11
- Early campaign bands one/two/three use 65/75/85 percent enemy attack; replays retain the same band pressure. Other modes and bands four and up are unchanged.
- Feature celebrations queue behind existing discoveries. Onboarding points to actual buttons and leaves normal play fully automatic.
- Zero observed defeats means hint retry rate is unobserved, not zero percent. The sim and report now show that distinction, and actual Legendary receipt is separate from pity budget.

## Q13a — original painted unit art
- Use the 25 original alpha concept masters published on origin/codex/cardrpg-art-r1-2026-11-09, under assets/source/look-v3/concepts/*.png. Read-only local counterparts: /Users/bao/taskbar-hero-cardrpg-b2/assets/source/look-v3/concepts/; masters: /Users/bao/art/look-v3/.
- Q8 face crops come from assets/cardrpg-look/v3-portraits/manifest.json on that published branch. Source identity and intended crop reviewed; these are DOM illustrations, not a claim that canvas puppets are accepted.
- tools/cardrpg-a6/pack-art.py packages alpha art at <=768×896, WebP86, and the existing 144px face crops. Runtime uses one manifest and the art-a6 helper across all v3 DOM views. Shared legacy cards retain their classic path outside A6.
- Missing manifest entry/file or runtime image failure falls back to the previous model portrait. Canvas, models, VFX, camera, rules, seeds and earned rewards remain owned by their existing implementations.

- Q13d scenery is original inline SVG in CampaignSceneryA6.tsx. Node placement is presentation only; edges/availability/stars/rewards use existing run state. Cat/enemy art still uses the unified original B manifest.

- Q13e: merge commits b9c1497d6 (B published P4 cats/P3 framing) and 00b04f8ee (B530bce90a P5 batch1 enemies). B owns all canvas files; A6 adds DOM HUD only. A6's opt-in App enables existing v3 puppet flags, preserving the main default OFF and the A6 shell.
- Q13e: gameplay playbackAt is wall time, so ultimate overlay lifetime is800/speed ms; the existing two-per-ten-second banner cap stays. Health trails are presentation only and never change combat HP. No manual cast control or second damage-number layer.
- Q13e: browser review uses Chromium channel with Metal, matching B's published harness. The default headless shell stalled shader compilation; that run is not pacing evidence. Q13f/g must report the browser/backend used.

Q13f: Existing route stays seven stops (early depths0–3, late4–5, guardian6); no artificial ten-stage subsystem. Fixed expected crew7500/7900/8200 and band budget are independent of equipped Power. Map/Prepare share exact enemy stats. A6 early levels gain4% per level (nine steps capped) in addition to existing growth; preserves legacy OFF. Late street adds one existing Binding Thread.

- 2026-11-10 resumed research gap: extended the three existing studies with source-scoped look/motion research; Q13a–e remain done. The campaign already has seven depths/nine nodes, so pressure bands map to that graph rather than adding ten fights. Power is not a win probability. Recovery and non-stuck play outrank forcing healer teams into an HP percentage.
- Added Q14a[auto] to improve the existing lowest-scored Bag/Tower/Relic compositions without systems; Q13g/Q15 now explicitly separate wall time from authored timing and include reduced-motion/keyboard checks. Recheck research after Q13f/g/Q14.

- 2026-11-10T18:00:52Z: While Q13f runs unchanged, reuse its existing browser for a read-only Q13g sceneReady observer. No second renderer or repeated earned run. Q14a drafts remain /tmp/cardrpg-a6-{KeepsakeArtA6,TowerSceneryA6,SheetsV3,RelicA6,TowerA6}.tsx and /tmp/cardrpg-a6-keepsakes-a6.css until timing completes.
- Same live captures reveal pale boon titles and the loss MVP statistic labelled “Why”; include these two small readability repairs in Q14a without reopening completed screens or adding rules.

- 2026-11-10T18:16:44Z: Route-choice cards will overlay the original street while a choice is pending; underlying map becomes inert. This keeps current actions and their scenery inside720p without shrinking the game or inventing a new system. Generic route behavior remains unchanged.

- 2026-11-10T18:25:35Z Q13g: stable16.7ms frame delivery points to authored action duration. Use650/800ms ordinary normal caps and1050/1300ms boss ordinary caps; preserve all ultimates/boss signatures and event order. Reuse earned17-round fixture and existing first-session harness for after measurement.

- 2026-11-10T18:28:34Z Q14 preparation: published B diff touches only B-owned renderer/art paths; no shared modified source file with A6 since common ancestor. Stage B v4 face-icon adoption in the existing artPropsA6 manifest adapter; retain transparent original full-body cutouts for cafe/recruit/cut-ins. New face icons come from assets/cardrpg-look/v3-portraits/manifest.json and matching *-face-72/144.webp. Do not apply until Q13g measurement finishes.

- 2026-11-10T18:37:54Z Q14a: extend the existing weakest-screen pass to Daily (7.3 at720p): gift illustration and explicit task states replace redundant binary bars; no reward/eligibility changes. Existing draft retained.

- 2026-11-10T18:46:07Z While Q13g waits for B P10 timing lease, apply already-preserved Q14a UI drafts. Cancelled only own pending63590 waiter (no child/browser, no sample lost); requeue identical boss candidate after static validation. Combat rules and ordinary pacing unchanged. Q14a verification remains pending; do not tick before viewing captures.

- 2026-11-10T18:57:07Z Q14 merged publishedB e83b9e2a1 with merge commitbe31fd412; all25puppets/P6single-source canvas numbers/P7stage/P8faces/P9budget retained. Adopted staged circle-face adapter only; A6 full-body alpha art and shell unchanged.

- 2026-11-10T19:05:24Z Q14 phase mismatch is an A-owned presentation adapter defect, not a new rule: shared displayedBossPhase maps A6 bonus+phase to1/2/3 for HUD/world label/scene input. Current boss visibility remains pending B P13; accepted Q13e design is not reworked.

- 2026-11-10T19:21:42Z: Final gallery adds Journal/Field guide/Settings to LOOK-SCORES. Journal is the lowest A-owned surface at 7.3/7.1; add Q17 after Q16 under the requested continuing quality pass. Prepare an original scrapbook using existing cat art and rule previews off the live app while Q15 measures. No new rewards or mechanics.

2026-11-10T19:35:56Z Q18[auto]: retained720p gallery exposes Field guide/Settings7.3 lows; code inspection finds legacy two-turn ultimate text and Settings[1,2,4] despite A6rage100/[1,2,3]. Add presentation/copy parity polish afterQ17, no rules or new systems; drafts only during frozenQ15.

2026-11-10T19:50:24Z: B published request for5s acquisition gap after Q15segment2; honor it before the next A6 lease. Latest published B fc4284033 contains4815b7f3 P15 helper fix plus continuation notes; merge after source freeze ends. B P14 prototype remains unpublished and is not imported.

2026-11-10T19:55:00Z: Advance Q17 application during B’s live timing lease after the Q15 source freeze ended. Stopped only own pending wrapper777 after proving it had no child; no measurement lost. Journal uses existing claims/caps/discoveries, with three meaningful claim tests and both-size review already drafted. Combine affected battle and Journal checks before a single offline rebuild; Q16 reports the accepted result. R-6 waiting-work and section7 reorder authority apply; no accepted seeds/run/E2E repeated.

2026-11-10T20:07:41Z: Q15 film review found startup white frames; trim existing recordings after rendered content, retaining original playback and raw files. Boss62s includes44.59s automatic battle plus setup/result, not a timing benchmark. B90fb3a46f publishes only reports/reviewtools; merge without repeating accepted application checks.

Q18 visual review found guide advice still describing V4 effects/enemy cadence. A6 now uses existing V5 mechanic data, translates legacy status names only in presentation, and explains its66%/33% boss thresholds. Verified Button Guard Warm targets itself, so its guide wording is corrected without changing combat. Legacy mode keeps old descriptions.

2026-11-10T20:22:47Z Q19[auto]: Q18 accepted; Prepare7.5 at720p is now the lowest A-owned screen. Use retained table/art-size drafts and every existing rule/action. Published B P14/P16 affects B-owned render motion only; merge before one combined offline rebuild.

- 2026-11-10T20:48:47Z Q20: replace the tall nine-collection-then-eight-pair grid with an original indexed album. This makes every existing friendship and Pair section directly reachable at720p while giving selected cats more art space; no mechanics, rewards, sorting or readiness rule change. Q19 accepted package freezes publishedBfa28d50cf; later tips belong to the next bounded integration.

2026-11-10 Q21: After Q20, the remaining lowest A-owned screens tie at7.8. Retained 720p Cats/Skills evidence shows four simultaneous dense descriptions and no clear automatic-ultimate label. Use four direct choices with one readable detail to improve comprehension; keep exact rule-provided text and all current actions. No new system or numerical tuning.

2026-11-10T21:12:15Z Q22[auto]: Q21 retained file review proves existing advanced preview starts at1590px on720p/1866px on900p despite a visible trigger. Reuse CompanionPreview in a focused dialog, keeping B renderer ownership, selected ability and account state. This fixes a concrete reachable-action gap rather than adding a game system. New B P24 remains for the next bounded package so accepted Q21 captures are not repeated.

Q23[auto]: Retained1280-daily image visibly places “Your earned chests” at the clipping edge. Code confirms those are current claimable star/Tower/Journal rewards, not optional history as the old score note said. Direct sections keep those existing actions visible without shrinking all seven login gifts/five task cards. Prepare off-app while Q22 verifies; do not redo accepted claim rules.

2026-11-10T21:35:20Z Q23: separate daily/login/weekly board count from existing star/Tower/Journal ready count. Keep all14milestone tickets in place after claiming so keyboard position and collected history remain understandable; readiness is only badgesA6. Exact capped preview amounts and non-currency ribbon use current rule previews, with no new rules.

- Q24: retained q14a/1280-inventory shows six of ten gear pieces, while comparison and enhancement sit below the visible fold. Improve that existing decision with a stable workbench and bounded shelf; expose exact current stats/costs/equipped ownership. Preserve commands/utility math/route locks and existing workshop. Q23 source and offline checks are complete and will not be repeated.

2026-11-10T21:58:25Z Q25[auto]: Tower is one of the remaining7.8lows. Its retained720p screenshot clips chest controls, and code still shows V4 counter copy for V5 battles. Use separate Climb/Milestone gifts views and the existing current-enemy advice adapter, keeping every floor/claim and deterministic rule unchanged.

2026-11-10T22:12:15Z Q26: retained Journal720p has only the first discovery disclosure visible beneath milestone tickets; StarBoard appears after the full found-history list. Add direct book sections and put existing star claims ahead of optional history. This extends accepted Q17 rather than repeating its claims/layout work, and addresses a remaining7.8screen using the existing stable-action-zone research. No rule or reward change.

Q27: after Q26 source acceptance, retained guide720p view confirms a long catalogue (13enemies/30charms) without direct lookup. At8.0/7.8 it remains a lowest screen. Reuse existing catalogue prose in an original indexed field notebook with category-scoped search and a single readable page; also fit the battle overlay. No game/content rule changes. Draft while Q26 package review runs, apply only after its acceptance.

2026-11-10T22:37:08Z Q28[auto]: after Q27, Settings7.9/7.8 is the lowest screen. Inspected1280settings/reset screenshots show a plain two-panel form, no direct way to select an exported long code, and an expanded reset paper extending beyond the sheet. Improve the existing transfer interaction and original desk composition, with clear local-versus-manual save wording; no clipboard dependency, schema or game rules change. Prepare draft off app until Q27 package is accepted.

2026-11-10T22:46:55Z Q28: original letter/lantern desk reuses current save model and art manifest; bounded reset replaces only the letter body. Exact state and all preference values roundtrip; sound still needs an explicit click under the retained audio startup contract. No new storage or schema.
2026-11-10T22:46:55Z Q29 scope from inspected q19/1280-prepare-earned: foe counter prose is11px in narrow cards and forecast repeats one foe mechanic. Next lowest Prepare7.9 gets selectable foe notes with15px mechanics/counter text and a compact forecast, retaining all enemy art/HP/row/Power and original calculation. No numerical tuning or new combat rule.

2026-11-10T22:59:22Z Q29 source accepted:20current views,13notes/bothsizes and fixedseed/Fight checks;15pxselectedprose and compactforecast, original calculation retained. Q30 extends the existing readable-metadata/action-zone research: inspected q19/1280-team-suggested hides suggestion reasons and pushes crew below the fold. Bounded tools reuse existing commands and preserve the main formation table.

Q31 scope: retained q20/1280-missing-pair and full-last-collection confirm10pxstatus and34pxtargets, despite available space in the decorative header. Keep original album/selection; combine summary and section tabs to provide space for>=40px index controls and14px rule text. No new feature or bond rule; draft only until Q30 delivery.

2026-11-10T23:23:20Z Q32 scope: inspected q13d-final/1280-map-route retains9–10px stop/chest metadata and28px Use tonic. It is the lowest remaining row13 at7.2. Compact the redundant Lantern streets heading into the chapter/star strip, give back the vertical room to current labels and40px supplies actions, retain original scene/graph/commands. Route notes remain an observed follow-up; no new systems or numerical tuning.

2026-11-10T23:33:31Z Research recheck after Q29/Q30/Q31: readable selected details, bounded tools and stable action zones match the retained research and passed both sizes. Q32 resolves the remaining route-metadata7.2. Inspected final1280home now exposes the next concrete gap: idle tips use a generic icon,10–12px labels and a small fast-reward target despite free space at the right. Q33 will make the existing tip corner a coherent original chest with readable amounts/status and>=40px actions; keep crew art, claims/caps and underlying room untouched. No new system.

- 2026-11-10T23:54:31Z Q34 follows inspected q14a720p result/loss8.0: small centered art and simple rewards leave a largely blank sheet, while Read details appends the long legacy report below it. Use an original receipt beside large companion art and a focused existing-data report. Preserve finish/advice/replay/team commands; do not reopen numerical difficulty tuning.

2026-11-11T00:12:32Z Q34: preserve summary/finish/replay/improve-team/advice commands. Use a native bounded dialog with three report pages and an original companion receipt; no new reward types or economy rules. Fix the reproduced visual reward-expiry lifecycle only.

2026-11-11T00:14:21Z Q35 queued from retained q14a/1280-relics inspection: next tied-low screen, simple cup material,12px labels/38px actions. Recompose the same four keepsakes and equipped slot with original vector refinements; preserve wallet/bonus rules. Off-app draft while Q34 package runs.

2026-11-11T00:27:02Z Q35 accepts the original ceramic/gilt mantel with14px text/44px controls and unchanged read-only wallet rules. Q36 addresses the observed tied-low Bag cost/owner/stat labels (12px and36px details tabs); bounded CSS refinement, no new gear or economy system. Existing final difficulty fallback remains explicit.

- 2026-11-11T00:35:45Z Q37 scope from retained q23-offline-board/1280-weekly-ready and current DailyA6: keep its board/shelves composition, use existing preview.reason for honest availability and reward previews. This repairs a presentational mismatch when completed tasks are blocked and makes exact weekly gifts reviewable. No new system or economic retuning.

- 2026-11-11T00:43:28Z Q38 addresses the lowest self-review category without reopening the closed Q13f numeric loop. Current AdviceV4 has no response timeout and hides fallback upgrade cost. Make existing affordable actions and their consequences reviewable; keep the advisor algorithm and all battle/economy constants fixed. Queue after Q37, no new simulator or final-seed rerun.

2026-11-11T00:52:50Z Q38: bound advice comparison at8s and expose the existing affordable upgrade while it runs. Cost comes from the unchanged public preview; unavailable purchases lead to free formation review. A stale encounter/build/late worker cannot replace current advice. No ranking, seed, reward or combat change.

2026-11-11T01:01:30Z Q39 queued from inspected q29-prepare-final/1280-group-2-yarn-giant and current ForecastV4:12px metadata and unbounded pending worker. Improve the tied-low Prepare8.0 state clarity/readability; keep forecast math/cache and battle rules fixed. Draft only until Q38 delivery.

2026-11-11T01:16:45Z Q40 scoped from inspected q25-climb-final/1280-boss and q25-tower/1280-ready-gifts: Tower remains8.1/8.0 with small metadata and38px claims. Preserve cabinet/parcel composition and all public rules; improve existing text/targets under the established readable-action research. Draft off app until Q39 delivery.

2026-11-11T01:24:16Z Q40: reuse the inspected Q25 cabinet/gift layout and preserved CSS draft. Raise floor numbers/markers to18–19/12px, status/body to14px and claims/returns to44px. Keep all art, floor/reward commands and six-parcel layout; no new system.

2026-11-11T01:27:29Z Q41 queued from retained Q26 screenshots, not a repeat of accepted page/claim work: collection summary labels10px and discovery dates12px are still the lowest Journal row; existing40px page/claim targets can improve. Draft only during Q40; preserve every data/claim command.

- 2026-11-11T01:33:46Z Q41: retained Q26 scrapbook/pages and public claims; raise collection counts/dates/reasons to14px and actions44px. Required published BP38 merge is isolated to B-owned art/canvas; verify integrated framing in the offline package. No new rewards/records or numerical tuning.

- 2026-11-11T01:35:15Z Q42/Q43 queued from inspected retained720p Field Guide/Settings views (both8.0 lows): practical metadata remains12–13px and controls40–42px. Apply existing readability/action-zone guidance; no new system or repeated research. Prepare off-app while Q41 verifies.

- 2026-11-11T01:44:22Z Q42 applies the retained Field guide typography/action draft after Q41 acceptance. Reuse its lookup/keyboard probe but remove unrelated Button Guard framing; P38 already has current accepted framing. No catalogue or rule changes.

- 2026-11-11T01:47:45Z Q44 follows the existing research readability guidance: inspected retained Cats growth/Inkcap skills720p expose9–11px metadata and36px actions. Improve existing costs/readiness/controls after Q43; keep art, commands and progression unchanged. Off-app draft /tmp/cardrpg-a6-q44-readability.css.

- 2026-11-11T01:52:55Z Q43 applies the retained Settings typography/action draft after Q42 acceptance. Published BP39 merged at15c183f27; existing save/preferences/reset logic stays unchanged. Verify Settings and current puppet tests before the next package.

- 2026-11-11T01:58:01Z Q44 applies retained card/growth/skill typography and44px controls after Q43 acceptance. Reuse production rules only as expected public transaction previews; no simulation, new system or numerical tuning.

2026-11-11T02:07:14Z Q45 queued from inspected Q44 fresh Awakening: enabled button rejects level-one cats only after click, with no quoted cost. Apply the existing public-preview pattern used by level/star training; keep underlying commands/economy unchanged. No new mechanics or numerical tuning.

2026-11-11T02:09:47Z USER11Nov real3D direction accepted verbatim in INBOX. Q44/Q45 remain ordered; unchanged2D cards retained. Future Q14 integration reads B lookV3D/socket contract and budgets; no new puppet-internal dependencies. Current publishedP39 remains the fallback until accepted3D tips arrive.

- 2026-11-11T02:16:49Z Q45: use the existing R.awakenCat transaction on its copy for eligibility, exact currency/material deltas and real stat gains; execute it again against the current state on click. An open awakening receipt occupies the existing Growth area with a direct Level & stars return, keeping the purchase visible at720p. No rule/cost/renderer change.

- 2026-11-11T02:20:51Z Q46 queued behind Q45: personally inspected retained1280 normal/boss screenshots show10px ultimate/phase and11px HP/auto labels; HUD locked text says only level6 although existing rules also allow3stars. Improve this tied8.1low within fixed canvas envelopes; do not couple HUD to pending3D internals or rerun frozen numeric balancing.

2026-11-11T02:28:26Z Q46: preserve canvas as black box; only fixed DOM cards/actions change. Readiness uses current battle skills, displays both existing unlock routes, and distinguishes fallen. Keep82px top/148px bottom envelopes and existing clock/cast/skip behavior.

2026-11-11T02:32:40Z Q47 added from Q46 visual/control evidence: empty battle log is a blank panel; opening while running does not pause, and closing leaves focus behind. Apply the existing illustrated-empty/readable-modal/return pattern to current100-event history after Q46; no new rules or new logging.
