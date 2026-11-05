
## UI release unblock —2026-11-03

SYSTEM reports auth-nonce HTTP502 and keeps unrelated merges on hold. Its chat was explicitly stopped by the user at20:37+07. When ready, resume the SYSTEM owner to inspect its sanitized health evidence, resolve the backend issue and explicitly clear the hold. UI is continuing local card work and has made no backend deployment, migration or live write.

## UI preview capacity —2026-11-04

GitHub's Vercel bot reports `api-deployments-free-per-day` (more than100 deployments) on the parked UI draft PRs262–265. Local acceptance does not establish a successful hosted preview. After the SYSTEM owner clears the health hold, the release owner must recheck available deployment capacity before the normal one-card-at-a-time release. No manual deployment, settings change or retry was attempted; the static gallery remains reviewable offline.


## AUTH-NONCE 502 FIX — overnight verdict, 2026-11-04

The health hold is **CLEARED**, using two public HTTP 200 responses at 2026-11-03T19:20:48Z and 19:31:17Z, 628.63 seconds apart. The historical 502 cause remains unproven. No migration, secret change or live deployment is required by this evidence. The earlier stopped-SYSTEM instructions above are historical and superseded by this authorized ALL-lane session.

Accepted optional hardening is draft [#269](https://github.com/ntbaoheyhey/taskbar-hero/pull/269), `ai/codex-ovn-sys-auth-stack` (`85a6919`, self-graded fresh A95/B95). Nonce failures become a CORS-readable 503 with Retry-After, and the client explains guest play. It is **not deployed**. Before any owner-authorized edge deployment or #244 work, obtain a complete off-repository function/dependency/import-map backup and successfully rehearse restoring that exact version. The supported read-only backup command attempted here was:

```sh
backup_dir=$(mktemp -d /tmp/taskbar-hero-auth-backup.XXXXXX)
supabase functions download auth-nonce --project-ref qoalewtxflagoprrxrgh --use-api --workdir "$backup_dir"
```

It fails with `UnsafeFunctionDownloadPathError` at `source/packages/auth/src/index.ts`; the partial result is **not a rollback backup**. Stop if it fails. The owner must obtain the complete deployed bundle through a supported Supabase export/support route and rehearse its restore locally; there is no verified one-command backup/rollback sequence yet. Do not bypass the guard, apply speculative migrations, deploy the draft, or merge #244. No credentials are needed in this chat.

## DEPLOYMENT CAPACITY — current release blocker

The observed `api-deployments-free-per-day` error triggers the stop-merging-for-the-day rule. UTC boundary recheck: **2026-11-04T00:00Z (07:00 Vietnam)**. The provider says “try again in 24 hours”; 24 hours after the recorded error is **2026-11-04T13:23:17Z (20:23:17 Vietnam)**. Midnight alone does not prove capacity. Vercel CLI is absent, and no login/install/settings change was performed. The release owner should check the existing Vercel account's usage before resuming. No merge or deploy command should be used merely to test quota.

After capacity is verified, release #262 → #263 → #264 → #265 → #266 in order, followed by recovery #268 and SYS #269, then refreshed gallery #267, through the documented merge lock and exact-head changed checks. At most one merge per 20 minutes; stop at 80 deployments or any cap error. Verify live asset hashes and both-size guest/Forge smoke after each merge. SYS #269 includes the inherited #263 accessibility repair through its held FIRSTPLAY parent and passes A95/B95 on that dependency-complete head. Refresh after the parent lands and confirm SYS-only scope before merge. Keep #252/#257 open and superseded, #244 blocked, and originalEconomy OFF.

Local review command (no hosting or backend change):

```sh
open /Users/bao/taskbar-hero-ovn-ui/docs/ui/gallery/index.html
```

### Updated quota evidence from recovery draft #268

The automatic PR preview again received `api-deployments-free-per-day` at 2026-11-03T20:41:35Z. The newer provider24-hour warning runs through **2026-11-04T20:41:35Z**, while **2026-11-04T00:00Z** remains the next UTC-boundary recheck. Verify account usage through the already connected Vercel dashboard before resuming. This session has no authenticated Vercel CLI and cannot establish the actual remaining count. Release remains parked. Recovery draft #268 has fresh A95/B95 receipts.

## Final SYS draft capacity evidence

Commit `85a6919` for draft #269 has a Vercel commit-status failure at **2026-11-03T20:51:55Z**, described as “Deployment rate limited — retry in 24 hours.” The other project check succeeded by canceling its build through the existing Ignored Build Step. This establishes no hosted preview acceptance. The latest conservative 24-hour warning runs through **2026-11-04T20:51:55Z (03:51:55 Vietnam on November 5)**. Recheck actual account usage at the UTC boundary **2026-11-04T00:00Z (07:00 Vietnam)** before considering release. See `reports/sys/release-final-state.json` for the minimal structured evidence.

## Single-session owner actions — November 4, 2026

The five requested owner steps are preserved verbatim below. None was performed by this session.

1. Open the Vercel account usage page and confirm real remaining deployments if you could not verify them.
2. Supabase: obtain a COMPLETE backup of the deployed functions, dependencies and import maps through a supported export/support route, rehearse restoring it locally. Required before deploying #269's edge source or merging #244. Do not bypass UnsafeFunctionDownloadPathError.
3. Reset the leaked Supabase DB password (it was pasted in chat on 31 Oct) and discard the old test wallet.
4. VITE_GAME_V2 cut-over go/no-go (only after #244 + backup + rehearsal).
5. Contest: planning deadline 2026-11-21 (UTC+7), Demo Day 2026-11-30; official submission deadline unconfirmed (Builder Hub shows 25 Nov 05:59). The user submits; you only prepare drafts.

The next planned capacity check is **2026-11-04T21:00:00Z** (04:00 Vietnam on November 5). The provider warning through20:51:55Z is not a guaranteed reset. No automatic retry is scheduled. Open the already identified account dashboard and choose Usage:

```sh
open 'https://vercel.com/ntbaoheyheys-projects'
```

For the owner-only database password reset, open the project database settings; enter a new password through the supported dashboard flow without pasting it in chat:

```sh
open 'https://supabase.com/dashboard/project/qoalewtxflagoprrxrgh/settings/database'
```

The earlier attempted function-download command above is a retained failed attempt, not a supported complete export or restore command. No exact complete-backup/restore command is verified; request the full deployed bundle from Supabase support. Do not run a deployment or flag-change command until the backup/restore and explicit owner go/no-go gates are satisfied. Discard the old wallet in its wallet application; no private key is required here.

## SINGLE2 pause — November 4, 2026

User paused before stack acceptance; no owner action was performed. The requested steps remain verbatim:

1. Open the Vercel account usage page and confirm real remaining deployments if you could not verify them.
2. Supabase: obtain a COMPLETE backup of the deployed functions, dependencies and import maps through a supported export/support route, rehearse restoring it locally. Required before deploying #269's edge source or merging #244. Do not bypass UnsafeFunctionDownloadPathError.
3. Reset the leaked Supabase DB password (it was pasted in chat on 31 Oct) and discard the old test wallet.
4. VITE_GAME_V2 cut-over go/no-go (only after #244 + backup + rehearsal).
5. Contest: planning deadline 2026-11-21 (UTC+7), Demo Day 2026-11-30; official submission deadline unconfirmed (Builder Hub shows 25 Nov 05:59). The user submits; you only prepare drafts.

Exact dashboard-opening commands remain in the Single-session owner actions section above. No verified complete deployed-backup command is invented.

## SINGLE2 completion — November 4, 2026

Candidate 1eefc3e and drafts #270/#271/#272/#273 pass their exact-head reviews. No owner step was performed; capacity remains BLOCKED. Next check: 2026-11-04T21:00:00Z (November 5, 04:00 Vietnam), not a guaranteed reset or scheduled retry. Release order: #262 → #263 → #264 → #265 → #266 → #268 → #269 → #271 → #273. Original #267 stays open. Never merge the integration branch.

1. Open the Vercel account usage page and confirm real remaining deployments if you could not verify them.
2. Supabase: obtain a COMPLETE backup of the deployed functions, dependencies and import maps through a supported export/support route, rehearse restoring it locally. Required before deploying #269's edge source or merging #244. Do not bypass UnsafeFunctionDownloadPathError.
3. Reset the leaked Supabase DB password (it was pasted in chat on 31 Oct) and discard the old test wallet.
4. VITE_GAME_V2 cut-over go/no-go (only after #244 + backup + rehearsal).
5. Contest: planning deadline 2026-11-21 (UTC+7), Demo Day 2026-11-30; official submission deadline unconfirmed (Builder Hub shows 25 Nov 05:59). The user submits; you only prepare drafts.

Repository-source restore passes local checks but does not replace the deployed backup. See [final report](SINGLE2-REPORT.md) and [restore instructions](sys/single2/repo-source-restore.md). Dashboard commands above remain the owner entry points; no complete deployed-export command is invented.


## Turn-based 3D candidate — November 5, 2026

Nothing is required from the owner to use this local candidate.

1. Optionally double-click `/Users/bao/taskbar-hero-turn3d/docs/turn3d/index.html`.
   Try Shield Bash on Spool Ram, Thread Snare on a row, and both squad compositions.
2. Optionally use Effects and Miniatures to inspect all recipes and the twelve original
   models; compare the actual 2D/3D captures below the encounter.
3. Before any future integration decision, consider outside playtests and profiling on
   a midrange laptop. Campaign difficulty and the 6–8 minute human pacing target remain open.
4. Keep the candidate default off and draft-only. Any merge, deploy or production flag
   change would be a separate future decision; none is required or performed here.

Report: `reports/turn3d/TURN3D-REPORT.md`. No Avalanche integration is added by 3D art.
