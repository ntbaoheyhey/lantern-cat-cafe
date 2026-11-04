# Held-stack release runbook — DRAFT, dry-run only

This kit never merges the integration branch. SINGLE2 executes no merge, deploy, signature, live SQL, environment change or contest submission. The active capacity record is BLOCKED. A local browser build is not evidence of production-equivalent assets.

## Inputs and order

Use the exact manifest and evidence directory on `ai/codex-ui-ledger` under `reports/sys/single2`. The product order is #262 → #263 → #264 → #265 → #266 → #268 → #269 → #271 → refreshed gallery. #267 is superseded for release by its new gallery-on-stack draft, but remains open. The docs-on-stack packet is a separately reviewed draft; reconcile it before freezing the final release tree. #244 remains blocked; #252/#257 remain open and untouched.

| Step | Expected asset change / check |
| --- | --- |
| #262 ART2 | Build may add lazy/default-OFF art assets; verify entry JS/CSS against that exact refreshed receipt, and classic Landing pixels. |
| #263 MOTION | JS/CSS change for motion, accessibility and keyboard scroll regions. Check reduced motion and Home/Bag. |
| #264 PREVIEWS | JS/CSS for optional Sample/Unavailable views; production flag must remain OFF. |
| #265 FIRSTPLAY | JS/CSS for visible first entry/reward; require first natural reward within 36 seconds. |
| #266 GALLERY | Static artifacts change; app asset hashes may legitimately remain identical. |
| #268 RECOVERY | JS/CSS for expiry/confirmation focus; guest return and Escape/Cancel must work. |
| #269 SYS | JS/CSS for nonce notice/compact HUD. Edge source changes must remain UNDEPLOYED. |
| #271 STACKFIX | CSS for Salvage contrast and cold-font geometry; reviewed exact Landing PNGs and zero CLS. |
| Refreshed gallery | Static evidence changes; app runtime tree must still equal the accepted stack. |

The machine receipt supplies the actual filename→SHA-256 mapping after each isolated refresh against current main, using the existing production build configuration. Do not substitute E2E/mock-auth assets or invent future filenames. For static-only steps identical entry hashes are expected. The HTML must point to the expected index JS/CSS; downloading an old immutable asset alone is insufficient.

## Dry run and execution barriers

Run from the tooling checkout, substituting the local ledger path:

```sh
bash scripts/release-stack.sh --manifest /Users/bao/taskbar-hero-ui-ledger/reports/sys/single2/release-manifest.json --capacity-file /Users/bao/taskbar-hero-ui-ledger/reports/sys/deploy-capacity.md --receipts /Users/bao/taskbar-hero-ui-ledger/reports/sys/single2/release-receipts
```

Default dry-run validates the nine-step plan and commit existence, prints every stage and every execution blocker, and performs no remote mutation. It does not claim the printed deployment stages were executed. `--execute` additionally requires `--confirm-release` with the manifest's complete candidate SHA and one current machine-readable `release-capacity` block in the capacity file. Accept only authenticated/owner-verified provider usage, fewer than 80 used deployments, remaining capacity, no rate-limit message and a check no older than 30 minutes. Recheck capacity after every merge. Historical Git activity or a date boundary is insufficient.

Execution handles one next PR per invocation. It fetches main and the pinned branch into a dedicated release worktree; merges latest main; installs the lockfile; runs typecheck, lint, build and changed specs at both desktop sizes. If that merge creates a new head, STOP and produce fresh A/B receipts at that head. Never promote an old receipt to the new head. The exact receipt must also name its complete changed-path set and production-equivalent JS/CSS SHA-256 inventory. Missing receipts and asset inventories remain explicit blockers.

Only then take the nonblocking `~/.taskbar-hero-locks/merge.lock`, recheck capacity/main/PR identity/scope and the 20-minute interval, persist a pending mutation intent, fast-forward the PR branch, retarget its base to main, mark ready and squash with an exact-head match. The squash subject ends `[skip ci]` so the path-triggered Supabase GitHub workflow is not dispatched. Do not manually dispatch Actions or deploy functions. If Vercel also declines the build, the asset wait must fail; do not bypass it or redeploy to spend quota.

Wait for the live HTML and each expected asset hash, then smoke fresh and returning guests at both sizes: Landing → class → Home, Forge, Help, no browser errors/overflow; from #265 onward require a natural reward ≤36 seconds. The smoke blocks mutating HTTP and wallet calls. A pending state prevents a subsequent merge after any failure or interruption. Reconcile it against GitHub before proceeding. Never delete pending state simply to retry.

After each squash, dependent branches still contain unsquashed ancestor commits. Retarget the next PR to main, merge latest main in its dedicated worktree, review the actual tree diff, and obtain new exact-head receipts. Do not checkout/reset/stash the user's main worktree. Never merge `ai/codex-stack-tip` or its immutable base.

## Tree identity and rollback

Before the final static refresh, the released product tree must equal the accepted integration tree. One-line review summary: `git diff --stat origin/main ai/codex-stack-tip`. The stronger product verification is `git diff --exit-code origin/main ai/codex-stack-tip -- apps packages supabase contracts tools`; after gallery/doc changes the full repository diff is intentionally nonempty. Freeze a separate `releaseTree` with those reviewed static artifacts for the script's final full-tree equality check. Do not call an unequal complete tree equal merely because runtime files match.

On live regression stop the train immediately and create a revert PR from the latest remote main in a new worktree:

```sh
git fetch origin main
git worktree add -b codex/revert-reviewed-release /tmp/taskbar-hero-release-rollback origin/main
git -C /tmp/taskbar-hero-release-rollback revert --no-commit <squash-commit>
git -C /tmp/taskbar-hero-release-rollback -c user.name=ntbaoheyhey -c user.email=108352255+ntbaoheyhey@users.noreply.github.com commit -m 'Revert regressed frontend release [skip ci]'
git -C /tmp/taskbar-hero-release-rollback push origin codex/revert-reviewed-release
gh pr create --repo ntbaoheyhey/taskbar-hero --head codex/revert-reviewed-release --base main --title 'Revert regressed frontend release' --body-file /tmp/taskbar-hero-rollback-body.md
```

Write the body file with the observed regression, exact squash SHA and rollback validation. Validate the revert and its asset/smoke receipt before the authorized rollback merge. Do not apply SQL rollback to live data. Quota errors can block even a revert deployment; preserve the failure and have the owner use the previously verified deployment through the supported account UI. SINGLE2 changes no provider settings.
