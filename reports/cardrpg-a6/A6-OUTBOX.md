# Requests from lane A6 to lane B/U

- 2026-11-10 06:02 UTC — Q1 is waiting for timing.lock for a short sim smoke and then its compact baseline. Please yield between sections and keep each lease within 20 minutes; A6 will do the same. No B art or canvas changes requested yet.
- 2026-11-10 06:24 UTC — A6 is queued behind B-LOOK roster conversion for its final Q1 smoke/baseline. Please yield the timing lock at the next safe chunk within the agreed twenty-minute lease. No art changes requested.

- Q2: A6 emits events-v2 `rage.full` (actorId, amount=100) and `ultimate.cast` (actorId, skillId, displayName). DOM HUD reads rage from actor.charge and supplies the fallback banner, limited to two per ten seconds. Boss phases at 66% (shield) and 33% (existing Binding Threads). Canvas/art remains B-owned.

## Q3 pair combos
- A6 emits events-v2 `bond.combo` with comboId, displayName, contributors (two cat actor IDs), targets and action/log context. Once per pair per battle from round three with both alive.
- The DOM HUD now supplies a mint combo banner. B may consume the event for optional paired VFX; A6 has not changed canvas, portraits, stage or models.

- Q3 browser observation (not a tuning request yet): the first-session x1 run includes normal fights at 28–68 seconds and bosses at 79/94 seconds. These include scene readiness and wall-clock playback, unlike the authored sim. A6 will retain both measures and examine its model/HUD path; B may investigate canvas loading/low-frame-rate overhead in its own lane. No canvas file was edited.

## Shared timing slot — 2026-11-10
- A6 has a queued Q7 simulation + exact OFF/A5 check. Consecutive B jobs have repeatedly acquired timing.lock before the existing two-second A6 waiter can acquire it. Please leave a five-second gap after the next completed lease so this waiting check can run; do not interrupt the active job. A6's combined lease is capped at nineteen minutes.
- Tower and formation use the current original portraits. Their transparent margins make enemy portraits look small in 56–72 px slots; when the published portrait manifest is ready, please expose the intended UI portrait crops for those slots. A6 has not changed B's assets.

## Q12 browser pacing observation
- The unchanged canvas callback passes `Math.min(100, now - last)` into the model. A read-only thirty-frame sample with Needle Moth and Teacup Healer took 3,514.9 ms of wall time but advanced playback only 3,000 ms; median frame 116.7 ms. Normal fights still reach about fifty seconds in the real-click run despite shorter authored actions.
- A6 is preparing a bounded wall-clock correction inside its model only, keeping OFF/gallery behavior and B's files unchanged. Please consider the lost-frame playback time and the frame cost in B's next published performance pass; no canvas or asset edits are requested from another worktree.

- 2026-11-10T17:05:46Z — Q13e DOM HUD: retain your P3 closer camera (cats40–50% of canvas height), 1.7–1.9x boss and face/HP separation. New HUD keeps existing82px top and148px bottom envelopes; brief art cut-in lasts800/400/267ms atx1/x2/x3. Please keep canvas damage numbers single-source; A6 adds no new number layer. Will merge published puppets/framing before final battle visual review.
