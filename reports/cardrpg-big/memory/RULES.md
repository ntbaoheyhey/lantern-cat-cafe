# Non-negotiables
REFERENCE: reports/cardrpg-big/memory/PROMPT.md
1. PROMPT.md is the verbatim source of truth. Re-read this file, STATE.md and the current prompt phase after compaction, at phase starts, before PR changes, rules edits and the report.
2. One model-driven agent. No subagents, workers, parallel codex exec, schedulers or image-generation calls. Local non-model scripts are allowed.
3. Use /Users/bao/taskbar-hero-cardrpg-big on ai/codex-cardrpg-big-2026-11-06, based on newest #332. Protect other worktrees and user edits.
4. Draft PRs only, one per phase plus integration. Never merge, deploy, access secrets or push main. Run typecheck, lint, unit, E2E and build before work pushes. Memory bootstrap was explicitly ordered immediately.
5. Card game outside battle. Battles fully automatic after Fight. Remove player skill, target, energy, defend, break and loadout play. Preserve collection, teams, rows, gear, map and rewards.
6. No new combat mechanics or manual-vs-auto target. Reuse existing systems. Only the smallest user-requested gaps from F0 may justify additions.
7. Research already exists in docs/design/cardrpg/RESEARCH.md. Read it, write a one-page auto addendum. New research only for a named gap.
8. game-rules edits only for A1-A3 automatic battle, I balance/caps, G presentation data or real bugs. Isolate each rules change with tests and before/after sims. Preserve hashes and path-limited diff.
9. Never touch live config.ts, forge, market, contracts, Supabase, wallets or Relic reading. Save format changes require versioned migration and tests.
10. Gacha uses earned stamps only, published odds and pity. Every random result and spendable balance stays off-chain and account-bound. No purchase route or NFT-eligible gacha.
11. Only deterministic, effort-gated, globally and seasonally capped Relic designs may be collectible-eligible. Design only - not minted. Nothing on-chain.
12. Original procedural art only. No copying reference-game names, silhouettes, UI or art. Record tool and parameters in assets/provenance.
13. Measure claims with raw evidence. Report MAX and hitch counts, first-use and repeat-use. No inflated self-grades or claims of completion without verification.
14. Measure from cold file:// page open, fresh profile/cache, real clicks, CPU 4x, DPR 1/2 and required sizes. Loading and transitions are included.
15. Layout first after F0 and A. Stage >=78% viewport height at 1280x720. Three camera presets, measured scale, facing, overlap and sharpness.
16. Starter slice Mochi, Soot, Clover plus chapter 1 gets F3/F4 priority. Publish docs/cardrpg3/slice.html and CHECKPOINT.md on F4, then continue.
17. Phase order F0, A, F1, F2, F3, F4, checkpoint, F5, M, I, G, F6, F7. Rerun hitch harness after phases.
18. Keep default-off flags and verify flag-off startup excludes three.js/models. Desktop 1280x720, 1440x900, 1024x600. Preserve approved nav/HUD where present.
19. Static offline docs/cardrpg3/index.html, builder tools/cardrpg-big/build.mjs, REFERENCE lines at demo top and every report section. Old demo remains available.
20. Report <=about 150 lines with 8-10 Vietnamese lines first, all eleven complaint self-grades, every missed gate, exact demo path and draft links. Publish report and STATE.md mirror to ledger.
21. Update STATE.md after every finished step and at least every 45 minutes. Keep decisions, exact numbers, SHAs, failures and next three actions. PROGRESS.md about every 90 minutes.
22. Phase-end self-check compares each prompt requirement, records pass/fail/not yet and fixes gaps or labels misses. Park half-wired WIP on a named commit excluded from PRs.
23. Delivery priorities if constrained are F0, A, F1, F2, hitches, starter F4/F3, checkpoint, F5, M, I, G, remaining cats, F7. Always deliver playable demo and honest report.
24. Lane A owns I, G, meta screens/CSS, main demo/build, coverage, integration and merged report. Lane B owns 3D/F6, remaining art/audio and default-off auto-extras. Never edit its worktree.
25. Sync only through append-only A-OUTBOX on ai/codex-cardrpg-big-sync. Read B-OUTBOX at starts/ends, before PR/grey edits and after compaction. CLAIM each phase. OWNERSHIP.md is immutable.
26. Atomic /tmp/cardrpg-big-locks/timing.lock before timing/matrix/profile/lifecycle/E2E, owner PID/task/time, release in finally. Wait on live lock, stale after3h/dead PID. Other heavy work nice10. Ports5910-5913.
27. I and G draft branches are siblings from340. Lane A owns grey edits, answers B requests and later merges chains in integration draft, validates five gates, announces CHECKPOINT for B remeasurement.
28. Phase order I→G→M follow-ups→integration→F7. Ask B for playEntrance(catId)/reveal camera. Final sims extrasON/OFF, defaultOFF retained. Merged report includes Lane B delivered with evidence.
