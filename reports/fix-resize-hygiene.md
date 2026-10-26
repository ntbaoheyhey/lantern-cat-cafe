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

Actual command and output:

```text
$ git fetch origin +main:refs/remotes/origin/main +ai/codex-integrate-v2-stage:refs/remotes/origin/ai/codex-integrate-v2-stage
fatal: couldn't find remote ref ai/codex-integrate-v2-stage
[exit 128]

$ git ls-remote --exit-code --heads origin ai/codex-integrate-v2-stage
[no output; exit 2: no matching ref]

$ git fetch origin +main:refs/remotes/origin/main
From https://github.com/ntbaoheyhey/taskbar-hero
 * [new branch]      main       -> origin/main
[exit 0]

$ git log -1 --format='%H %s' origin/main
337977751204b5ea59d8f0cabfb91fb4cd4a391f feat(web): v2 Help tab content (A23 / V27e) (#169)

$ git log --all --oneline --grep='CX1\|integrate-v2-stage'
[no output; exit 0]

$ rg -n 'CX1|integrate-v2-stage' reports docs/tasks
[no output; exit 1]
```

## Required docs-only checks

FAIL — `pnpm install --frozen-lockfile` (exit 1):

```text
Scope: all 7 workspace projects
[ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY] Aborted removal of modules directory due to no TTY

If you are running pnpm in CI, set the CI environment variable to "true", or set "confirmModulesPurge" to "false".
```

FAIL — noninteractive retry, `CI=true pnpm install --frozen-lockfile` (exit 1):

```text
Scope: all 7 workspace projects
Recreating /workspace/taskbar-hero/node_modules
? Verifying lockfile against supply-chain policies (520 entries)...
Lockfile is up to date, resolution step is skipped
Packages: +504
Progress: resolved 504, reused 0, downloaded 495, added 504, done
✓ Lockfile passes supply-chain policies (520 entries in 10.6s)

[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4, utf-8-validate@5.0.10

Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
```

FAIL — `pnpm gen:deno && git diff --exit-code -- supabase/functions` (exit 1).
The environment's pnpm performed another install check before running the
generator and failed; neither the generator nor the chained diff ran:

```text
Scope: all 7 workspace projects
✓ Lockfile passes supply-chain policies (verified 10s ago)
Lockfile is up to date, resolution step is skipped
Already up to date

[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4, utf-8-validate@5.0.10

Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
[ERROR] Command failed with exit code 1: /opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin/node /opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/bin/pnpm.mjs install
```

The runtime printed pnpm 11.25.0 in its update notice; package.json pins
`pnpm@10.28.0`. The install automatically added unresolved `allowBuilds` entries
to `pnpm-workspace.yaml`. Restored that file immediately with
`git checkout origin/main -- pnpm-workspace.yaml`; no dependency, lockfile, or
workspace changes are included. No build approvals or policy bypasses were used.

PASS — separately ran `git diff --exit-code -- supabase/functions`: no output,
exit 0. This checks the current diff only; generated-output freshness is
NOT VERIFIED because `gen:deno` did not run.

full suite skipped: docs only

| Required command | Result |
| --- | --- |
| `pnpm typecheck` | NOT VERIFIED — not run, gate stop / docs only |
| `pnpm lint` | NOT VERIFIED — not run, gate stop / docs only |
| `pnpm test` | NOT VERIFIED — not run; no unit-test counts measured |
| `pnpm build` | NOT VERIFIED — not run, gate stop / docs only |
| `cd apps/web && pnpm test:e2e` | NOT VERIFIED — not run; no browser-test counts measured |

## Acceptance self-check

Re-read the goal, CX1 gate, seven-file allowlist, forbidden files/actions,
two-fix-round limit, and all acceptance requirements before finishing.

| Item | Result |
| --- | --- |
| CX1 DONE and reported baseline commit available | FAIL — remote branch missing; no matching local completion record |
| Four screenshot writers use SCREENSHOTS / SCREENSHOT_DIR without assertion changes | NOT VERIFIED — implementation stopped at gate |
| Full browser run leaves no modified reports evidence | NOT VERIFIED — browser suite not run |
| SCREENSHOTS=1 still produces images | NOT VERIFIED — not run |
| Burst regression fails on baseline first, then passes after fix | NOT VERIFIED — baseline unavailable; no regression added |
| Settled canvas count, width, height, both actors | NOT VERIFIED — no browser probe run |
| Whole browser suite and all unit tests pass, with counts | NOT VERIFIED — not run |
| Measured instance count before / after | NOT VERIFIED — no measurements; card's 77 is supplied evidence, not a result from this run |
| Existing resize and stage-redraw assertions preserved | PASS — no test files changed |
| Report-only stop with no product changes | PASS |
| No PR, merge, GitHub Actions invocation, deploy, live DB write, or sharing change | PASS |

## NOT verified and what is needed to continue

All product acceptance results, browser/unit counts, and generated-output
freshness remain unverified. To continue, publish the required CX1 DONE report
and baseline commit on `ai/codex-integrate-v2-stage`, or explicitly supply a
replacement baseline/gate instruction. No product file outside the allowlist is
needed for the gate itself.

Separately, the required check commands need the environment to honor the
repository's pinned pnpm 10.28.0. If build approvals remain necessary, pnpm
requests edits to `pnpm-workspace.yaml` for bufferutil, keccak, and
utf-8-validate; that file is expressly forbidden and outside this task's
allowlist, so no such fix was attempted. This report does not request or apply
dependency changes.

## Files touched and final repository checks

Only `reports/fix-resize-hygiene.md` is included. Final diff-stat, author,
allowlist, and push results are recorded below after verification.
