# Turn3D progress

- Started 2026-11-05 16:17 Asia/Ho_Chi_Minh. Wall-clock deadline: 22:17.
- New worktree `/Users/bao/taskbar-hero-turn3d`; branch `ai/codex-turn3d-2026-11-05`.
- Verified pushed base `41a6aa3`, open draft stack #287–#291. Remote main `340f88b`.
- Main checkout has local HEAD `6144d42`; not changed. Ledger contains unrelated
  untracked evidence; only explicitly named turn3d files will be staged there.
- Frozen install passed. Baseline typecheck/lint/unit/E2E/build running, raw logs in logs/.
- No Blender. glTF Transform 4.5.1 available. Plan uses original procedural GLBs.
- Design written before implementation. No deployment, merge, server or save work.
- 16:33: user revoked helpers. All task-owned helper trees stopped; hashes and exact
  partial contributions recorded in HELPER-STOP.json and HELPER-CONTRIBUTIONS.md.
- Continuing solo in required order. Baseline 421 E2E, 1509 web, 546 rules passing.
- 16:37: T1 core reviewed and completed; 17 new turn tests pass, rules typecheck passes.
  First 360-run simulation is too forgiving (all wins, no deaths). T2 tuning underway.
- 18:20 resume audit: kept branch and five existing commits; no task-owned helper process remains.
- T3/T4 committed with event-only presenter and original cafe scene; scene-only software-rendered
  evidence is not used to claim final combat performance.
- T5: 12 original GLBs, ten clips each, 2.07 MB raw / 0.54 MB gzip; 48 real turnarounds
  captured without browser errors. Continuing solo to T6.

- 18:40 solo proof pass: T6 labels separated in screen space, enemy rows staggered;
  1024/1280/1440 no horizontal overflow and six intent labels do not overlap.
- Full inherited suite: 421 E2E, 578 rules, 1552 web, backend/auth/chain/contract all pass.
  Added one further KO regression test after fresh source review.
- Corrected model viewer role replacement, KO actor selection, healing reaction and
  paused render invalidation. Instanced VFX reduce worst draw calls ~255 to ~196;
  paused renderer busy time dropped from 15–22% to <1% in initial repeat.
- Production proof servers: localhost:5515 final, localhost:5516 baseline; dev :5511.
  No new agents. Remaining: finish performance/10-minute soak/visual self-reviews,
  build offline demo, commit/push draft stack, ledger report. Deadline still 22:17.

- 19:29 solo regrade: runtime `372c65a`; 47 focused web checks pass, latest full web
  run 1556, inherited full E2E 421. Source and four separate self-review passes recorded.
- 175/175 exact repeated effect captures now match; 13-action x1 live review recorded.
  Final production perf/isolation remeasurement in progress. Twelve GLB rebuild hashes
  unchanged, 2,073,028 raw bytes / 539,750 gzip. No new agents or remote deployments.
- Remaining: final proof receipts, offline demo + file:// checks, draft-only stack and
  ledger report. All code retained on the original ai/codex-turn3d-2026-11-05 branch.

- 19:47 continuation: confirmed no task-owned extra model-request processes. Existing
  commits and worktree retained. Bundle mismatch resolved: identical guest-v2 build
  settings show +5,250 raw / +1,565 gzip startup JS, with no Three/GLB flag-off load.
- Offline demo builder now compiles the actual TurnApp/core/presenter with embedded
  original GLBs and MIT libraries. Waiting for final 10-minute soak receipt before
  embedding measured evidence; file:// public-input checks prepared.
