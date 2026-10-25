# Codex master summary

Revised prompt: branches and reports only; D10 MADE; stacking on own DONE branches authorized; no PRs, merges to main, live writes, or deployments. Started 2026-10-25 (UTC+7).

## Start state

```text
$ git fetch origin +main:refs/remotes/origin/main && git log origin/main --oneline | head -30
3379777 feat(web): v2 Help tab content (A23 / V27e) (#169)
5faabb1 feat(web): boss gate gated/no_key/rematch states (A21 / V19d) (#168)
665cab4 feat(web): presentational HUD pieces for v2 stage (A20) (#167)
67cd5ed feat(web): arena cue builder and fixtures (C14 / V19) (#166)
c95f0ce feat(functions): v2-boss-fight Edge Function and timeline big/dodged flags (C12 / V10) (#165)
cdcb0cf feat(game-rules): config-driven chapter pacing, boss strength and first-clear keys (C5d / V6e) (#164)
befd8eb docs: draft v2 pitch slide outline (card A27a) (#163)
7c99d80 docs: add class reference request sheet and screenshots (card A26) (#162)
6d7e7d8 docs: add V29 cut-over runbook (card A22) (#161)
a42765c feat(web): wire specific item icons into loot and forge, add chest room backdrop (v19c) (#157)
6ea287d C7 V11 forge functions (#158)
2ae5f7e test: raise remaining sim test timeouts to 180s (they sit at 40-60s, near the 60s limit under load) (#160)
c559e45 feat(sim): diagnose V6d rebalance and document remaining blockers (#159)
4dd8e68 C6 V9 state functions (#155)
d8a97ab test: raise sim determinism test timeout (runs take ~21s, limit was 20s) (#156)
443f307 feat(sim): document bounded V6c rebalance fallback (#154)
9ea63de A17 V24g backdrop view + map thumbnails (#153)
544263a feat(web): wire specific item icons into bag and character panels (v17b) (#152)
7eb6da5 test: add deterministic v2 demo save fixtures (#151)
1970318 test(a11y): add accessibility and reduced-motion audit for v2 components (v27d) (#150)
31689de C5 V6 balance sim + numbers proposal (#148)
3bf17cb C4 V12 demo API + v2 views (#146)
e55b8e8 feat(art): chapter backdrops pixel art format, rooms, and tests (v24f) (#143)
e0227f6 feat(boss): add v2 boss gate panel with portrait and status logic (v19b) (#142)
9e6985a A13 V19a loot components (#147)
cb6f543 feat(art): add 24 armor and accessory pixel icons with tests and report (v25c) (#149)
6aa9d25 feat(web): add isolated v2 game loop and API switch (#145)
41c5370 Add v2 Supabase browser adapter and session guard (#144)
24a3e27 docs(v2): player guide and judge demo script (V27c) (#141)
2a5825a R0: boss keyCost and lossCooldownSeconds in V2_CONFIG (#140)
[exit 0]

$ git ls-remote --heads origin 'ai/*' | awk '{print $2}' | sed 's#refs/heads/##' | sort
ai/antigravity-b3-ag2
ai/antigravity-b3-ag3
ai/antigravity-b5-ag6
ai/antigravity-pitch-v2
ai/antigravity-v16-hud
ai/antigravity-v17b-icons-wiring
ai/antigravity-v18-classpicker
ai/antigravity-v19a-loot
ai/antigravity-v19b-boss-gate
ai/antigravity-v19c-loot-icons
ai/antigravity-v19d-boss-gate-states
ai/antigravity-v20-forgeui
ai/antigravity-v21-map
ai/antigravity-v22-class-refs
ai/antigravity-v23-gear
ai/antigravity-v24a-ch1
ai/antigravity-v24b-ch2
ai/antigravity-v24c-ch3
ai/antigravity-v24d-ch4
ai/antigravity-v24e-ch5
ai/antigravity-v24f-backdrops
ai/antigravity-v24g-backdrop-view
ai/antigravity-v25-icons
ai/antigravity-v25b-frames
ai/antigravity-v25c-item-icons
ai/antigravity-v27a-content-docs
ai/antigravity-v27b-docs
ai/antigravity-v27c-guide
ai/antigravity-v27d-a11y
ai/antigravity-v27e-help
ai/antigravity-v29-runbook
ai/codex-b3-cx2
ai/codex-b3-cx3
ai/codex-b5-cx6
ai/codex-check-live-v2
ai/codex-s1-state
ai/codex-s1-state-r2
ai/codex-s2-bag
ai/codex-s2-bag-r2
ai/codex-v10-boss-fn
ai/codex-v11-functions
ai/codex-v12-demo
ai/codex-v16a-loop
ai/codex-v19-cues
ai/codex-v26a-fixtures
ai/codex-v3-idle
ai/codex-v4-loot
ai/codex-v4b-lootcheck
ai/codex-v5-forge
ai/codex-v6-balance
ai/codex-v6c-rebalance
ai/codex-v6d-rebalance
ai/codex-v6e-levers
ai/codex-v7b-adapter
ai/codex-v9-functions
[exit 0]

$ git ls-tree --name-only origin/main supabase/functions/ | grep v2-
supabase/functions/v2-boss-fight
supabase/functions/v2-choose-class
supabase/functions/v2-claim
supabase/functions/v2-craft
supabase/functions/v2-equip
supabase/functions/v2-lock
supabase/functions/v2-relic-forge
supabase/functions/v2-salvage
supabase/functions/v2-state
[exit 0]

$ git ls-tree --name-only origin/main apps/web/src/game/ apps/web/src/game/arena/ apps/web/src/layout/hud/ docs/v2-plan.md
apps/web/src/game/DemoNote.tsx
apps/web/src/game/Hud.test.tsx
apps/web/src/game/Hud.tsx
apps/web/src/game/LoadNotice.tsx
apps/web/src/game/StripScene.ts
apps/web/src/game/apiSwitch.test.ts
apps/web/src/game/apiSwitch.ts
apps/web/src/game/arena/arenaFixtures.test.ts
apps/web/src/game/arena/arenaFixtures.ts
apps/web/src/game/arena/cues.test.ts
apps/web/src/game/arena/cues.ts
apps/web/src/game/arena/index.ts
apps/web/src/game/combat
apps/web/src/game/createGame.ts
apps/web/src/game/demoNote.css
apps/web/src/game/errorStates.test.tsx
apps/web/src/game/gameState.test.ts
apps/web/src/game/gameState.ts
apps/web/src/game/loadNotice.css
apps/web/src/game/rig
apps/web/src/game/store.test.tsx
apps/web/src/game/store.ts
apps/web/src/game/v2
apps/web/src/layout/hud/HudBar.test.tsx
apps/web/src/layout/hud/HudBar.tsx
apps/web/src/layout/hud/LevelXpBar.test.tsx
apps/web/src/layout/hud/LevelXpBar.tsx
apps/web/src/layout/hud/PowerChip.test.tsx
apps/web/src/layout/hud/PowerChip.tsx
apps/web/src/layout/hud/ProgressChip.test.tsx
apps/web/src/layout/hud/ProgressChip.tsx
apps/web/src/layout/hud/StacksBar.test.tsx
apps/web/src/layout/hud/StacksBar.tsx
apps/web/src/layout/hud/hud.a11y.test.tsx
apps/web/src/layout/hud/hud.css
apps/web/src/layout/hud/index.ts
[exit 0]

$ git show origin/main:apps/web/src/layout/StageLayout.tsx | grep -n sampleState
23:import { useSampleStateV2 } from './sampleState';
[exit 0]

$ git ls-tree origin/main apps/web/src/game/stage/
[exit 0]

$ git show origin/main:docs/proposals/numbers-v2.md | grep -n "User: ____"
729:User: ____ (approved / changes)
[exit 0]

$ git show origin/main:packages/game-rules/src/v2/config.ts | grep -nE "dailyKeys|walkTimeMs|baseHp|firstClearKeys"
9:    baseHp: 100,
24:    walkTimeMs: 1000,
29:    dailyKeys: 1,
100:    firstClearKeys: 0,
[exit 0]

```

## Queue

| card | status | branch | merged yes/no | what the user must decide |
|---|---|---|---|---|
| Q0 | DONE | ai/codex-v2-plan-doc | no | none |
| Q1 | DONE | ai/codex-check-live-v2 | no | Live health not verified: environment network errors; rerun from reachable host. |
| Q2 | DONE-ON-MAIN | main | yes | Hand-built chapter 5 fixture retained; regenerate only after D4/CL8. |
| Q3 | DONE | ai/codex-v6f-rebalance | no | D4: NOT READY; growth and boss-check fail strict and relaxed; wait for pacing/classes follow-up. |
| Q4 | DONE | ai/codex-v19-arena | no | Review viewport screenshots; merge before V16. |
| Q5 | DONE | ai/codex-v16-stage | no | STACKED ON ai/codex-v19-arena @ 16911ac: merge that first; review screenshots. |
| Q6 | DONE | ai/codex-v7c-client-contract | no | Manual real JWT/gateway/Fuji checks remain. |
| Q7 | DONE | ai/codex-v10-followups | no | Deno check NOT VERIFIED: unavailable; workflow unchanged. |
| Q8 | DONE | ai/codex-v29-founder-grant | no | D8: approve contents/cutoff/eligibility; apply_migration BEFORE merge; draft only. |
| Q9 | BLOCKED | ai/codex-v26-e2e | no | STACKED ON V16 fd318c4. Equip best drops second upgrade; Q9 forbids required product fix; authorize fix card then rerun. |
| Q10 | DONE | ai/codex-v29-flag-flip | no | STACKED ON V16 fd318c4. D6 hard gate; never merge before cut-over; Q9 bug unresolved; revert code commit 28a5469. |
| Q10b | DONE | ai/codex-v20b-relic-wiring | no | STACKED ON V16 fd318c4; USER must perform real Fuji mint/shared-limit/recovery test. |
| Q11 | DONE | ai/codex-v29-rehearsal | no | STACKED ON Founder 235298d; D8/D6 and every live cut-over step remain USER-only. |
| Q12 | DONE | ai/codex-v6g-apply-plan-report | no | D4 hard stop: 34 leaves, 26 changes, injected test impact documented; proposal NOT READY; no numbers applied. |
| Q13 | DONE | ai/codex-later-qa-report | no | Both named QA1 findings fixed in separate branches; later findings WAITING; Q9 bulk-equip needs eligible QA source or explicit scope. |
| Q13a | DONE | ai/codex-fix-decorative-key | no | QA1 finding 1 fixed; STACKED ON V16 fd318c4; full final tests and 53 browser tests pass. |
| Q13b | DONE | ai/codex-fix-sheet-focus | no | QA1 finding 2 fixed; STACKED ON V16 fd318c4; full checks and 53 browser tests pass. |

- Q0: `15ad4b8f924e76012067dce59e4f9ff3a2e65e69`, [reports/v2-plan-doc.md](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-v2-plan-doc/reports/v2-plan-doc.md) (DONE).
- Q1: `c5aa2b53f7547108438603004f6f857b46c322bb`, [reports/check-live-v2.md](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-check-live-v2/reports/check-live-v2.md) (DONE).
- Q2: `67cd5ed522cd0b9ee680a7ad7fdcbb9bf109aff0`, [reports/v19-cues.md](https://github.com/ntbaoheyhey/taskbar-hero/blob/main/reports/v19-cues.md) (DONE-ON-MAIN).
- Q3: `9d820a0601526c0da515be7d33d43d15aeec77a6`, [reports/v6f-rebalance.md](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-v6f-rebalance/reports/v6f-rebalance.md) (DONE).
- Q4: `16911ac0932a4fdcdaaf811672e2dc3cc9e7a61e`, [reports/v19-arena.md](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-v19-arena/reports/v19-arena.md) (DONE).
- Q5: `fd318c4910e50152fdb0522593762288e76efbda`, [reports/v16-stage.md](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-v16-stage/reports/v16-stage.md) (DONE).
- Q6: `2cbbf7ff81beedb7495b9d638540039c62734907`, [reports/v7c-client-contract.md](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-v7c-client-contract/reports/v7c-client-contract.md) (DONE).
- Q7: `a3eac4a46cfc625dec4910ff40b8b4c54611e6b4`, [reports/v10-followups.md](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-v10-followups/reports/v10-followups.md) (DONE).
- Q8: `235298d29595ee5c1851ff80cdb687a5fdcdb172`, [reports/v29-founder.md](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-v29-founder-grant/reports/v29-founder.md) (DONE).
- Q9: `de1e4b64ce3b3d4d981ae13fb3f6f432a635355e`, [reports/v26-e2e.md](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-v26-e2e/reports/v26-e2e.md) (BLOCKED).
- Q10: `b82ccbaf7c2be588300014c539665f580bf030cb`, [reports/v29-flag-flip.md](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-v29-flag-flip/reports/v29-flag-flip.md) (DONE).
- Q10b: `fd1f75d85b654a3d556b8bd2cd2e44c96564c401`, [reports/v20b-relic-wiring.md](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-v20b-relic-wiring/reports/v20b-relic-wiring.md) (DONE).
- Q11: `0ca1264f15edf3422935b54340fc3fa5f16d8154`, [reports/v29-rehearsal.md](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-v29-rehearsal/reports/v29-rehearsal.md) (DONE).
- Q12: `3b5a220ca2dfe8b557f3fb913e9d0f112c44e67d`, [reports/v6g-apply-plan.md](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-v6g-apply-plan-report/reports/v6g-apply-plan.md) (DONE).
- Q13: `cf935a5ba8b8672fdd2feef7573b08398fb623d3`, [reports/later-qa.md](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-later-qa-report/reports/later-qa.md) (DONE).
- Q13a: `096327b7c5f003013a6febabaa02125fce793a49`, [reports/fix-decorative-key.md](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-fix-decorative-key/reports/fix-decorative-key.md) (DONE).
- Q13b: `3cfcdb724b7f7d086d2059fba8f1b68bf7f72dd4`, [reports/fix-sheet-focus.md](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-fix-sheet-focus/reports/fix-sheet-focus.md) (DONE).

## User must decide on return

1. **D4:** Q3's proposal is NOT READY: 7 strict targets pass, chapter-growth and boss-check fail under strict and relaxed criteria. Recommend pacing/classes follow-up before signing. Q12 lists all 34 leaves (26 changes), injected-suite impact, goldens and commands. Production numbers and the unsigned signature line remain unchanged.
2. **D8:** approve Founder contents, caps and strict `created_at < cutoff` eligibility. Q8 SQL is a draft; authorized live apply_migration is required BEFORE merging it. Q11 rehearsed batches, idempotency and rollback only in PGlite, never live.
3. **D6:** choose cutover day and go/no-go only after release gates pass. Q10 must NEVER merge early. Revert code commit `28a5469f4d5d6d23d2bf1d0178b089fb75e5a835` if necessary. C16 must be merged before CHECK_LIVE_V2=post. Main remains v1.
4. **Manual Fuji test (Q10b):** use a real signed-in wallet to verify first mint, pending receipt/reload, shared daily limit, failed reporting recovery and wrong-wallet refusal. Report gives exact steps. No transaction, signing key or live contract operation was performed here.
5. **Q9 BLOCKED:** Equip best dispatches concurrent mutations; the busy guard drops all after the first upgrade. Regression failed in both normal viewports and reduced motion. Q9 forbids the needed StageLayout/BagPanel/loop changes. The eligible QA1 report names two other accessibility bugs only (fixed independently under Q13); obtain a named QA finding or explicit scope for the bulk-equip fix, then rerun the v2 loop three times. Do not merge Q9 as a green release gate.
6. **D10 MADE:** V19/V16 were authorized by the replacement prompt. Review their screenshots and final viewport behavior. Q13 fixes await review; future findings remain WAITING.
7. **D3/D5:** final class art waits for user references/previews. D7 public repo/submission and D9 deadline remain user decisions. No public submission performed.
8. **Verification limits:** Q1 live health failed due environment network errors (NOT VERIFIED); Deno unavailable for Q7; real JWT/gateway/Fuji behavior and deployed UI remain manual. Q12 injected failures document expected application impact, not approved assertion changes.

## Review and merge order (user only)

- Independent: Q0 plan, Q1 C16 checks, Q3 simulator proposal, Q6 client contract tests, Q7 deployment-list checks. Q12 report only. Q2 C14 is already on main at `67cd5ed`.
- UI: Q4 `16911ac` → Q5 `fd318c4` → Q10b `fd1f75d`; Q13 accessibility fixes each stack directly on Q5 and may merge after Q5 in either order. Preserve later Relic wiring when resolving their StageLayout overlap. Q9 `de1e4b6` requires an approved product fix and successful repeat runs before release acceptance.
- Founder: Q8 `235298d` only after D8 and authorized live migration apply → Q11 `0ca1264` rehearsal test/report. SQL draft is not permission to execute.
- Q10 `b82ccba` LAST, only on D6 cutover with all gates satisfied, latest-main rebase and manual smoke. Its stage snapshot must be reconciled with Relic/accessibility fixes. No main flag flip, deployment, merge or live execution occurred in this session.

## Final state

All task branches/reports pushed; no PRs created. main unchanged at `337977751204b5ea59d8f0cabfb91fb4cd4a391f`. No dependency, lock/workspace, auth, contract, signed-economy or live database change. Temporary number probe removed. Worktree clean at completion.

## Final audit evidence

Read-only audit after the user requested a final missed-step check. Q9 remains an explicit stopped card; a narrow scope exception was requested, never inferred from generic continuation. QA source head remains 163127d96257329b3f00da0f43051d6fbf5ea2b7.

```text
PASS: main unchanged at 337977751204b5ea59d8f0cabfb91fb4cd4a391f
PASS: Q0 replacement approved-plan block copied verbatim
PASS: Q0 report status matches summary
PASS: Q0 protected contracts/auth/lock/workspace unchanged
PASS: Q1 report status matches summary
PASS: Q1 protected contracts/auth/lock/workspace unchanged
PASS: Q4 report status matches summary
PASS: Q4 protected contracts/auth/lock/workspace unchanged
PASS: Q5 report status matches summary
PASS: Q5 protected contracts/auth/lock/workspace unchanged
PASS: Q5 completed parent is ancestor
PASS: Q5 exact stack header present
PASS: Q3 report status matches summary
PASS: Q3 protected contracts/auth/lock/workspace unchanged
PASS: Q3 production economy/content unchanged
PASS: Q6 report status matches summary
PASS: Q6 protected contracts/auth/lock/workspace unchanged
PASS: Q7 report status matches summary
PASS: Q7 protected contracts/auth/lock/workspace unchanged
PASS: Q8 report status matches summary
PASS: Q8 protected contracts/auth/lock/workspace unchanged
PASS: Q8 only new draft migration
PASS: Q9 report status matches summary
PASS: Q9 protected contracts/auth/lock/workspace unchanged
PASS: Q9 completed parent is ancestor
PASS: Q9 exact stack header present
PASS: Q10 report status matches summary
PASS: Q10 protected contracts/auth/lock/workspace unchanged
PASS: Q10 completed parent is ancestor
PASS: Q10 exact stack header present
PASS: Q10b report status matches summary
PASS: Q10b protected contracts/auth/lock/workspace unchanged
PASS: Q10b completed parent is ancestor
PASS: Q10b exact stack header present
PASS: Q11 report status matches summary
PASS: Q11 protected contracts/auth/lock/workspace unchanged
PASS: Q11 completed parent is ancestor
PASS: Q11 exact stack header present
PASS: Q12 report status matches summary
PASS: Q12 protected contracts/auth/lock/workspace unchanged
PASS: Q12 production economy/content unchanged
PASS: Q13a report status matches summary
PASS: Q13a protected contracts/auth/lock/workspace unchanged
PASS: Q13a completed parent is ancestor
PASS: Q13a exact stack header present
PASS: Q13b report status matches summary
PASS: Q13b protected contracts/auth/lock/workspace unchanged
PASS: Q13b completed parent is ancestor
PASS: Q13b exact stack header present
PASS: Q13 report status matches summary
PASS: Q13 protected contracts/auth/lock/workspace unchanged
PASS: task worktree clean
```

Summary docs-only checks: full suite skipped: docs only.

```text
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Progress: resolved 1, reused 0, downloaded 0, added 0
Packages: +506
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 506, reused 497, downloaded 0, added 0
Progress: resolved 506, reused 497, downloaded 0, added 326
Progress: resolved 506, reused 497, downloaded 0, added 506, done

╭ Warning ─────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4,                     │
│   utf-8-validate@5.0.10.                                                     │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
Done in 2.9s using pnpm v10.28.0

```

```text

> taskbar-hero@0.0.0 gen:deno /tmp/taskbar-summary
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps

```
