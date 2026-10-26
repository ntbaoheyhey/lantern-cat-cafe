STATUS: BLOCKED

# Independent Visual and Browser QA: Integrated v2 Stack

Independent browser and visual QA report for the Cat RPG v2 integrated stack. Report only; no product code or repository test files have been altered.

## What was done

1. Checked the primary source under test: CX2 report on `ai/codex-fix-resize-hygiene`.
   - The remote branch `ai/codex-fix-resize-hygiene` does not exist (`git ls-remote --exit-code --heads origin ai/codex-fix-resize-hygiene` exits with code 2).
   - Inspected CX2's report branch `origin/ai/codex-fix-resize-hygiene-report` at commit `2e64383ad5ab55447f49ec5e400c79a64785868b`.
   - CX2 reported `STATUS: BLOCKED` with zero product code changes because prerequisite integration branch `ai/codex-integrate-v2-stage` was missing.
   - Therefore, CX2 is **NOT DONE**.
2. Evaluated fallback instruction: *"If CX2 is not DONE, test ai/codex-integrate-v2-stage instead and say so."*
   - Checked remote ref: `git ls-remote --exit-code --heads origin ai/codex-integrate-v2-stage` exited with code 2 (not found).
   - Checked local refs: `git rev-parse --verify origin/ai/codex-integrate-v2-stage` failed (`fatal: Needed a single revision`).
   - The fallback source `ai/codex-integrate-v2-stage` does not exist in the repository.
3. Gate check failed: neither the primary source nor the fallback integration source exists. Per self-check rule 7 and 8, stopped implementation at the gate and prepared this honest report on report-only branch `ai/antigravity-qa-integrated-report` branched from `origin/main` at `337977751204b5ea59d8f0cabfb91fb4cd4a391f`.
4. Prepared the full runnable automation harness script under `reports/qa-integrated/harness/run-qa-integrated.mjs` and archived raw logs under `reports/qa-integrated/harness/logs/` so a reviewer can inspect the code and rerun it once the integration branch is published.
5. Successfully ran the WebKit install command (`pnpm --filter @taskbar-hero/web exec playwright install webkit`) as required by item 7; WebKit 27.2 downloaded and verified successfully.
6. Successfully executed required docs-only checks (`pnpm install --frozen-lockfile` and `pnpm gen:deno && git diff --exit-code -- supabase/functions`).

## Exact blocker

The source under test cannot be checked out detached or built:
- Primary branch `ai/codex-fix-resize-hygiene`: absent from remote; CX2 reported `STATUS: BLOCKED` on `ai/codex-fix-resize-hygiene-report` @ `2e64383ad5ab55447f49ec5e400c79a64785868b` with zero product commits.
- Fallback branch `ai/codex-integrate-v2-stage`: absent from remote (`git ls-remote --exit-code --heads origin ai/codex-integrate-v2-stage` exit 2).
- Neither source under test can be checked out or built with `VITE_GAME_V2=1`.

## Gate check commands and actual output

```text
$ git ls-remote --exit-code --heads origin ai/codex-fix-resize-hygiene
[exit 2: ref not found on origin]

$ git ls-remote --heads origin ai/codex-fix-resize-hygiene-report
2e64383ad5ab55447f49ec5e400c79a64785868b	refs/heads/ai/codex-fix-resize-hygiene-report

$ git show origin/ai/codex-fix-resize-hygiene-report:reports/fix-resize-hygiene.md | head -n 20
STATUS: BLOCKED

## What was done

Stopped at the required CX1 baseline gate. Created report-only branch
`ai/codex-fix-resize-hygiene-report` from `origin/main` at
`337977751204b5ea59d8f0cabfb91fb4cd4a391f`. No product fixes or regression test
were made. No existing assertions were changed. Product fix rounds used: zero.

## Gate: FAIL

The required branch `ai/codex-integrate-v2-stage` is absent from the remote.
CX1's DONE report and baseline commit could not be verified. This does not
establish CX1's status elsewhere; it means the prerequisite supplied in the card
cannot be satisfied from this repository. Per the card, implementation stopped.

$ git ls-remote --exit-code --heads origin ai/codex-integrate-v2-stage
[exit 2: ref not found on origin]

$ git rev-parse --verify origin/ai/codex-integrate-v2-stage
fatal: Needed a single revision
[not found in local refs]
```

## Required verification checks (docs-only diff)

`pnpm install --frozen-lockfile`: PASS (exit 0)
```text
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date

╭ Warning ─────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4,                     │
│   utf-8-validate@5.0.10.                                                     │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
Done in 384ms using pnpm v10.28.0
```

`pnpm gen:deno && git diff --exit-code -- supabase/functions`: PASS (exit 0)
```text
> taskbar-hero@0.0.0 gen:deno /Users/bao/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps
```

full suite skipped: docs only

| Command | Status | Output / Notes |
| :--- | :--- | :--- |
| `pnpm install --frozen-lockfile` | PASS | Up to date, exit 0 |
| `pnpm gen:deno && git diff --exit-code -- supabase/functions` | PASS | 18 Edge Function maps generated, no drift, exit 0 |
| `pnpm typecheck` | SKIPPED | Docs-only diff |
| `pnpm lint` | SKIPPED | Docs-only diff |
| `pnpm test` | SKIPPED | Docs-only diff |
| `pnpm build` | SKIPPED | Docs-only diff |
| `cd apps/web && pnpm test:e2e` | SKIPPED | Docs-only diff |

## Acceptance items

| Item | Status | Finding / Evidence |
| :--- | :--- | :--- |
| **1. Boss Lifecycle (bossReadyStrong & bossReadyWeak)** | NOT VERIFIED | Source under test unavailable (stopped at gate). Automated spec prepared in harness. |
| **2. Forge (craft, salvage, lock guard, Relic area)** | NOT VERIFIED | Source under test unavailable (stopped at gate). Automated spec prepared in harness. |
| **3. Relic UI with no wallet connected** | NOT VERIFIED | Source under test unavailable (stopped at gate). No wallet connected; no transactions sent. |
| **4. Real desktop browser layout zoom (100%, 200%, 400%)** | NOT VERIFIED | Source under test unavailable (stopped at gate). Layout zoom matrix probe prepared in harness. |
| **5. Resize drag burst (1600 -> 420 px 4px steps x3)** | NOT VERIFIED | Source under test unavailable (stopped at gate). Burst probe prepared in harness. |
| **6. Phone sheet at 320x568 and 390x844** | NOT VERIFIED | Source under test unavailable (stopped at gate). Sheet Escape/focus/scroll probe prepared in harness. |
| **7. WebKit execution** | PARTIAL / NOT VERIFIED | `pnpm exec playwright install webkit` **PASS** (WebKit 27.2 downloaded to `/Users/bao/Library/Caches/ms-playwright/webkit-2370`); items 4–6 on WebKit **NOT VERIFIED** due to missing baseline source. |
| **8. Reduced motion on and off for items 1 and 5** | NOT VERIFIED | Source under test unavailable (stopped at gate). Reduced motion matrix prepared in harness. |
| **Physical device checks** | NOT VERIFIED | Simulation only; no physical device claims made. |

## NOT verified

- All runtime interaction, visual capture, and assertion checks for Items 1 through 6 and Item 8 remain **NOT VERIFIED** because neither `ai/codex-fix-resize-hygiene` nor `ai/codex-integrate-v2-stage` exists to build and run.
- Physical device checks are NOT VERIFIED.
- WebKit execution of items 4 through 6 is NOT VERIFIED (though the browser binary was successfully installed).

## What is needed to continue

1. Publish the required integrated baseline commit on remote branch `ai/codex-integrate-v2-stage` (or resolve and publish `ai/codex-fix-resize-hygiene`).
2. Run the prepared harness from `reports/qa-integrated/harness/run-qa-integrated.mjs` against the resulting build.

## Files touched and git verification

```text
$ git diff --stat origin/main...HEAD
 reports/qa-integrated.md                                | 143 ++++++++++++++++++
 reports/qa-integrated/harness/README.md                 |  31 ++++
 reports/qa-integrated/harness/logs/gate-checks.txt      |  38 +++++
 reports/qa-integrated/harness/logs/gen-deno.txt         |   6 +
 reports/qa-integrated/harness/logs/pnpm-install.txt     |  13 ++
 reports/qa-integrated/harness/logs/webkit-install.txt   |  13 ++
 reports/qa-integrated/harness/run-qa-integrated.mjs     | 167 +++++++++++++++++++++
 7 files changed, 411 insertions(+)

$ git diff --name-only origin/main...HEAD
reports/qa-integrated.md
reports/qa-integrated/harness/README.md
reports/qa-integrated/harness/logs/gate-checks.txt
reports/qa-integrated/harness/logs/gen-deno.txt
reports/qa-integrated/harness/logs/pnpm-install.txt
reports/qa-integrated/harness/logs/webkit-install.txt
reports/qa-integrated/harness/run-qa-integrated.mjs

$ git log --format='%an <%ae>' origin/main..HEAD
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
```
