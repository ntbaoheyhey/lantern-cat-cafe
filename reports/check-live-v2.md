STATUS: BLOCKED

Card C16 stopped at the installation check. No implementation is delivered. The unfinished scripts were removed and the original live check was restored. Only this report is committed. No production health check, GitHub Actions, pull request, deployment, or merge was run.

## Exact blocker and continuation

`pnpm install --frozen-lockfile` failed with `ERR_PNPM_IGNORED_BUILDS` after downloading the dependencies. The container resolves `pnpm` to 11.25.0, whereas package.json:5 specifies pnpm@10.28.0; Node is v24.19.0. The install generated an unapproved `allowBuilds` section in pnpm-workspace.yaml. That file is outside the card allowlist and was restored to origin/main. No dependency build was approved, disabled, or bypassed.

Under the card's stop rule, no further implementation or verification was attempted after this failure. To continue, provide an environment using the repository's pinned pnpm@10.28.0 and restart the checks. If installation still requires an explicit build policy, pnpm-workspace.yaml (after line 4) would need authorization to declare build decisions for bufferutil, keccak, and utf-8-validate. No test or assertion failed: the blocker is the package manager's installation policy. No test was skipped, disabled, weakened, or deleted from the repository.

## Gate output

Git identity initially differed and was set locally before creating the branch. Final identity:

```text
$ git config user.email
108352255+ntbaoheyhey@users.noreply.github.com
$ git config user.name
ntbaoheyhey
```

```text
$ git fetch origin +main:refs/remotes/origin/main
From https://github.com/ntbaoheyhey/taskbar-hero
 * [new branch]      main       -> origin/main
$ git show origin/main:scripts/check-live.mjs | grep -n "const FUNCTIONS"
14:const FUNCTIONS = ['auth-nonce', 'auth-verify', 'game-state', 'idle-claim', 'equip', 'boss-fight', 'upgrade', 'relic-forge', 'relic-mint-report'];
$ git ls-tree --name-only origin/main supabase/functions/ | grep '^supabase/functions/v2-'
supabase/functions/v2-choose-class
supabase/functions/v2-claim
supabase/functions/v2-craft
supabase/functions/v2-equip
supabase/functions/v2-lock
supabase/functions/v2-relic-forge
supabase/functions/v2-salvage
supabase/functions/v2-state
$ git ls-remote origin 'refs/heads/ai/*check-live*' | awk '{print $2}' | sed 's#^refs/heads/##' | grep -vxF -e ai/codex-check-live-v2
(no output; grep exit 1)
```

PASS: all three gates. v2-boss-fight was absent on main. There was no competing branch and no existing v2 live-check implementation. A later fetch also completed successfully.

## Checks actually run

First installation attempt, without a terminal (exit 1):

```text
$ pnpm install --frozen-lockfile
Scope: all 7 workspace projects
[ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY] Aborted removal of modules directory due to no TTY

If you are running pnpm in CI, set the CI environment variable to "true", or set "confirmModulesPurge" to "false".
```

Repeated the same command with a terminal and answered yes to recreating the existing modules directory. Relevant actual output (exit 1; repetitive progress and terminal controls omitted):

```text
$ pnpm install --frozen-lockfile
Scope: all 7 workspace projects
? The modules directories will be removed and reinstalled from scratch. Proceed? (Y/n) y
✔ The modules directories will be removed and reinstalled from scratch. Proceed? Yes
Recreating /workspace/taskbar-hero/node_modules
✓ Lockfile passes supply-chain policies (520 entries in 32.6s)
Lockfile is up to date, resolution step is skipped
Packages: +504
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Downloading @electric-sql/pglite@0.5.11: 8.81 MB/8.81 MB, done
Downloading phaser@3.90.0: 22.61 MB/22.61 MB, done
Downloading @rolldown/binding-linux-x64-gnu@1.2.15: 8.30 MB/8.30 MB, done
Progress: resolved 504, reused 0, downloaded 495, added 504, done
[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4, utf-8-validate@5.0.10

Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
```

During the installation, initial helper code and tests were drafted. This command passed before the installation failure was observed; both new files were subsequently removed so this is historical evidence only, not a test of the final report-only branch:

```text
$ node --test scripts/check-live-v2.test.mjs
✔ discovers only v2 directories, sorted (7.046465ms)
✔ anonymous POST must be exactly 401, identifying function versus gateway (0.716931ms)
✔ CORS needs both a 2xx and the matching or wildcard origin (73.711325ms)
✔ HTML module scripts are same-origin assets only, unique and capped at ten (1.797765ms)
✔ real API detection uses the configured Supabase host (0.33199ms)
✔ v2 marker verdict covers pre/post, present/absent and skip (0.671221ms)
✔ fresh import performs no network request (2.295613ms)
✔ real repository contains v2-state and valid v2 folder names (1.02678ms)
ℹ tests 8
ℹ suites 0
ℹ pass 8
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 298.40817
```

## Marker and intended mode table

No marker was validated: neither comparison build ran. `v2-shell` was an initial candidate from StageLayout.tsx, but uniqueness is NOT VERIFIED and no marker is shipped. The final branch does not add either a flag verdict or the specified SKIP fallback; the existing script remains unchanged.

The requested behavior for a future implementation is:

| Mode | Lines to run | PASS meaning |
| --- | --- | --- |
| pre (default) | v1, discovered v2 anonymous POST and CORS checks, bundle API and flag checks | v2 POST is 401 (function or gateway), CORS is 2xx with matching or wildcard origin, Supabase host present, validated v2 marker absent |
| post | Same checks | Same requirements, but validated v2 marker present |
| off | Existing v1 lines only | Existing v1 behavior |

A missing validated marker should produce the card's SKIP line without increasing the failure count. This fallback has NOT been implemented or tested in the delivered branch.

Cut-over note for docs/cutover-v2.md / card A22: **run with CHECK_LIVE_V2=post after the flag flip**. That document was not edited.

## Acceptance self-check

- PASS: fetch latest main, confirm v1-only FUNCTIONS, eight required v2 directories, no competing branch; record missing v2-boss-fight.
- PASS: required local Git identity configured; final author and allowlist checks are recorded below.
- PASS: dependency-free constraint, no dependencies added, no keys printed, no application or forbidden files retained in diff.
- PASS: existing v1 script behavior and output preserved by restoring the file unchanged.
- NOT VERIFIED: automatic discovery including future v2-boss-fight in a delivered implementation.
- NOT VERIFIED: exact 401 function/gateway classification, 404 not deployed, and OPTIONS CORS integrated into the live check. Draft helper tests passed but are not delivered.
- NOT VERIFIED: same-origin module retrieval, ten-file limit, timeout, real API host and pre/post marker checks in the delivered script.
- NOT VERIFIED: CHECK_LIVE_V2 default/pre/post/off modes and non-counting SKIP behavior in a delivered implementation.
- NOT VERIFIED: all seven requested helper test categories in the final branch (temporary draft passed eight tests).
- NOT VERIFIED: both local builds, bundle sizes and marker grep comparison.
- NOT VERIFIED: short v2 paragraph/env var in docs/runbook.md (not changed because implementation stopped).
- NOT VERIFIED: live v2 deployed/not-deployed list. No production requests were made, so every v2 deployment state is unknown; this is not evidence of missing deployments.
- FAIL: required pnpm install --frozen-lockfile, as shown above.
- NOT VERIFIED: pnpm gen:deno && git diff --exit-code -- supabase/functions.
- NOT VERIFIED: pnpm typecheck, pnpm lint, pnpm test, pnpm build.
- NOT VERIFIED: node scripts/check-live.mjs and CHECK_LIVE_V2=off node scripts/check-live.mjs.
- NOT VERIFIED: node scripts/check-links.mjs docs/runbook.md.
- PASS: e2e not required by the final file scope (no apps/web, packages, package.json or pnpm-lock.yaml changes).
- PASS: blocker report written; branch push result and commit are provided in the final response. No PR or Actions run.

## NOT verified

All checks listed as NOT VERIFIED above were not run because the card requires stopping after an installation failure requiring work outside the allowlist. The plan path tasks/v2/plan-to-finish.md is absent from this checkout; the pasted card supplied the operative scope and acceptance requirements. No full-suite success or live deployment readiness is claimed. The final diff is report-only; full suite skipped: docs only, and installation blocked before the remaining docs-only checks.

## Final files and author checks

The final stat and author verification follow below. The stat was generated after committing the report, then inserted into it; its line count changes with this insertion.

Actual verification output at the report checkpoint (before appending this output):

```text
$ git fetch origin +main:refs/remotes/origin/main
(no output; exit 0)
$ git diff --name-only origin/main...HEAD
reports/check-live-v2.md
$ git diff --stat origin/main...HEAD
 reports/check-live-v2.md | 142 +++++++++++++++++++++++++++++++++++++++++++++++
 1 file changed, 142 insertions(+)
$ git log --format='%an <%ae>' origin/main..HEAD
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
```

PASS: the only changed path is allowlisted. PASS: every task commit has the required author. This report-only task branch is used because implementation work had begun before the installation blocker, rather than stopping at the gate.
