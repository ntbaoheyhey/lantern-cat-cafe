# Deployment capacity — overnight SYS S2

Checked 2026-11-03 UTC (2026-11-04 in Vietnam). No Vercel CLI is installed, so no Vercel login or settings were changed.

Git fallback: 23 commits reachable from origin/main since 2026-11-03T00:00:00Z; 7 merged PRs (#245, #255, #256, #258, #259, #260, #261). These are activity counts, **not an authoritative deployment count**: stacked commits, skipped builds, previews and other projects prevent equality.

Authoritative observed limit evidence: Vercel bot on #262, 2026-11-03T13:23:17Z: `Resource is limited - try again in 24 hours (more than 100, code: "api-deployments-free-per-day")`. Existing #263–#265 also have recorded cap failures. This triggers the user's stop-merging-for-the-day rule regardless of the lower Git activity counts. No merges, preview retries or manual deployments are attempted.

Next UTC date boundary: **2026-11-04T00:00:00Z (07:00 Vietnam time)**. The provider message says *try again in 24 hours*, so this boundary is only a recheck time, not a guarantee of restored capacity; 24 hours after the recorded failure is 2026-11-04T13:23:17Z (20:23:17 Vietnam). Recheck actual capacity with an already logged-in Vercel CLI before release. Never infer available quota solely from midnight.

Release rule remains at most one merge per 20 minutes, and stop at 80 deployments or any capacity error. Finish local work and leave gated drafts parked if capacity remains blocked.
