STATUS: IN-PROGRESS — explicitly resumed; current verification pending.

# CXP1 current-FXRB integration and repair

Resume 2026-11-02T09:49:53+07:00: the user resumed after the pause. The one-line guard now preserves a saturated count without publishing another equal state. Store/isolation control18/18 passed. Four-file repair7393dc3 is committed on the prospective integration, with current-head root/type/lint/build/G3 checks passed, four detected cap mutations and two18-case green controls. Full1280passed280/280; full1600 and pets repeats are running/pending. Source2b7ceeb is saved locally with18focused tests/typecheck passed; it has not been pushed. Source64cf350 and PR240 have not moved. The paused record below is historical, retained with its failing regression.

## Historical pause snapshot

Saved 2026-11-02T08:37:42+07:00. User explicitly requested a handoff and pause. Do not launch tests, change product code, merge or release until an explicit resume.

Read-only acceptance review covered preview-only registries, threshold/level/equip rules, immutable store API, corruption/migration, acknowledged-claim deduplication and gameplay isolation. Existing source remains64cf350 / PR240; the stale original local branch6b06574 was not changed.

New owned checkout /Users/bao/.codex/worktrees/mega-cxp1-current-fxrb/taskbar-hero is at3c202d6, a conflict-free local merge of existing CXP1 preflight9d012ce with published FXRB26e7de8. The merge changes only the four FXRB test/doc files; CXP1 application bytes remained unchanged. Frozen installation, pnpm gen:deno and zero generated-map drift passed. Root pnpm test then passed:32chain,24auth,548Supabase,383game-rules,16API-contract and1325web. The2expected failures/11skips in game-rules are inherited and disclosed. Logs/root-test.exit preserve exit0 before the new regression was added.

A small edge-contract issue was found in recordClaimedKills: after Number.MAX_SAFE_INTEGER saturation, another valid delta still publishes a new equal snapshot, notifies listeners and writes storage. This violates state.ts's documented unchanged-state identity contract. Added23lines to state.test.ts test the real transition to the cap once and require later no-op claims to preserve identity and avoid notifications/writes. BEFORE FIX, the focused suite returns1failed/16passed (17), exit1, at the reference-identity assertion; values serialize identically. The original failure remains in capped-state-before.log.

NO production fix has been applied. Only apps/web/src/pets/state.test.ts is uncommitted in this owned checkout. Its patch and hash are saved in capped-state-regression.patch and pause-state.json. The patch is already applied locally: do not apply it twice. The intended next step after resume is a no-op guard once the clamped next count equals old, then re-run the regression and the necessary full checks on the actual repaired head. That is a plan, not a completed change.

No browser test was launched for this card. Sessions35749(install),63120(root) and47965(regression) are terminal; former root PID97554 is absent. Owned4310–4313 and4340–4343 have no listener. No subagent/helper is active. No product branch/PR/main moved, no score, merge, deployment or game-state write.

Recovery bundle: /Users/bao/.codex/handoffs/taskbar-hero/reliability/cxp1-current-fxrb-3c202d6.bundle, verified, requires280ff4b. It contains committed integration only; the separate WIP patch preserves the uncommitted regression. Keep existing source worktrees, old reports and media unchanged.

Commands already run directly: pnpm install --frozen-lockfile; CI=true pnpm gen:deno; git diff --exit-code -- supabase/functions; CI=true pnpm test; CI=true pnpm --filter @taskbar-hero/web test src/pets/state.test.ts. All raw outputs/exits are retained here. Root verification after repair, type/lint/builds/full browser/repeats/G3–G7/current mutants/independent reviews/actual-main/live remain incomplete. Pause does not waive any gate.
