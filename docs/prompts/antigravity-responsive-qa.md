# Paste into Antigravity: A-R1 responsive QA

You are doing independent responsive-window QA for ntbaoheyhey/taskbar-hero. The user made Codex temporary coordinator and will paste this prompt manually. Preserve your original Claude instructions; this is a bounded additional card, not permission to override them.

Read docs/responsive-coordination.md and reports/responsive-window.md from ai/codex-responsive-window. Gate: report exists with STATUS: PARTIAL or DONE for read-only QA. Fetch latest main explicitly (`git fetch origin +main:refs/remotes/origin/main`) and the responsive branch into an explicit remote-tracking ref. Record its full SHA before reviewing. If the gate or your original permissions conflict, publish STATUS: BLOCKED and explain; do not silently expand scope.

Review the responsive branch in a detached, read-only checkout. Publish only reports/responsive-qa.md, screenshots under reports/responsive-qa/, and a dated findings addendum in reports/qa-v2-1.md on ai/antigravity-responsive-qa from latest main. Preserve old QA1 history; copy it from the existing QA1 branch if needed. Do not copy or merge implementation into the report branch. No product fixes in this card.

Test live resize in ONE session: 1600×900 → 1280×720 → 1024×768 → 1023×600 → 768×600 → 601×480 → 600×600 → 390×844 → 320×568 → 844×390 → 1280×480 → 1600×900. Test all panels, class picker, real stage actors after redraw, boss replay/chest, long currency/XP values, dark/light, reduced motion and 100%/200% browser zoom. Check clipping/overlap inside HUD (page scrollWidth alone is insufficient), fixed sheet/nav intersections, controls reachable by scroll and keyboard, and focus after sheet open/close. Verify class/inventory/progress and selected tab survive resizing without a page reload.

Use Chromium and WebKit if already available; otherwise mark missing engines NOT VERIFIED. Mark physical iOS/Android testing NOT VERIFIED unless actually done on a device. Do not describe viewport simulation as real-phone verification. Capture desktop, short landscape and phone screenshots.

Report independently: PASS/FAIL/NOT VERIFIED per case, exact source SHA and commands/results, bug severity, steps, expected/actual, file/line and screenshot. Put named actionable bugs in the dated QA1 addendum so the existing Codex Q13 gate can be met. A-R1 is not complete merely because Codex's tests pass.

Rules: no PR/merge/main push, other-tool branch merge, workflow dispatch, deployment, live SQL/migration/backend mutation, private key/transaction, auth/contract change, new dependency, lock/workspace edit, signed economy/config application or final class-art change. D4/D8/D6/D3/D5/D7/D9 remain user-only. No skipped/weakened tests, deleted assertions or raised timeouts. At most two fix rounds for your allowed report/harness work; if a product fix is needed, preserve the failure and report it. Never select mock auth to make server tests pass.

Use pnpm 10.28.0 via Corepack with CI=true and frozen lockfile. Run your original required checks; report-only commits may use the original docs-only exception (frozen install + gen:deno drift + actual QA checks). Don't claim unrun tests. Git author must be ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>. Check author and own allowlist before pushing your branch only. End with branch, full commit, report and status. Do not publish to the demo Site: its latest access reading is public and no new publication is authorized by this card.

Priority finding: reproduce the missing cat/monster after viewport resize, inspect StageScene.create()/show() vs Phaser CREATING/RUNNING timing, and record the named bug in eligible QA evidence. A PARTIAL branch may be read in a detached checkout; never stack new implementation on it.
