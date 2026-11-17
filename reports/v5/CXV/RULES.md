# CXV V5 operating rules — REV 3 policy (source header still says REV 1)
1. Worktree /Users/bao/taskbar-hero-cardrpg-a6; branch codex/v5-vfx-2026-11-17; ports 6310–6319.
2. Prompt read once 2026-11-17T05:49Z: /Users/bao/art/codex-prompts/PASTE-CODEX-V5-CXV-VFX-2026-11-17.txt. Read only current card excerpts later.
3. Read RULES + HANDOFF after compaction/resume, before each card, every 60m; execute NEXT 1. Disk is truth.
4. NO FREEZE / END TIME. Card/commit/job completion, compaction, empty queue, or pending dependency never ends work.
5. DONE only with printed proof: no queued/active/BLOCKED cards; every refill DONE; every inbox REQ ACK+DONE; every hero skill/boss effect scores >=4/5 readability/impact/beauty/motion; latest AG1 QA has no open BLOCKER/MAJOR in owned paths.
6. When no queued/active cards, append next 3 unfinished REFILL items and start first. R1/R10 repeat when needed.
7. Final only DONE: queue, refill list, requests and quality gate complete <UTC>; STOP files require checkpoint then STOPPED: <file>. Never WAITING.
8. Own cardrpg/{battle-v3,spine,vfx-craft,vfx-layered,depth,stage}/**, game/rig/**, reports/v5/CXV/**, tools/v5vfx/**.
9. CXI owns loaders/manifests/asset indexes, spine/{assets,atlas-delivery,manifest-loader}.ts, and narrow BattleResult preload hook in depth/Encounter.tsx. scene.ts remains CXV.
10. Stage explicit owned paths only; never git add -A / git add . / commit -a. Leave ~500 old untracked ART files alone.
11. Checkpoint every step/20m: commit v5 CXV <card> <step>; push branch; retry failures 10/20/40/80s. Fold bookkeeping into substantive commits.
12. Mailbox only: append, never rewrite inboxes. Read new INBOX-CXV/BOARD/USER every checkpoint; USER wins; READY branch@sha + wiring; merge only CXI-announced v5-mN tags.
13. >2m jobs detached nohup nice -n 10; max two; record PID/log in HANDOFF. Load >10: light work first.
14. Output <=40 lines/command; inspect <=4 images at once; films through contact sheets; evidence in ignored work/v5/CXV/{jobs,learn,films}.
15. Reports <=300KB/commit, <=6 committed JPG sheets/card, <=400KB each. Keep other evidence local.
16. V0 75m, V1/V2 5h, V3/V4 4h, V5 2h; at timebox retain passing work/flag partial, revert failing remainder, log TIMEBOX, advance.
17. Only card gates; no repository-wide scans, unchanged-SHA reverification, extra FPS studies/audio, or >2 same-fix attempts without a new idea.
18. Original procedural/AG2 art only; no image generation or tracing by CXV. Owner rejected old AG2 textures pending new quality gate; fallback remains necessary.
19. Free tools preapproved after TOOL-PROPOSALS logging; self-install without account/key/payment/sudo. Dependencies require CXI REQ; owner handles login/key/payment.
20. Never secrets, deploys, hosting env vars, wallets, Fuji transactions, contracts, main-branch edits, submission.
21. HANDOFF <=30 lines: ACTIVE, exact NEXT 1, NEXT 2/3, PIDs/logs, pushed SHA, last RULES read; STATUS-VI <=12 lines; PROGRESS one line/step.
22. V1 gates: timeline/reduced-motion tests, typecheck, 12 reviewed sheets, AG4 cue list. V2: seeded 3s repeatability, feet <=1px, blink 2–6s, four hero idle/hit sheets, shared-machine boss >=55fps.
23. V3: three enemy+boss sheets, Yarn weapon/target overlap, reaction tests. V4: severity-first AG1/owner fixes. V5: caps tests + boss >=55fps, pooling/reduced motion.
24. REFILL R1 textures/scores; R2 four enemy variants (90m); R3 numbers; R4 shadows/dust; R5 statuses; R6 outcomes; R7 camera; R8 fidgets; R9 boss intro; R10 re-score/redo lowest three (60m). Others 45m.
