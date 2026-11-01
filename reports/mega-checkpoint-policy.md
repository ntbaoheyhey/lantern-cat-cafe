# Checkpoint and context policy — living draft

User accepted this workflow and explicitly resumed the mission on 2026-11-01.

- Save a concise on-disk handoff at approximately ten-minute intervals while active, and immediately after meaningful milestones, before a risky transition, or before stopping.
- The current handoff is `reports/MEGA-CURRENT-HANDOFF.md`. Preserve previous dated handoffs; detailed logs remain on disk. Update timestamp, exact worktree/HEAD, changed paths, worker ownership/ports, command/evidence status, unresolved findings and next action. Never label interrupted/unrun checks PASS.
- App heartbeat `taskbar-hero-checkpoint-10-ph-t` requests these updates every ten minutes in this chat. It must honor later user pauses. Scheduling is best effort; it is not a preemptive rescue mechanism for a disconnected/blocked request.
- Local Codex configuration now has `model_auto_compact_token_limit = 64000` as an initial conservative token threshold. The model, reasoning effort and context-window metadata were not changed. The old selected setting is recorded outside the repository for rollback. Active-session reload and compaction through the custom provider remain NOT VERIFIED; do not claim that writing this handoff compacted the chat.
- Workers use small coherent cards with necessary constraints, keep full logs on disk, and send concise evidence-backed summaries. Native subagents are available now; use Astra Ultra per the original model mandate.
- Before any retry after a transport failure, inspect files, worker/process ownership, git HEADs and completed external actions. Do not duplicate commits, merges, deployments or long test runs. Use bounded, spaced retries per attempt; revise the plan on repeated failures.
- Retain the complete mission queue, full verification, two independent graders and serial merge/post-merge gates. This policy changes recovery and orchestration, not the quality bar.

Official references: [configuration](https://learn.chatgpt.com/docs/config-file/config-reference), [long-running chats](https://learn.chatgpt.com/docs/learn/best-practices).

## Latest delegation preference

The user subsequently requested fewer subagent calls: start one only when necessary. Let the three already running cards finish; the coordinator handles routine follow-ups directly. Fresh independent graders remain necessary under the original two-grader merge gate. Do not fan out merely to fill concurrency slots.

The user explicitly requires the coordinator to write the session handoff personally. Never spawn an agent solely to write a handoff or checkpoint. Worker evidence notes are part of their substantive build/verification cards; the coordinator consolidates the authoritative mission handoff.
