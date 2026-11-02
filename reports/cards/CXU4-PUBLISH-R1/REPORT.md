STATUS: IN-PROGRESS

# CXU4 source publication verification

Observed 2026-11-02T08:00:52+07:00. Source/head d408ada368a05c078dcd97bbd61f4e4b1dbc238b; branch ai/codex-cxu4; base1fb25ed. The branch was absent remotely and no existing CXU4 PR was found before publication. DraftPR251 was created2026-11-02T08:01:18+07:00 and a later read confirms open/draft/mergeable on main1fb25ed. A normal non-force push succeeded, and git ls-remote returned the exact source head. Required author/suffix and30-file diff were checked. Historical untracked reports/media in the original checkout were preserved; no blanket stage or cleanup.

Fresh direct verification checkout: /Users/bao/.codex/worktrees/mega-cxu4-verify-d408ada/taskbar-hero, retained clean. Frozen install exit0. Focused units exit0:9files/56tests. Onboarding exit0:2files/19tests. All commands, exact head and raw-log SHA256 values are in result.json. No browser/preview ports were started, no helper or subagent used, and no process remains active.

The historical integration b06a68d has58focused cases because its theme tests also include two BASE0 contrast pairs (muted text and XP graphic). It is a different head, with the preceding queue integrated. Source Hero/Help/shared-UI directories are byte-identical, but historical full/repeat/effects outcomes are not relabeled as d408ada evidence. See ../CXU4-PREFLIGHT-R2/REPORT.md.

Static source checks: git diff --check passed; required author/skipCI suffix intact; no asset, backend, package, dependency, workflow or contract change. changed-files.txt and source-diff-stat.txt preserve the30-file scope. The implementation decisions remain on its source branch; the canonical living report is ../../redesign/CXU4.md on the ledger.

Command: `pnpm install --frozen-lockfile`. Exit0. Tail of install.log:

```text
│                                                                              │
│   Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4,                     │
│   utf-8-validate@5.0.10.                                                     │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
Done in 6.1s using pnpm v10.28.0
```

Command: `CI=true SCREENSHOTS=0 VITE_SUPABASE_URL='' VITE_SUPABASE_ANON_KEY='' pnpm --filter @taskbar-hero/web test src/layout/character src/layout/HelpTab src/ui src/theme.contrast.test.ts src/layout/StageLayout.test.tsx src/layout/notice`. Exit0. Tail of focused-units-d408ada.log:

```text
 RUN  v5.0.5 /Users/bao/.codex/worktrees/mega-cxu4-verify-d408ada/taskbar-hero/apps/web


 Test Files  9 passed (9)
      Tests  56 passed (56)
   Start at  07:59:15
   Duration  6.88s (tests 41%, environment 33%, transform 15%, import 11%)

```

Command: `CI=true SCREENSHOTS=0 VITE_SUPABASE_URL='' VITE_SUPABASE_ANON_KEY='' pnpm --filter @taskbar-hero/web test src/onboarding`. Exit0. Tail of onboarding-d408ada.log:

```text
 RUN  v5.0.5 /Users/bao/.codex/worktrees/mega-cxu4-verify-d408ada/taskbar-hero/apps/web


 Test Files  2 passed (2)
      Tests  19 passed (19)
   Start at  07:59:30
   Duration  627ms (environment 65%, tests 16%, import 10%, transform 8%, worker 1%)

```

Actual-main integration after earlier queue items, complete G1–G7/UI/reference comparison, source/final browser matrix, mutations, independent review, merge and live proof remain incomplete. Publication is draft preparation only.
