# Four separate self-review passes

Primary session only. These are self-grades, not independent user research. Each
pass began with the running build in a fresh browser. Earlier captures are retained;
new captures use runtime `372c65a`. No combat log was needed for the UI exercises.

| Pass | Before → after / 10 | Observation and evidence |
|---|---:|---|
| First-time player | 7.2 → 8.1 | Current cat, 1–4 skills, committed move and target readable without the log. Initial labels collided; screen-space label placement and staggered rows fix six-role overlaps at 1024, 1280 and 1440. `fresh-pass-1.png`, `fresh-pass-1-bash.png`, `regrade-opening.png`, `ui-proof.json`. |
| Skeptical judge, three-minute review budget | 7.5 → 7.9 | Original small 3D cats have stronger facial/gear silhouettes and a coherent tabletop. Same-viewport real-renderer comparison in `shots/compare/`: the new art is my preference, but effects still look like a polished prototype. Native 2D and 3D panel sizes differ; this is not a pixel-for-pixel quality metric. |
| Active player | 7.7 → 8.0 | Bash cancels the advertised charger action, row Snare offers a real AoE choice, Milk Flask can save Soot. Completed campaign: 173 slots, zero fallen cats; 92.53 seconds at x4 after three manual choices. `active-review.json` and `fresh-pass-3-*`. This is not a measured x1 human playtime. Terminal UI no longer names the defeated boss as the active turn. |
| Effects director | 7.1 → 7.8 | All 35 action/lifecycle recipes have five captured beats (175 frames). Multihit text previously implied multiplication; it now says “3 hits · total”. Healing no longer plays a hurt reaction; KO clips belong to the fallen actor. Instanced glow, shield/flame/flask/petal silhouettes and lower impact opacity improve the weakest generic bursts. `shots/effects/*`, `live-review.json`, `video/live-self-review.mp4`. |

Overall self-grade: **7.95/10** (mean of the four final scores), not a claim that a
universal beauty gate is met. Recommend a demo-only candidate until external playtests
and broader GPU profiling. Metal profiling was subsequently added for the local M3 Pro. The prior 2D path remains the default when only `squad=1`
is requested; the 3D candidate requires the additional `squad3d=1` opt-in.

## Effects director notes after the fix

- Mochi: Bash has a readable wind-up, lunge, shield stamp, recoil and shield residue.
  Rally/Hearthwall remain similar; their target count and canopy scale distinguish them.
- Soot: Spark/Orb/Lanternstorm have violet trails with ember flames; Snare has persistent
  loops. Storm's white core still partly hides the back-row faces for its 100ms impact.
- Clover: the rotating flask silhouette now reads in transit. Droplets and petal rings
  distinguish healing and shelter. Nine-Lives' three stacks of numbers remain dense.
- Enemy actions: household silhouettes and timings are distinct; several small melee
  attacks still share the same arc vocabulary. Yarn's wind-up is clearer than its sweep
  contact; bind's persistent red loop is the strongest boss effect.
- Passive/status/KO/wave/win plans are sequenced, but intentionally quieter than skills.
  Sound cues are authored slots only; no audio was produced. There is no true bloom
  pass or per-pixel overdraw measurement. The renderer uses bounded additive glows.
- All five frozen frames differ across the timeline, but a captured frame does not prove
  enjoyment. The native x1 video supplements stills. Caption polling misses some brief
  impact labels; it is not used to claim complete beat coverage.

## Separate source pass

Re-read initiative, targeting, engine, presenter, controller and scene after play.
Queue preview consumes no RNG, legal targets reject wrong sides/taunt violations,
resolved choices lock synchronously, settlement is once-only, and presentation consumes
ordered events. Fixtures use the actual core; direct fixture mutation is debug-only.
The scene imports snapshot types but no rules/engine functions. No save/API imports
exist in the new slice. Generated Deno import-map entries are plumbing for the config
re-export; no Supabase function logic, migrations or deployments changed.

## Regrade changes and limits

The exact repeated-fixture test originally matched 173/175; initializing fixed render
time and settling the first fixture brings it to 175/175 in separate browser runs.
Rendering pauses while idle/hidden; instanced particles cut peak calls below 220.
Performance results use the actual new production renderer, never prior pixel numbers.
Full campaign wins are still 100% in the 30-seed conditions; the nontrivial-balance gate
is not met. Metal and SwiftShader are now separately measured. One M3 Pro does not establish a midrange-laptop compatibility claim.
