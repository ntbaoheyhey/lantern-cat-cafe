# CXR2 — live accepted

PR [261](https://github.com/ntbaoheyhey/taskbar-hero/pull/261) merged as `340f88b92405ceb6b5421b207307fdbb283b2ca3` on 2026-11-03. The merged tree exactly matches the scoped release head `335011f`. Original application/test/tool trees are identical to the frozen `6ef93c0` graded A96/B96 (self-graded, fresh pass); the release-only change moves capture evidence under the current `screenshots/ui/**` ownership lane, preserving all166 image hashes.

Locked verification passed typecheck, lint, build and73 changed browser cases at each desktop size. The additional release refresh passed72 returning-guest/focus/class-save executions and20/20 resize executions, failure rate0%. No full suite was repeated. A fresh main checkout at `/Users/bao/taskbar-hero-ui-main-cxr2` independently passed73 changed cases at1280×720 and73 at1600×900, including the returning earned guest route and snapshot preservation.

The production build was reconstructed in memory using observed public frontend configuration, without saving built production bytes or keys. All35 emitted/public assets, including index.html, matched live SHA-256 hashes. The entry manifest stayed stable before/after inspection. See `live-assets.json` and ledger logs `reports/ui/logs/cxr2-main/`. Both Vercel status contexts report success; the connector found0 PR-triggered Actions runs on the merge commit. No workflow was started.

The previous UI lock had a dead owner. The user explicitly authorized removing only that orphaned lock; a new live lock owner held the fetch, integration, checks and merge, and released the lock in `finally`. The requested author and `[skip ci]` suffix were verified. No MAIN worktree checkout/reset/stash, backend/database write, wallet transaction, live demo operation, provider setting change or contest submission occurred.

**SYS-UI-007 is fixed in main and the matching build is live. SYSTEM owns the independent live returning-guest route recheck.**

Superseded draft PR257 remains open; its13 failures are explained in PR261. Superseded draft PR252 remains open; CXU3 shipped separately via PR259. Neither old draft was merged or edited.
