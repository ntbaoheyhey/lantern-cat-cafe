STATUS: DONE

## 1. Mission pieces and acceptance

Completed S2 on `ai/codex-s2-security`, based directly on fetched `origin/main` `672bdeb`. The pre-existing checkout had unrelated forge changes and was left untouched; this mission used `/Users/bao/.codex/worktrees/s2-security/taskbar hero`. No PR, merge, Actions run, deployment or live DB request was made.

DONE describes the requested review/fix/test/proposal deliverables, **not resolution of every risk**. The High starter-material farming defect and three other SQL/API invariants remain explicitly gated. Do not call this unconditional on-chain readiness.

| Piece / acceptance | Result | Evidence |
| --- | --- | --- |
| 1 / acceptance 1: dated review, all v2 routes/modules, status/severity/attack/fix/file:line | PASS | [Security review](../docs/security-review-2026-10.md), including nine-route replay/lock matrix, voucher scope, inputs/errors, SOUND statement and reconciliation of prior reviews. |
| 2 / acceptance 2: permitted web changes, tests and headless CSP proof | PASS | Report-Only CSP plus existing headers/X-Frame-Options; exact hash validation; explicit opener attributes; approval sentence. Each fix has its own commit and tests. Twelve viewport/build CSP checks paint Phaser pixels with zero violations and console/page errors. |
| 3 / acceptance 3: at least six passing concurrency/idempotency cases | PASS with explicit gated defects | Eight ordinary passing route races/replays and four supported Vitest expected failures; twelve additional disposable-DB proposal tests. No silent skip or weakened existing assertion. Failing-before and passing-after/proposal evidence below. |
| 4 / acceptance 4: proposals outside migrations | PASS | [Nonce RLS SQL](../docs/proposals/sql/siwe-nonces-rls.sql), [rate limits](../docs/proposals/rate-limit-v2.md), [auth hardening](../docs/proposals/auth-hardening-v2.md), plus [state integrity and two contract Mediums](../docs/proposals/v2-state-integrity.md). SQL applied only to disposable in-memory PGlite clones, never live or under migrations. |
| 5 / acceptance 5: required checks and classic compatibility | PASS | Actual command output below. Existing main skips/expected failures retained and counted explicitly. |
| 6 / acceptance 6: no secret/token/private-key value in diff | PASS for local diff inspection/scans | Bundle scans clean for classic/v2; generated signer keys stay in test memory, no credential fixtures or environment files added. No dependency or lockfile changes. |

## 2. Problems found, fixes and reproductions

- **Fixed Medium JSON parser boundary:** malformed JSON and scalars became `{}`, invoking ignored-body mutations, and bodies were unbounded. Added an actual streamed-byte 8 KiB cap, UTF-8/JSON/object validation and oversize cancellation after authentication. Existing `invalid_request` maps these refusals to HTTP 400. A lying Content-Length cannot bypass the cap; 8,192 bytes succeeds and the next byte fails.
- **Fixed Low explorer hash validation:** TodayRelicCard interpolated an arbitrary server string into a fixed-host path. It now omits the link for anything except an exact 32-byte hex hash; seven rendering cases cover valid/malformed values.
- **Fixed Info opener attributes:** two forge links and the wallet-install link had noreferrer alone. Only link attributes changed; regressions check both forge result states and the wallet install link.
- **Fixed Low approval explanation:** the listing form did not say approval covers all current/future Relics until revoked. Added one sentence and asserted it before the existing approval/list transaction-order test.
- **Headers reconciled:** today's baseline already had a blocking CSP and other headers, contrary to the old finding. Per the mission, switched CSP to Report-Only, used the documented exact public Supabase hostname and Fuji RPC host, included self/Google font origins, and added X-Frame-Options DENY. Report-Only does not enforce script restrictions; making CSP blocking again is an owner decision. No reporting endpoint is configured; local browser events/console provide the evidence.
- **High starter farming, gated:** SQL grants a free class weapon when none of its type is currently owned, and salvage ignores its source. Class swap → salvage → class swap regenerates free Yarn/fluffTuft. Snapshot JSON lacks source and drops/crafts share catalog IDs, so a catalog-ID filter would be incorrect. The proposed locked SQL source check is proven for all seven classes and a mixed batch, while allowing paid common weapon salvage.
- **Medium craft/boss retry safety, gated:** there is no stable action UUID/transactional response ledger, so identical funded retries are new paid actions. No free duplication was observed; durable idempotency needs client/API/SQL coordination. The two explicit expected failures retain that requirement.
- **Medium stale equipment snapshot, gated:** equip changes do not bump progress_rev, so boss CAS accepts pre-unequip stats. Proposed equipment revision trigger rejects it and preserves no-op equip behavior in a disposable clone. Claim shares this snapshot dependency; a live reward exploit was not attempted.
- **Medium availability and mock auth, proposal only:** no shared HTTP budgets; missing production backend URL selects permissive mock sign-in. The budget design uses free-plan Postgres, fail-closed admission and signed trusted-IP envelopes; auth selector/domain code remains untouched. Server-side SIWE domain validation already exists; absence was NOT REPRODUCIBLE.
- **Low used-nonce ambiguity:** expired voucher recovery treats cancellation as mint; preserve the existing receipt-based recovery proposal. Signer compromise and single-step ownership remain contract Mediums, with explicit testnet mitigation paragraphs. No contract or auth implementation changed.

Actual defect reproduction output:

```text
v2/security-http.test.ts on baseline parser (exit 1):
  expected 200 to be 400
  Test Files  1 failed (1)
  Tests       9 failed | 2 passed (11)
Same regression tests after dda4593 (exit 0):
  Test Files  1 passed (1)
  Tests       11 passed (11)

v2/security-races.test.ts, temporarily run with the four .fails markers removed
in this disposable checkout, then restored (exit 1):
  Test Files  1 failed (1)
  Tests       4 failed | 8 passed (12)
  craft retry: different item UUID instead of the first result
  boss retry: fights = 2, expected 1
  equipment snapshot: SQL returned status ok, expected stale
  starter salvage: promise resolved with gains, expected invalid_request
Retained committed test form (exit 0):
  Test Files  1 passed (1)
  Tests       8 passed | 4 expected fail (12)

v2/security-proposals.test.ts (proposal SQL applied ONLY to in-memory clone):
  Test Files  1 passed (1)
  Tests       12 passed (12)
```

The two retry failures still need the proposed ledger implementation; they have **no passing-after claim**. The equipment and starter fixes pass on proposal-enabled clones, not the production schema. The four `it.fails` markers are explicitly authorized by the mission for gated SQL changes and supported by Vitest: they run and are reported as expected fail. No new skip/only/timeout increase, no existing test deletion, and no golden-value adjustment. PGlite serializes SQL statements; barrier-controlled initial snapshots expose CAS races but cannot prove real independent-connection lock scheduling or deadlock freedom.

Ordinary new route tests cover claim/window+daily-key replay, boss last-key/shared-snapshot first clear, craft last recipe budget, same-item salvage/replay, competing equip/replay, simultaneous forge/stable voucher nonce+single spend, repeated class selection and explicit lock assignment/replay. v2 has keys rather than v1's daily attempt counter; a legitimate boss chest can grant keys, so the test does not invent an all-source one-key-per-day cap.

## 3. Tier 2 changes

None required. New browser/unit tests and proposal tests are within the mission's explicit “unit tests for your fixes” / `supabase/tests/**` scope. The new browser test reads existing Vercel headers and injects them on the built HTML response because Vite preview does not implement vercel.json. No Playwright configuration, wallet/auth logic, layout/style/stage code, contracts, game config numbers, package dependencies, migrations or live state changed.

## 4. Diff inventory

Generated from the completed branch; the report's own final text is necessarily amended after capturing the inventory. Binary files are the twelve requested CSP evidence images, each below 200 KB. Full stat and paths are appended below after final staging.

<!-- S2_DIFF_START -->
```text
$ git diff --stat origin/main...HEAD
 apps/web/e2e/security.spec.ts                  |  61 +++++
 apps/web/src/forge/ForgeTab.test.tsx           |   2 +
 apps/web/src/forge/ForgeTab.tsx                |   4 +-
 apps/web/src/forge/TodayRelicCard.test.tsx     |  17 ++
 apps/web/src/forge/TodayRelicCard.tsx          |   7 +-
 apps/web/src/market/MarketTab.test.tsx         |   2 +
 apps/web/src/market/MarketTab.tsx              |   1 +
 apps/web/src/securityHeaders.test.ts           |  17 ++
 apps/web/src/wallet/WalletButton.tsx           |   2 +-
 apps/web/src/wallet/wallet.test.tsx            |   2 +
 apps/web/vercel.json                           |   8 +-
 docs/abuse-controls.md                         |   2 +
 docs/proposals/auth-hardening-v2.md            |  53 +++++
 docs/proposals/rate-limit-v2.md                | 233 ++++++++++++++++++
 docs/proposals/sql/siwe-nonces-rls.sql         |  16 ++
 docs/proposals/v2-state-integrity.md           | 120 ++++++++++
 docs/security-review-2026-10.md                |  72 ++++++
 docs/security-web.md                           |   2 +
 reports/s2-security.md                         | 312 +++++++++++++++++++++++++
 reports/s2-security/csp-classic-1280-dark.png  | Bin 0 -> 62204 bytes
 reports/s2-security/csp-classic-1280-light.png | Bin 0 -> 62240 bytes
 reports/s2-security/csp-classic-1600-light.png | Bin 0 -> 69849 bytes
 reports/s2-security/csp-classic-320-light.png  | Bin 0 -> 23121 bytes
 reports/s2-security/csp-classic-390-dark.png   | Bin 0 -> 41761 bytes
 reports/s2-security/csp-classic-390-light.png  | Bin 0 -> 41768 bytes
 reports/s2-security/csp-v2-1280-dark.png       | Bin 0 -> 44377 bytes
 reports/s2-security/csp-v2-1280-light.png      | Bin 0 -> 44394 bytes
 reports/s2-security/csp-v2-1600-light.png      | Bin 0 -> 54497 bytes
 reports/s2-security/csp-v2-320-light.png       | Bin 0 -> 31660 bytes
 reports/s2-security/csp-v2-390-dark.png        | Bin 0 -> 45862 bytes
 reports/s2-security/csp-v2-390-light.png       | Bin 0 -> 45802 bytes
 supabase/functions/_shared/v2/http.ts          |  31 ++-
 supabase/tests/v2/security-http.test.ts        |  65 ++++++
 supabase/tests/v2/security-proposals.test.ts   |  87 +++++++
 supabase/tests/v2/security-races.test.ts       | 165 +++++++++++++
 35 files changed, 1271 insertions(+), 10 deletions(-)

$ git diff --name-only origin/main...HEAD
apps/web/e2e/security.spec.ts
apps/web/src/forge/ForgeTab.test.tsx
apps/web/src/forge/ForgeTab.tsx
apps/web/src/forge/TodayRelicCard.test.tsx
apps/web/src/forge/TodayRelicCard.tsx
apps/web/src/market/MarketTab.test.tsx
apps/web/src/market/MarketTab.tsx
apps/web/src/securityHeaders.test.ts
apps/web/src/wallet/WalletButton.tsx
apps/web/src/wallet/wallet.test.tsx
apps/web/vercel.json
docs/abuse-controls.md
docs/proposals/auth-hardening-v2.md
docs/proposals/rate-limit-v2.md
docs/proposals/sql/siwe-nonces-rls.sql
docs/proposals/v2-state-integrity.md
docs/security-review-2026-10.md
docs/security-web.md
reports/s2-security.md
reports/s2-security/csp-classic-1280-dark.png
reports/s2-security/csp-classic-1280-light.png
reports/s2-security/csp-classic-1600-light.png
reports/s2-security/csp-classic-320-light.png
reports/s2-security/csp-classic-390-dark.png
reports/s2-security/csp-classic-390-light.png
reports/s2-security/csp-v2-1280-dark.png
reports/s2-security/csp-v2-1280-light.png
reports/s2-security/csp-v2-1600-light.png
reports/s2-security/csp-v2-320-light.png
reports/s2-security/csp-v2-390-dark.png
reports/s2-security/csp-v2-390-light.png
supabase/functions/_shared/v2/http.ts
supabase/tests/v2/security-http.test.ts
supabase/tests/v2/security-proposals.test.ts
supabase/tests/v2/security-races.test.ts
```
<!-- S2_DIFF_END -->

## 5. Verification — real commands/output

Corepack was unavailable. Every direct pnpm invocation used `npx -y pnpm@10.28.0`; nested workspace/Playwright commands inherited that pnpm binary on PATH. Node `v26.11.1` satisfies Node 20+.

```text
$ npx -y pnpm@10.28.0 --version
10.28.0

$ CI=true npx -y pnpm@10.28.0 install --frozen-lockfile
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date
│   Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4,                     │
Done in 317ms using pnpm v10.28.0

$ npx -y pnpm@10.28.0 gen:deno && git diff --exit-code -- supabase/functions
wrote 18 Edge Function import maps

$ npx -y pnpm@10.28.0 typecheck
Scope: 6 of 7 workspace projects
packages/chain typecheck: Done
packages/auth typecheck: Done
packages/game-rules typecheck: Done
supabase/tests typecheck: Done
packages/api-contract typecheck: Done
apps/web typecheck: Done

$ npx -y pnpm@10.28.0 lint
Scope: 6 of 7 workspace projects
packages/chain lint: Done
packages/auth lint: Done
packages/game-rules lint: Done
supabase/tests lint: Done
packages/api-contract lint: Done
apps/web lint: Done

$ npx -y pnpm@10.28.0 test
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
supabase/tests test:  Test Files  21 passed (21)
supabase/tests test:       Tests  416 passed | 4 expected fail (420)
packages/game-rules test:  Test Files  20 passed | 3 skipped (23)
packages/game-rules test:       Tests  330 passed | 2 expected fail | 11 skipped (343)
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
apps/web test:  Test Files  87 passed (87)
apps/web test:       Tests  1096 passed (1096)

$ npx -y pnpm@10.28.0 build
packages/chain build: Done
packages/auth build: Done
packages/game-rules build: Done
supabase/tests build: Done
packages/api-contract build: Done
apps/web build: ✓ built in 376ms
apps/web build: Done

$ VITE_GAME_V2=0 VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= npx -y pnpm@10.28.0 --filter @taskbar-hero/web build
✓ built in 525ms

$ node scripts/check-bundle.mjs
check-bundle: scanned 24 text files in apps/web/dist
check-bundle: no secret-looking strings found.

$ node scripts/check-bundle.mjs apps/web/dist-v2
check-bundle: scanned 28 text files in apps/web/dist-v2
check-bundle: no secret-looking strings found.

$ npx -y pnpm@10.28.0 --filter @taskbar-hero/web exec playwright install chromium
(exit 0; no output)

$ git diff --check
(exit 0; no output)

$ node scripts/check-links.mjs --json
origin/main: 58 existing broken links
S2 branch: 58 broken links; no new broken (file,target) pairs
(exit 1 on both; documented baseline)
```

```text
$ cd apps/web
$ VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= npx -y pnpm@10.28.0 test:e2e
  1 skipped
  122 passed (32.1s)
(exit 0)
```

CSP mechanism: Playwright intercepts the built document response and serves the **exact** headers from vercel.json. It asserts the Report-Only response header, records `securitypolicyviolation` events plus CSP console messages/page errors, and reads nontransparent Phaser canvas pixels. Classic navigates to the market tab; v2 selects a class and renders its chapter canvas. External font requests are real; no asset/network mock was substituted. This is local build evidence, not verification of live Vercel headers or wallet calls.

```text
$ cd apps/web
$ SCREENSHOTS=1 VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= npx -y pnpm@10.28.0 exec playwright test security.spec.ts --project=classic --workers=1
CSP classic 1600x900 light: canvas painted; violations=0; console/page errors=0
CSP classic 1280x720 light: canvas painted; violations=0; console/page errors=0
CSP classic 390x844 light: canvas painted; violations=0; console/page errors=0
CSP classic 320x568 light: canvas painted; violations=0; console/page errors=0
CSP classic 1280x720 dark: canvas painted; violations=0; console/page errors=0
CSP classic 390x844 dark: canvas painted; violations=0; console/page errors=0
CSP v2 1600x900 light: canvas painted; violations=0; console/page errors=0
CSP v2 1280x720 light: canvas painted; violations=0; console/page errors=0
CSP v2 390x844 light: canvas painted; violations=0; console/page errors=0
CSP v2 320x568 light: canvas painted; violations=0; console/page errors=0
CSP v2 1280x720 dark: canvas painted; violations=0; console/page errors=0
CSP v2 390x844 dark: canvas painted; violations=0; console/page errors=0
  12 passed (23.7s)
```

Twelve PNGs under [CSP evidence](s2-security/) cover 1600×900, 1280×720, 390×844, 320×568 light and 1280×720, 390×844 dark, once each for classic/v2. The app intentionally uses its dark plum theme even when OS color preference is light. Sample [classic phone](s2-security/csp-classic-390-light.png), [v2 desktop dark](s2-security/csp-v2-1280-dark.png). These are demo builds with empty public Supabase URL/anon key and no wallet.

Initial browser attempts: one run lost its preview servers to another checkout's concurrent Playwright run on ports 4173/4174; stopped it and waited for ports to be free. Another run exposed incorrect new fixture startup assumptions (the init script had already dismissed classic onboarding; v2 needed class choice before a stage exists). Corrected the fixture, with no timeout/threshold change, then obtained clean CSP and full browser runs. Restored all unrelated report PNGs rewritten by existing e2e tests; only S2 report/evidence remains.

The install warned that optional native build scripts (bufferutil, keccak, utf-8-validate) were ignored. No approval was requested and no workspace/lockfile mutation occurred. Standard Vite node:worker_threads externalization and terminal color warnings remained non-fatal. Existing main unit skips/expected failures and the one existing browser skip are preserved; none were added by S2.

## 6. NOT verified

No live DB/schema/grants, Supabase deployed bundles/environment, actual SIWE domain/CORS/JWT-secret precedence, live backend/RPC host overrides, signer key hygiene, deployed bytecode/owner, wallet signature/mint/approval, Fuji nonce/event state, confirmation depth, reorg recovery or production PostgreSQL multi-connection locking was inspected. No Foundry/Slither/formal audit or fresh dependency reachability/audit campaign was run. Bundle scans cover local builds, not a remote production bundle. Request-budget proxy/TS sketches were not deployed or integrated; only their proposed SQL was executed in memory. The SIWE no-policy advisor observation came from the mission; S2 verified source/default-deny semantics, not the live advisor state.

## 7. Human decisions and suspicious areas

Prioritize the High starter-source SQL fix before describing an unforgeable economy. Approve a separate schema/API card for durable craft/boss request IDs and equipment revision invalidation, then remove the corresponding expected-failure markers only after normal tests pass. Decide production-demo behavior before enabling the mock-auth fail-closed selector. Review per-player/IP limits and signed proxy integration before enabling them; cheap rejected direct Supabase traffic can still consume invocation quota. Keep CSP Report-Only until the owner validates real wallet/live host coverage. Confirm one application JWT-secret source deliberately; do not assume the separate-secret documentation matches deployment. Resolve used-vs-minted recovery/finality before claiming voucher reissue cannot duplicate entitlement under reorg/stale-RPC conditions. Preserve separate signer/owner keys and avoid ownership transfer on this immutable testnet deployment.

## 8. Branch, commits and reproduction

Branch: `ai/codex-s2-security`. All commits authored by `ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>`. Base: `672bdeb`. No PR/merge/Actions/deploy requested or performed. Commits before the final report/evidence commit:

```text
dda4593 fix(security): bound and validate v2 JSON before mutations
67dca27 fix(security): validate today relic explorer transaction hashes
d1b24ab fix(security): isolate forge explorer links from openers
baa0d5f fix(security): isolate wallet install link from opener
6a1c325 fix(security): explain the scope of market relic approval
4660a15 test(security): type malformed server hash fixtures explicitly
c6cf400 test(security): exercise v2 concurrency and retain gated defect reproducers
bb620f4 fix(security): stage report-only CSP and verify built Phaser canvases
60fc1de docs(security): propose gated auth SQL rate and state integrity fixes
98e31c3 docs(security): audit all v2 routes and reconcile earlier reviews
14ae6d0 test(security): verify proxy replay proposal and finalize evidence capture
```

Reproduce from the branch with Node 20+:

```sh
npx -y pnpm@10.28.0 --version
CI=true npx -y pnpm@10.28.0 install --frozen-lockfile
npx -y pnpm@10.28.0 gen:deno && git diff --exit-code -- supabase/functions
npx -y pnpm@10.28.0 typecheck
npx -y pnpm@10.28.0 lint
npx -y pnpm@10.28.0 test
npx -y pnpm@10.28.0 build
node scripts/check-bundle.mjs
VITE_GAME_V2=0 VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= npx -y pnpm@10.28.0 --filter @taskbar-hero/web build
# Ensure no other checkout is running a browser suite before stopping old preview processes.
pkill -f 'vite preview' || true
cd apps/web
VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= npx -y pnpm@10.28.0 test:e2e
# Targeted evidence (same preview-port exclusivity; writes only S2 images):
SCREENSHOTS=1 VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= npx -y pnpm@10.28.0 exec playwright test security.spec.ts --project=classic --workers=1
```

Run only the new server cases with `npx -y pnpm@10.28.0 --filter @taskbar-hero/supabase-tests exec vitest run v2/security-http.test.ts v2/security-races.test.ts v2/security-proposals.test.ts`. Never apply proposal SQL to a shared/live DB as part of reproduction. Final report commit is discoverable with `git log -1 -- reports/s2-security.md`; the report cannot embed its own eventual hash without changing that hash.
