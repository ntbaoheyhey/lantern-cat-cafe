# Mega ledger — living draft

**ACTIVE: explicitly resumed2026-11-01.** Latest authority: [balanced resume](mega-resume-2026-11-01.md); read [current handoff](MEGA-CURRENT-HANDOFF.md).

Updated 2026-11-01. Current authority: [mission](mega-mission.md); [task cards](mega-plan.md). Previous narrower run archived in [prior ledger](mega-ledger-prior-run.md). No earlier grade is accepted as current evidence.

| # | item | base | branch | PR URL | state | rounds | last verify | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | BASE0 (DENO0 repair card) | main | ai/codex-mega-deno0 | https://github.com/ntbaoheyhey/taskbar-hero/pull/246 | GRADING | 2 | 280ff4b full265/265 and repeats700/700 eachsize; 25mutants killed | Fresh A/B running; historical A0/B97/Cinterrupted retained; no merge |
| 1 | FXRB | main | ai/codex-fxrb | https://github.com/ntbaoheyhey/taskbar-hero/pull/243 | IN-PROGRESS | 0 | Targeted build evidence complete; full gates pending | Reuse existing branch/PR; fresh gates required |
| 2 | CXN3 | main | ai/codex-n3-cutover-truth | https://github.com/ntbaoheyhey/taskbar-hero/pull/244 | IN-PROGRESS | 0 | Targeted build evidence complete; full gates pending | Reuse existing branch/PR; fresh gates required |
| 3 | ART1 | main | ai/codex-art1 | https://github.com/ntbaoheyhey/taskbar-hero/pull/247 | IN-PROGRESS | 0 | NOT VERIFIED in this mission | Queued under full mission |
| 4 | CXP1 | main | ai/codex-cxp1 | https://github.com/ntbaoheyhey/taskbar-hero/pull/240 | IN-PROGRESS | 0 | NOT VERIFIED in this mission | Reuse existing branch/PR; fresh gates required |
| 5 | CXL1 | main | ai/codex-cxl1 | https://github.com/ntbaoheyhey/taskbar-hero/pull/248 | IN-PROGRESS | 0 | NOT VERIFIED in this mission | Queued under full mission |
| 6 | CXU4 | main | ai/codex-cxu4 | — | IN-PROGRESS | 0 | NOT VERIFIED in this mission | Queued under full mission |
| 7 | CXU3 | main | ai/codex-cxu3 | — | TODO | 0 | NOT VERIFIED in this mission | Queued under full mission |
| 8 | CXU5 | main | ai/codex-cxu5 | https://github.com/ntbaoheyhey/taskbar-hero/pull/249 | IN-PROGRESS | 0 | a49906e/c5b846e;257pass/3fail eachsize | Worker stopped; evidence dirty, backed up |
| 9 | CXC2 | main | ai/codex-cxc2 | — | TODO | 0 | NOT VERIFIED in this mission | Queued under full mission |
| 10 | CXP2 | main | ai/codex-cxp2 | — | TODO | 0 | NOT VERIFIED in this mission | Queued under full mission |
| 11 | CXLU1 | main | ai/codex-cxlu1 | — | TODO | 0 | NOT VERIFIED in this mission | Queued under full mission |
| 12 | CXLU2 | main | ai/codex-cxlu2 | — | TODO | 0 | NOT VERIFIED in this mission | Queued under full mission |
| 13 | ART2 | main | ai/codex-art2 | — | TODO | 0 | NOT VERIFIED in this mission | Queued under full mission |
| 14 | CXR1 | main | ai/codex-redesign-cxr1 | https://github.com/ntbaoheyhey/taskbar-hero/pull/245 | TODO | 0 | NOT VERIFIED in this mission | Reuse existing branch/PR; fresh gates required |
| 15 | CXQ1 | main | ai/codex-cxq1 | — | TODO | 0 | NOT VERIFIED in this mission | Queued under full mission |
| 16 | CXR2 | main | ai/codex-redesign-cxr2 | — | TODO | 0 | NOT VERIFIED in this mission | Queued under full mission |
| 17 | CXN4 | main | ai/codex-cxn4 | — | TODO | 0 | NOT VERIFIED in this mission | Queued under full mission |
| 18 | CXN5 | main | ai/codex-cxn5 | — | TODO | 0 | NOT VERIFIED in this mission | Queued under full mission |
| 19 | CXL2 | main | ai/codex-cxl2 | — | TODO | 0 | NOT VERIFIED in this mission | Queued under full mission |
| 20 | CXG1 | main | ai/codex-cxg1 | — | TODO | 0 | NOT VERIFIED in this mission | Queued under full mission |
| 21 | CXG2 | main | ai/codex-cxg2 | — | TODO | 0 | NOT VERIFIED in this mission | Queued under full mission |
| 22 | ART3 | main | ai/codex-art3 | — | TODO | 0 | NOT VERIFIED in this mission | Queued under full mission |
| 23 | CXS1 | main | ai/codex-s1-security-docs | — | TODO | 0 | NOT VERIFIED in this mission | Queued under full mission |
| 24 | CXS2 | main | ai/codex-s2-submission | — | TODO | 0 | NOT VERIFIED in this mission | Queued under full mission |
| 25 | REGRESSION | main | ai/codex-mega-regression | — | TODO | 0 | NOT VERIFIED in this mission | Queued under full mission |

| 26 | CXN3-FIX (P0) | CXN3/BASE0 | ai/codex-cxn3-fix | — | TODO | 0 | NOT VERIFIED | Ten live findings; reports/cards/CXN3-FIX/brief.md |
| 27 | CXQ1 Demo path (P1 gate) | current merged screens | ledger QA card | — | PREPARING | 0 | NOT VERIFIED | Three-minute live path after every P0/P1 merge |

## Corrections and scheduling decisions

- CORRECTED (mission round 0): previous ledger forbade merges/art/live changes; current brief authorizes specified actions behind strict gates. Previous verification results remain historical and untrusted until re-run.
- Preserve CXR1 #245 and dirty CXR2 work, but defer execution until all UI prerequisites merge.
- Reuse #240/#243/#244; no duplicate PRs. #241 remains the log/delivery PR and becomes eligible for a docs-only gated merge at mission completion (the newer explicit delivery instruction takes precedence over the older never-merge-log sentence).
- Existing dirty primary and unrelated worktrees remain untouched; the clean-worktree completion requirement applies to worktrees created/modified for this run. Never discard user edits to manufacture cleanliness.
- Baseline completed in a fresh detached worktree: unit/typecheck/lint/build/classic/bundle green; e2e 249 pass/3 fail; Deno import guard 80 unresolved edges; one baseline broken link. No score or merge recorded.

- Added DENO0 before merge queue: main import guard fails on missing explicit-index aliases; implementation and full gates required. Branch ai/codex-mega-deno0, state IN-PROGRESS, round 0, no score/PR/merge yet. FXRB and CXN3 independent builders are running in isolated worktrees with Astra Ultra, priority service; no graders have run.

- Baseline gate repair plan update: DENO0 is a build card folded into the added BASE0 prerequisite PR. Fresh complete e2e also found a stage-recreation failure and two pre-existing shell HUD height regressions, so separate merges cannot satisfy the required green-main gate. BASE0 will carry the smallest combined repairs; FXRB retains its own existing PR for the stronger resize-repeat evidence. No assertions are removed or weakened. The shell work restores existing responsive compatibility and does not add a mobile redesign. This interpretation follows the stricter complete-suite requirement plus the explicit instruction to rebuild already-merged work when it fails. DENO0 branch is reused as BASE0 delivery branch to avoid duplication.

- FXRB builder b5fd48e: 120 resize repeats pass; 3/3 mutants detected; code unchanged from reused fix; full gate still pending BASE0. CXN3 builder 6257c0e: classifier 9/9, PGlite 4/4, mutations 11/11; live probes 17 pass/10 fail (oversized 401 plus boss timeouts). Both pushed to existing branches; neither scored or merged.

- BASE0 complete exploratory run: 253 passed/1 failed; narrow topbar height must remain <=72 (assertion preserved). GUI audits: 18 guest and 18 local signed-in states have zero findings; initial effects pass 9/9. Harness writes to historical reports were restored only in this run-owned worktree; opt-in output repair added to BASE0 before editing. No merge or score.

- ART1 builder 4df594a: pipeline/docs/434-slot manifest committed; 36 targeted tests, ten repeat runs and 8/8 mutants detected. Eight contact sheets cover 44 reference views. Unpushed pending coordinator inspection; no score. CXP1 and CXL1 independent P/B cards started while BASE0 repeat/full-size verification continues.

- ART1 targeted suite re-run by coordinator: 36/36 pass; branch 4df594a pushed and draft PR #247 opened. Independent/full gates remain pending.

- Independent BASE0 preflight completed with five findings: classic1600 expectation and gated clipping are repaired; action-text/XP readability are assigned to an isolated HUD repair builder, and actual effects navigation verification is assigned to coordinator. No score was issued; all findings remain tracked until reverified.

- CXP1 64cf350 and CXL1 178f379 pushed after builder handoff; CXL1 draft #248. CXU4 and CXU5 independent UI builders started in isolated worktrees. BASE0 HUD repair runs separately; coordinator owns effects navigation verification. No formal grade or merge.

- User explicitly resumed after reliability setup. Three isolated native subagents (Astra Ultra) own BASE0 HUD, CXU4 and CXU5. Current source checks and two formal grades remain pending; no merge or release is authorized merely by resumption. See MEGA-CURRENT-HANDOFF.md.

- Resume2026-11-01T17:55:39+07:00: BASE0 first; prepared-item merge order FXRB, CXP1, CXL1, ART1, CXN3, CXU5, CXU4, with every full gate and fresh grades. After that P0 core, P1 judging/QA/security/submission, P2 optional UI/game rules, P3 expansions. Complete scope retained. See priority plan; dependency ambiguities do not block BASE0 verification.

- User decision2026-11-01T17:57:12+07:00: initialP1 covers all mergedcore; QA/security/submission evidence is extended afterP2/P3. OldoptionalUI/allitems dependency cycle is removed for initialP1, implementation dependencies retained. BASE0-FINISH andCXQ1-DEMO-PATH native workers active; see runtime.

- Latest user steering2026-11-01T18:00:43+07:00: coordinator now directly builds/fixes/verifies/reports. Two just-launched builder/QA agents have STOP controls and must release ownership before takeover. Future workers primarily mandatory independent graders, max2(or1afterrecent429); grouped grading up to3readyitems allowed under unchanged exact-head gates. P1 merged-core decision preserved.

Coordinator clock repair milestone:114/114focused cases, typecheck/lint/fullrootunits exit0 on working source. Shared test-only clock fixes all six additional failuresuites without productionchanges. Successor source commit and fresh exact-head gate follow; no formalgrade/merge yet.

- BASE0currentproof publishedc388d57; exacthead5db4949. G1-G7builderchecks complete; two independent grades stillrequired. Latest research directive captured inreference-usage andcast-observations.

- 2026-11-01T18:43:31+07:00: BASE0 independent graders A/B launched on unchanged 5db4949, isolated ports 4420–4424 / 4430–4434. Candidate remains immutable while grading; no formal score or merge. Latest research requirement remains in source usage and priority cards.

- 2026-11-01T18:51:49+07:00: read-only public artifact baseline matches current main across31files; candidate5db4949 differs as expected. Provider commit metadata unobserved. Both independent graders remain active; no merge.

- 2026-11-01T19:08:17+07:00: independent BASE0 A round1 FAIL, final0/100(A7), raw72.9167; repeat1280 469pass/1fail at errors-notice.ts81, repeat1600 470pass. Quality findings: unusedcompact prop, duplicated narrow context CSS. B still independent/running. Coordinator reproduces unmodified source in mega-base0-repair-r2, PID31494,ports4380–4384; candidate branch stays5db4949.

- 2026-11-01T19:17:45+07:00: GB-R1 completed97PASS; GA-R1 remains0FAIL. Difference>5 invokes freshindependentGC-R1 (briefpushed10d2f68), candidateunchanged. Coordinator reproduced a distinct stale-pauseAt setup race and fixed clockorigin in isolated WIP; original craft locator failure stillreproduces4/100 withouttrace. No merge.

- 2026-11-01T19:34:39+07:00: successor280ff4b committed detached after100/100originalcase and meaningful clock/lifecycle negativecontrols. Fresh full verifierPID45517 starts atsameSHA, expanded12spec repeats. PR246 stays5db4949 whileCgrades. No merge; oldproof not reused fornewhead.

- Provider429 interrupted C and recovery; mandatory C stillnotgraded, PRhead stays5db4949. Local280ff4b fullsuitesgreen,700expandedrepeats at1280green,25mutants/16controls/clean. Currenthandoff/runtime contain recovery deadlines and workerlimit.

- 2026-11-01T19:51:33+07:00: latest userauthorizes coordinatorfallback when subagents unavailable and requests contextdiscipline. No furtherC recovery scheduled; interruptedC evidence preserved, no score invented. Local280ff4b verification continues withPID45517; sourcePRstill5db4949; no merge.

- 2026-11-01T22:00:20+07:00: user resumed. PR246280ff4b/main1fb25ed/publishedledger2088154 confirmed unchanged. Full repaired-head evidence complete; G7 publication confirmed. Two fresh independent round2 grades prepared; historical round1 failure/Cinterruption retained. No merge. Heartbeat reactivated30minutes.
