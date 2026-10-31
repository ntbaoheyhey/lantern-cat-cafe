STATUS: DONE
APPLY BEFORE DEPLOY: 20261107000000_voucher_race_guard.sql

# CXN1 Relic recovery

Date: 31 October 2026 (UTC+7). Base: origin/main at a913b052387f666b58d706281b51c926177b6e62, including deploy import-map fix #217. The user confirmed Claude's merge notice. Work used a separate clean worktree because the original checkout contained another mission's unfinished edits. Read-first period: 07:51:49–08:22:04 UTC+7 (30 minutes 15 seconds); no implementation edits during that period.

Latest update: origin/main at 70d8c7948940c59b167963253fa8874ab5353190 was merged into this branch at the user's explicit request. See section 9 for the conflict resolution and latest verification; earlier check logs remain historical evidence.

## 1. Pieces and acceptance

- Piece 1 — PASS: expose the existing relic_forges.id as claimId in v1/v2 forge replies, pending vouchers, forge.today and mint-report replies. Shared contract types, SQL JSON helpers, both store adapters, demo APIs and docs carry it. No claim-id column was added. Replacement vouchers retain the same claim, Relic and rarity.
- Piece 2 — PASS: missing or failing signers retain pending with signature null and recoverable true. The matching today and forge also expose recoverable true. Both forge handlers return server_error, while state remains readable. Classic/v2 views prefer the waiting message and never pass an unsigned voucher to MintPanel. MintPanel itself was not edited.
- Piece 3 — PASS locally: enforce expiry plus the existing 120-second grace, hold an expiry replacement unsigned, then re-read the old nonce after the store reissue. A newly used nonce atomically marks the old voucher minted (unknown tx hash), cancels the replacement and returns the old expired voucher with minted state; no replacement signature is returned. An exclusive check token prevents another state/forge request signing first. A 120-second lease lets a later retry resume an interrupted check without another voucher/payment. Mint reporting also cancels issued siblings atomically, and a partial unique index enforces at most one recorded minted voucher per forge.
- Migration — PASS locally / NOT APPLIED remotely: one additive, idempotent migration, wrapped in begin/commit, with explicit role grants. Its three new columns are reissue-check metadata, not claim identity. Existing migrations are unchanged. Apply after 20261106000000_voucher_cancel_reissue.sql, before deploying the function changes.

| Case | Result | Evidence actually run |
| --- | --- | --- |
| T1 used nonce + matching mint log stores tx, no new voucher | PASS | Both versions in relic-recovery.test.ts; relic-reader.test.ts also checks the real reader's matched hash/filter behavior with mocked RPC. |
| T2 used nonce + no log cancels/reissues same Relic without spending | PASS | Both versions, plus the existing voucher-cancel suite. |
| T3 forge/state/mint-report use the same existing claimId | PASS | Both versions; mint-report exercised through its HTTP handler. |
| T4 ids differ across days and players | PASS | Both versions, real UUIDs from local SQL. |
| T5 unsigned pending + no signer remains visible/recoverable | PASS | Both state implementations; also a failing signer. |
| T6 unsigned pending + no signer returns server_error | PASS | Both HTTP handlers return 500 with exactly the server_error body. |
| T7 false then true after reissue marks old minted and new cancelled | PASS | Both versions; replacement signature stays null and its nonce never appears in the response. |
| T8 false on both reads issues exactly one replacement | PASS | Both versions; exactly two reads of the old nonce, same balances and claim. |
| T9 concurrent expiry calls leave at most one issued voucher | PASS | Both versions; retries recover the one voucher, duplicate SQL insertion is rejected by the unique index. |
| T10 rejected prompt, expiry, late report and double click | PASS | Existing ForgeTab/forge/concurrency/v2 lifecycle suites plus both new late-report cases; full unit suite ran. |
| T11 pending UI shows waiting rather than daily-limit refusal | PASS | Classic unit test, signed/unsigned v2 unit cases, and six browser viewport cases. |
| T12 ordered migration application and service-role permissions | PASS | PGlite setup applies every migration in sorted order; the resolver is called as service_role, anon/authenticated are denied, and reapplication preserves the pending claim. |
| T13 generated Deno maps are clean | PASS | pnpm gen:deno and git diff --exit-code -- supabase/functions after the implementation commit; all 18 maps unchanged. |

Full shared-rules suite — PASS after the isolated-port browser rerun; the link checker retains its one unchanged baseline failure.

Additional passing cases: state/competing forge cannot sign during a paused reissue; interrupted check resumes without new spend; foreign player, wrong token and expired lease owner cannot release a replacement.

## 2. Problems found and fixed

- FIXED: both state loaders discarded unsigned pending rows when no signer existed, turning an owned recovery into a misleading daily-limit state.
- FIXED: no public stable forge identifier survived nonce replacements; all claim references now use the existing forge UUID.
- FIXED: the old reissue path signed immediately after insertion, allowing another request to publish the replacement before a post-insert chain check; persisted signature holds and an exclusive resolver close that observed window.
- FIXED: an interrupted held check could otherwise strand the voucher; lease recovery resumes the same replacement and rechecks the original nonce.
- FIXED: late mint reports only marked the old row, leaving an issued sibling; marking minted and cancelling siblings now happen under the same player lock.
- FIXED: the chain log lookup returned only a boolean, losing an available transaction hash; production lookup now returns the matched hash, while legacy boolean test readers remain compatible.
- FIXED: the v1 PGlite adapter could overlap role switching on one connection; each RPC now serializes role changes, while handlers still interleave their independent RPCs.
- BASELINE: the first unit baseline overlapped browser work and hit one StageLayout five-second timeout; a separate baseline rerun and the final full unit run both passed. That test and its timeout were not changed.
- BROWSER INFRASTRUCTURE: the first full post-change browser run lost all four default-port servers, then produced ERR_CONNECTION_REFUSED (153 failed, 88 passed). The servers were absent from the listener/process inventory. Cause of their disappearance is NOT VERIFIED; no assertion or timeout was changed. A fresh-port, two-worker full rerun passed all 241 tests without code, assertion or timeout changes.

## 3. Tier 2 changes

- supabase/functions/_shared/v2/voucher.ts — adjacent signing helper must carry claimId, refuse held rows and require a successful signature write.
- apps/web/src/api/MockGameApi.ts — supply stable demo claim ids and the expanded mint-report reply.
- apps/web/src/api/MockGameApiV2.ts — supply/persist demo claim ids, including existing demo saves.
- apps/web/src/layout/StageLayout.tsx — keep unsigned pending vouchers out of the existing MintPanel without editing that owned component.
- apps/web/src/forge/TodayRelicCard.tsx — display the authorized waiting message for a recoverable today entry.
- packages/api-contract/src/index.test.ts — static contract fixtures gain required claim ids.
- apps/web/src/api/MockGameApi.test.ts — expected today objects gain the mock voucher's stable id.
- apps/web/src/CafeBoard.test.tsx — required claim ids in manually built snapshot fixtures.
- apps/web/src/boss/BossTab.test.tsx — the API stub satisfies the expanded mint-report reply.
- apps/web/src/forge/TodayRelicCard.test.tsx — required claim ids in today fixtures.
- apps/web/src/forge/ForgeTab.test.tsx — API helper preserves the added field/unsigned type and adds T11.
- apps/web/src/layout/forge/ForgePanel.test.tsx — fixture ids and signed/unsigned pending-voucher precedence tests.
- apps/web/src/game/stage/relicWiring.test.ts — voucher/result fixture ids for the expanded contract.
- apps/web/src/game/stage/relicWiring.ui.test.tsx — required voucher fixture id and a merge regression covering unsigned recovery in the relocated Relic footer.
- apps/web/src/game/v2/loopV2.test.ts — forge result/voucher fixture ids.
- apps/web/src/forge/MintPanel.test.tsx — add the required claimId to the new AGN1 test fixture after merging main; production MintPanel is unchanged relative to main.
- apps/web/e2e/layout/stage-layout.spec.ts — await the observed panel-focus transition before Escape; retains the original focus assertion and timeout and avoids racing the next-frame callback.
- apps/web/e2e/server/n1-relic-recovery.spec.ts — six viewport checks and opt-in screenshots for the connected forge view.

Deliberately updated old assertions: v1 no-signer state changed from pending=null/daily_limit to a visible unsigned recoverable voucher; v2 no-signer state changed from pending=null to the same visible recovery. The competing-v2-reissue test now expects server_error while another request's unsigned check is held, then verifies successful lease recovery, the same Relic, a new nonce and no fresh forge call. No tests were deleted, disabled, skipped or weakened to hide failures. Existing game-rules skips/expected failures were left unchanged.

## 4. Committed diff

<!-- STAT_START -->
Command: git diff --stat origin/main...HEAD

```text
 apps/web/e2e/layout/stage-layout.spec.ts           |   4 +
 apps/web/e2e/server/n1-relic-recovery.spec.ts      |  46 +++
 apps/web/src/CafeBoard.test.tsx                    |   2 +
 apps/web/src/api/GameApiV2.ts                      |  10 +-
 apps/web/src/api/MockGameApi.test.ts               |   4 +-
 apps/web/src/api/MockGameApi.ts                    |  13 +-
 apps/web/src/api/MockGameApiV2.ts                  |  17 +-
 apps/web/src/api/SupabaseGameApi.ts                |   3 +-
 apps/web/src/boss/BossTab.test.tsx                 |   2 +-
 apps/web/src/forge/ForgeTab.test.tsx               |  18 +-
 apps/web/src/forge/ForgeTab.tsx                    |  12 +-
 apps/web/src/forge/MintPanel.test.tsx              |   1 +
 apps/web/src/forge/TodayRelicCard.test.tsx         |   4 +-
 apps/web/src/forge/TodayRelicCard.tsx              |   4 +-
 apps/web/src/forge/forgeText.ts                    |   2 +
 apps/web/src/game/stage/relicWiring.test.ts        |   4 +-
 apps/web/src/game/stage/relicWiring.ui.test.tsx    |  15 +-
 apps/web/src/game/v2/loopV2.test.ts                |   3 +-
 apps/web/src/layout/StageLayout.tsx                |   3 +-
 apps/web/src/layout/forge/ForgePanel.test.tsx      |  17 +
 apps/web/src/layout/forge/ForgePanel.tsx           |  14 +-
 docs/api-v2.md                                     |  12 +-
 docs/api.md                                        |  10 +-
 docs/proposals/relic-recovery.md                   |   2 +-
 packages/api-contract/src/index.test.ts            |   3 +-
 packages/api-contract/src/state.ts                 |   9 +-
 packages/api-contract/src/types.ts                 |  22 +-
 packages/api-contract/src/v2.ts                    |   8 +
 reports/n1-relic-recovery.md                       | 397 +++++++++++++++++++++
 .../n1-relic-recovery/pending-1280x720-dark.png    | Bin 0 -> 103114 bytes
 .../n1-relic-recovery/pending-1280x720-light.png   | Bin 0 -> 103114 bytes
 .../n1-relic-recovery/pending-1600x900-light.png   | Bin 0 -> 114875 bytes
 .../n1-relic-recovery/pending-320x568-light.png    | Bin 0 -> 45396 bytes
 reports/n1-relic-recovery/pending-390x844-dark.png | Bin 0 -> 57904 bytes
 .../n1-relic-recovery/pending-390x844-light.png    | Bin 0 -> 57904 bytes
 supabase/functions/_shared/game-server.ts          |   5 +
 supabase/functions/_shared/game.ts                 |  89 ++++-
 supabase/functions/_shared/relic.ts                |   7 +-
 supabase/functions/_shared/v2/forge.ts             |  13 +-
 supabase/functions/_shared/v2/game.ts              |  23 +-
 supabase/functions/_shared/v2/server.ts            |   3 +-
 supabase/functions/_shared/v2/voucher.ts           |   5 +-
 .../20261107000000_voucher_race_guard.sql          | 271 ++++++++++++++
 supabase/tests/src/forge.test.ts                   |  28 +-
 supabase/tests/src/game-db.ts                      |  12 +-
 supabase/tests/src/relic-reader.test.ts            |  16 +
 supabase/tests/src/relic-recovery.test.ts          | 262 ++++++++++++++
 supabase/tests/v2/functions-forge.test.ts          |   7 +-
 supabase/tests/v2/functions-state.test.ts          |   2 +-
 supabase/tests/v2/v2-store.ts                      |   3 +-
 50 files changed, 1298 insertions(+), 109 deletions(-)
```
<!-- STAT_END -->

<!-- NAMES_START -->
Command: git diff --name-only origin/main...HEAD

```text
apps/web/e2e/layout/stage-layout.spec.ts
apps/web/e2e/server/n1-relic-recovery.spec.ts
apps/web/src/CafeBoard.test.tsx
apps/web/src/api/GameApiV2.ts
apps/web/src/api/MockGameApi.test.ts
apps/web/src/api/MockGameApi.ts
apps/web/src/api/MockGameApiV2.ts
apps/web/src/api/SupabaseGameApi.ts
apps/web/src/boss/BossTab.test.tsx
apps/web/src/forge/ForgeTab.test.tsx
apps/web/src/forge/ForgeTab.tsx
apps/web/src/forge/MintPanel.test.tsx
apps/web/src/forge/TodayRelicCard.test.tsx
apps/web/src/forge/TodayRelicCard.tsx
apps/web/src/forge/forgeText.ts
apps/web/src/game/stage/relicWiring.test.ts
apps/web/src/game/stage/relicWiring.ui.test.tsx
apps/web/src/game/v2/loopV2.test.ts
apps/web/src/layout/StageLayout.tsx
apps/web/src/layout/forge/ForgePanel.test.tsx
apps/web/src/layout/forge/ForgePanel.tsx
docs/api-v2.md
docs/api.md
docs/proposals/relic-recovery.md
packages/api-contract/src/index.test.ts
packages/api-contract/src/state.ts
packages/api-contract/src/types.ts
packages/api-contract/src/v2.ts
reports/n1-relic-recovery.md
reports/n1-relic-recovery/pending-1280x720-dark.png
reports/n1-relic-recovery/pending-1280x720-light.png
reports/n1-relic-recovery/pending-1600x900-light.png
reports/n1-relic-recovery/pending-320x568-light.png
reports/n1-relic-recovery/pending-390x844-dark.png
reports/n1-relic-recovery/pending-390x844-light.png
supabase/functions/_shared/game-server.ts
supabase/functions/_shared/game.ts
supabase/functions/_shared/relic.ts
supabase/functions/_shared/v2/forge.ts
supabase/functions/_shared/v2/game.ts
supabase/functions/_shared/v2/server.ts
supabase/functions/_shared/v2/voucher.ts
supabase/migrations/20261107000000_voucher_race_guard.sql
supabase/tests/src/forge.test.ts
supabase/tests/src/game-db.ts
supabase/tests/src/relic-reader.test.ts
supabase/tests/src/relic-recovery.test.ts
supabase/tests/v2/functions-forge.test.ts
supabase/tests/v2/functions-state.test.ts
supabase/tests/v2/v2-store.ts
```
<!-- NAMES_END -->

## 5. Initial implementation checks and real output

Toolchain:

```text
node --version: v24.22.2
pnpm --version: 10.28.0
corepack enable && corepack prepare pnpm@10.28.0 --activate: success
```

Frozen install — PASS:

```text
CI=true pnpm install --frozen-lockfile
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Packages: +505
Done in 7.1s using pnpm v10.28.0
```

pnpm ignored optional build scripts for bufferutil, keccak and utf-8-validate. No build-script approval was requested; the lockfile and workspace config were unchanged.

Deno generation/drift — PASS, exit 0 after the implementation commit:

```text
pnpm gen:deno && git diff --exit-code -- supabase/functions
wrote 18 Edge Function import maps
```

Typecheck and lint — PASS, both exit 0:

```text
pnpm typecheck
packages/auth, packages/chain, packages/game-rules, supabase/tests, packages/api-contract, apps/web: Done
pnpm lint
packages/auth, packages/chain, packages/game-rules, supabase/tests, packages/api-contract, apps/web: Done
```

Full unit suite — PASS, exit 0:

```text
pnpm test
packages/chain: 2 files passed; 7 tests passed
packages/auth: 1 file passed; 24 tests passed
supabase/tests: 27 files passed; 517 tests passed
packages/game-rules: 24 files passed | 3 skipped; 366 passed | 2 expected fail | 11 skipped
packages/api-contract: 1 file passed; 16 tests passed
apps/web: 103 files passed; 1247 tests passed
```

Focused tests — PASS:

```text
pnpm --filter @taskbar-hero/supabase-tests exec vitest run src/relic-recovery.test.ts src/relic-reader.test.ts
Test Files 2 passed (2); Tests 29 passed (29)
pnpm --filter @taskbar-hero/web exec vitest run src/forge/ForgeTab.test.tsx src/forge/TodayRelicCard.test.tsx src/layout/forge/ForgePanel.test.tsx src/game/stage/relicWiring.ui.test.tsx src/api/MockGameApi.test.ts src/api/MockGameApiV2.test.ts
Test Files 6 passed (6); Tests 105 passed (105)
```

Builds — PASS, both exit 0:

```text
pnpm build
apps/web build: 1805 modules transformed; built in 338ms; Done
VITE_GAME_V2=0 pnpm --filter @taskbar-hero/web build
built in 319ms
```

Browser evidence — PASS, exit 0:

```text
cd apps/web
SCREENSHOTS=1 pnpm test:e2e e2e/server/n1-relic-recovery.spec.ts --project=v2-server --workers=1
6 passed (11.8s)
```

The initial six PNG captures were in reports/n1-relic-recovery (refreshed captures are listed in section 9), at 1600x900, 1280x720, 390x844 and 320x568 light, and 1280x720/390x844 dark. Sizes: 122027, 96757, 64330, 48545, 96757 and 64330 bytes respectively; all below 200 KB. All six were visually inspected. Browser evidence replaces only the local state reply's forge payload with an unavailable-signer fixture; surrounding state/session comes from the real local PGlite transport. Real server payload behavior is tested independently in the backend tests.

Full browser suite — PASS on the full isolated-port rerun, exit 0:

```text
cd apps/web && pnpm test:e2e
First attempt: 153 failed, 88 passed (1.4m); servers disappeared, ERR_CONNECTION_REFUSED.
E2E_PORT_CLASSIC=4273 E2E_PORT_V2=4274 E2E_PORT_SERVER=4275 E2E_PORT_API=4276 pnpm test:e2e --workers=2
241 passed (2.2m)
```

PR verification wrapper — NOT VERIFIED as a PR wrapper; all equivalent checks above run directly:

```text
bash scripts/verify-pr.sh
scripts/verify-pr.sh: line 8: 1: pr number
```

The script requires a PR number and merges PR head with main in a throwaway checkout. This mission forbids creating a PR and merging, so no PR invocation or --comment was used.

Link baseline — unchanged known failure, no new broken links before this report:

```text
node scripts/check-links.mjs
Clean base: Checked 59 markdown files and 791 links/paths. Found 1 broken link(s).
Implementation: Checked 59 markdown files and 790 links/paths. Found 1 broken link(s).
Both: docs/security-test-matrix.md:15 -> ../../packages/auth/src/index.test.ts
```

## 6. NOT verified

- Live migration application, Supabase service-role REST wiring, hosted Deno execution and live signer configuration: no live database/admin writes or deploy were authorized or performed.
- A real wallet mint/rejection or Fuji transaction: tests use ephemeral local signers, fake receipts and chain readers; no transaction was sent.
- True multi-connection PostgreSQL lock scheduling: PGlite interleaves handlers on one connection and enforces the real SQL/indexes, but serializes SQL calls.
- An absolute on-chain exactly-once claim guarantee under two consistently stale RPC reads: the requested double read closes the observed false-then-true race, but claimId is not part of the deployed contract's signed voucher and server cancellation cannot revoke a signature already delivered. No contract changes were made.
- The cause of the first browser run's disappearing local servers.

## 7. Human decisions and observations outside the zone

- Apply the new migration after the existing cancelled-nonce migration and before deploying these functions. Neither migration was applied to a live database here.
- For an unconditional on-chain claim guarantee, a separate approved contract design is needed; repeated stale reads can still miss an already mined mint. Also, the card explicitly treats an old nonce newly used on the post-reissue read as minted; an owner cancellation at precisely that point is not distinguished by that requested rule.
- AGN1 should review how its owned MintPanel consumes an already-minted state returned during an expired-voucher refresh. The server deliberately returns only the old expired voucher in that success case, never the replacement signature; MintPanel was not edited. Real wallet behavior for this case is NOT VERIFIED.
- The unchanged broken link and the baseline load-sensitive StageLayout timeout are outside this mission. No auth, contract, config-number, workflow, error-mapping, storeV2, v2text or MintPanel files were edited.

## 8. Branch, commits and reproduction

Branch: ai/codex-n1-relic-recovery.
Implementation/evidence commit: 53e03f265ed79275fe6548e8e5916210bae8a19a.
Report commit: the final branch tip (see git log -1 on this branch).
Git author: ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>.

Reproduce with the frozen install and checks above. The focused recovery tests cover both API versions. Run the six-case screenshot command for the committed PNGs. Run the full browser suite with the isolated four-port environment above if the default ports are in use. Report metrics generated for other missions are restored after browser runs.

The initial implementation created no merge. The follow-up explicitly authorized the main-to-mission merge described below. No PR, workflow dispatch, deploy command, live database write or on-chain transaction was performed. Only this mission branch is pushed.


## 9. Main merge follow-up — 31 October 2026

Merged origin/main at 70d8c7948940c59b167963253fa8874ab5353190, including AGU1 UI changes (#223) and AGN1 error screens (#224), into ai/codex-n1-relic-recovery. Merge commit: a4b76b9468c804154ffdcb12dd37b258ed1cfcee; its parents are the prior CXN1 report tip 795a14953e74a1dcbd57c771c193ffe2451f594e and that main commit. No rebase or force push. A separate test synchronization commit, 05acadb, waits for actual panel focus before the existing Escape assertion.

Conflict resolution — PASS:

- StageLayout now keeps AGU1's craftResult and relicFooter slots, craft result notice, relocated Boss map and surrounding UI structure, with no duplicate legacy craft/mint block.
- The CXN1 signature-null guard moved into the new relicFooter. Only a signed voucher reaches MintPanel; the existing mintedNonce and confirmation/retry handling remain intact.
- AGN1's ActionNotice, API error mapping, wrong-wallet message and store error behavior are preserved. Checked upstream source paths (MintPanel, storeV2, v2text, layout/notice, GameApiErrorV2, SupabaseGameApiV2, StageCanvas/StageScene, Bag, Boss and map) match origin/main exactly.
- The new integration regression verifies the waiting message, no daily-limit refusal, no MintPanel call for an unsigned voucher, one Relic footer, and no leaked Relic footer when switching to Craft. Existing signed-mint, reporting, layout and notice tests pass.
- Initial merged typecheck found the newly imported MintPanel test fixture missing CXN1's required claimId. Adding that field was the only change to that upstream test. No production MintPanel changes were made by CXN1.

The first full merged browser run had 245 passes and one focus failure in the phone navigation case. Its isolated rerun passed unchanged (1 passed, 7.8s). Inspection found that the test sent Escape while the next-animation-frame panel-focus callback could still be pending. The test now asserts that focus has entered the Boss panel before Escape; the original return-focus assertion and timeout remain unchanged. No application focus code was changed. The final full rerun is recorded below.

Latest actual checks:

```text
pnpm --version
10.28.0
CI=true pnpm install --frozen-lockfile
Lockfile is up to date, resolution step is skipped
Already up to date
Done in 352ms using pnpm v10.28.0

pnpm gen:deno && git diff --exit-code -- supabase/functions
wrote 18 Edge Function import maps
exit 0

pnpm typecheck
all six package checks: Done; exit 0
pnpm lint
all six package checks: Done; exit 0

pnpm test
packages/chain: 2 files passed; 7 tests passed
packages/auth: 1 file passed; 24 tests passed
supabase/tests: 27 files passed; 517 tests passed
packages/game-rules: 24 files passed | 3 skipped; 366 passed | 2 expected fail | 11 skipped
packages/api-contract: 1 file passed; 16 tests passed
apps/web: 107 files passed; 1274 tests passed
exit 0

pnpm --filter @taskbar-hero/web exec vitest run src/game/stage/relicWiring.ui.test.tsx src/layout/StageLayout.test.tsx src/forge/MintPanel.test.tsx src/layout/notice/ActionNotice.test.tsx src/layout/forge/ForgePanel.test.tsx
Test Files 5 passed (5); Tests 55 passed (55)

pnpm build
apps/web build: built in 382ms; Done; exit 0
VITE_GAME_V2=0 pnpm --filter @taskbar-hero/web build
built in 327ms; exit 0

E2E_PORT_CLASSIC=4273 E2E_PORT_V2=4274 E2E_PORT_SERVER=4275 E2E_PORT_API=4276 pnpm test:e2e --workers=2
246 passed (2.2m); exit 0

node scripts/check-links.mjs
Checked 61 markdown files and 795 links/paths.
Found 1 broken link: unchanged docs/security-test-matrix.md:15 -> ../../packages/auth/src/index.test.ts
```

Merged UI evidence — PASS, exit 0:

```text
SCREENSHOTS=1 E2E_PORT_CLASSIC=4273 E2E_PORT_V2=4274 E2E_PORT_SERVER=4275 E2E_PORT_API=4276 pnpm test:e2e e2e/server/n1-relic-recovery.spec.ts --project=v2-server --workers=1
6 passed (9.7s)
```

All six committed captures were refreshed for the merged UI and visually inspected. Current byte counts:

- pending-1280x720-dark.png: 103114 bytes.
- pending-1280x720-light.png: 103114 bytes.
- pending-1600x900-light.png: 114875 bytes.
- pending-320x568-light.png: 45396 bytes.
- pending-390x844-dark.png: 57904 bytes.
- pending-390x844-light.png: 57904 bytes.

All are below 200 KB. The 21 report artifacts rewritten by unrelated browser cases were restored; only CXN1 evidence/report changes remain. The full workspace suite, all 246 browser cases (including classic, AGN1 error notices and CXN1 recovery), and Deno drift checks pass. The unchanged link-check baseline remains the one known exception.

The checks use local builds and PGlite only. All T1–T13 backend/unit cases were rerun in the full unit suite; production migration application, real wallets and the previously documented chain/RPC limits remain unverified. The migration is still unapplied and still required before deploy. No Actions, PR, deployment or live write was triggered.
