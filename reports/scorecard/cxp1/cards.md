# CXP1 scoped builder cards

Base: detached `7a66b14f4e1bb9816235ee3195a2f15745180031`; reuse PR #240.
Builder: this independent Codex session, inherited model/effort. No agents.
Authority: assignment overrides the mega merge/full-gate workflow. No push,
merge, deploy, live write, auth repair, or shared BASE0 repair. No self-score.

Dependency: P1 audit -> B1 API/tests/decision -> B2 targeted verification and
scratch mutants -> B3 report/commit. P2 demo review can run alongside B1.

| Card | Exact paths | Goal and proof | Done when |
| --- | --- | --- | --- |
| P1 | packages/game-rules/src/v2/meta/pets/**; apps/web/src/pets/**; apps/web/src/game/v2/{loopV2,storeV2}.ts (read); apps/web/src/game/stage/progress.ts (read); apps/web/e2e/v2/pets-preview.spec.ts | Audit every sections 10/11 CXP1 line, trace the actual acknowledged claim delta and persistence schema | Acceptance matrix and source/limitations documented |
| P2 | docs/proposals/rune-skill-system/{design.md,plan.md,demo/**} (read); reports/scorecard/cxp1/demo-* | Review Companions mechanics at 1280x720 and 1600x900; exercise hunt, adopt, feed and equip; explain deliberate preview differences | Current browser evidence, no copied content or numbers |
| B1 | apps/web/src/pets/state.ts + tests; packages/game-rules/src/v2/meta/pets/README.md; docs/decisions/pets-preview.md; docs/design/decisions.md | Document stable API, provide React subscription hook, strengthen concurrency/parse/equip tests; authorize DEMO_PREVIEW numbers | Existing assertions preserved, targeted tests green |
| B2 | reports/scorecard/cxp1/{logs,tools}/**; apps/web/e2e/v2/pets-preview.spec.ts | Run pnpm 10.28.0 targeted rules/store/isolation tests and focused persistence at both sizes on 4340–4343, repeat 10; at least five distinct behavioral mutants in scratch copies | Commands/exits recorded, mutants fail assertions, original remains green |
| B3 | reports/cxp1.md; reports/scorecard/cxp1/** | Review full scoped diff, scan for secrets/integrity issues, record runtime/acceptance gaps, commit with required author and suffix | Clean detached HEAD, exact commit handed to coordinator |

Full-app e2e, all-screen audits, full fresh-worktree gates, independent grading,
same-day main comparison, push and merge remain with the coordinator. Older
reports/cxp1 evidence is historical until explicitly rerun here.
