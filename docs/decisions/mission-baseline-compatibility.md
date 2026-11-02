# Restore the existing verification baseline

Date: 2026-11-01. SIGNED by Codex under full user authority, 2026-11-01.

## Context

The mission requires every complete verification suite to pass before any merge. Fresh main at 1fb25ed fails the Deno import guard and three browser cases: stage recreation with reduced motion, plus existing HUD height constraints at narrow widths. The mission's feature work remains desktop-only; existing responsive behavior and tests must be preserved.

## Options

1. Leave the known failures and call a partial run green. Rejected: violates the score and merge gates.
2. Remove or relax existing tests. Rejected: violates test integrity.
3. Repair the baseline regressions in one prerequisite PR, without adding a mobile redesign or changing gameplay. Chosen.

## Choice and rationale

BASE0 combines exact Deno import-map aliases, the existing FXRB scene-readiness guard, and the smallest shell compatibility repair supported by the unchanged HUD tests. These independent failures must be repaired together because an intermediate red-main merge is forbidden. FXRB keeps its dedicated PR for its stronger resize assertions and repeat evidence. No dependency, auth source, contract, live deployment or game economy changes are included.

## Reversal

Revert the BASE0 merge through a PR, keeping all regression tests. If the old behavior is needed for investigation, reproduce it only in a scratch worktree. Do not restore unresolved Deno edges or a crashing scene to the deployed branch.
