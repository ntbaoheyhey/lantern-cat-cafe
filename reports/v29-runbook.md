STATUS: DONE

# Task Report: V29 Cut-Over Runbook (Card A22)

**Branch:** `ai/antigravity-v29-runbook`
**Base commit:** `a42765ccd523fc4ceb9632d54b053778be798527` (`origin/main`)
**Author:** `ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>`
**Files modified/created:**
* `docs/cutover-v2.md` (new)
* `reports/v29-runbook.md` (new)

---

## 1. Status & Summary of Work

* **STATUS:** `STATUS: DONE`
* **What was done:** Authored the complete operational cut-over runbook for Cat RPG v2 (Card A22) in `docs/cutover-v2.md`. The document specifies all operational procedures, roles, pre-cut-over checklists, step-by-step cut-over ordering, rollback protocols, Founder chest specifications, risk mitigations, and post-cut-over freeze rules.
* **Blocker:** None.
* **Files touched (`git diff --stat origin/main...HEAD`):**
  ```text
   docs/cutover-v2.md     | 311 +++++++++++++++++++++++++++++++++++++++++++++++++
   reports/v29-runbook.md | 220 ++++++++++++++++++++++++++++++++++
   2 files changed, 531 insertions(+)
  ```
* **Gate check output:**
  ```sh
  $ git fetch origin +main:refs/remotes/origin/main && git ls-tree origin/main docs/cutover-v2.md
  # Exited 0 with no output (file did not exist on origin/main)
  ```

---

## 2. Acceptance Criteria Ticks

| Item | Requirement | Status | Notes |
| :--- | :--- | :--- | :--- |
| 1 | Gate passed: `docs/cutover-v2.md` does not exist on `origin/main` | **PASS** | Verified; command printed nothing. |
| 2 | Git user configuration matches required identity | **PASS** | `ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>` |
| 3 | Documentation file `docs/cutover-v2.md` created with all 8 sections in order | **PASS** | Sections 1 through 8 present in exact specified order. |
| 4 | Allowlist respected (touch ONLY `docs/cutover-v2.md` and `reports/v29-runbook.md`) | **PASS** | Only these two files appear in `git diff --name-only origin/main...HEAD`. |
| 5 | Every backticked repository path exists on `origin/main` | **PASS** | 15 paths audited; all exist via `git ls-tree`. Future paths unbackticked. |
| 6 | No secrets exposed; variable names used exclusively | **PASS** | `AUTH_JWT_SECRET`, `GAME_SEED_SECRET`, etc. referenced by name only. |
| 7 | Unverifiable statements marked with "(to verify)" | **PASS** | 7 "(to verify)" items marked in runbook and listed in report. |
| 8 | User-only actions marked with "USER:" | **PASS** | 11 "USER:" steps marked in runbook and listed in report. |
| 9 | `node scripts/check-links.mjs docs/cutover-v2.md` exits 0 | **PASS** | Checked 26 links/paths; all exist on disk. |
| 10 | `pnpm gen:deno && git diff --exit-code -- supabase/functions` clean | **PASS** | 17 import maps generated; zero diff. |
| 11 | Full test suite requirement for docs-only diff | **PASS** | `full suite skipped: docs only` (no code, package, or lockfile changes). |
| 12 | Pushed to branch `ai/antigravity-v29-runbook` with single commit | **PASS** | 1 commit authored by ntbaoheyhey; no PR or Actions triggered. |

---

## 3. Real Checks & Output (Step 2 of Self-Check)

> **Notice:** Diff is docs-only (only `docs/**` and `reports/**` modified; zero code, SQL, workflow, or dependency changes).
> Per Step 2 instructions: `full suite skipped: docs only` (install + gen:deno drift + link check ran).

### Check 1: `pnpm install --frozen-lockfile`
```sh
$ pnpm install --frozen-lockfile
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date
Done in 381ms using pnpm v10.28.0
```

### Check 2: `pnpm gen:deno && git diff --exit-code -- supabase/functions`
```sh
$ pnpm gen:deno && git diff --exit-code -- supabase/functions
> taskbar-hero@0.0.0 gen:deno /Users/bao/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 17 Edge Function import maps
```
*(Exited 0 with no diff in `supabase/functions`).*

### Check 3: `node scripts/check-links.mjs docs/cutover-v2.md`
```sh
$ node scripts/check-links.mjs docs/cutover-v2.md
Checked 1 markdown files and 26 links/paths.

✓ All links, image paths, and backticked repo paths exist on disk.
```

### Check 4: Whole-Repo Link Check `node scripts/check-links.mjs`
```sh
$ node scripts/check-links.mjs
Checked 39 markdown files and 501 links/paths.

Found 52 broken link(s) or path(s) on disk:
  README.md:114 [backticked image path]
    Target: `og.png`
    Not found: og.png
  docs/database.md:3 [backticked repo path]
    Target: `supabase/migrations/*.sql`
    Not found: supabase/migrations/*.sql
  docs/demo-script.md:103 [backticked repo path]
    Target: `apps/web/src/game/GameCanvas.tsx`
    Not found: apps/web/src/game/GameCanvas.tsx
  docs/deploy.md:4 [backticked repo path]
    Target: `packages/chain/deployments/<chainId>.json`
    Not found: packages/chain/deployments/<chainId>.json
  ... (52 pre-existing broken links on main listed in docs/link-check.md)
```
*(Notice: `docs/cutover-v2.md` has 0 errors; clean).*

### Check 5: `git ls-tree` Verification for All Backticked Paths
```sh
$ for p in \
  .github/workflows/ci.yml \
  .github/workflows/deploy-functions.yml \
  apps/web/src/App.tsx \
  apps/web/src/api/GameApiV2.ts \
  apps/web/src/layout/classpicker/ClassPicker.tsx \
  apps/web/src/layout/flag.ts \
  apps/web/src/wallet/authApi.ts \
  apps/web/vercel.json \
  docs/runbook.md \
  packages/game-rules/src/v2/content/materials.ts \
  packages/game-rules/src/v2/state/stacks.ts \
  scripts/check-live.mjs \
  scripts/verify-pr.sh \
  supabase/migrations/20260101000000_init_schema.sql \
  supabase/migrations/20261101000000_v2_cat_rpg.sql; do
  git ls-tree --name-only origin/main "$p"
done
.github/workflows/ci.yml
.github/workflows/deploy-functions.yml
apps/web/src/App.tsx
apps/web/src/api/GameApiV2.ts
apps/web/src/layout/classpicker/ClassPicker.tsx
apps/web/src/layout/flag.ts
apps/web/src/wallet/authApi.ts
apps/web/vercel.json
docs/runbook.md
packages/game-rules/src/v2/content/materials.ts
packages/game-rules/src/v2/state/stacks.ts
scripts/check-live.mjs
scripts/verify-pr.sh
supabase/migrations/20260101000000_init_schema.sql
supabase/migrations/20261101000000_v2_cat_rpg.sql
```

### Check 6: `git diff --stat origin/main...HEAD`
```sh
$ git diff --stat origin/main...HEAD
 docs/cutover-v2.md     | 311 +++++++++++++++++++++++++++++++++++++++++++++++++
 reports/v29-runbook.md | 220 ++++++++++++++++++++++++++++++++++
 2 files changed, 531 insertions(+)
```

### Check 7: `git log --format='%an <%ae>' origin/main..HEAD`
```sh
$ git log --format='%an <%ae>' origin/main..HEAD
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
```

---

## 4. List of "(to verify)" Items

1. **Section 3, Item 1:** All 9 v2 functions on `main` (`ls supabase/functions | grep '^v2-'`). Currently on `main`, 8 functions exist; `v2-boss-fight` lands before cut-over.
2. **Section 3, Item 2:** `.github/workflows/deploy-functions.yml` line 26 `FUNCTIONS:` environment variable includes `v2-boss-fight` before cut-over.
3. **Section 3, Item 3:** `node scripts/check-live.mjs` green. Card C16 updates `scripts/check-live.mjs` to include v2 function health checks.
4. **Section 3, Item 4:** Release-candidate tag naming scheme (`rc-v29-YYYYMMDD`) to be confirmed with USER.
5. **Section 3, Item 5:** File numbers-v2.md signed off by USER and card CL8 merged into `main`.
6. **Section 4, Step 2:** `public.v2_grant_founder(p_player, p_contents, p_caps)` already exists in `supabase/migrations/20261101000000_v2_cat_rpg.sql` line 654. Card C15 may only need to execute a batch grant call or a small grant migration file `supabase/migrations/20261113000000_founder.sql (created by C15)`.
7. **Section 4, Step 7:** Manual smoke test steps (Class Picker, idle claim, boss battle demo/real, chest, Bag, Forge, Relic forge voucher) to be verified against the real live UI on cut-over day.

---

## 5. List of "USER:" Steps

1. **Role Definition (Section 2):** Sole custodian of production credentials, secrets (`AUTH_JWT_SECRET`, `GAME_SEED_SECRET`, `SIWE_DOMAIN`, `SIWE_ALLOWED_ORIGIN`, `VOUCHER_SIGNER_PRIVATE_KEY`, `FUJI_RPC_URL`, `SUPABASE_ACCESS_TOKEN`), and administrative consoles.
2. **Role Definition (Section 2):** Approves each operational phase, database migration execution, and pull request merge.
3. **Checklist Item 7 (Section 3):** Checks Vercel dashboard (project **web**) to verify deployment count and ensure budget target of <= 3 groups per day.
4. **Checklist Item 8 (Section 3):** Checks GitHub account settings to confirm sufficient remaining Actions minutes for `.github/workflows/deploy-functions.yml`.
5. **Checklist Item 9 (Section 3):** Executes the pre-cut-over database backup dump (`supabase db dump --data-only -f backup-pre-cutover-...sql` or `pg_dump`) with credentials and retains the file securely off-repository.
6. **Checklist Item 11 (Section 3):** Approves Founder chest contents (Decision D8).
7. **Cut-Over Step 2 (Section 4):** Approves and applies Founder migration / grant (Card C15) via Supabase MCP `apply_migration` or Supabase dashboard SQL editor.
8. **Cut-Over Step 3 (Section 4):** Approves/executes batch grant query for pre-existing player accounts.
9. **Cut-Over Step 4 (Section 4):** Approves and merges Card C17 flag-flip PR to `main`.
10. **Emergency Rollback (Section 5):** In case of blocking failure, promotes the last known good pre-cut-over deployment in Vercel dashboard.
11. **Risk Mitigation (Section 7):** If GitHub Actions minutes reach zero, deploys functions from local terminal using Supabase CLI.

---

## 6. Open Questions for the USER

1. **Decision D6 (Cut-Over Day):** What is the preferred cut-over date: Friday 13 Nov, Saturday 14 Nov, or Sunday 15 Nov 2026? (Recommended: Friday 13 Nov morning, starting no later than 14:00 UTC+7 to finish well before evening).
2. **Decision D8 (Founder Bundle Contents):** Does the user approve the proposed Founder bundle: 200 Yarn, 50 Fluff Tuft, 20 Shiny Button, 2 Moon Pearl, and 3 Cat Keys (Cat Keys <= 5)?
3. **Founder Gear Items (Yes / No):** Should Founders receive a commemorative Founder gear item (e.g. exclusive collar or weapon instance with `source = 'founder'`)? If yes, card C15 must add a dedicated SQL function to insert gear items, because `public.v2_grant_founder` in `supabase/migrations/20261101000000_v2_cat_rpg.sql` currently grants material stacks only.
4. **Database Backup Method Preference:** Does the user prefer running `supabase db dump --data-only` via local Supabase CLI, standard `pg_dump`, or dashboard export?

---

## 7. Documentation Linking to `docs/cutover-v2.md` Later

The following documents should be updated by the orchestrator in subsequent tasks to link to `docs/cutover-v2.md`:
1. `docs/runbook.md`: Add a "Cat RPG v2 Cut-Over (V29)" section linking to `docs/cutover-v2.md`.
2. `docs/go-live.md`: Reference `docs/cutover-v2.md` under deployment and migration procedures.
3. `docs/proposals/schema-v2.md`: Update section "Cut-over (V29): reset and Founder chest" with a direct link to `docs/cutover-v2.md`.
4. `docs/api-v2.md`: Reference `docs/cutover-v2.md` in the Coexistence section.
5. `README.md`: Add `docs/cutover-v2.md` to the documentation index when v2 becomes the default interface.

---

## 8. NOT Verified

* **Full test suite execution (`pnpm test`, `pnpm typecheck`, `pnpm lint`, Playwright e2e):** Skipped per Step 2 protocol for docs-only changes (`full suite skipped: docs only`), as zero runtime code or package dependencies were touched.
* **Production Deployment Execution:** Cut-over runbook is preparatory documentation for Card A22; nobody runs cut-over operations today.
* **Live UI Verification of Cut-Over:** Manual smoke testing interactions and UI flows will be verified against the live site on cut-over day.

---

## 9. What is Needed to Continue

* USER signs off on decisions D6 (cut-over day) and D8 (Founder bundle contents).
* Card C15 (Founder grant) implements the batch grant script / migration based on Section 6 of `docs/cutover-v2.md`.
* Card C16 updates `scripts/check-live.mjs` to include v2 function health checks.
* Card C17 prepares the flag-flip PR branch.
