# Turn core integration notes

Completed and reviewed by the primary session after helpers were stopped, 2026-11-05.
No changes to the stable `types.ts` contract were required.

- `createTurnBattle()` defaults to **campaign** (waves 0–2, then boss at wave 3). `patrol` ends after wave 2. `wave` optionally selects the first patrol/campaign wave.
- `startTurn` removes the active slot from `queue`; the active actor is separate. `getTimeline` includes the current actor first, then future slots, with a default length of eight. Only the next committed enemy occurrence carries an intent; later repeated occurrences have no invented future intent.
- Both heroes and enemies use explicit `chooseAction` calls. `getAutoAction` is a pure policy query, including for enemy turns; it never selects or resolves an action. Hero `auto` starts false. No create/start call makes a hero decision.
- Dead, stunned, restrained, or interrupted actors lose their turn at `startTurn`, which returns the actor with phase `resolved`; call `endTurn` once to continue. There is no invented fifth hero button. Replay drains these forced boundaries without recording a decision.
- Event action IDs are partitioned into three plans per turn: start boundary, selected action, end boundary. Each plan has nondecreasing beats, so burn/status boundary events never rewind into the next action's beat 0. Initialization uses action ID 0.
- Cooldowns and statuses count the affected actor's own subsequent turns. The applying turn does not shorten a self buff or newly used cooldown. `shieldTurns` follows the same convention.
- `history` records every accepted choice, including enemy choices; replay is for completed choices at API boundaries. Direct debug mutation and standalone queue editing are not replay inputs. Ordinary skill delay/advance effects are reproduced by choices.
- Cosmetic `fishFound` is local-only and settles once per cleared wave. There are no production save, economy, or network adapters.

Validation: 32 dedicated turn cases, including seeded properties, replay hash, API idempotency,
all twelve hero actions, turn-boundary status expiry, guard/shield/cleanse/control and binding
thread release. Rules typecheck passes. The initial 17-case full rules run passed 563 tests
plus unchanged 2 expected failures/11 skips; final complete suite is rerun in proof.
`tools/turn3d/balance.mjs` produced 360 runs with complete action histories. Final config
and every run are in `reports/turn3d/balance.json`; rejected tuning receipts are retained.
No effect/model helper code is imported by this rules layer. Policy and tests are primary-session work.
