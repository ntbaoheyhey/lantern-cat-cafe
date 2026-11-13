# V3-A2 decisions

- 2026-11-13T01:08:45.969630+00:00: Work alone; existing worktree and branch, local-only CI, no deployment or main merge. User instructions are authoritative.
- Start tag v3a2-start saved at 0d76bed967e0865cbb9f8b40f6fff2e5332ecefc. Removed only the explicitly disposable planner audit and local build.
- macOS path collision: old reports/v3-battle/A2 is the same directory as a2. Preserve its evidence; new state uses distinct file names and per-card folders.
- Reference frames remain private under ignored ref/. Review sheets are measurement-only and never enter shipped paths.
- G0 uses fail-closed numeric gates and source-commit freshness; measured reference targets stay unset until R supplies observations. No planner estimates masquerade as measurements.

- Case-path repair: git ignored lowercase add pathspecs while legacy A2 was tracked. Moved the unchanged first-run evidence to a2-first-run/ and made a2/ canonical for this run. No legacy evidence was deleted; old A2 filenames now live in a2-first-run/.
