# Cut-Over Runbook: Cat RPG v2 (Card A22)

> **Execution Date:** Planned for Friday 13 Nov 2026 (latest Sunday 15 Nov 2026; decision D6).
> **Production Freeze:** Tuesday 17 Nov 2026.
> **Status:** Operational Runbook and Pre-Cut-Over Guide. Nobody runs this runbook now; this document defines the exact operational procedure for USER and the orchestrator on cut-over day.

---

## 1. Purpose and Scope

On cut-over day, Cat RPG v2 replaces the classic layout as the default live user interface at `https://web-zeta-tan-13.vercel.app`, rendering the stage-first game experience with class selection, real-time stage combat, new equipment slots, crafting, salvaging, and chapter bosses. Off-chain v1 Edge Functions (`auth-nonce`, `auth-verify`, `game-state`, `idle-claim`, `equip`, `boss-fight`, `upgrade`, `relic-forge`, `relic-mint-report`) remain deployed and untouched alongside the v2 functions, ensuring that zero v1 endpoints are broken or removed during cut-over. All v1 database rows (`idle_state`, `gear`, `boss_attempts`, `boss_keys`) are retained unmodified in PostgreSQL as historical records (no destructive SQL drops or resets), while shared player accounts (`players`), Relic mint records (`relic_forges`, `relic_vouchers`), and Avalanche Fuji on-chain contracts (`RelicNFT`, `RelicMarket`) remain fully active and continuous across versions.

---

## 2. Roles

Operational authority and responsibilities during the cut-over are strictly partitioned:

* **USER:**
  * Holds sole access to production credentials, environment secrets, and administrative consoles.
  * USER: Approves each operational phase, database migration execution, and pull request merge.
  * USER: Controls the Supabase dashboard (`qoalewtxflagoprrxrgh`), executes project restores if paused, inspects Edge Function secrets (`AUTH_JWT_SECRET`, `GAME_SEED_SECRET`, `SIWE_DOMAIN`, `SIWE_ALLOWED_ORIGIN`, `VOUCHER_SIGNER_PRIVATE_KEY`, `FUJI_RPC_URL`), and reviews database logs.
  * USER: Executes database backup dumps (`pg_dump` or `supabase db dump`) prior to cut-over and securely retains the snapshot off-repository.
  * USER: Controls the Vercel dashboard (project **web**), monitors build logs, promotes deployments, and inspects production environment variables.
  * USER: Monitors GitHub Actions minute quotas; if minutes reach zero, deploys functions from local terminal.
  * USER: Makes final determinations on open decisions D6 (cut-over day) and D8 (Founder chest contents).

* **Orchestrator (Sonnet medium):**
  * Drives the cut-over procedure step by step according to this runbook.
  * Executes read-only status and health inspections (`git status`, `git diff`, `node scripts/check-live.mjs`).
  * Prepares branches, verifies pull requests using `scripts/verify-pr.sh`, and validates link integrity.
  * Pauses at each "USER:" milestone, surfaces clear diagnostic outputs, and awaits explicit USER authorization before proceeding.
  * Strictly adheres to deploy limits (maximum 3 batch deployments to `main` per day).
  * Has no direct access to production secrets, database credentials, or administrative dashboards.

---

## 3. T-1 Day Checklist

Complete every check on the day preceding cut-over (T-1). Each item must be verified with the specified command or console check:

- [ ] **1. All 9 v2 functions deployed and on `main`:**
  Run the verification command:
  ```sh
  ls supabase/functions | grep '^v2-'
  ```
  Expected output must list all 9 functions: `v2-boss-fight`, `v2-choose-class`, `v2-claim`, `v2-craft`, `v2-equip`, `v2-lock`, `v2-relic-forge`, `v2-salvage`, `v2-state` (to verify: currently on `main` 8 functions exist; `v2-boss-fight` lands before cut-over).
- [ ] **2. FUNCTIONS workflow line includes all 18 functions:**
  Inspect `.github/workflows/deploy-functions.yml` line 26: `FUNCTIONS:` must include all 9 v1 functions plus all 9 v2 functions (to verify: `v2-boss-fight` present in workflow env).
- [ ] **3. Live health check passes completely:**
  Run:
  ```sh
  node scripts/check-live.mjs
  ```
  Every check must report `PASS` (to verify: card C16 updates `scripts/check-live.mjs` to include v2 function health checks).
- [ ] **4. Release-candidate tag created:**
  USER / Orchestrator creates and pushes a release-candidate tag from `origin/main`:
  ```sh
  git tag -a rc-v29-$(date +%Y%m%d) -m "Release candidate for v29 cut-over"
  git push origin rc-v29-$(date +%Y%m%d)
  ```
- [ ] **5. Game balance numbers signed off and CL8 merged:**
  Confirm numbers-v2.md (to verify: document created before cut-over) contains the USER sign-off line and card CL8 is merged into `main`.
- [ ] **6. End-to-end v2 verification green:**
  Run `scripts/verify-pr.sh` in throwaway worktree:
  ```sh
  ./scripts/verify-pr.sh <pr-number>
  ```
  Confirms lint, formatting, Deno drift check, typechecks, unit tests, Playwright e2e tests, and Foundry contract checks are green.
- [ ] **7. Vercel deployment budget verified:**
  USER: Open Vercel dashboard > Project **web** > **Deployments**. Count deployments merged to `main` today. Verify target budget: at most 3 deploy groups per day (well within the 100 deploys/day hobby cap documented in `docs/runbook.md`).
- [ ] **8. GitHub Actions minutes confirmed (USER):**
  USER: Open GitHub > **Settings** > **Billing and plans** > **Spending limits**. Confirm repository has sufficient remaining Actions minutes (at least 20 minutes) for a `.github/workflows/deploy-functions.yml` execution.
- [ ] **9. Pre-cut-over database backup taken (USER):**
  USER: In local terminal, export a database snapshot with database credentials:
  ```sh
  supabase db dump --data-only -f backup-pre-cutover-$(date +%Y%m%d).sql
  ```
  Confirm backup includes tables: `players`, `idle_state`, `gear`, `boss_attempts`, `boss_keys`, `relic_forges`, `relic_vouchers`, `siwe_nonces`, `cat_state`, `items`, `player_stacks`, `boss_clears`, `boss_fights`, `founder_grants`. File must be stored securely outside the git repository.
- [ ] **10. Flag-flip branch rebased and verified:**
  Confirm card C17 branch (flag-flip branch, created by C17) is rebased onto latest `origin/main` and verified via `scripts/verify-pr.sh`.
- [ ] **11. Founder chest contents approved (Decision D8):**
  USER confirms the exact material amounts and key counts for the Founder grant (Decision D8).

---

## 4. Cut-Over Order

Execute following the numbered sequence below. Each step lists the operational action, expected result, estimated duration, and stop/rollback criteria.

### Step 1: Freeze merges (Estimated time: 5 min)
* **Action:** Orchestrator and USER announce and enforce an absolute merge freeze on `origin/main`. No PRs or direct commits may be merged.
* **Command:**
  ```sh
  git fetch origin +main:refs/remotes/origin/main && git log -1 origin/main
  ```
* **Expected Result:** Clean commit log; HEAD hash confirmed with USER.
* **Stop Point:** If unexpected commits appear on `origin/main`, stop immediately. Triage commits before continuing.

### Step 2: USER: Approve and apply Founder migration / grant (Card C15) (Estimated time: 5-10 min)
* **Action:** USER reviews and applies the Founder grant migration or batch function call via Supabase MCP `apply_migration` or Supabase dashboard SQL editor.
  *(to verify: `public.v2_grant_founder(p_player, p_contents, p_caps)` was deployed in `supabase/migrations/20261101000000_v2_cat_rpg.sql` near line 654. Card C15 may only need to execute the grant batch query or apply migration file supabase/migrations/20261113000000_founder.sql (created by C15)).*
  If C15 includes wiping pre-cut-over test records from v2 tables, USER approves clearing:
  ```sql
  DELETE FROM public.cat_state;
  DELETE FROM public.items;
  DELETE FROM public.player_stacks;
  DELETE FROM public.boss_clears;
  DELETE FROM public.boss_fights;
  DELETE FROM public.founder_grants;
  ```
  *(Confirmed: this touches only v2 tables; v1 tables are untouched).*
* **Expected Result:** SQL applies successfully with exit code 0; `founder_grants` table is initialized.
* **Stop Point:** If SQL execution fails, stop. Do not proceed to flag flip. v1 remains untouched.

### Step 3: Run Founder grant for all existing players (Estimated time: 5-10 min)
* **Action:** USER / Orchestrator runs the idempotent grant script or SQL batch against qualifying player accounts created before the cut-over timestamp `T_cutover`:
  ```sql
  -- Iterates through players created prior to cut-over timestamp
  -- v2_grant_founder locks the players row and applies stacks idempotently
  SELECT public.v2_grant_founder(id, :founder_contents, :caps)
  FROM public.players
  WHERE created_at <= :T_cutover;
  ```
* **Expected Result:** All pre-existing accounts receive `{"status":"granted"}`. Re-running the command returns `{"status":"already"}` for all rows with no duplicate stack credit.
* **Stop Point:** If unhandled database errors occur, investigate logs. Because `v2_grant_founder` is idempotent, the batch may be safely resumed once corrected.

### Step 4: Merge the flag-flip PR (Card C17) as its own batch (Estimated time: 2-5 min)
* **Action:** USER approves and merges the card C17 flag-flip PR to `main` as an isolated batch (setting v2 active in `apps/web/src/layout/flag.ts` or production environment).
* **Expected Result:** Single commit lands on `main`. Vercel automatically initiates production build for `main`.
* **Stop Point:** If merge conflicts or unexpected file edits are present, abort merge.

### Step 5: Wait for Vercel production deployment (Estimated time: 3-5 min)
* **Action:** USER / Orchestrator monitors the deployment in Vercel dashboard > Project **web** > **Deployments**.
* **Expected Result:** Deployment completes with status "Ready" on `https://web-zeta-tan-13.vercel.app`. Inspecting response headers confirms successful build.
* **Stop Point:** If Vercel build fails or deployment stalls, evaluate Rollback (Section 5) or promote the previous good deployment in the Vercel dashboard.

### Step 6: Execute live health check (Estimated time: 2 min)
* **Action:** Run:
  ```sh
  node scripts/check-live.mjs
  ```
* **Expected Result:** All checks PASS:
  - `site loads` (HTTP 200, `#root` element verified)
  - All Edge Functions refuse anonymous POST with HTTP 4xx (`auth-nonce` answers 200)
  - Relic metadata files (`1.json`..`4.json`), images, and 64-hex paths answer 200
  - Avalanche Fuji RPC calls succeed (`signer()`, `owner()`, `uri(1)`)
* **Stop Point:** If any check fails, triage via `docs/runbook.md`. If not resolved within 10 minutes, proceed to Rollback (Section 5).

### Step 7: Manual smoke test on mobile and laptop viewports (Estimated time: 15-20 min)
* **Action:** Perform end-to-end manual play-through on Chrome, Brave, or Edge (laptop width and mobile/phone viewport):
  1. **Sign-In:** Connect test wallet on Avalanche Fuji and sign in via SIWE.
  2. **Class Selection:** Class Picker (`apps/web/src/layout/classpicker/ClassPicker.tsx`) displays; select a class (e.g. Warrior) and confirm starter weapon is equipped.
  3. **Claim:** Wait >= 10 seconds; trigger idle claim and confirm Fish, Yarn, XP, and materials update.
  4. **Boss Fight:** Fight Chapter 1 boss in Demo mode, then in Real mode (spending 1 Cat Key); verify fight timeline replays smoothly.
  5. **Boss Chest:** Open victory chest; confirm item and stack loot are credited to Bag.
  6. **Inventory & Forge:** Open Bag, inspect item cards, toggle item lock, salvage unlocked items, craft an item at the Forge.
  7. **Relic Forge Voucher:** Open Relic Forge; forge today's Relic (costs 30 Yarn and 1 Moon Pearl); confirm EIP-712 voucher is issued and signed by `VOUCHER_SIGNER_PRIVATE_KEY` on Avalanche Fuji.
  *(to verify: test each interaction against the live user interface on the day).*
* **Expected Result:** Entire gameplay loop functions smoothly with zero console errors or uncaught exceptions.
* **Stop Point:** If critical game-breaking flaws occur (e.g. sign-in broken, transactions failing, claim 500 error), initiate Rollback (Section 5).

### Step 8: Announce completion (Estimated time: 5 min)
* **Action:** USER / Orchestrator lifts merge freeze and posts cut-over announcement.
* **Expected Result:** v2 is live for all players.

### Timings and Start Window
* **Step 1:** 5 min
* **Step 2:** 5-10 min
* **Step 3:** 5-10 min
* **Step 4:** 2-5 min
* **Step 5:** 3-5 min
* **Step 6:** 2 min
* **Step 7:** 15-20 min
* **Step 8:** 5 min
* **Total Estimated Duration:** 45 to 60 minutes.
* **Latest Start Time:** To ensure completion with generous debugging and verification margin before evening in UTC+7 (17:00 UTC+7), cut-over operations must initiate no later than **14:00 UTC+7**.

---

## 5. Rollback

### Rollback Trigger
Rollback is triggered if Step 6 (`scripts/check-live.mjs`) or Step 7 (manual smoke testing) reveals a critical production blocker (e.g. auth failure, broken web layout rendering blank screen, database lockups, or unrecoverable API 500s) that cannot be diagnosed and fixed forward within 10 minutes.

### Rollback Procedure
1. **Revert the flag-flip commit:**
   USER / Orchestrator creates a revert commit of the C17 flag-flip PR:
   ```sh
   git checkout -b revert-c17-cutover origin/main
   git revert <c17-commit-sha> --no-edit
   git push origin revert-c17-cutover
   ```
2. **Merge revert PR:**
   USER approves and merges the revert PR to `main` as a single isolated batch.
3. **Emergency Vercel Rollback (30-second shortcut):**
   USER: Open Vercel dashboard > Project **web** > **Deployments**. Locate the last successful pre-cut-over production deployment and click **Promote to Production**. This instantly restores the v1 production site while the git revert builds.
4. **Post-Rollback State:**
   * The web application returns immediately to the classic v1 layout (`<ClassicLayout />` in `apps/web/src/App.tsx`).
   * v1 Edge Functions were never modified or undeployed, so v1 gameplay resumes with zero loss of functionality.
   * v2 database rows in `cat_state`, `items`, `player_stacks`, `boss_clears`, `boss_fights` remain in PostgreSQL (no destructive SQL or table drops).
   * `founder_grants` rows remain recorded. Because `public.v2_grant_founder` is idempotent, re-granting later is a safe no-op (`{"status":"already"}`).
   * Relics minted on Avalanche Fuji during cut-over testing remain valid on-chain ERC-1155 tokens.

### When NOT to Roll Back
Do not roll back for minor cosmetic glitches, CSS misalignments, copy typos, or non-blocking UI quirks. Instead, fix forward with a targeted patch merged to `main` within the 3-deployment-groups-per-day budget.

---

## 6. Founder Chest Specification (Proposal for Card C15 & Decision D8)

### Qualifying Players
* **Criteria:** Any player account whose account record exists in `public.players` prior to the cut-over timestamp `T_cutover`.
* **Database Definition:** Verified against `supabase/migrations/20260101000000_init_schema.sql` line 12:
  ```sql
  create table public.players (
    id uuid primary key default gen_random_uuid(),
    wallet text not null unique check (wallet = lower(wallet) and wallet ~ '^0x[0-9a-f]{40}$'),
    created_at timestamptz not null default now()
  );
  ```
* **Selection Query:**
  ```sql
  SELECT id FROM public.players WHERE created_at <= :T_cutover;
  ```

### Contents Specification
The Founder bundle is passed as a JSON object `{stackId: amount}` matching material ids defined in `packages/game-rules/src/v2/content/materials.ts`:
* `yarn`: Tier 0 base material (maxStack 999,999)
* `fluffTuft`: Tier 1 material (maxStack 99,999)
* `shinyButton`: Tier 2 material (maxStack 99,999)
* `catnipCrystal`: Tier 3 material (maxStack 9,999)
* `starlightScale`: Tier 4 material (maxStack 9,999)
* `moonPearl`: Relic crafting material (maxStack 999)
* `catKey`: Boss fight key (maxStack 5)

**Example Proposal (Decision D8 left for USER approval):**
```json
{
  "yarn": 200,
  "fluffTuft": 50,
  "shinyButton": 20,
  "moonPearl": 2,
  "catKey": 3
}
```
*(Note: `catKey` must be `<= 5` because `CAT_KEY_CAP = 5` in `packages/game-rules/src/v2/state/stacks.ts`).*

### Caps Enforcement
All granted amounts are clamped to `STACK_CAPS_V2` through `p_caps` passed to `public.v2_grant_founder(p_player, p_contents, p_caps)`. Key balances cannot exceed 5.

### Idempotency
`public.founder_grants` uses `player_id uuid primary key`. The function `v2_grant_founder` executes:
```sql
insert into public.founder_grants (player_id, contents)
values (p_player, coalesce(p_contents, '{}'::jsonb))
on conflict (player_id) do nothing;
```
If the row exists, the function immediately returns `{"status":"already"}` without modifying balances.

### Capability Scope and Open Question on Founder Items
* **Current SQL Capability:** `public.v2_grant_founder` in `supabase/migrations/20261101000000_v2_cat_rpg.sql` credits material stacks only (`public.v2_apply_stacks`). It cannot grant gear instances into `public.items` because it does not call `public.v2_insert_items`.
* **Open Question for USER:** Should Founders receive a commemorative Founder gear item (e.g. exclusive collar or weapon instance with `source = 'founder'`)? If yes, card C15 must provide an updated SQL migration function to insert items, since `v2_grant_founder` today supports stack materials only.

### UI Display
When granted, `public.v2_snapshot` returns `'founder', true`. In `apps/web/src/api/GameApiV2.ts`, `ServerStateV2.founder` is `true`, driving the Founder badge and recognition in the web client.

---

## 7. Known Risks on the Day & Mitigations

Identified risks and operational mitigations (from planning documentation and architecture analysis):

1. **Mock-Auth Fail-Closed in Production:**
   * *Risk:* In `apps/web/src/wallet/authApi.ts`, `defaultAuthApi()` falls back to `createMockAuthApi()` if `VITE_SUPABASE_URL` is undefined. If a deployment misconfiguration drops that environment variable, the live site silently operates in mock mode with simulated signatures.
   * *Mitigation:* Ensure decision is signed off before V29 to make `defaultAuthApi()` throw an error in production (`import.meta.env.PROD && !import.meta.env.VITE_SUPABASE_URL`). During the T-1 checklist and smoke testing, verify `VITE_SUPABASE_URL` is populated in Vercel Production Environment Variables.
2. **Vercel Deployment Cap:**
   * *Risk:* Vercel Hobby plan imposes a hard cap of 100 deployments per day. Rapid consecutive commits could exhaust daily quota.
   * *Mitigation:* Enforce deployment batching: target <= 3 batch deployments to `main` per day. Pull requests never trigger Vercel builds (`apps/web/vercel.json` restricts builds to `main`). If quota is threatened, USER uses Vercel **Promote to Production** on an existing deployment without rebuilding.
3. **GitHub Actions Minutes Exhaustion:**
   * *Risk:* The private repository receives 2,000 Actions minutes per month. If depleted, `.github/workflows/deploy-functions.yml` will not run.
   * *Mitigation:* `.github/workflows/ci.yml` is manual-only. If Actions minutes reach zero, USER executes the local fallback deployment directly:
     ```sh
     # Run on USER machine with Supabase CLI
     supabase functions deploy $FUNCTIONS --project-ref qoalewtxflagoprrxrgh --use-api --no-verify-jwt
     ```
     *(Flags match `.github/workflows/deploy-functions.yml`).*
4. **Paused Supabase Project:**
   * *Risk:* Inactive free Supabase projects pause after 7 days. Symptoms: all functions return 5xx or connection timeouts; `scripts/check-live.mjs` fails.
   * *Mitigation:* Check Supabase dashboard 24 hours prior (T-1). If paused, click **Restore project** (takes 2-3 minutes). Run `node scripts/check-live.mjs` to confirm restoration.
5. **Database Lock Contention on Batch Founder Grant:**
   * *Risk:* Running the Founder grant concurrently across all player records could trigger lock timeouts or connection spikes.
   * *Mitigation:* `public.v2_grant_founder` serializes updates per player row using `SELECT ... FOR UPDATE`. The grant script should iterate sequentially or in batches of 50. Idempotency guarantees safe recovery if interrupted.
6. **Avalanche Fuji RPC Latency or Faucet Limits:**
   * *Risk:* Fuji testnet RPC rate limits or delays during Relic voucher signing and verification.
   * *Mitigation:* Verified by `scripts/check-live.mjs`. USER maintains at least 1 test AVAX in test wallet funded early via faucet.

---

## 8. After Cut-Over

### Live QA Protocol (Card V28)
Immediately following cut-over announcement, execute the comprehensive live QA test battery defined by card V28:
* Full cross-browser verification across Chrome, Brave, Edge, and Safari Mobile (in-wallet browser).
* Validate responsive layout transitions between desktop Stage view and mobile drawer sheet.
* Verify keyboard accessibility and screen-reader announcements on Class Picker, Boss Gate, Bag, and Forge tabs.

### Production Freeze Rule (Tuesday 17 Nov 2026)
* Starting **Tuesday 17 Nov 2026**, an absolute production code freeze is established across the repository.
* Zero feature merges, refactors, or documentation-only commits to `main`.
* The only permitted modifications are emergency blocker fixes directly approved by USER. Each fix must pass `scripts/verify-pr.sh` and deploy within the daily 3-group budget.
