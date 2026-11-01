# Taskbar Hero current handoff — active, living draft

Updated 2026-11-01T16:32:56+07:00. The user explicitly approved reliability setup and resumed the entire mission. Read this file before the historical pause handoff.

## Authority and scope

Full brief: [mega-mission.md](mega-mission.md); task cards: [mega-plan.md](mega-plan.md); current [ledger](mega-ledger.md), [scorecard](mega-scorecard.md), [runtime](mega-runtime.md). Preserve the complete queue. Existing backups and historical evidence remain described by [2026-11-01 pause handoff](MEGA-HANDOFF-2026-11-01.md).

## Current work

- Reliability setup: app heartbeat created for approximately10-minute checkpoint updates. Configured local `model_auto_compact_token_limit = 64000`; effective reload in this active chat/provider is NOT VERIFIED. Details and limits: [policy](mega-checkpoint-policy.md). No compaction success is claimed.
- BASE0 PR246 source HEAD63853ec, preserved logs modified; detached HUD worktree42028ad has saved actionable-guidance/160px-XP repair. Agent `/root/base0_hud_finish` is completing and retesting it before returning a commit for integration. Coordinator has not yet integrated it.
- Agent `/root/cxu4_resume_build` continues preserved Hero/Help/modal work in mega-cxu4. Agent `/root/cxu5_resume_build` continues preserved Map/Boss work in mega-cxu5. Each uses its own worktree/ports and writes a local resume-handoff.md.
- No mission PR has yet received two formal grades or merged. Existing full/repeat passes are historical and version-specific, not current exact-head gate proof.
- `git fetch --all --prune` completed successfully on resumption. Verify origin/main before integration/scoring.

## Next concrete actions

1. Review/integrate the returned BASE0 HUD repair into ai/codex-mega-deno0, preserving current effects-navigation checks and decision-index entries.
2. Run fresh-worktree complete exact-head BASE0 checks, both desktop sizes, changed-spec repeats, mutations, UI/reference/keyboard/contrast, bundle comparison, integrity/tier/secret review, live-public-config preview and verify-pr246 without comments.
3. Prepare honest pushed evidence, obtain two independent formal graders, and only then evaluate serial merge gates.
4. Continue original queue and other builder cards without weakening dependencies or safety constraints.

## Recovery essentials

Keep original checkout and unrelated dirty worktrees untouched. Correct author and every commit suffix ` [skip ci]`; no Actions, direct-main push, copied reference art or unsafe live writes. Backend-dependent features default-OFF. Preserve NOT VERIFIED. Before retrying after disconnect, inspect current files/HEADs/processes/PR state; never duplicate external actions. Full logs stay on disk.
