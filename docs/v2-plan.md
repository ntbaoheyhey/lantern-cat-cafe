Copy of the approved plan for tools that cannot read the planner files. Decisions are the user's; this file records them, it does not make them.

# Cat RPG v2: plan to finish (approved 2026-10-25)

=== THE APPROVED PLAN (Cat RPG v2: classes, gear, chapters), condensed from the Opus plan approved by the user on 2026-10-25; status updated to origin/main 3379777 ===
P1. Dates (UTC+7). Today is Sun 25 Oct 2026. Cut-over ~13 Nov (latest 15 Nov), freeze 17 Nov, submit 20 Nov, planning deadline 21 Nov 2026 23:59 UTC+7 (official date unconfirmed: team1vn.xyz says 21 Nov, Builder Hub showed 24/25 Nov; Top 10 screening 27 Nov, Demo Day 30 Nov).
P2. Rules that never change: live v1 must keep working until cut-over (V29); v2 client code renders only with VITE_GAME_V2=1; v2 Edge Functions are prefixed v2-; v1 functions and applied migrations are never edited; Relic tiers (content.ts RARITIES, relicIdOf) are append-only; contracts do not change; every number lives in config (V2_CONFIG), never hard-coded; numbers change only through a table the user signs (D4). Zero GitHub Actions minutes: never start ci.yml or any workflow; verify locally (scripts/verify-pr.sh). Git author ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>.
P3. What is on main now (c95f0ce):
  Done: V1 content, V2 combat, V3 idle, V4/V4b loot, V5 forge rules, S1 state, S2 bag, V7 API contract (docs/api-v2.md, GameApiV2.ts), V7b Supabase v2 client (C9), V8 schema (applied to Supabase), V9 state/claim/equip/choose-class functions (C6), V11 forge functions v2-craft/salvage/lock/relic-forge (C7, #158), V10 v2-boss-fight + timeline big/dodged flags (C12, #165), C5d config levers (boss.firstClearKeys 0, boss.chapterHpMul/AtkMul, chapters.killsPerRound; behaviour-neutral, #164), V12 demo mode (C4, C11 fixtures), V13 layout shell + flag.ts, V14 rig, V15 combat animation, V16a loop + api switch (C10), V17a/b character/bag/icons, V18 class picker, V20 forge UI, V21 map (components, not wired), V19a loot UI, V19b boss gate panel, V19c loot/forge icons (A19), V23 gear sets, V24a-g art, V25/b/c icons, V27a-d docs + a11y audit, A22 docs/cutover-v2.md (#161), A26 docs/class-refs.md (#162), A27a pitch v2 draft (#163), C14 arena cue model + fixtures (#166, ch5 win fixture hand-built until numbers change), A20 HUD components layout/hud/** (#167), A21 boss gate states (#168), A23 HelpTab v2 (#169). Nine v2 functions exist (milestone M1 met in code). HUD (A20) and cues (C14) are merged but NOT wired into the stage yet (that is V16/V19).
  Pushed, NOT merged: C16 check-live v2 (ai/codex-check-live-v2, STATUS BLOCKED on a pre-existing docs/runbook.md link failure + one idle timing flake; fix round 3 is queue item 1).
  Not started: A25a a11y prep (gate now open), C5e rebalance round 3, C15 Founder batch grant, C19 client contract test, V16 stage+HUD wiring (CL5, Claude), V19 arena render (CL6, Claude), V22 class art (CL7), V26 e2e (C8), CL8 apply numbers, CL10 Relic mint wiring, C17 flag flip, V29 cut-over, V28 live QA, submission kit.
  Numbers: NOT signed (docs/proposals/numbers-v2.md "User: ____"; config.ts baseHp 100, walkTimeMs 1000, dailyKeys 1, firstClearKeys 0).
P4. Milestones:
  M0 Sun 25 Oct: pending batch merged; D1, D2 answered (done).
  M1 Wed 28 Oct: all v2 server functions on main (done: v2-boss-fight merged); content levers config-driven (done).
  M2 Fri 30 Oct: numbers signed (C5e table or the D4 relaxed fallback); CL8 merged by 31 Oct.
  M3 Mon 2 Nov: playable v2 in demo mode (V16 stage+HUD+wiring and V19 arena merged): VITE_GAME_V2=1 build: pick class, fight, boss win, chest, forge.
  M4 Thu 5 Nov: v2 works against the real server behind the flag; Relic mint from the v2 Forge (CL10); C8 e2e merged.
  M5 Mon 9 Nov: content complete (class art or D5 fallback), fix wave done, cut-over rehearsal on PGlite, release candidate, check-live v2 checks ready.
  M6 Tue 10 Nov: reminder: confirm deadline, invite tuantqse90.
  Wed 11-Thu 12 Nov: 2-day buffer; go/no-go review 12 Nov; user picks the cut-over day (D6).
  M7 Fri 13 Nov: V29 cut-over (latest Sun 15 Nov): live site renders v2; check-live green.
  M8 14-16 Nov: V28 live QA + fixes (max 3 deploy groups/day).
  M9 Tue 17 Nov: FREEZE: no feature merges, only user-approved blocker fixes.
  M10 18-19 Nov: submission kit: 2-3 min video, slides, docs/submission.md; repo public only on the user's OK (D7).
  M11 Fri 20 Nov: user submits. 21 Nov: deadline, untouched buffer.
P5. Plan B (decided at go/no-go on 12 Nov): if M3 slips past 6 Nov or M7 past 15 Nov, keep v1 live and ship v2 as the demo-mode build (VITE_GAME_V2=1 preview or second Vercel alias); submit v1 + v2 demo.
P6. Lanes (until the user returns on Tue 27 Oct, every buildable Claude-lane card is in the Codex/Antigravity queues; see D10): Codex = server functions, game-rules logic, sim, pure TS, e2e, SQL drafts. Antigravity = React components with tests, docs, screenshots, browser QA, a11y. Claude (only on the user's "go", paused until Tue 27 Oct) = Phaser scenes (CL5 V16, CL6 V19), wiring, class art with the user (CL7), numbers apply (CL8), Relic mint wiring (CL10), cut-over execution (CL9). Orchestrator (Claude) = opens PRs, runs scripts/verify-pr.sh, batches merges, runs pnpm gen:deno after merging main into a branch.
P7. Deploy and merge constraints:
  - Vercel free plan, 100 deploys/day; only main pushes touching apps/web/**, packages/** or pnpm-lock.yaml deploy. At most 3 main-deploying merge groups a day. The 100/day limit was HIT on 25 Oct (PRs #161-#169 show "Deployment rate limited, retry in 24 hours"): nothing merged since then is live yet; the live site picks it up on the first web-deploying merge after the reset. Live checks (node scripts/check-live.mjs) of new code wait for that reset.
  - docs/**, reports/**, scripts/**, supabase/tests/** and supabase/migrations/**-only merges deploy nothing.
  - Main pushes touching supabase/functions/**, supabase/config.toml, packages/game-rules/**, packages/auth/**, packages/api-contract/**, packages/chain/deployments/43113.json or .github/workflows/deploy-functions.yml run deploy-functions.yml (Actions minutes, quota ~zero): one such batch per day at most, and only after the user says the workflow is still allowed that day.
  - Migrations: only C15 adds one; applied with Supabase apply_migration by the orchestrator after the user's D8 OK, before merging.
P8. Dependency graph (A -> B: A must be merged before B; [U] = user gate):
  C12 V10 (merged) -> C19 client contract test; C12 -> C16 check-live (covers v2-boss-fight by folder) ; C12 -> CL10 relic mint wiring
  C14 cues (merged) -> CL6 V19 arena render (now Codex Q4)
  A20 HUD + A21 boss gate + A19 (all merged) -> CL5 V16 stage+wiring (now Codex Q5) ; A20 + A21 -> A25a a11y prep
  CL5 V16 -> C17 flag flip branch, A24 screenshots, demo script update, QA1 ; CL5 + CL6 -> C8 V26 e2e, A25 full a11y re-audit
  C5d (merged) + C5c (merged) + D1 -> C5e round 3 -> [U D4 sign] -> CL8 apply numbers -> V29
  [U D3 refs per class] -> CL7 class art x7 (preview [U] each) -> M5 ; A26 sheet (merged) helps
  A22 runbook (merged) -> C15 Founder batch grant -> [U D8 + apply_migration] -> V29
  C16 + C17 + C15 + CL8 + M5 -> V29 cut-over [U D6] -> V28 live QA -> freeze -> submission [U D7]
  Critical path: user "go" for CL5/CL6 -> V16 (2-3 days) -> C8 e2e (1-2 days) -> fix wave -> V29. Second: C5e -> user sign -> CL8 -> V29. Third: class references -> CL7 previews.
P9. Decisions (made / still the user's):
  D1 MADE: S-B: one Cat Key in each FIRST-clear boss chest (boss.firstClearKeys = 1), none on rematch, dailyKeys <= 3. S-A (5 daily keys) rejected. Applied later by CL8 (not on main yet).
  D2 MADE: optional big?/dodged? on TimelineEventV2 (done in C12).
  C5d behaviour-neutral levers: MADE (OK, merged).
  D3 OPEN: class art references (picture or written look) per class, 7 classes; rolling, last 5 Nov.
  D4 OPEN: numbers sign-off from C5e by 30 Oct; if still NOT READY: sign the best S-B table under the relaxed set (first boss 8-15 min, chapter growth 1.2-2.5x, class spread +-20% with range >= 3%, first-attempt boss wins 30-95%) with known failures listed.
  D5 OPEN: classes without references by 5 Nov: written-look fallback (recommended) or placeholder looks.
  D6 OPEN: cut-over day (13 Nov recommended, latest 15 Nov) and go/no-go incl. Plan B, on 12 Nov.
  D7 OPEN: repo public (or add tuantqse90) and submit; who records the video; recommended public 19 Nov after a secrets scan, submit 20 Nov.
  D8 OPEN: Founder chest contents and who qualifies (recommended: one Founder bundle to every player created before cut-over; v1 rows kept read-only); by 6 Nov.
  D9 OPEN: confirm the official deadline (21 vs 24/25 Nov) and where to submit; reminder 10 Nov.
  D10 MADE (25 Oct, user: "give them the entire current plan, don't save any task for Claude"): V16 (CL5) and V19 (CL6), V26 e2e, CL10 wiring, QA, class-art PREP and cut-over PREP go to Codex/Antigravity now. Claude resumes after the user returns (verify, merge, and the hard-stop steps). Still user-only: D3/D5 class references and previews, D4, D6, D7, D8, D9, CL8 applying numbers, V29 execution.
  Also open (older, not v2 blockers): Relic recovery proposal, contract mediums, CSP headers, mock-auth fail-closed (decide before V29).
P10. Risks: numbers may never pass all targets (time-box D4 30 Oct); Claude lanes late (Plan B 12 Nov); class refs missing (D5); shared hot files (game.ts, server.ts, v2-store.ts, deno.json, FUNCTIONS line: sequential only, always pnpm gen:deno after merging main); Vercel 100/day; Actions minutes; sim runtime (writer <= 4 min, game-rules suite <= 2.5 min); Relic shared daily limit v1/v2; cut-over breaking live (runbook, rehearsal, revertable flag-flip commit); mock auth silently chosen if VITE_SUPABASE_URL is missing (C16 asserts the real API on the live bundle); token budget.
=== END OF PLAN ===

## Queue summary

Execution order: Q0, Q1, Q4, Q5, Q3, Q6, Q7, Q8, Q9, Q10, Q10b, Q11, Q12, Q13.

- Q0. Plan copy (docs only). Branch ai/codex-v2-plan-doc. Report reports/v2-plan-doc.md. Gate: main-state/user authorization checks described in card.
- Q1. C16 check-live v2 checks, FIX ROUND 3. Branch ai/codex-check-live-v2 (exists: continue it). Report reports/check-live-v2.md. Gate: main-state/user authorization checks described in card.
- Q2. A note on C14 (no work): merged as #166 with a HAND-BUILT chapter 5 win fixture ('ch5-win-handbuilt') because ch5 is not winnable under today's numbers. Regenerating it belongs to CL8 (after the user signs numbers). Do not touch arena fixtures in this session unless Q4 needs to import them. Gate: main-state/user authorization checks described in card.
- Q3. C5e V6f rebalance round 3, PROPOSAL ONLY. Branch ai/codex-v6f-rebalance. Report reports/v6f-rebalance.md. Gate (all on origin/main): (1) config.ts has boss.firstClearKeys: 0, boss.chapterHpMul, boss.chapterAtkMul, chapters.killsPerRound; (2) packages/game-rules/src/v2/sim/diagnosis.test.ts exists and sim/proposal.ts contains SCENARIO_V2_OVERRIDES; (3) numbers-v2.md has "User: ____" and config.ts still has `dailyKeys: 1,`, `walkTimeMs: 1000,`, `baseHp: 100,`, `firstClearKeys: 0`. Any false -> STOP (signed/applied = obsolete).
- Q4. V19 boss arena render (plan card CL6, given to Codex by D10). Branch ai/codex-v19-arena. Report reports/v19-arena.md. Gate: C14 merged (apps/web/src/game/arena/{cues,arenaFixtures,index}.ts on main); game/combat/** exists; no other branch builds the arena: `git ls-remote origin 'refs/heads/*arena*' 'refs/heads/task/V19*'` prints nothing except your own.
- Q5. V16 stage + HUD + screen wiring (plan card CL5, given to Codex by D10). Branch ai/codex-v16-stage. Report reports/v16-stage.md. Do it after Q4. If Q4 is merged on main, branch from origin/main. If Q4 is DONE but not merged, branch from ai/codex-v19-arena (stacked) and write "stacked on ai/codex-v19-arena: merge Q4 first" at the top of the report. If Q4 failed, show the fight result text instead of the arena and leave a TODO line in the report. Gate: StageLayout.tsx still imports sampleState; apps/web/src/game/stage/ absent; no other V16 branch (`git ls-remote origin 'refs/heads/task/V16*' 'refs/heads/*v16-stage*'` empty except yours); layout/hud/** (A20) and layout/boss (A21) on main.
- Q6. C19 V7c server-mode client contract test (tests only). Branch ai/codex-v7c-client-contract. Report reports/v7c-client-contract.md. Gate: supabase/functions/v2-boss-fight/index.ts on main and `"v2-boss-fight"` in _shared/v2/game.ts; supabase/tests/v2/client-contract.test.ts absent; no other *client-contract* branch; SupabaseGameApiV2.ts has `fetch?: typeof fetch`.
- Q7. C20 V10 follow-ups (tests + checks only). Branch ai/codex-v10-followups. Report reports/v10-followups.md. Gate: v2-boss-fight on main (C12 merged); supabase/tests/v2/deploy-list.test.ts absent.
- Q8. C15 Founder batch grant (DRAFT; never merged without D8). Branch ai/codex-v29-founder-grant. Report reports/v29-founder.md. Gate: docs/cutover-v2.md on main (A22: section 6 Founder spec); `create function public.v2_grant_founder` in supabase/migrations/20261101000000_v2_cat_rpg.sql; no founder migration on main; no other *founder* branch.
- Q9. C8 V26 e2e v2 loop (demo mode). Branch ai/codex-v26-e2e. Report reports/v26-e2e.md (+ reports/v26-e2e/*.png). Gate: MockGameApiV2.ts and game/v2/loopV2.ts on main; V16 merged on main (StageLayout.tsx no longer imports sampleState, game/stage/ exists); V19 arena render merged (game/arena/ has the Phaser arena, not only C14's cue files). Not on main: stack on ai/codex-v16-stage (rule A5; it carries Q4 if Q5 stacked) when its report is DONE; else WAITING.
- Q10. C17 flag-flip branch (prepared, NEVER merged before the V29 cut-over day; guarded, report only). Branch ai/codex-v29-flag-flip. Report reports/v29-flag-flip.md. Gate: V16 merged on main (as in Q9), or stack on ai/codex-v16-stage if DONE (rule A5). Else WAITING.
- Q10b. CL10 Relic mint wiring in the v2 Forge (plan card CL10). Branch ai/codex-v20b-relic-wiring. Report reports/v20b-relic-wiring.md. Gate: V16 on main or stack on ai/codex-v16-stage if DONE (rule A5); v2-relic-forge on main (C7).
- Q11. CL9 cut-over REHEARSAL (prep only; execution is a HARD STOP for the user + Claude). Branch ai/codex-v29-rehearsal. Report reports/v29-rehearsal.md. Gate: C15 (Q8) DONE (stack on ai/codex-v29-founder-grant) and C17 (Q10) DONE or WAITING (rehearse without it then).
- Q12. CL8 apply-numbers PREP (report only; applying numbers is a HARD STOP until the user signs D4). Branch ai/codex-v6g-apply-plan-report (report-only branch). Report reports/v6g-apply-plan.md. Gate: Q3 C5e DONE (branch ai/codex-v6f-rebalance).
- Q13. Later (record WAITING): C18+ fix cards, one bug per card, only when a QA report (Antigravity G8, reports/qa-v2-1.md on any ai/antigravity-* branch or main) names the bug: fix it on its own branch ai/codex-fix-<slug> with a regression test. Hard stops never to do: CL8 applying numbers, V29 execution (apply_migration, merging C17, flag flip on main), CL7 final class art (needs the user's references/previews: Antigravity prepares). Gate: main-state/user authorization checks described in card.
