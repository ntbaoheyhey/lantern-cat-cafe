# V7 full-battle live desktop density coverage

Reviewed once: 2026-11-18T02:18:02.904281+00:00. Capture UTC: 2026-11-18T02:12:36.386Z to 2026-11-18T02:16:04.878Z.
URL: http://127.0.0.1:6312/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3; viewport 1280×720. Capture git HEAD `6d4324dc38e3d5373950079172529e1eed923629`; served untransformed source `c0373a1d97b6c991888bb66e259142ed4efe3635`; index `6c93080042b25bfa98bdf699fb081e2af41ccc8c890ef2ee30a2b36c3982a635`. Empty build runtime patch; four capture-tool snapshots verified.

Two natural CPU4× battles started at DPR2 and changed to DPR1/1.5/2 at 15/45/75 seconds. All six transition rows verify renderer, canvas and composer buffers; all screenshots preserved the live density and 1280×720 CSS size.

Both modes exactly match the preserved static-DPR2 control for seeded battle, complete rule log, presentation/action order, final actors, result and round. Each contains 68 actions, 24 ultimates, 82 status applications and 46 expirations; no browser errors or blocked requests.

- normal: natural result 99.758s; total capture run 101.228s; capture-excluded frame p95 33.4ms, later >50.5ms intervals 23.
- reduced: natural result 99.213s; total capture run 100.563s; capture-excluded frame p95 33.4ms, later >50.5ms intervals 18.

Sixteen fresh full-size captures measured before four new sheets were reviewed once. Visual review found distinct hero effects, visible combat numbers and complete victory crew. The pre-existing shell toast overlap remains a CXI issue.

These are descriptive local configuration/stress results, not a performance improvement comparison, calibrated laptop benchmark, independent judge acceptance, or physical monitor-event test. Existing native density gates (18 focused tests, full web typecheck zero) apply to the unchanged application source.

Evidence: `V7-F-full-battle-density-transitions.json`; verifier: `tools/v5vfx/verify-full-battle-density-transitions.mjs`. Raw captures stay ignored under `work/v5/CXV/films/V7-F-full-battle-density-transitions/`.
