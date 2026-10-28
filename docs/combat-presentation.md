# Idle stage and boss presentation

The server owns rewards, progress, gates and boss outcomes. The stage never changes game state.
`StageCanvas` reads the chapter, round and kill pips directly from `state.progress`. The diamond is
the last kill (the elite). Finishing round 10 shows “Boss ready — open Boss”. A claim that advances
the round shows “Round cleared”, then “Round start”, without delaying the current authoritative label.

## Idle fights are previews

Idle claims contain aggregate results, not a hit log. The stage therefore labels its repeating
animation “Fight preview · rewards on claim”. It previews the next frontier monster, using the
regular rotation by kill index and the elite at the last kill. Repeated preview defeats do not
advance pips, award loot or represent additional confirmed kills.

`monsterFight(deriveStats(current snapshot), monsterAt(id, stage))` supplies time to kill,
net damage taken and whether the cat can win. The stage uses the existing `buildIdleCues` weapon
schedule; equal shares of monster HP are cosmetic interpolation, not individual damage rolls.
Anticipation lasts the weapon's `windupMs`; `hitAtMs` is already measured from attack start, so
impact is `windupMs + (hitAtMs - windupMs) + projectile.travelMs`. No double windup is added.
Bow, staff and flask projectiles leave the current rig grip anchor. Impact, number and HP update
share the arrival cue. Melee contact uses opaque frame edges, sprite origins and scale, with a
2 logical pixel gap before the 2 pixel knockback. Defeat uses the authored pose and a 600 ms fade.
Enemy lunges follow the monster interval (including the Guardian's analytic delay). Lunges are
presentation of expected combat, not extra damage events. No new swift projectile mechanic is added.

## Cat health

The green bar is **expected HP for this monster**, not persistent idle health. It starts at derived
max HP and falls linearly over `monsterFight.timeToKillMs` by exactly `monsterFight.damageTaken`.
That loss already includes regeneration and expected dodge: the renderer does not subtract attack
damage or add regen again. Each new preview/montage monster starts at full HP, as the analytic
idle rules do. This bar is not a replacement for the real, event-driven boss HP bar.
The cat does not play an idle death animation. An unwinnable preview cannot emit kill cues.

The claim gates the entire round profile. When `progress.gated` is true, the stage finds the first
unbeatable member among all regulars and the elite at that stage, approaches it, shows
“Too strong — equip better gear”, and stops attacks and defeats. It does not pretend that fallback
farming behind the frontier advances the displayed gate.

## Claims, visibility and bounds

Acknowledged frontier deltas replay at most the latest **eight** kills, keeping the elite when a
round finishes. Monster IDs/rounds come from the before/after frontier. Their interpolated combat
uses the latest confirmed gear/level because the API does not provide historical per-kill stats.
Farming without a frontier delta has no invented credited montage. A chapter change starts the new
preview without inventing cross-chapter kill history.
After 30 seconds hidden, pending montage playback is discarded; the current progress and the
normal claim/welcome result UI show the catch-up. There is no frame-by-frame hidden-time catch-up.

Scene sprites survive progress updates, inventory locks and resizes. Equipment appearance changes
rebuild the pair. Stage feedback is prewarmed and capped at 12 numbers/silhouettes and 8 projectiles;
there are no particle emissions. The steady update path uses cached bounds, plans and timings,
reuses a cue player, performs scalar arithmetic and mutates pool entries. It does not filter/map
arrays or instantiate effects each frame. Text rasterization on impact and Phaser internals still
allocate; this is not a claim that the browser or Phaser has a zero-allocation renderer.

Reduced motion freezes sprite poses, removes approach, lunges, knockback, projectile movement and
number rise, and retains opacity fades and the authoritative UI updates.

## Boss replay

Boss cues retain the server timeline order and final HP. Playback uses
`speed = max(1, lastCueMs / 12000)` and scales every cue timestamp and projectile travel by that
speed. Animation time is scaled as well. Replays finish within approximately 12 seconds of active
time. Skip is focused on mount, stays reachable and can be requested before the lazy canvas is ready.
The confirmed result appears when playback finishes or Skip is activated; the progress status does
not announce the outcome before then. Hiding pauses replay consumption. Returning finishes directly
with the confirmed result, without consuming the remaining cues. The parent owns the result/chest UI.

## Evidence

`apps/web/e2e/ui/g3-combat.spec.ts` covers melee, ranged, elite, gated and round-cleared states at
1280×720 and 390×844, additional required light/dark viewports, and a 180-frame p95 measurement.
Set `SCREENSHOTS=1` to save evidence under `reports/g3-combat/`. Timing, HP, bounds, gate and montage
unit tests live beside the stage; replay scaling and visibility tests live beside arena playback.
