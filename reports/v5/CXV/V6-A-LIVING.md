# V-A: living motion, first implementation step
Four heroes now have distinct breath periods, slow weight shifts, neck-pivot turns and seeded gestures. Ears, tails and held objects follow with the existing analytical springs. Feet remain planted; actions attenuate idle gestures and retain contact holds. Authored art is unchanged.

## Evidence and limits
- Current local judge route: http://127.0.0.1:6310/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3&dev=1 . All evidence below was captured by CXV at HEAD `b064f41fc9149a0fa6960066946e39d0648b9e2e` plus runtime patch SHA256 `7b989cc8f5a07ad1e82463aba0561abcc8a09a22ba359323e6ba2021c209911c`.
- `work/v5/CXV/films/V-A-r2/`, 12:43:50.098–12:44:06.363 UTC: four 1024px actor sheets and 1280×720/25fps/16.24s film, including a 12s real-time idle segment. This is a controlled boss fixture, not live gameplay or performance proof.
- 12s rig samples: horizontal head travel Mochi1.95%, Soot1.86%, Clover1.45%, Panko1.33% of opaque height, versus baseline0% for all four. Both feet0; three seeded blinks. Per-hero breath periods3.35/4.15/3.8/4.4s. Gestures start about8.5s apart, rise300ms, recover1100ms.
- `V-A-hit/`, 12:44:34.440–12:44:38.514: all four hurt/K4 at30.02/30.1s, recovery/K0 at30.25 and idle at30.5. `V-A-actions/` contains each ultimate at850/1100/1280/2199ms plus pose audit; every hero casts and appears as a victory spectator. No page errors.
- `V-A-reduced/`, 12:45:52.591–12:45:57.523: zero horizontal head motion and0.9% vertical breath. All final idle, hit and action sheets and the reduced field visually inspected once. No detached feet or visible mesh tears found; cast/hurt art remains legible.
- `work/v5/CXV/ref/reference-compare-600ms.jpg`: friendF810/F828 (27.0/27.6s), current Clover20.0/20.6s, matching600ms windows with approximately95±5px head widths. Friend is manually driven and filmed from a monitor; current is automatic idle. Reference has stronger eye/outline parallax and more expressive yaw. The current restrained sway is an improvement, not full Live2D equivalence. Preliminary unscaled comparison is not acceptance evidence.

## Validation and delivery
24/24 focused living-motion, secondary-motion and cutout tests pass; typecheck exit0. Logs: `work/v5/CXV/jobs/v-a-rig-tests-r2.log`, `v-a-typecheck-r2.log`. Five new regressions failed before implementation and pass now; seeking, feet, cast breath, contact freeze and reduced motion are covered.

Deliver this passing implementation step to CXI. V-A remains open for AGV's independent current-tag reference comparison and any justified facial-depth correction. Continue V-B while that review proceeds. The ultimate sheets reveal the next visible gap: large legacy effects dominate the field; only approved V5 texture layers may receive the narrower protection mask.

Study: `/Users/bao/taskbar-hero-mailbox/LEARN/CXV-living-characters-v6-20261117.md`. No phone captures or layout work remain in scope.
