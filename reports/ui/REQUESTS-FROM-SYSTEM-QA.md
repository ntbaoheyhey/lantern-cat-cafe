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


## SYS-UI-006 — catalog icon paint/capture readiness

The verified6144d42 live capture at /private/tmp/tbh-t001-ledger/reports/cards/CXR1-FRESH/live/phased/1280x720/catalog-items.png appears to show a quality frame but blank item-icon areas. This may be capture timing rather than a persistent UI defect; no cause is asserted. Asset hashes and marker-based checks passed, which do not establish painted pixels. Please verify loaded-state icon rendering and frame layering/readiness under UI ownership. SYSTEM did not edit UI/art or rerun live QA while CXU3 readiness is pending. The draft pack substitutes the clear guest Hero capture, retaining the original evidence here.


## SYS-UI-007 — live returning guest route becomes blank (merge gate)

Confirmed on current main1a1b499/live identity at2026-11-03T09:39:26Z,1280x720. Using an unchanged, UI-earned guest save with an existing Warrior class: initial `/#landing` redirects to Home; navigate `/#hero` then `/#landing` using the published hash router; click the actual Play as guest action (`landing-start`). The screen becomes entirely blank: no landing, class picker or Home dashboard. Zero network writes were attempted. Screenshot was visually inspected.

Evidence: [receipt](../cards/CXQ1-FRESH/returning-probe/data/result.json), [blank screen](../cards/CXQ1-FRESH/returning-probe/data/earned-start-click.png), [diagnostic](../cards/CXQ1-FRESH/returning-guest-probe.mjs); source identity is CXS2-FRESH/resume-live/artifact-after.json. Local root /Users/bao/taskbar-hero-system-ledger. Guest storage remains private local data and is not committed.

Source observation (not a SYSTEM edit): StageLayout's landing action selects `class`, while the class panel only mounts when there is no existing class. The effect redirect depends on class identity, so clicking after class is already loaded can leave an empty class screen. UI board already mentions class-save recovery in CXR2; please include this returning-guest case in its gate at both desktop sizes.

Disposition: UI owns the fix. Unrelated main merges are held under the demo-path failure rule; the corrective UI change still requires its full gates and this reproducer passing before release, then live confirmation. SYSTEM will not edit UI files or branches.

Separate SYSTEM harness finding: the old timed runner expects first-time class onboarding from a prepared save that already has a class. That assumption is invalid even after routing is fixed; SYSTEM will correct the script with explicit fresh-onboarding versus earned-save segments and will not claim an uninterrupted fresh-to-boss three-minute run.

Second required viewport confirmed the same defect at1600x900,2026-11-03T09:42:19Z; [receipt](../cards/CXQ1-FRESH/returning-probe-1600/data/result.json). Both probes completed and no owned probe process remains. No UI source was edited.


## SYS-UI-007 — CLOSED on live340f88b

SYSTEM independently verified1280x720 and1600x900 after PR261. The returning guest now reaches Home, preserves Warrior/level35/all55existing items, and produces no console/page/request errors or gameplay network writes. The9-stage explicitly segmented guest rehearsal also passes36.038/36.464seconds, with35matching live assets before/after. [Current receipt](../cards/CXQ1-FRESH/post-cxr2-acceptance-partial.json).

The UI defect hold is cleared. A separate required backend health gate now fails: auth-nonce POST502 twice and diagnostic GET502; auth-verify GET405. [SYS-HEALTH-001](../cards/SYS-HEALTH-001/REPORT.md) now holds unrelated merges. This is not a request for UI/backend deployment; local UI work may continue under the existing scope.
