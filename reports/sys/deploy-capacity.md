# Deployment capacity — overnight SYS S2

Checked 2026-11-03 UTC (2026-11-04 in Vietnam). No Vercel CLI is installed, so no Vercel login or settings were changed.

Git fallback: 23 commits reachable from origin/main since 2026-11-03T00:00:00Z; 7 merged PRs (#245, #255, #256, #258, #259, #260, #261). These are activity counts, **not an authoritative deployment count**: stacked commits, skipped builds, previews and other projects prevent equality.

Authoritative observed limit evidence: Vercel bot on #262, 2026-11-03T13:23:17Z: `Resource is limited - try again in 24 hours (more than 100, code: "api-deployments-free-per-day")`. Existing #263–#265 also have recorded cap failures. This triggers the user's stop-merging-for-the-day rule regardless of the lower Git activity counts. No merges, preview retries or manual deployments are attempted.

Next UTC date boundary: **2026-11-04T00:00:00Z (07:00 Vietnam time)**. The provider message says *try again in 24 hours*, so this boundary is only a recheck time, not a guarantee of restored capacity; 24 hours after the recorded failure is 2026-11-04T13:23:17Z (20:23:17 Vietnam). Recheck actual capacity with an already logged-in Vercel CLI before release. Never infer available quota solely from midnight.

Release rule remains at most one merge per 20 minutes, and stop at 80 deployments or any capacity error. Finish local work and leave gated drafts parked if capacity remains blocked.

## Latest provider evidence

Vercel bot on new recovery draft #268 again reported the same `api-deployments-free-per-day` error at **2026-11-03T20:41:35Z**. This is an automatic PR preview failure, with no manual deployment or quota probe. Its “try again in 24 hours” wording gives a newer conservative warning through **2026-11-04T20:41:35Z (03:41:35 Vietnam on November 5)**. The UTC boundary remains a capacity recheck time only. An authenticated usage check is required before release.

## Final SYS draft capacity evidence

Commit `85a6919` for draft #269 has a Vercel commit-status failure at **2026-11-03T20:51:55Z**, described as “Deployment rate limited — retry in 24 hours.” The other project check succeeded by canceling its build through the existing Ignored Build Step. This establishes no hosted preview acceptance. The latest conservative 24-hour warning runs through **2026-11-04T20:51:55Z (03:51:55 Vietnam on November 5)**. Recheck actual account usage at the UTC boundary **2026-11-04T00:00Z (07:00 Vietnam)** before considering release. See `reports/sys/release-final-state.json` for the minimal structured evidence.

## Single-session capacity check — 2026-11-04T04:29:07.556170+00:00

CAPACITY BLOCKED. Fresh GitHub API reads still show the exact #269 head with Vercel production-project status “Deployment rate limited — retry in 24 hours”; the second project is Ignored, not a successful deployment. Vercel CLI remains absent. Current UTC activity is zero main commits and zero merged PRs, which does not establish actual deployment usage or remaining quota. Repository remains private; main and all eight accepted draft heads are unchanged. No merge or deployment was used as a quota probe.

The latest recorded provider warning runs through **2026-11-04T20:51:55Z**; planned next check is **2026-11-04T21:00:00Z** (04:00 Vietnam on November 5), not a guaranteed reset. This is beyond the session’s ten-hour maximum (started around 04:27Z). No scheduler/heartbeat is available or started; finish no-deploy work and stop when only capacity/user gates remain. The next UTC date boundary is 2026-11-05T00:00Z and is not capacity proof. Raw minimal evidence: [release-state.json](single-session/release-state.json).

## Docs-only draft preview disposition

Fresh #270/127e3f8 statuses at2026-11-04T04:34:28Z and04:34:42Z are both “Canceled by Ignored Build Step.” Their success flags do not represent a deployment or quota recovery. No new rate-limit warning or verified remaining usage is supplied by this draft. The conservative20:51:55Z warning and21:00Z planned recheck remain unchanged. [Minimal status evidence](single-session/docs-preview-status.json)

## SINGLE2 P0 — 2026-11-04T05:37:54.708357+00:00

**CAPACITY BLOCKED.** Vercel CLI is absent. Fresh GitHub status on #269 retains “Deployment rate limited — retry in 24 hours” (2026-11-03T20:51:55Z); #270 previews were ignored builds. Today UTC main commits/merged PRs: 0/0, activity only, not deployment usage. Actual remaining quota is unknown. No merge or deployment quota probe. Next planned retry: **2026-11-04T21:00Z** (November 5, 04:00 Vietnam), only if still running; this is later than SINGLE2’s 15:36Z maximum. Not a guaranteed reset. Continue offline P1–P4.
