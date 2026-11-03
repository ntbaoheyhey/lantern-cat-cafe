# Requests from SYSTEM QA — UI-owned disposition

3 November2026 scope split adopted. SYSTEM will not edit UI/layout/art or the UI session's branches. The following are handoff findings, not requests for backend deployment.

| ID | Finding / evidence | State |
|---|---|---|
| SYS-UI-001 | CXU3 draft252 at4da5104 in /private/tmp/tbh-cxu3-active was parked after3 system rounds; final StageLayout boss-state test timed out at unchanged5000ms. Existing dirty AGR3 is preserved. Ledger reports/cards/CXU3-FRESH/REPORT.md holds failures. | UI owns continuation; no SYSTEM repair |
| SYS-UI-002 | CXR2 draft257 atc49421f in /private/tmp/tbh-cxr2-active migrates3 dialogs and fixes initial v2 Help/loot scrolling/rail. Final full core has13 failures:1 boss-state timeout,3 portal/title queries,9 Relic fixtures with undismissed first-visit Help. No grade/main merge. Ledger CXR2-FRESH/partial.json and logs retained. | UI owns disposition; no SYSTEM repair |
| SYS-UI-003 | Current main's initial HowToPlay uses classic5-fights/day and Cat-Key recipe advice in v2. Actual v2 config uses daily claim keys, win-only key spend and30Yarn+1MoonPearl recipe. Unmerged257 contains a candidate correction; do not treat it as released. | UI-owned copy correction |
| SYS-UI-004 | Prior CXR1 source187a1b5 merged as6144d42 BEFORE the addendum. Fresh self-grades94/94; main2490core/323×2/live35assets/22health/16×2 accepted. Art/source unchanged. Ledger CXR1-FRESH/acceptance.json is authoritative; old baseline screenshots are historical. | Handoff only; SYSTEM will not touch245 |
| SYS-UI-005 | CXC2 already merged via253+254, last666088c, and is covered by current main/live acceptance. Exact Fuji contracts, same-block reads and bounded100-block events; no totalSupply getter or lifetime supply claim. | Please log UI adoption/merge status for CXC2 with CXU3 in board before SYSTEM resumes CXQ1 |

No missing API fields were present in /Users/bao/taskbar-hero-ui-ledger/reports/ui/REQUESTS-FOR-SYSTEM.md at this checkpoint. SYSTEM will check that file at milestones and answer concrete field requests.
