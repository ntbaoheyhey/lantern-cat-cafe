# Lane B rules
REFERENCE: reports/cardrpg-big2/memory/PROMPT.md
1. One agent; no subagents/workers/Codex exec/schedulers/image-generation calls.
2. Own worktree only: /Users/bao/taskbar-hero-cardrpg-big2. Preserve main and Lane A.
3. Card game outside; automatic battles. Only speed,pause,skip,camera,sound controls.
4. Rules ONLY depth/auto-extras/, default-OFF autoExtras, tests,50seeds/cell train/heldout,off hash parity.
5. No manual energy/break/loadout/card/target play; no new currencies/economy.
6. Own turn3d/**,card-effects*.ts/card-staging.ts,depth/Battle.tsx/chapter-stage.ts,battle-layout/turn3d CSS,original assets/tools/provenance,big2 tools/reports,demo3b,MECHANICS-LAB.
7. Lane A owns items/gear/economy/encounter balance,invitations,meta screens,existing rules,main demo,integration.
8. Grey files require exact outbox REQUEST; minimal SHARED-EDIT only after blocked >one phase, disclose outbox/commit.
9. Read A-OUTBOX start/end phases,before PR/grey edits,after compaction. Write only append-only B-OUTBOX; OWNERSHIP immutable.
10. CLAIM paths before phases/batches; respect A overlap. Sync commit,pull --rebase,push,retry2/4/8/16s.
11. Atomic /tmp/cardrpg-big-locks/timing.lock before ANY timing/profile/lifecycle/matrix/E2E;owner/PID/start;release finally.
12. Non-timing heavy work nice10;ports5920-5923;tmp cardrpg-big2- prefix;kill only owned PIDs.
13. Original procedural art/provenance only,no game-art copying or inputs.
14. Desktop1280x720/1440x900/1024x600;nav/HUD retained;existing flags default-off;3D excluded flag-off startup.
15. Gates:castsMAX50ms,99%<=20ms DPR1/2,postinteractiveMAX100ms,CPU4p95<=33/MAX100ms,250draws/150ktris,20battle heap/GPUflat.
16. Progress/load-to-interactive;page-open real-click trace/raw arrays;profile first;harness after fixes.
17. Three-cat batches then enemies/bosses;filmstrips/uniqueness/hitch checkpoint per batch;honest tiers.
18. No live config,forge,market,contracts,Supabase,wallet,Relic,secrets. No merge/deploy/main push;draft PR chain only.
19. Before work push:typecheck,lint,unit,E2E,build;record counts incl2expectedfails/11skips.
20. Re-read RULES/STATE15/A-OUTBOX/phase after compaction,before phases/PRs. Append decisions,record measurements.
21. PROGRESS about90min;STATE ledger mirror each phase;touch only own report/state on ledger.
22. Offline demo3b with own builder;REFERENCE lines;~150line report,8-10Vietnamese opening lines,misses/self-grades/requests.
23. No half-wired code at end;named WIP excluded from PRs. Deliver report/demo even partial.
