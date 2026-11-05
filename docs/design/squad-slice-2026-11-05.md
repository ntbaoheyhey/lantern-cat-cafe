# The last lantern: Stage 1 squad slice

2026-11-05. Builds on `squad-combat-review-2026-11-05.md`, candidate `0b92553`.
Local prototype only. `features.squadCombat=false`; `?demo&squad=1` selects an isolated,
lazy entry before the main app/store is imported. No storage, API, reward or replay adapter.

## The memorable fight

1. The cafe's closing bell rings. Mochi (Guardian) stands in the front; Soot (Witch)
   and Clover (Alchemist) take separate rear anchors. Three enemy silhouettes approach.
2. A charger lowers its spool horn. A striped lane and countdown identify its victim.
   Mochi's Rally intercepts it and visibly raises a guard shield.
3. Soot threads the guard and two clustered small foes together. Snare icons persist;
   her Ember Orb then expands on the held group and leaves small capped burn marks.
4. Clover watches Mochi's HP fall. A white flask arcs over the line, breaks at his feet,
   and restores HP on impact. An observable passive leaves a small shield.
5. The alternative is to mark the rear healer first. The Witch redirects her next cast;
   its death prevents healing and shortens the encounter. The Guardian still holds front.
6. HP carries through three waves. A short preparation pause reveals the next composition.
   Completion settles only an in-memory “fish found” counter, once. Between encounters,
   a new run restores the squad; retry never writes to a real save.
7. Yarn Giant sweeps a marked lane, ties one ally and exposes its knot. Free the ally,
   clear the loose-thread adds, or mark the knot and spend Lanternstorm on the opening.
   Below half HP, a second crossing lane forces protection of both rows. Enrage ends stalling.

## Encounters and threat budget

| Encounter | Composition | Decision |
|---|---|---|
| 1 · Doorstep tangle | Guard, charger, two flankers | Intercept, snare, burst |
| 2 · Teatime trouble | Guard, healer, two ranged, flanker | Mark the healer or hold the front |
| 3 · Closing patrol | Armored elite, healer, charger, ranged, two flankers | Preserve HP and sequence control |
| Yarn Giant | Boss, at most two loose threads per add phase | Free, clear or burst |
| Training | One dummy or eight role-mixed targets | Compare damage/heal/shield and all effects |

Only one enemy heavy windup at a time. Routine attacks are staggered by slot. Rear-targeting
flankers are weaker than the guard. Adds consume the same enemy cap (eight), never an
unbounded spawn budget. All numbers and skill tables live in the squad config re-export.
Two data presets: Hearthkeepers (guard/last-heal shield) and Lanternbreakers (pierce/break).

## Rules and presentation contract

Pure 50ms tick simulation; seeded RNG; stable actor insertion order; commands ordered by
tick then sequence; releases before impacts, deaths immediately on impact, then new casts.
The event stream carries resolved outcomes and actor snapshots, so replay projects state
without rolling damage again. A launched hostile projectile fizzles on a dead target;
support flasks retarget a living injured ally. Area impacts retain their fixed ground zone.
Control resistance grows per application with a hard continuous-control cap and immunity
window. Buffs add by kind and cap once, never multiply per allied source.

Events: `cast_start`, `projectile_release`, `impact`, `status_applied`, `status_expired`,
`heal`, `shield`, `interrupt`, `death`, `wave_transition`, `boss_phase`, `passive`, `reward`,
`command`, `fizzle`, `retarget`, `fight_end`, plus state checkpoints. Every skill/attack has
anticipation, distinct motion, event-timed contact, reaction/HP/number and short residue.
Phaser owns presentation only. Melee approaches contact then returns; ranged keeps its anchor.
Danger is striped/marked above scenery. Calm motion keeps timing bars, zones and outlines.

## Acceptance and cut line

Stage-1 gate, verbatim: **Groups have real targets/HP; front-line contact and ranged impacts
are visible; full auto works; active targeting changes outcomes; two compositions are viable.**

Also require isolated default-off routing, no real-save/network writes, deterministic
50/60/144Hz+hitch playback, bounded effects and eight-target layout at 1280×720. Test
all new mechanics; run both presets and policies across at least twenty seeds; measure
the production squad renderer on this machine. Self-grades are judgments, not player data.

Cut first: compact idle view, alternate classes, skill variants, additional gear, second boss.
Keep the three cats, nine abilities, three passives, three authored waves, Yarn Giant,
effect contract, causal contact, isolation, tests and offline real-core demo. Any missing
gate will be explicitly reported. No human playtest is claimed; delivery includes a pilot plan.
