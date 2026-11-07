# A4 working rules (v2)
1. One agent; no subagents, workers, codex exec or generative-model calls.
2. Battles fully automatic. In-fight input only speed/pause/skip/camera.
3. Never reintroduce choose-3 skills, energy/break bars, flavour wheels or manual-play advantage.
4. Gameplay depth is pre/between fights: roster, formation, traits, tactics, gear, routes and economy.
5. Own cardrpg rules except auto-extras, meta screens, meta CSS, main demo, A tools/docs/reports.
6. Never edit B battle renderer, turn3d, battle CSS, look assets/tools/docs, auto-extras or B worktrees.
7. No changes to config.ts, contracts, supabase, wallet/SIWE/auth, Relic/Fuji paths, .github or secrets.
8. No runtime dependency additions. No main checkout/reset/stash; no other worktree deletion.
9. New mechanics behind gameplayV4 in cardrpg. Demo ON, live default unchanged. OFF hashes exact.
10. Migrate saves with version bump and tests; old saves load in both modes.
11. baseline-v1.html must remain 23,937,000 bytes / 9a5f6ebbb04af56c19f11cf43cf2763b35df2bde3b7a8dcd943060e878d793d3.
12. Original cozy-cat content only; research names only in research docs; never download reference art.
13. Earned currency only; NFT design + local enforcement only; Fuji Relics only, no contracts/tokens/funds.
14. Append only A-OUTBOX, max eight lines/entry. Read B at phase boundaries, before PRs, after compaction.
15. CLAIM before phase. Sync pull --rebase; retry pushes up to four with 2/4/8/16-second delays.
16. Typed events-v4 plus A fallback for battle mechanics; request B rendering without blocking.
17. Timing/browser/E2E and long sims use with-timing-lock; <=2–3-minute CPU slices where possible, 6.5-second minimum handoff.
18. Ports 5910-5913; temp /tmp/cardrpg-a4-*; kill own PIDs only. Check disk first.
19. Never run B 860-case matrix; full204 screenshot pack only once on last artifact.
20. Each phase: typecheck, lint, web unit, rules unit, E2E + build; retain failing logs, at most two fix rounds.
21. Each rule: unit + sim. Each new screen: E2E, 1280/1440/1024 captures, no overflow, contrast >=4.5.
22. Before PR: rules, STATE first20, phase text, outboxes, author, protected-path diff, OFF hashes.
23. Draft PRs only, stacked from #358; never merge/deploy/push main/Vercel/live Supabase.
24. Update STATE each phase and mirror to ui-ledger. Park WIP in named commits, never half-wired.
25. Report measured evidence only; PARTIAL/NOT VERIFIED/MISS allowed, never claim unmeasured success.
26. Do not regress startup bytes/cold CPU; report inherited misses and 32MB exception honestly.
27. Required phases G0,R,D,P1,P2,P3,P4,P5,P6,P7 in order; research and design committed before implementation.
28. Every missed gate/request/decision belongs in report; blocked item parked, continue other work.
29. User update: no screen use for research. Use background web search/text/PDF sources; no CUA/browser interaction. Local app validation stays headless and must not take over the desktop.
