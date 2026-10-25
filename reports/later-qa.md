STATUS: DONE

# Later QA queue

Gate PASS: read reports/qa-v2-1.md from origin/ai/antigravity-qa-v2-1 @ 163127d96257329b3f00da0f43051d6fbf5ea2b7. This is the only remote Antigravity branch containing that report at inspection. No main report exists. No Antigravity branch was merged.

The two named QA1 findings were fixed on separate branches, with regression tests and full verification:

| finding | branch | commit | report |
|---|---|---|---|
| duplicate key-icon screen-reader announcement | ai/codex-fix-decorative-key | 096327b7c5f003013a6febabaa02125fce793a49 | reports/fix-decorative-key.md |
| focus remains outside opened mobile panel | ai/codex-fix-sheet-focus | 3cfcdb724b7f7d086d2059fba8f1b68bf7f72dd4 | reports/fix-sheet-focus.md |

Both stack directly on Q5 ai/codex-v16-stage @ fd318c4910e50152fdb0522593762288e76efbda; merge Q5 first, then review either fix independently. Neither requires the other.

## WAITING and hard stops

- Future C18+ bugs WAITING on a named eligible QA finding, one bug/card.
- Q9 bulk-equip bug is NOT named by QA1, whose broad PASS cannot override Q9's actual failing regression. It needs an eligible QA finding or explicit new scope for StageLayout/BagPanel/loop work before correction; keep Q9 BLOCKED.
- CL8 number application remains blocked on signed D4 and a READY proposal; current proposal fails two targets.
- Live Founder migration, C17 merge/flag flip, deployment, cutover and final class art remain user-only hard stops. No such action taken.

## Acceptance

- PASS: all currently named QA bugs addressed on their own branches with regressions.
- PASS: later work recorded WAITING; no invented QA source or extra product fix.
- PASS: this branch contains only this report; no PR/merge/deployment/live writes.
- NOT VERIFIED: real assistive technology/devices, combined branch integration, deployed behavior, real Fuji mint. See per-fix reports for full checks and reproduced red tests.
- Full suite skipped: docs only. Actual docs-only checks follow.


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
Done in 934ms using pnpm v10.28.0

```

```text

> taskbar-hero@0.0.0 gen:deno /workspace/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps

```

Files touched: reports/later-qa.md only (new).
