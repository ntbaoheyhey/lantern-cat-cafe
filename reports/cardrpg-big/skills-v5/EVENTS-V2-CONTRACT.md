# S4 event contract
- Battle container v4.version remains 1; each event has version 2 when initial.skillsV5 is true. OFF events stay version 1 byte-for-byte.
- Existing event payloads remain readable. V2 adds status-applied, status-tick, reaction and multi-hit.
- Every V2 event carries sequence (global event order), round, actionId (0 for setup, then monotonically one per accepted turn), stage (setup/action/round-end), and logIndex (exclusive resolved-log boundary).
- status-applied: statusId, stacks (resulting total), sourceId, targetId. IDs are normalized core/signature internal IDs, not display text.
- status-tick: statusId, sourceId, targetId, amount (actual HP damage/healing; absorbed Bleed is zero). Shield absorption stays in the resolved log.
- reaction: reactionId, primerIds (status IDs present before consumption), targets (affected actor IDs), actorId/sourceId (trigger source), targetId (primed actor/callout anchor).
- multi-hit: skillId, shape, targets in landing order, including repeated random hits. Emitted once at action resolution, no RNG draw for presentation.
- Five seeded full-battle fixtures include initial setup, choices, ordered events, resolved logs and result hash; per-action before/after status snapshots expose consume/expiry changes.
- Reaction cue <=600ms; multi-target stagger60–90ms per target inside the existing action duration. No extra action delay or input.
- Version2 fixture includes snag, bitter, Burn/Regen/Bleed ticks, shared caps and boss Daze/phase context. B may keep v1 fallback during integration.
- THC15 is the event-v2 save transport; THC14 V5 snapshots with v1 events load unchanged. Legacy non-V5 save transport remains exact.

- Published fixture is generated evidence (not imported runtime input); its SHA is recorded separately in the S4 closure. All five first matching examples use TRAIN seed1.
