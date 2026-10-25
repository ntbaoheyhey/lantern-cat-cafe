# Codex master summary

Revised prompt: branches and reports only; D10 MADE; stacking on own DONE branches authorized; no PRs, merges, live writes, or deployments. Started 2026-10-25 (UTC+7).

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
| Q2 | DONE-ON-MAIN | - | yes | Hand-built chapter 5 fixture retained; regenerate only after D4/CL8. |
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
| Q13a | DONE | ai/codex-fix-decorative-key | no | QA1 finding 1 fixed; STACKED ON V16 fd318c4; full final tests and 53 browser tests pass. |
| Q13b | DONE | ai/codex-fix-sheet-focus | no | QA1 finding 2 fixed; STACKED ON V16 fd318c4; full checks and 53 browser tests pass. |

- Q0: `15ad4b8f924e76012067dce59e4f9ff3a2e65e69`, `reports/v2-plan-doc.md` (DONE).
- Q1: `c5aa2b53f7547108438603004f6f857b46c322bb`, `reports/check-live-v2.md` (DONE).
- Q2: `337977751204b5ea59d8f0cabfb91fb4cd4a391f`, `reports/v19-cues.md` (DONE-ON-MAIN).
- Q3: `9d820a0601526c0da515be7d33d43d15aeec77a6`, `reports/v6f-rebalance.md` (DONE).
- Q4: `16911ac0932a4fdcdaaf811672e2dc3cc9e7a61e`, `reports/v19-arena.md` (DONE).
- Q5: `fd318c4910e50152fdb0522593762288e76efbda`, `reports/v16-stage.md` (DONE).
- Q6: `2cbbf7ff81beedb7495b9d638540039c62734907`, `reports/v7c-client-contract.md` (DONE).
- Q7: `a3eac4a46cfc625dec4910ff40b8b4c54611e6b4`, `reports/v10-followups.md` (DONE).
- Q8: `235298d29595ee5c1851ff80cdb687a5fdcdb172`, `reports/v29-founder.md` (DONE).
- Q9: `de1e4b64ce3b3d4d981ae13fb3f6f432a635355e`, `reports/v26-e2e.md` (BLOCKED).
- Q10: `b82ccbaf7c2be588300014c539665f580bf030cb`, `reports/v29-flag-flip.md` (DONE).
- Q10b: `fd1f75d85b654a3d556b8bd2cd2e44c96564c401`, `reports/v20b-relic-wiring.md` (DONE).
- Q11: `0ca1264f15edf3422935b54340fc3fa5f16d8154`, `reports/v29-rehearsal.md` (DONE).
- Q12: `3b5a220ca2dfe8b557f3fb913e9d0f112c44e67d`, `reports/v6g-apply-plan.md` (DONE).
- Q13a: `096327b7c5f003013a6febabaa02125fce793a49`, `reports/fix-decorative-key.md` (DONE).
- Q13b: `3cfcdb724b7f7d086d2059fba8f1b68bf7f72dd4`, `reports/fix-sheet-focus.md` (DONE).

## User must decide on return

1. D4: sign economy proposal only after reviewing Q3 evidence; production numbers unchanged.
2. D8: Founder contents, eligibility cutoff and permission to apply the draft migration before any merge.
3. D10 MADE: V16/V19 authorized by replacement prompt; user reviews final screenshots.
4. D6: cut-over day; flag flip requires V16 on main and the cut-over decision.
- Q9: STACKED ON V16 fd318c4. Equip best drops second upgrade; Q9 forbids required product fix; authorize fix card then rerun.
