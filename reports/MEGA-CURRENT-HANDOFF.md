# Taskbar Hero — SYSTEM current handoff
Updated: 2026-11-03T11:49:00.097315+07:00. ACTIVE SYSTEM scope under 3Nov addendum; UI work delegated by USER.
Read FIRST after compaction; reconcile board/Git/owned PIDs before action; no duplicate tests.
Repo private; author ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>; every commit ends [skip ci].
No subagents/helper chats/orchestrator/new schedulers; user-started UI session is separate. Preserve STOP.

SCOPE: SYSTEM owns ledger/244 prerequisite,T011/T012 original data/packages/nonvisual wiring,CXQ1,CXS1/CXS2,
CXN4/CXN5 default-OFF, regression. UI owns all layout/screens/art incl249/251/245/CXR2/CXU3/CXC2.
Do not touch249,251,245 or ai/codex-ui-* branches. No UI/layout/art edits.
May edit apps/web/src only api/,wallet/,v2text/; e2e only own-script specs; no public/,tools/art/,ui-redesign/.
Only explicit reports/ui exceptions: read/reply REQUESTS-FOR-SYSTEM.md; write REQUESTS-FROM-SYSTEM-QA.md.
Own new branches ai/codex-sys-*; own ports5173–5299 only. UI5300–5399. Never edit UI worktrees.
Never combine package.json/pnpm-lock edits with UI-owned files. Neither is changed by current system work.

MERGES: before ANY merge-to-main acquire ~/.taskbar-hero-locks/merge.lock via mkdir.
If held, wait/check every2–3min up to60min; stale ONLY owner older90min AND PID dead; no blind removal.
Inside lock fetch,merge latest origin/main into own branch,rerun changed specs+typecheck+lint,merge,release rmdir.
Keep exact-head fresh A/B gate; if integration changes reviewed head, reverify rather than use stale evidence.
Append one atomic line per milestone to ~/.taskbar-hero-locks/board.log. No cross-session messages needed.
Board: UI adopted CXC2 #253/#254 evidence; CXU3 2e1f83b gate active, NOT merged/ready yet.

| Item | Verified state |
|---|---|
| T011/T012 | DONE #255/maina903fb6, A96/B96; shared original economy OFF, data publication accepted |
|244 CXN3 | db0f9d6 draft BLOCKED: complete deployed-source+deps/import maps+tested restore absent |
|CXQ1 | WAITING UI board CXU3/CXC2 merges/adoption; natural-prep run interrupted on user scope change |
|CXS1 | own ai/codex-sys-cxs1-security-overview 97a1595 atop6144d42;691-word docs+6 companions |
|CXS2 | own ai/codex-sys-cxs2-submission /private/tmp/tbh-cxs2-active atop97a1595; drafting only |
|CXN4/CXN5 | default-OFF/versioned only; conditional on earlier gates; no implementation started |
|regression | after UI/system integration; latest pre-addendum6144d42 accepted |
|UI handoff | all UI/art now UI-owned; historical accepted249/251/253+254/255/256/245 receipts retained |
|CXU3/CXR2 | drafts252/257 were PARTIAL under SYSTEM; UI now owns continuation/disposition |

Last verified origin/local main6144d42ce12d9c61dc4f863733356de99f605eb9 (245 merged BEFORE addendum).
CXR1 acceptance: A94/B94,2490core/323browser×2/40art/35assets before+after/22health/16live×2,Actions0.
No funded wallet or full timed demo claim. All prior verification PIDs finished; old test ports must not be reused.

Own active source: /private/tmp/tbh-cxs1-active, ai/codex-sys-cxs1-security-overview, 97a1595 clean.
CXS1 exact97a1595 fresh A97 PASS:691words/2490core/38classic/6mutants/builds/links.
A62344/B66562 FINISHED PASS97/97 on97a1595; clean B tests then full diff; all ports free.
CXS1 waits for UI-held merge lock; first attempt inCXS1-FRESH/lock-wait.json; recheck2–3min,max60min.
Need latest-main integration and locked changed-spec/type/lint before merge; regrade if reviewed head changes.
Ledger /private/tmp/tbh-t001-ledger ai/codex-mega-ledger (existing branch retained), stage selected paths only.
Preserve historical dirty/untracked evidence; update this<=80lines and living MEGA-FINAL-REPORT after milestones.

CXQ1 old process55396/Node55399 and children interrupted after checking lineage+cwb; all exited.
Cwd /private/tmp/tbh-main-after-cxr1; no timed demo had started, no wallet/funds/transactions/network writes.
Evidence: CXQ1-FRESH/natural-run/scope-interruption.json;6real30s preparation ticks retained.
Do NOT restart until UI board records CXU3/CXC2 readiness. Future run must use own script worktree/new ports.
Script CXQ1-FRESH/earned-live-demo.mjs uses real wall-clock/UI-earned guest state, clones earned save only in memory.
Official faucet redirects to Builder Hub and requires wallet+login. Console key storage was not used.
Funded wallet owner prerequisite in OPTIONAL-USER-STEPS; no key/seed should be supplied in chat.

UI worktrees observed READ-ONLY: /Users/bao/taskbar-hero-ui and /Users/bao/taskbar-hero-ui-ledger.
UI requested CXLU1 rune definitions/ownership/equipped fields; declined under current P2 gate/no authoritative model.
Inline reply mirror reports/ui/REQUESTS-FOR-SYSTEM.md in own ledger; board links it; UI worktree untouched.
Handoff findings at this ledger reports/ui/REQUESTS-FROM-SYSTEM-QA.md; board points UI to that absolute path.
257/c49421f source /private/tmp/tbh-cxr2-active and252/4da5104 source /private/tmp/tbh-cxu3-active untouched now.
Old separate CXR2 dirty clone /Users/bao/.codex/worktrees/mega-cxr2/taskbar-hero preserved; do not edit it.

Safety: no secrets, destructive liveDB writes, migrations/edge deploys,Vercel/VITE_GAME_V2 changes,
real funds/mainnet,repo publicity,contest submission,.github changes,Actions,direct main pushes.
244 CLI failed UnsafeFunctionDownloadPathError; partial files are NOT backup; exact owner recovery step remains.
No broad pkill; kill only owned PIDs after cwd check; PID reuse observed. Leave unrelated18457/OS listeners.
Fresh self-grades>=92 both, C1>=23,C2=20,C6=5,C7>=8,each>=60%,zeroauto-fails; no weakened tests/retries.
Next3: CXS1 exact-head docs/core/mutation gate; CXS2 draft preparation; recheck UI requests/board before CXQ1.
