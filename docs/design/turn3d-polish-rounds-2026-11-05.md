# Round rules · 2026-11-05
Candidate only. References: docs/design/turn3d-2026-11-05.md, packages/game-rules/src/squad/turn/, apps/web/src/game/squad/turn3d/.

The request “Do not use action time” replaces the former fractional scheduling mechanism.
A shared order sorts small integer Initiative ranks, higher first; ties use the seed then actor ID.
This interleaves both sides, makes gear's +1 Initiative meaningful, and exposes exactly who remains.

Each living participant gets one action per numbered round. Current remaining actors and the complete next round are shown together. Push Back and Quicken move a pending actor by whole positions, never duplicate one; Quicken is limited to one use per recipient per round. Summons join next round and advertise that fact. KO removes an actor from both orders. A new wave begins a fresh round.

Cooldowns, guard, burn, shield, exposure and passive recovery count completed rounds. A duration applied in round N keeps its full duration until the end of round N+1; duration 2 expires at the end of N+2. Burn ticks once at the affected actor's opening action in each subsequent round. Interruption/stun consumes one pending action, then clears; restrain persists until its duration expires or the Binding Thread dies. Boss commitments say “this round” or “next round”. Cosmetic animation playback rate has no effect on rules.

A synchronous, seeded, pure TS core owns all outcomes. Events carry round numbers. The presenter drains each action before opening the next decision. The older 2D comparison is a preserved historical implementation; it is not the current round system. No economy, saved state, server, chain or inventory adapter is introduced.

