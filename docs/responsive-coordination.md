# Responsive window coordination — 2026-10-26

The user made Codex temporary coordinator, asked for a UI that adapts while the window shrinks/stretches, and required reports for Claude. This is branch/report coordination under Claude's original rules; production and user D-decisions remain gated.

## Rules retained

- No PRs, merges/main pushes, merging Antigravity branches, workflows, live SQL/backend writes, real signing/transactions, auth/contract changes, new dependencies, lock/workspace changes, applied economy/sign-off or final class art.
- D4 remains NOT READY; D8 Founder approval/application, D6 cutover/flag merge, D3/D5 art and D7/D9 remain user-only. Original approved-plan copy is unchanged.
- One named QA bug per Q13 fix branch. Respect card allowlists, maximum two fix rounds, no skipped/weakened assertions, timeout increases or golden edits to hide a failure. Never stack implementation on PARTIAL/FAILED work or another tool's branch.
- Device simulation is not physical-phone verification. No new Site publication or access change; existing preview's last observed access was public.

## C-R1 — responsive CSS and continuous resize

Original source allowlist: apps/web/src/layout/layout.css; new apps/web/e2e/layout/resize.spec.ts; this plan, prompts, report/screenshots. Shared hud/**, metrics.ts, StageLayout behavior, API/auth, art and game rules remain read-only for this card. Scope CSS to .v2-shell. HUD values wrap instead of overlapping/clipping; panel children can shrink and phone sheets can scroll.

Original commit d4fb8ec745a92c1052a8250f57a4108b8ce59ac4 was PARTIAL: geometry passed, but a stronger actor-pixel check failed in both themes (68 browser passes / 2 failures). S5 stopped C-R1 without renderer edits. The user chose “Keep scope; let Antigravity document it first.” That decision was honored.

Current dependency: completed ai/codex-fix-stage-redraw @ 7760775cd2beae2f87efbcbeef6b849c5ae28a5c, itself based on completed Q9 @ 33481ce01933834876037127e2753773a9a204cc. Rebase only the coordinator's own responsive commits onto that DONE parent, then re-run all real checks. Do not label C-R1 DONE until reports/responsive-window.md records the passing final run. See that report for current status and exact output.

## A-R1 — independent Antigravity QA: published

Antigravity published report-only ai/antigravity-responsive-qa @ 9980b46c01f60dc41975975f6166e99cff16b918, based on main @ 337977751204b5ea59d8f0cabfb91fb4cd4a391f. reports/responsive-qa.md has verdict PARTIAL on the old source. Its reports/qa-v2-1.md dated addendum names MAJOR Finding A-R1-1: StageScene create-time isActive guard drops actor redraw after resizing. The finding satisfies original Q13. Its historical FAIL report remains unchanged; this report branch was never merged or used as an implementation parent.

## C-R2 — one named bug: stage actor redraw

ai/codex-fix-stage-redraw @ 7760775cd2beae2f87efbcbeef6b849c5ae28a5c; reports/fix-stage-redraw.md STATUS: DONE. Scoped to StageScene.ts, new StageScene.test.ts, new stage-redraw.spec.ts and report/images. It queues display for Phaser CREATE after RUNNING and cancels pending work on shutdown, retaining director cleanup. No StageCanvas edit was needed. Unit regressions reproduce missing sprites before the fix; browser tests verify both actor halves after the target canvas dimensions settle, in normal/reduced motion. Full root checks and all 70 browser tests pass on this branch. C-R1 inherits this separate completed fix; its CSS-only source scope remains intact.

## A-R2 — Antigravity independent retest: READY after C-R1 DONE

Manual paste: docs/prompts/antigravity-responsive-retest.md. Inspect latest ai/codex-responsive-window at an exact recorded SHA in a detached read-only checkout. Publish reports/responsive-retest.md and screenshots on ai/antigravity-responsive-retest from latest main; preserve QA1 history if adding a dated finding/resolution addendum. No implementation stack, code fix, deployment or milestone sign-off. Independently verify both actors through the full same-session resize matrix, panels/persistence, dark/light, reduced motion, long numbers and zoom. Actual device/WebKit gaps remain NOT VERIFIED. Do not infer PASS from the coordinator's test result.

## Independent Codex review

User authorizes new Codex chats, but no callable create_thread is exposed. docs/prompts/codex-responsive-review.md is prepared; no chat was created and no independent Codex review is claimed. If the tool becomes available, create one read-only review chat under that bounded prompt; no repeat permission is needed.

## Claude review/integration order

Review existing Q4/Q5 → bulk-equip fix → Q9 → C-R2 stage-redraw → C-R1 responsive. Review A-R1's old failure and A-R2's eventual retest separately. Preserve other completed Relic/accessibility branches when integrating their overlaps. Only Claude/user handles merges, all production decisions and any later preview publication. Original phone hardware verification remains open.
