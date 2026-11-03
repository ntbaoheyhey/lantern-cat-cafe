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
