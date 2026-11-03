
## UI release unblock —2026-11-03

SYSTEM reports auth-nonce HTTP502 and keeps unrelated merges on hold. Its chat was explicitly stopped by the user at20:37+07. When ready, resume the SYSTEM owner to inspect its sanitized health evidence, resolve the backend issue and explicitly clear the hold. UI is continuing local card work and has made no backend deployment, migration or live write.

## UI preview capacity —2026-11-04

GitHub's Vercel bot reports `api-deployments-free-per-day` (more than100 deployments) on the parked UI draft PRs262–265. Local acceptance does not establish a successful hosted preview. After the SYSTEM owner clears the health hold, the release owner must recheck available deployment capacity before the normal one-card-at-a-time release. No manual deployment, settings change or retry was attempted; the static gallery remains reviewable offline.


## AUTH-NONCE 502 FIX — overnight verdict, 2026-11-04

The health hold is **CLEARED**, using two public HTTP 200 responses at 2026-11-03T19:20:48Z and 19:31:17Z, 628.63 seconds apart. The historical 502 cause remains unproven. No migration, secret change or live deployment is required by this evidence. The earlier stopped-SYSTEM instructions above are historical and superseded by this authorized ALL-lane session.

Optional hardening is on `ai/codex-ovn-sys-auth` (`95d9c32`): nonce failures become a CORS-readable 503 with Retry-After, and the client explains guest play. It is **not deployed**. Before any owner-authorized edge deployment or #244 work, obtain a complete off-repository function/dependency/import-map backup and successfully rehearse restoring that exact version. The supported read-only backup command attempted here was:

```sh
backup_dir=$(mktemp -d /tmp/taskbar-hero-auth-backup.XXXXXX)
supabase functions download auth-nonce --project-ref qoalewtxflagoprrxrgh --use-api --workdir "$backup_dir"
```

It fails with `UnsafeFunctionDownloadPathError` at `source/packages/auth/src/index.ts`; the partial result is **not a rollback backup**. Stop if it fails. The owner must obtain the complete deployed bundle through a supported Supabase export/support route and rehearse its restore locally; there is no verified one-command backup/rollback sequence yet. Do not bypass the guard, apply speculative migrations, deploy the draft, or merge #244. No credentials are needed in this chat.

## DEPLOYMENT CAPACITY — current release blocker

The observed `api-deployments-free-per-day` error triggers the stop-merging-for-the-day rule. UTC boundary recheck: **2026-11-04T00:00Z (07:00 Vietnam)**. The provider says “try again in 24 hours”; 24 hours after the recorded error is **2026-11-04T13:23:17Z (20:23:17 Vietnam)**. Midnight alone does not prove capacity. Vercel CLI is absent, and no login/install/settings change was performed. The release owner should check the existing Vercel account's usage before resuming. No merge or deploy command should be used merely to test quota.

After capacity is verified, release #262 → #263 → #264 → #265 → #266 in order, followed by the overnight repair/refresh drafts, through the documented merge lock and exact-head changed checks. At most one merge per 20 minutes; stop at 80 deployments or any cap error. Verify live asset hashes and both-size guest/Forge smoke after each merge. SYS hardening also requires the inherited #263 accessibility repair before it can receive a passing standalone gate. Keep #252/#257 open and superseded, #244 blocked, and originalEconomy OFF.

Local review command (no hosting or backend change):

```sh
open /Users/bao/taskbar-hero-ovn-ui/docs/ui/gallery/index.html
```
