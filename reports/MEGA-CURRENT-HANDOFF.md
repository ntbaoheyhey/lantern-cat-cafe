# Taskbar Hero — current handoff
Updated: 2026-11-02T23:53:52+07:00. ACTIVE: fresh single-session execution; no helpers or timers.
Authority: user's 2026-11-02 evening prompt supersedes historical orchestration/dependencies.
STOP preserved in /Users/bao/taskbar-hero/.codex-orchestrator/STOP; never run orchestrator.py.
Repo private; author ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>.
Last merged/main: 9c457a3e56b7c5813fa40e6aa20b0c14242ef26a (verified fetch).

| Item | PR/head | State |
|---|---|---|
| CXU5 | #249 / local a4dc85e | Pass 1 green (51 units, 18 browser); grader A running; current main integrated |
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
In-flight owned PIDs: 82640 finite grade-A test runner (cwd CXU5). Reserved ports 4700–4703 A, 4710–4713 B, 4720–4723 main: free.
Unrelated listeners left untouched: 18457, 49986, OS ports 5000/7000/64xxx/65xxx.
Safety: no secrets, live DB mutation/migration/function deploy, Vercel changes, mainnet or submission.
No VITE_GAME_V2 setting changes. Existing local test configurations remain isolated.
Historical scores/evidence are not current grades. Grade files will say self-graded (fresh pass).
Current owner step: reports/OPTIONAL-USER-STEPS.md T007; exact recovery path already present.
Next 3: finish exact a4dc85e A gate; clean checkout B tests then full diff; merge only if both pass and verify main/live.
