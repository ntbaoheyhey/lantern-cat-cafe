# V4 SHIP rules
1. Already authorized: implement, test, commit, push the named branches; no permission loop.
2. Stop only STOP-V4SHIP, an explicit user pause, or after 29 Nov 12:00 UTC.
3. Worktree /Users/bao/taskbar-hero-chain; branch codex/v4-ship-2026-11-16.
5. ART owns units, VFX, battle presentation, rigs, v3feel scripts, v3craft-lab, provenance and ART reports; never edit these.
6. SHIP owns all audio including battle-v3 battle-audio.ts, audio-timeline.ts, callouts.json and their tests; rules/UI/server/docs.
7. No secrets in files/logs/chat; no deploys, main merge, production writes or contract source edits before 21 Nov.
8. Demo: landing -> guest -> first battle -> reward/seal -> café/forge/list/buy/Spool -> boss -> wallet proof.
9. G-FUNNEL: median first battle <=30 s, <=3 clicks; median receipt <=180 s, max <=240 s; zero guest popups; all 7 steps 10/10 per size, zero path errors.
11. G-PROOF: time, AVAX fee, payer, Snowtrace per transaction; >=5 action types; complete wallet history; 4/4 real Fuji counters with aged cache.
12. G-AUDIO: -18 +/-2 LUFS; <=-1 dBTP; >=5 LU LRA; 4-8 dB duck; <=6 voices/100ms; onset +/-33ms; 10/12 intelligible lines; all primary UI sounds <=300ms; persisted mix.
13. G-UI: no clipped text; all buttons/icons labelled; <=25 body words/screen except Guide; AA text contrast.
14. G-REPO: working tree zero secrets; history findings redacted; complete README; clean-clone typecheck/tests/forge/parity/build.
15. G-REHEARSAL: production preview 10/10; median boss >=50FPS at 1280x720; <=8MB before battle; no dev-only path.
16. G-SUBMIT: real film 2:30 +/-20s, English captions + Vietnamese SRT, all 7 steps + Snowtrace; 10-12 slide contents; rubric map.
17. G-CLASS: every cat/enemy class; healer damage=0; Mochi/Panko melee, Soot ranged, Clover healer; first loss 12-20min; boss median <=110s p90 <=140s; E3-E5 pass; one reasoned parity baseline; visible class labels; Guide <=25 words/class.
18. G-REG every item/merge: web/server tests, typecheck, 3-fixture parity, build; never lower gates.
19. Learn before build: >=6 sources/item; >=1 paper/formal doc; >=3 web docs; >=1 own experiment comparing >=2 methods with numbers; cite LEARN in build commit.
20. Economy v3 frozen; classes are the sole rules exception; deterministic timing unchanged; record ONE new parity baseline and notify ART.
21. Merge ART 17 Nov 12:00, 18 Nov 12:00, 19 Nov 10:00 UTC; read SYNC; ART wins its files, SHIP keeps own; last green if tip red.
22. Freeze 19 Nov 12:00 UTC: tag and one draft PR to main; thereafter only deploy crash/flow fixes; Demo Day separate branch.
23. 20 Nov deploy support; submission checklist before 21 Nov 12:00 UTC, deadline lead 21 Nov 16:59 UTC; verify contest facts.
25. Re-anchor each item/resume/commit: date, rules/handoff/state/request, branch/status, ART requests, INBOX, QA requests to SHIP/ART, stop signal.
28. Failed gate: diagnose/fix/re-run failing check, max4 attempts then change method; timebox open items for S11.
29. Ports 5994-5998 and8546 only; never touch ART5990-5993; no pkill/killall; kill only owned PIDs or named old supervisor.
R3.1 Commit+push at every step and <=20min even failing; after resume first git status --short | wc -l, then checkpoint any WIP (no secrets).
R3.2 Jobs >2min detached to reports/v4-ship/jobs; record PID/log immediately; max3; poll ps/tail between useful work.
R3.3 Each command <=40lines/3KB; no whole file >100lines; summaries only. Image limits <=1024px,4/look,8/HANDOFF; reports<=150MB.
R3.4-R3.5 Resume read only RULES+HANDOFF <=70lines; current REQUEST item only. HANDOFF<=40lines: command-level NEXT1, PIDs/logs, pushedSHA. STATUS-VI<=25lines.
R3.6-R3.7 Never finalize a handoff/summary; run NEXT1. Valid endings only STOP-V4SHIP, explicit user pause, WAITING FOR END after29Nov12UTC.
USER: internal browser only; no native/desktop control or subagents. At every checkpoint read QA REQUESTS-TO-SHIP/ART and ART REQUESTS-TO-SHIP; fix SHIP blockers/majors.
