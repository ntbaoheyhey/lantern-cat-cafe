# I encounter checkpoint
REFERENCE: ../memory/PROMPT.md lines129–134 and lane addendum, ENCOUNTERS.md, ENCOUNTER-BALANCE.md, flow/summary.json

Existing enemy-stat tuning db1448e9 and replay repair 3263cece are measured in the offline artifact `6a8e0a42b6b05be1157119df1b66cd35bbe2716768356327bcca1fe5f3784764`. Five real-click cases use fresh pages, cache disabled, three desktop sizes, DPR 1/2 and native/4× CPU. Each starts through the route, Prepare and Fight, checks Pause/Resume, skips, then watches the full recorded battle at 1×. The seed is the sole fixture setup.

## Browser flow
REFERENCE: flow/summary.json, ../../../tools/cardrpg-big/flow-measure.mjs

| Viewport / DPR / CPU | Seed | Battle seconds | Page MAX ms | Frames >25 / >50 ms | Round gap MAX ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1280×720 / 1 / 1 | 11 | 57.2778 | 50.0 | 2 / 0 | 400.1 |
| 1440×900 / 2 / 1 | 23 | 57.0950 | 33.3 | 2 / 0 | 399.9 |
| 1024×600 / 1 / 1 | 37 | 51.8786 | 50.0 | 1 / 1 | 400.1 |
| 1280×720 / 1 / 4 | 53 | 46.5327 | 300.0 | 17 / 7 | 400.0 |
| 1280×720 / 2 / 4 | 71 | 50.7576 | 233.3 | 14 / 3 | 400.0 |

All five encounters last 46.5327–57.2778 s, within the 45–90 s target. All five replay outcomes equal their skipped result. Browser errors, premature HP changes and action-budget misses are all zero. Pointer-down to visible response peaks at Fight 49.7 ms, Pause 13.2 ms and Skip 34.5 ms, below 100 ms.

The full-page sample contains 17,601 frames, 36 above 25 ms and 11 above 50 ms. Page MAX reaches 300 ms under CPU 4×. The raw threshold count includes one floating-point sample at 50.00000000000006 ms. Round gap reaches 400.1 ms against the strict 400 ms gate. Both misses remain visible. The sample retains page-opening frames. Lane B owns the engine follow-up and exhaustive integrated harness.

## Phase I acceptance review
REFERENCE: ../memory/PROMPT.md lines129–134, ../../../docs/design/cardrpg/ITEM-TIERS.md, ENCOUNTER-BALANCE.md, screens/checks.json

| Prompt requirement | Result | Evidence |
| --- | --- | --- |
| Item types, rarity, drops/rates, uses, sinks, power bands and binding in ITEM-TIERS | PASS | Existing table covers five inventory groups and design eligibility. |
| State a bounded single-legendary contribution | PASS for displayed power | Maximum 9.63060686%, within the declared 10% ceiling. |
| Each rarity step raises win rate meaningfully | MISS | 26/48 positive steps, 22 ties, 0 declines. Level 6 has saturated cells. |
| No single set or cat dominates | MISS | Heldout set spread reaches 8–92%, cat-context wins 49.15–83.76%. |
| One item has bounded combat influence | MISS | Maximum paired boss gain +42 pp training and +34 pp heldout. |
| 45-day casual/heavy ratio ≤3×, goals remain open | PASS | Maximum 2.1947756956274844× across 90 accounts, collection goals remain open. |
| Deterministic, effort-gated, capped design eligibility, counters, labels and help | PASS at I checkpoint | 25 boundary tests, 2 UI tests, 12 captures, zero browser errors/remote requests. |
| Preserve Fuji read-only Relic panel | PASS in A scope proof | Protected-path diff has zero changes and reader/panel hashes match. Repeat after integration. |
| Lane addendum encounter pacing 45–90 s through existing knobs | PASS in five browser cases, broader sample PARTIAL | 46.5327–57.2778 s measured. Sim training 48/50 and heldout 44/50 fit. |

The phase proceeds with the balance misses explicitly retained. The next balance comparison uses the same gear/economy matrix with lane B extras ON and OFF at integration.

## Validation and reproducibility
REFERENCE: ../validation/i-enemy-final.json, encounter-source-receipt.json, REPLAY.md, SAVE.md

Typecheck, lint, unit tests, build and E2E all pass. Counts are 1,681 web tests, 983 rules tests and 421 E2E tests. Inherited rules include 2 expected failures and 11 skips. The frozen artifact was built before the source commit. Its receipt compares 996 inputs against current files, with six recorded differences covering disconnected G preparation and the report generator. All other inputs match.

The earlier collectible checkpoint remains documented in CHECKPOINT.md. ENCOUNTER-BALANCE.md holds complete training/heldout/economy tables. This checkpoint records the later enemy-stat and replay work with its own source and artifact identifiers.
