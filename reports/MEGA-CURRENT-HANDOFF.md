# Taskbar Hero — current handoff
Updated: 2026-11-03T00:11:37+07:00. ACTIVE single-session execution.
Authority: user's 2026-11-02 evening prompt supersedes historical orchestration/dependencies.
STOP preserved in /Users/bao/taskbar-hero/.codex-orchestrator/STOP; never run orchestrator.py.
Repo private; author ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>.
Last merged/main: 9c457a3e56b7c5813fa40e6aa20b0c14242ef26a (verified fetch).

| Item | PR/head | State |
|---|---|---|
| CXU5 | #249 / local 3678bc3 | Fix round 1 focused checks PASS (52 units/28 browser); A rerun active; current main integrated |
| CXU4 | #251 / 1581084 | NEXT after A; not blocked by #244 |
| CXU3 + CXC2 | pending | Build after A+B; frontend, independent of #244 |
| T011 + T012 + content + ART/T013 | local 12d0355 / a35a280 | P1; publish and integrate default OFF |
| CXR1 + CXR2 + CXQ1 | #245 / e99e497 + pending | Refresh after screens; preserve AA threshold |
| CXS1 + CXS2 | pending | Security evidence + submission DRAFT, never submit |
| CXN3 | #244 / db0f9d6 | BLOCKED only by complete backend source backup/restore; no merge/deploy |
| P2/P3 | pending | Only after A–F green and merged; default OFF |

Verified initial PR metadata (base SHA is GitHub-reported; current origin/main above):
| PR | Head | Base | Mergeable |
|---|---|---|---|
|249|5d778004b4f6d19b144669ad530daf8eed463c1a|9c457a3e56b7c5813fa40e6aa20b0c14242ef26a|MERGEABLE|
|251|15810841b90064be8d8083da02f35067fb4de078|9c457a3e56b7c5813fa40e6aa20b0c14242ef26a|MERGEABLE|
|245|e99e497e81b608ba4aa772475251064f6c21803c|1fb25edf4c54ada0d161e3c1dd16a4c4550aafba|MERGEABLE|
|244|db0f9d64c408825a832d808bc31cfd88f1c3a014|9c457a3e56b7c5813fa40e6aa20b0c14242ef26a|MERGEABLE|

Worktrees: ledger /private/tmp/tbh-t001-ledger; CXU5 /private/tmp/tbh-t008-cxu5.
B clean checkout: /private/tmp/tbh-cxu5-fresh-b at 3678bc3; no tracked/untracked changes.
B grade-b-r2/run.json ready, not started until A finishes; isolated 4710–4713/4750–4753.
In-flight owned PIDs: 88168 grade-a-r2 (cwd CXU5); 4700–4703. UI 90727 (4740–4743) after fixing build-directory race; six mutants passed. Ports 4700–4703 repair active; 4710–4713 B, 4720–4723 main, 4740–4743 UI free.
Unrelated listeners left untouched: 18457, 49986, OS ports 5000/7000/64xxx/65xxx.
Safety: no secrets, live DB mutation/migration/function deploy, Vercel changes, mainnet or submission.
No VITE_GAME_V2 setting changes. Existing local test configurations remain isolated.
Historical scores/evidence are not current grades. Grade files will say self-graded (fresh pass).
Current owner step: reports/OPTIONAL-USER-STEPS.md T007; exact recovery path already present.
Next 3: verify compact-panel repair; rerun A on 3678bc3 then clean B; merge only after both gates, then main/live.
