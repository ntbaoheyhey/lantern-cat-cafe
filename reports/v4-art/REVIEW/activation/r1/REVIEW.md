# Production activation checkpoint

Implementation is pushed in `9a21cc07c`. Authored poses and effects now run outside the DEV/pilot gate. Effect resources load per encounter owner; late image completion after disposal is guarded. Existing designer/sequence precedence is preserved; designer idle coexisting with authored attacks remains unresolved.

Validation: 18 focused tests, typecheck, 2,713 full web tests across 324 files, three unchanged fixture hashes and the default production build passed. `validation.json` binds 78 runtime hashes; its source SHA predates the implementation commit, so the hashes identify the tested worktree.

`production-smoke-r3.json` passed normal C2 UI entry without a debug flag: visible canvas, ready scene, zero loading overlays and authored cat drawings. Separate cases use `dev=1` only for the existing model handle in the same production bundle, covering all eight heroes and 36 actions. A blocked Mochi K2 request leaves readiness false and displays an error. R1 failed by waiting for a production-hidden model handle; R2 used an obsolete Fight selector. Both failures remain saved.

`front-face-probe-r3.json` passed 16 ultimate observations at 720p/900p; maximum scoped foreground alpha coverage was 0.0035660661 (0.357%). This is live alpha readback at impact, not film acceptance.

Open: fresh action/film review, reduced motion and strict shake, full class integration, designer idle integration, blind caster association, number ownership and transfer acceptance. No new film was captured or visually reviewed in this continuation. QA independently rechecked the earlier presentation repair at 13/13 on `dfce473f`; integrated SHIP coverage is still pending.

Motion follow-up: Yarn basic sampled zero approach in X and about 50px in Y; its +9px X at impact is retaliation. Inspect the actual contact window before accepting that as a melee approach. Other observations include Mochi basic X range 120.87px, Panko 218.91px and planted Soot/Binding basics. No motion gate is closed by this receipt.

The resource totals in the smoke receipt were collected after action sampling, not at first visible readiness. They cannot establish the 8MB gate. Wave1/wave3 still fetch large legacy enemy rig-depth PNGs; boss sampled total was 8,406,740B. SHIP's referenced `S8/initial-transfer-2.json` was absent when checked; its decision receipt remains available. Authoring/time-split compliance is not established.

Paused at the user's explicit request on 17 November 2026. Logs, raw screenshots/builds, private material and inherited artifacts remain local and excluded from this checkpoint.
