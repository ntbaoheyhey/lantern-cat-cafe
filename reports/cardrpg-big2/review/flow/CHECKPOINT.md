# Current standalone flow checkpoint
REFERENCE: tools/cardrpg-big/flow-measure.mjs; summary.json

Pinned HTML `734d301c5dfc192e6e0a74e03311deff2fde93acd673983724813bec96a7cfec`; five fresh pages across three sizes, DPR1/2, native and CPU4. Real Fight/Pause/Resume/Skip/Replay controls drive the automatic controller. All skipped and replayed battle states match byte for byte, with zero runtime errors and no HP changes ahead of impact.

- Click-to-visible response: 6.1–53.3 ms, all below 100 ms.
- Full x1 replay: 9.31–16.29 s; the inherited standalone encounter still misses the requested 45–90 s duration. Encounter balance belongs to Lane A; these are not integrated main-demo timings.
- All 42 actor actions meet their type budgets; maximum 1333.3 ms.
- Maximum ordinary gap 83.4 ms and round gap 399.9 ms, within 250/400 ms budgets.
- Visible skill banners: 583.3–600.1 ms.
- Whole-page maximum 183.4 ms (CPU4), **MISS** against 100 ms. This is a separate, worse current-artifact sample than the seven-case cold maximum of 150 ms. CPU4 p95 remains 16.8 ms.

Each scenario's full frame/action/click arrays remain beside `summary.json`. This checkpoint does not turn a successful harness exit into a performance-gate pass.
