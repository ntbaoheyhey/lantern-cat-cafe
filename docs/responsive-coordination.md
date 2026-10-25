# Responsive window plan — temporary coordination, 2026-10-26

User asked Codex to coordinate its work and Antigravity's while preserving Claude's rules, improve automatic layout when the window shrinks/stretches, and write a review report. This plan does not grant production or D-decision authority. Responsive layout here means the existing game's browser/in-app viewport, with desktop, tablet and phone layouts adapting during one session.

## Rules carried forward

- Branches and reports only. No PRs, main pushes/merges, merging Antigravity branches, GitHub Actions, live backend/SQL, real transactions, dependency/lock/workspace changes or contract/auth edits.
- D4/signature and production economy remain unchanged/NOT READY. D8 Founder approval/application, D6 cutover/flag merge, D3/D5 final art and D7/D9 remain the user's decisions.
- Follow original per-card allowlists and self-checks; maximum two fix rounds, no weakened/skipped tests or raised timeouts. New responsive work has the bounded scope below; it does not reopen old cards or expand their exceptions.
- Every card publishes an honest report, including BLOCKED/NOT VERIFIED. Do not treat phone emulation as a real iPhone/Android test.
- The demo Site most recently reports public access. This plan gives no permission to change sharing or publish new work. Keep this work on review branches.

## C-R1 — Codex: wrapping and continuous resize regression

Branch ai/codex-responsive-window, stacked on completed ai/codex-v26-e2e @ 33481ce01933834876037127e2753773a9a204cc. Report reports/responsive-window.md. Merge parent first, by Claude/user only.

Problem: shared HUD CSS stops wrapping at 600px and hides overflow. Therefore scrollWidth alone misses overlapping/clipped stats. Existing viewport listener already changes the layout and pixel-art canvas sizing.

Scope: apps/web/src/layout/layout.css; new apps/web/e2e/layout/resize.spec.ts; this plan and report/screenshots. Scope HUD overrides to .v2-shell. Keep hud/**, metrics.ts, StageLayout behavior, wallet, API, game logic, art and classic layout read-only.

Acceptance: no hidden/overlapping HUD values; panels can shrink and scroll; continuously resize 1600→1280→1024→1023→768→601→600→390→320→844 landscape→1280 short→1600. Preserve class, level, inventory IDs, active Forge tab and exactly one stage canvas. Test dark/light and breakpoint boundaries. Run normal repository checks and full Playwright suite. Show representative desktop/phone screenshots. State real-device limits.

## A-R1 — Antigravity: independent visual/phone QA

Status READY for read-only QA of the PARTIAL C-R1 branch; not dispatched automatically. Never stack implementation on PARTIAL work. Antigravity must follow its own Claude prompt and permissions. Read the provided branch in a detached checkout for QA. Put report-only work on ai/antigravity-responsive-qa from latest main; do not merge or stack another tool's code unless Antigravity's existing instructions explicitly authorize it. If its gate/permissions are incompatible, publish a BLOCKED report rather than inventing an exception.

Deliver reports/responsive-qa.md, a dated findings addendum in reports/qa-v2-1.md (preserve previous QA history), and screenshots only. No product fixes in this card. Review the same continuous-resize path, Inventory/Boss/Forge/Market/Help, class selection, boss arena/chest, long currencies, browser zoom 100%/200%, dark/light and reduced motion. Exercise 320×568, 390×844, 600×600, 601×480, 768×600, 844×390, 1023/1024 and 1280/1600 widths. Check focus when phone sheets open/close, touch-target reachability, clipped text, overlays and internal scrolling. Test Chromium and WebKit only if available; otherwise mark WebKit NOT VERIFIED. Never install dependencies or loosen tests to satisfy QA. Physical phone Safari/Chrome remains NOT VERIFIED without an actual device.

For every finding: severity, reproducible resize/actions, expected/actual behavior, source reference, screenshot, and whether fixture or real-device evidence. Independent QA must not copy the Codex PASS verdict without verification.

## C-R2 — Codex: one named QA bug per card

WAITING on A-R1 findings. Own ai/codex-fix-<slug> branch and regression per bug. Original Q13 requires reports/qa-v2-1.md on main or an Antigravity branch to name a bug: A-R1 explicitly includes that report addendum, subject to Antigravity's existing Claude rules. A new report filename alone does not bypass that gate; otherwise request explicit scoped authorization. No speculative broad redesign.

## Review handoff to Claude

Review C-R1 diff/evidence, A-R1 independent findings and any separately authorized C-R2 fixes. Integrate through the existing merge process only after review. Preserve bulk-equip, Relic handoff and accessibility fixes when resolving overlaps. Any later preview update needs its own source/build/deployment evidence and audience check. Physical device verification and all production decisions remain open.

## C-R1 current blocker

STATUS PARTIAL: HUD geometry fix passes initial focused checks; final suite finds missing actor redraw (68 passed, 2 failed). StageScene create-time isActive guard rejects initial show before Phaser becomes RUNNING. Renderer files are outside C-R1 CSS-only source scope; S5 stops this card. A separate renderer fix needs explicit scope or eligible named QA1 evidence. Antigravity can audit the PARTIAL source read-only and produce that evidence; no implementation may stack on it while PARTIAL.

## User decision after the blocker

The user answered: “Keep scope; let Antigravity document it first.” C-R1 remains PARTIAL. Do not edit StageScene/StageCanvas or broaden this card. A-R1 is the next action: independent read-only reproduction and a named dated QA1 finding. A renderer fix remains WAITING on that eligible evidence under the original Q13 rules. No new renderer approval is pending, and no generic continuation should be treated as permission to bypass this decision.
