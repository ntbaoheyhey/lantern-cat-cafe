# A4 P6 — measured gameplay balance
REFERENCE: GAMEPLAY-V4 section9; registration p6/REGISTERED-METHOD.md.

| Target | Before | After | Status |
|---|---|---|---|
| Adjacent tiers ≥44/48, zero reversals | 26 positive / 22 ties / 0 reversals (50 seeds/cell) | 46/48 gain≥2pp; 0 reversals | PASS |
| Intended bands: ≥15pp spread; no saturation | Level6 saturation; max50 dominated | 33/33 bands; minimum spread 16.80pp | PASS |
| One piece ≤12pp; utility-aware share ≤10% | +34pp heldout; old displayed score omitted utility | Worst 93.40pp (hearthloom-charm-legendary, mochi, chapter3); share≤4.80% | MISS |
| Every set 35–75% and leads a common situation | 8–92% heldout | 67.03–79.60% | MISS |
| Every cat 55–75% and a top pick | 49.15–83.76% heldout | 31.38–64.66% | MISS |
| Coherent crew +10–25pp at matched power | Not measured under v4 protocol | 47.73pp | MISS |
| Matched-power tolerance ±2% | Not measured under v4 protocol | 0.99438–1.00569 ratio | PASS |
| Wall time ordinary, chapter1 | 52.477–63.705s | 21.340s / party | PASS |
| Wall time elite, chapter2 | Not measured at G0 | 33.785s / party | PASS |
| Wall time boss, chapter1 | 177.346s (different earned day7 fixture) | 57.546s / enemy | PASS |
| Wall time boss, chapter2 | Not measured at G0 | 64.807s / enemy | PASS |
| Wall time boss, chapter3 | Not measured at G0 | 58.680s / enemy | PASS |
| 45day heavy/casual ≤3×: every currency and paid draws | Max2.1948×; 90 accounts | paidPulls 1.0000×; fish 1.2069×; threads 1.4098×; stamps 1.0000×; essence 2.7260× | PASS |
| Invitations: conditional CDF deviation ≤1pp | P4 max0.640337pp | 30,000accounts /1.8Mdraws; max0.640337pp | PASS |
| Collectible paired win gain ≤3pp | Local counters; no enforcement layer | 500 races; 6000 encounters; 0pp | PASS |
| OFF behavior exact | Frozen G0 digest47477251 | 8,250 routes exact47477251 | PASS |
| Source gates | G0 passed | Type/lint/build, rules/web/E2E pass; numeric tests reported separately | PASS |
| Offline artifact and startup | G0 A3 26,120,329 bytes | 26,215,694bytes; +95,365 vs G0; current-main cold comparison belongs to P7 | MISS |

## Method and limits
Train1–500 and heldout10001–10500 each cover3,625 cells (1,812,500 outcomes/sample). Every cell retains per-seed outcomes and Wilson95% intervals. Cases, weights, source and coherent-kit carrier map were registered before heldout; the coherent crew was selected only on train. No heldout-driven retuning or seed reroll. G0 before measurements used50seeds/cell and earlier fixed enemies; they are historical comparisons, not paired evidence of the causal effect of v4.

Full-route tiers are distinct from single-boss band fixtures and easy fixed-band farming. All128templates are checked on three starter carriers, two levels and three bosses. Another384cells add each template as the fourth slot of an existing epic kit. This prevents all-loss bare-party cases from hiding a set-threshold spike. Combat pairs use+0; the+12extension checks displayed contribution only, not max-enhancement combat balance. Source: p6/train/results.json and p6/heldout/results.json.

Set and cat fixtures normalize party HP/attack/defense to a common utility-aware budget within2%; no gear-dependent enemy scaling. All8sets face the same8situations and all220legal triples face each boss. Tied leaders count and remain disclosed in balance-gates.json. Crew comparison uses a train-selected role-balanced crew and frozen uniform sampling of legal equal-power teams.

The displayed score remains an approximate build estimate, not a win probability. A training-only linear fit and heldout residual/order diagnostics are in balance-gates.json; they do not alter combat or erase single-piece misses. Single-piece all-loss floor cells and informative baselines are explicit. Remaining misses must be addressed before promotion rather than hidden by passing functional tests.

## Separate sample measurements
| Sample | Worst paired item gain | Set aggregate range | Cat aggregate range | Coherent crew gain |
|---|---|---|---|---|
| train | 91.60pp: bellsteel-charm-legendary, mochi, chapter3 (35→493/500) | 66.78–78.65% | 31.01–64.22% | 52.33pp |
| heldout | 93.40pp: hearthloom-charm-legendary, mochi, chapter3 (11→478/500) | 67.03–79.60% | 31.38–64.66% | 47.73pp |

Training diagnostics are shown separately from heldout acceptance. Both samples use the same registered case list and the same crew selected on training. See p6/sample-audit.json for the independent raw-outcome, case-key, digest and source-integrity audit; an integrity PASS does not imply balance PASS.

## Earned progression
| Style | Reward | Observed / censored at45 | Median / p90 day | Reached by day7 /14 /30 /45 |
|---|---|---|---|---|
|casual|First Legendary|30 / 0|33 / 38|6.7% / 10.0% / 23.3% / 100.0%|
|casual|Chosen reward|0 / 30|>45 (censored) / >45 (censored)|0.0% / 0.0% / 0.0% / 0.0%|
|regular|First Legendary|30 / 0|33 / 38|6.7% / 10.0% / 23.3% / 100.0%|
|regular|Chosen reward|0 / 30|>45 (censored) / >45 (censored)|0.0% / 0.0% / 0.0% / 0.0%|
|heavy|First Legendary|30 / 0|33 / 38|6.7% / 10.0% / 23.3% / 100.0%|
|heavy|Chosen reward|0 / 30|>45 (censored) / >45 (censored)|0.0% / 0.0% / 0.0% / 0.0%|

The new-save bot uses public commands for90accounts×45synthetic days: actual elapsed service, routes, quests, journal, invitations, gear, recipes, loadouts and chosen rewards. No levels/currency/unlocks injected. Every cohort contains30accounts; all accounts are observed through day45. Missing rewards are administratively censored at45days. Quantiles use the full30-account denominator; a quantile not reached by45 remains >45, never a median of only successful accounts. Raw account days, reward observations and paid-draw totals remain in p6/economy/progression.json. During the run, the bot cached pure item scores within each stable sort after84complete ranking/equip comparisons matched. Seeds, candidates, tie order, public commands and checkpoint were unchanged; the original harness and parity receipts remain in p6/harness-parity. Heavy/casual ratios compare total earned resources and paid draws separately; different G0 and v4 policies are not a paired trial. Gacha distribution checks instead use controlled bankrolls and10,000accounts/banner; those draw-count distributions are not earned-day predictions. Banner quantiles, conditional-bucket audit and the separate earned-day table: [P6 invitations](P6-INVITATIONS.md).

## Verification and retained failures
Five source gates: validation/a4-p6-accepted.json. The first type/lint checks failed because Node-only receipt imports were placed in the browser-typed rules package; the same numeric assertions moved to native node:test tooling with no runtime dependency change. Original logs remain. Numeric assertions are in p6/numeric-tests.log, independently of the source gates. Timing attempts use public-command route setup, explicit imported level/unlock benchmarks and real x1 playback; no nominal speed adjustment or skip. The outcome in every timing row is explicit: an enemy victory measures time to crew defeat, not a successful boss finish. A null boss-death timestamp does not establish victorious finishing/cleanup timing on this build. P3 finishing evidence remains historical; P7 additionally observes the earned day7 route. Any incomplete measurement above is NOT VERIFIED.

No B-owned/protected changes; no B checkpoint adopted. P1/P3/P4 presentation requests remain open. Native/headless and short shared-lock windows. Historic13sim files and baseline-v1 remain exact. Artifact SHA-256 067d2062f6836a6d0bb9f6753ece1b2f3ca923688f241866a7f42806c8f7b6a1, 26,215,694bytes; startup bytes MISS and cold CPU pending P7. No merge, deployment, wallet action or on-chain issuance.
