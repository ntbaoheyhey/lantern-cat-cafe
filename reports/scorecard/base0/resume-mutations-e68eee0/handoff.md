# BASE0 mutation handoff — paused by user

The coordinator's PAUSED-BY-USER.txt marker was discovered after the main sequence ended and the supplemental sequence had started. Its text requests stopping all implementation/tests/commits/pushes for machine sleep and resuming only on explicit instruction. The owned supplemental process tree was terminated immediately on discovery. No further tests started after discovery. The active wrong-token mutation was restored exactly from HEAD; git diff --exit-code returned 0. The untracked pause marker is preserved.

HEAD e68eee0be82a085999f565800bf50925046acf18. Worktree: /Users/bao/.codex/worktrees/mega-base0-resume-mutants/taskbar-hero.

{
  "head": "e68eee0be82a085999f565800bf50925046acf18",
  "state": "PAUSED_BY_USER",
  "completedRecordedRuns": 31,
  "completedMutationRecords": 21,
  "verifiedKills": 20,
  "survivors": [],
  "interruptedRecords": [
    "control-effects-before",
    "effects-ignores-viewport"
  ],
  "additionalStartedThenStopped": "hud-xp-wrong-token; no outcome counted; source restored",
  "passedControls": 9,
  "trackedSourceClean": true,
  "untrackedMarker": "?? PAUSED-BY-USER.txt",
  "ports": [
    4610,
    4611,
    4612,
    4613,
    4619
  ]
}

Evidence is in reviewed-results.json (authoritative reviewed outcomes), paused-summary.json, source-clean.txt, source-stamp.json, integrated-source.diff and per-case .diff/.log/.json. Raw results.json and completed.json remain unchanged as historical automatic output; completed.json predates the supplemental partial run. Its raw Deno classifications are reporter mismatches, and its viewport kill classification is invalid because exit 143/missing output is interruption, not a meaningful kill. reviewed-results.json corrects both without altering any exit code or raw log.

Verified behavior: 8 Deno generator mutations (explicit index, directory, test/fixture exclusion, ordinary module, auth distinction, shared/non-function exclusion), scene pre-boot guard, missing HUD styles, readable action, actionable navigation, XP width and semantic value, gated ancestor containment, visible nonzero XP fill, F3/errors no-output contracts, effects omitted Help and inert tool navigation. HUD browser cases exercised both 1280x720 and 1600x900. Effects used selected 1600x900.

F3 and errors opt-in mutants: browser exit 0, independent no-output contract exit 1, combined 1. Effects omission and inert navigation exit 1 for intended coverage/selected-tab failures. The first effects control and viewport mutant were interrupted with exit 143 around the coordinator pause; the viewport mutant had no PNG and is NOT verified. A later unchanged effects control completed all 10 checks and the 1600x900 PNG contract successfully.

Outstanding only if explicitly resumed: complete independently named viewport mutation with a valid PNG dimension contract; run the prepared product-level Help inert/content-hidden mutations and wrong-token mutation. run-supplemental.mjs is syntax-checked but must NOT be rerun wholesale against reused artifact directories: it contains completed cases and output-path assumptions. No tests, retries, timeouts, assertions or expected values were weakened. No product fixes, dependencies, .github edits, commits, pushes, PRs, merges, live writes or deployments. This is targeted verification, not a formal grade.
