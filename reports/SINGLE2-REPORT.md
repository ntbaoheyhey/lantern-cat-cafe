# SINGLE2 final report — local work complete, release held

November 4, 2026. One agent, no subagents or orchestrator. Started 05:36:34 UTC and completed before the original 15:36:34 UTC deadline; user pause/resume did not extend it. P0–P4 are complete within the available local evidence boundary. Remaining release and owner steps are parked. This is a passing local candidate receipt, **not a deployed release**.

## Exact results

| Deliverable | Exact head | Self-graded (fresh pass) | Evidence |
| --- | --- | --- | --- |
| Integration, NEVER MERGE; STACKFIX #271 | `1eefc3ef6d828b06710c8be18feb08e90b099e3e` | A95 / B95 PASS | [Stack receipts](sys/single2/stack-tip-receipts.md) |
| Refreshed docs #270 | `932b6f7e4dcfbd33e4ff81e9bd967d50cab9b6fd` | A95 / B95 PASS | [A](ui/cards/SINGLE2-DOCS/A.md), [B](ui/cards/SINGLE2-DOCS/B.md) |
| Release/local rehearsal #272 | `f1a338854a8eb632a0d8f1841436595d59e83890` | A95 / B95 PASS | [A](ui/cards/SINGLE2-TOOLING/A.md), [B](ui/cards/SINGLE2-TOOLING/B.md) |
| Refreshed gallery #273 | `f5c0a0c2bcc5e869f937b487bfbc3069f490bfe4` | A95 / B95 PASS | [A](ui/cards/SINGLE2-GALLERY/A.md), [B](ui/cards/SINGLE2-GALLERY/B.md) |

Each exact head above ran the full Playwright suite **once at each desktop size: 399/399 at 1280×720 and 399/399 at 1600×900**. Integration and STACKFIX share one head/run. Each A/B gate passes typecheck, lint, build, script/package units, 1,467 web units, art checks, 38 pinned axe scans per reviewer and 18 strict geometry views per reviewer. Resize burst ran five repetitions per size: 0/40 failures across A/B. Axe: 0/76; geometry: 0/36. No threshold, retry, pixel tolerance, timeout or test exclusion was weakened. Two expected package failures and eleven inherited skips remain disclosed.

Changed-spec repetitions per size/reviewer: stack 246, docs 57, tooling 60, gallery 24. B checkouts are clean, detached and on separate ports, with tests before final diff review. Native screenshot review covers Landing, confirmations, Salvage explanations, Home and standalone gallery at both sizes. Automated accessibility-tree/live-region inspection is not a human screen-reader listening session.

Final product performance: nominal 60 fps, p95 below 20 ms, CLS 0 including cold-font journeys; effects 10/10 per size/reviewer. Entry JS gzip 143,074 B versus 141,603 B baseline (+1,471 B, +1.04%); Phaser remains lazy, 315,728 B gzip. Docs/gallery have identical runtime source to this product; they do not claim a new performance measurement. Final wallet/recovery mocks pass **14/14**, covering nonce 503, expiry/focus return, wrong network, connected HUD, offline and API 503. No signing or live write. [Mock audit](ui/cards/SINGLE2-U5/stack-audit.md).

## Changes and preserved history

The seven original PRs merged locally in release order without conflicts: #262 ART2 `a9afaad`, #263 MOTION `4b0e69a`, #264 PREVIEWS `949cc44`, #265 FIRSTPLAY `7d0d08e`, #266 GALLERY `f2a0588`, #268 RECOVERY `afd0699`, #269 SYS `85a6919`. Their remote heads remain unchanged. [Integration record](sys/single2/stack-tip.md).

- **#271:** repair equipped/locked Salvage explanation contrast and reserve stable Landing font/control geometry. Add focused contrast/cold-font regressions and separately reviewed exact Landing PNGs while preserving originals. No economy or eligibility change. Immutable `ai/codex-stack-tip-base` preserves pre-fix `d31cb2a` for review.
- **#270:** ten Markdown paths refresh CXS1/CXS2 facts and add four DRAFT documents: a three-minute rubric-mapped pitch, 90-second shot list, one-page Fuji proof and judge FAQ. All 60 local links/paths and seven historical media hashes pass. Original branch lease-updated from `127e3f8` only after A/B passed; now based on `ai/codex-stack-tip`. The old A0/B0 rejection remains archived. Live 340f88b and candidate 1eefc3e remain distinct; Fuji 43113 and both requested contract addresses are unchanged.
- **#272:** guarded release kit, asset verification and guest smoke, deterministic repository-source export/restore and seven nonce failure-mode cases. Disposable cutover rollback now retains current shared nonce/voucher/budget protections and v1 sentinel balances.
- **#273:** new gallery draft replaces #267 only in the future release order; original #267 remains untouched/open. Gallery/demo defaults to 286 current captures and preserves 624 historical captures. All **910 hashes** pass; each reviewer passes 24 repeated standalone checks including links, video playback, filters, axe and zero network requests. Four videos stay explicitly historical. Sixteen natural guest runs show Home in 0.86–1.57 seconds and first reward in 30.41–31.08 seconds.

Earlier failures remain visible: original #270 main-based accessibility/keyboard A0/B0; `d31cb2a` Salvage contrast A0/B0; `68ab4c1` cold-font CLS failure; `22e4c4b` unit contention/old exact-pixel rejection; corrected output-path, harness and install launches; and the obsolete rollback comparison. Final passing heads have no unresolved in-scope failing assertion. The historical native gateway 502 cause remains **unproven**, not a passing root-cause diagnosis. [Regression card](sys/single2/regression-card.md).

## Release kit and offline system evidence

The actual [release dry run](sys/single2/release-dry-run.log) exits 0 with writes=0 and validates the nine-step [manifest](sys/single2/release-manifest.json). It reports capacity and absent future refreshed-head/production-asset receipts as blockers; it does not execute its printed remote stages. The [runbook](sys/single2/RELEASE-RUNBOOK.md) covers retargeting after squashes, checks, receipts, asset/smoke verification, rollback PRs and at least 20 minutes between merges. Order: #262 → #263 → #264 → #265 → #266 → #268 → #269 → #271 → #273. #270/#272 are separately held and excluded from that manifest's final tree.

Never merge either integration branch. Before the final static refresh, verify the product tree against stack-tip. Review command: `git diff --stat origin/main ai/codex-stack-tip`; enforce runtime equality with `git diff --exit-code origin/main ai/codex-stack-tip -- apps packages supabase contracts tools`. Final gallery tree is `f5c0a0c`, not a claim that its complete tree equals the older gallery in `1eefc3e`. Later docs/tooling release needs a separately pinned final tree. Merge-refreshed heads and production-equivalent asset hashes require new receipts; no test asset mapping was invented. [Receipt requirements](sys/single2/release-receipts/README.md).

Each exact tooling checkout additionally passes five release-barrier tests, three archive-integrity tests and actual loopback release smoke at both sizes. Fresh/returning guests, Forge and Help pass without console errors or mutating requests. Rewards occur in 29.432–29.850 seconds measured from Home, a different start point from the gallery's whole-entry journey. [A smoke](ui/cards/SINGLE2-TOOLING/a-supplement/smoke/receipt.json), [B smoke](ui/cards/SINGLE2-TOOLING/b-supplement/smoke/receipt.json).

Repository-source export contains 713 deterministic files with 18 import maps, seven existing locks and eleven missing function locks. Twin archive SHA-256: `323ab32249f341e4019487cf2d48e6d20f0f01d3d8fe0e0762fe0ac3c153e522`. Exact restored source passes **588 Supabase tests**. Remote dependency payloads are not vendored. This is **repo-source rehearsal only**, not the missing complete deployed backup. [Restore evidence](sys/single2/repo-source-restore.md), [archive A](sys/single2/repo-restore/f1a3388/repo-source-a.tgz), [archive B](sys/single2/repo-restore/f1a3388/repo-source-b.tgz).

Nonce missing configuration and rejected DB dependencies reproduce generic CORS-readable 503/Retry-After responses; focused tests pass 42/42. Indefinitely pending upstream remains pending until resolved; no native timeout/502 fix is claimed. Docker daemon is unavailable and Deno absent, so native gateway coverage is parked. No live nonce probe occurred. [Root-cause limits](sys/single2/nonce-root-cause.md).

Read-only #244 review executes locally available checks: 18-function import guards, 27 mocked probe shapes, 17-object catalog, local migrations and **52 browser/HTTP cases**, then security-preserving disposable rollback. Native runtime, real-project/deployed identity, live rollback bundle and production cutover remain blocked. #244 itself was not modified. [Cutover dry run](sys/single2/cutover-dry-run.md).

## Capacity, safety and remaining gates

**CAPACITY BLOCKED.** Once-at-start check found no Vercel CLI and retained #269's November 3 20:51:55 UTC rate-limit warning. Ignored builds and UTC main activity 0/0 do not prove remaining quota. Next planned check: **2026-11-04T21:00:00Z** (November 5, 04:00 Vietnam), only in a running session. This is not a guaranteed reset; no retry or scheduler was created. [Capacity evidence](sys/deploy-capacity.md).

**Main merges: 0 (no merge commit). Deployments performed: 0. Live nonce probes: 0. Signatures/transactions: 0.** Remote main remains `340f88b92405ceb6b5421b207307fdbb283b2ca3`; last retained live identity uses index-Ccs5evFH.js / index-jL_b_lsJ.css. Local main checkout `6144d42` was never checked out, reset or stashed. Repository remains private. #244/#252/#257 remain open/draft and unchanged. No production env/settings/flags, live migrations/database, edge functions, contracts, economy values, third-party art or contest submission changed. #269 edge source remains undeployed. Sample previews remain Sample/Unavailable and default-OFF. [Final GitHub state](sys/single2/final-github-state.json).

Only release/user-gated work remains: real account quota, complete supported deployed backup/native restore, secret rotation, cutover go/no-go, final released recording and owner contest submission. [Judge packet](https://github.com/ntbaoheyhey/taskbar-hero/tree/ai/codex-docs-on-stack/docs/submission) · [Gallery source](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-gallery-on-stack/docs/ui/gallery/index.html). Private GitHub source is not hosted HTML. Local gallery: `/Users/bao/taskbar-hero-single2-gallery/docs/ui/gallery/index.html`.

### Closing metadata correction — 2026-11-04T10:30:46Z

Direct `git ls-remote origin refs/heads/main` and GitHub `GET /repos/ntbaoheyhey/taskbar-hero/commits/main` both confirm `340f88b92405ceb6b5421b207307fdbb283b2ca3`. The final GitHub snapshot incorrectly copied PR #244's historical base SHA `9c457a3` into its `main` field; that field is now corrected with explicit provenance. The report's main identity was already correct. Remote candidate refs and #270–#273 heads still match their accepted receipts, all recorded final gate exit codes are zero, and #244/#252/#257 remain unchanged/open/draft. No accepted gate was repeated and no capacity check, main merge or deployment was performed during this metadata correction.

## Owner steps — verbatim, not performed

1. Open the Vercel account usage page and confirm real remaining deployments if you could not verify them.
2. Supabase: obtain a COMPLETE backup of the deployed functions, dependencies and import maps through a supported export/support route, rehearse restoring it locally. Required before deploying #269's edge source or merging #244. Do not bypass UnsafeFunctionDownloadPathError.
3. Reset the leaked Supabase DB password (it was pasted in chat on 31 Oct) and discard the old test wallet.
4. VITE_GAME_V2 cut-over go/no-go (only after #244 + backup + rehearsal).
5. Contest: planning deadline 2026-11-21 (UTC+7), Demo Day 2026-11-30; official submission deadline unconfirmed (Builder Hub shows 25 Nov 05:59). The user submits; you only prepare drafts.

Exact dashboard-opening commands and safe manual backup limitations remain in [OPTIONAL-USER-STEPS.md](OPTIONAL-USER-STEPS.md). No credentials are needed in chat. [Final handoff](ui/SINGLE2-HANDOFF.md).
