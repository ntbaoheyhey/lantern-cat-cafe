# Existing-knob encounter tuning
REFERENCE: PLAN.md, enemy-tuning.json, REPLAY.md, ../sim/encounter-balance-{before,train,heldout}.json.gz

The selected candidate uses ordinary enemy HP4.25× and attack0.40×. The guard has480HP and18defense. Elites and bosses use3.5×HP, with Rain Spool attack58 and Pantry Crown attack60. The tutorial cushion keeps its existing values. Exact per-enemy values and source hashes are in enemy-tuning.json.

Training pilots used2001–2020. The candidate was fixed before opening final duration seeds30001–30050. The extended training measurement uses2001–2050. Gear comparison separately retains its prior1–50 and10001–10050 paired seeds.

## Authored duration and starter progression
REFERENCE: ../sim/encounter-balance-before.summary.json, ../sim/encounter-balance-train.summary.json, ../sim/encounter-balance-heldout.summary.json

Durations below come from exact replay plans and80ms inter-action gaps. Browser wall-clock evidence follows in a separate section. Full-route wins include later encounters.

| Sample | Level | Chapter | Route wins | First encounter min / median / p95 / max, seconds | Within45–90s |
| --- | ---: | ---: | ---: | --- | ---: |
| balance-before | 1 | 1 | 24/50 | 9.251 / 14.780 / 48.271 / 49.800 | 3/50 |
| balance-before | 1 | 2 | 37/50 | 12.054 / 15.955 / 26.866 / 53.969 | 2/50 |
| balance-before | 1 | 3 | 27/50 | 9.367 / 14.780 / 20.066 / 20.066 | 0/50 |
| balance-before | 6 | 1 | 49/50 | 9.135 / 14.557 / 35.343 / 44.354 | 0/50 |
| balance-before | 6 | 2 | 50/50 | 9.135 / 14.780 / 27.254 / 44.238 | 0/50 |
| balance-before | 6 | 3 | 50/50 | 9.367 / 14.780 / 20.066 / 20.066 | 0/50 |
| balance-train | 1 | 1 | 13/50 | 44.620 / 51.411 / 70.152 / 87.881 | 48/50 |
| balance-train | 1 | 2 | 2/50 | 49.784 / 57.985 / 78.512 / 87.608 | 50/50 |
| balance-train | 1 | 3 | 3/50 | 56.633 / 68.733 / 87.442 / 88.924 | 50/50 |
| balance-train | 6 | 1 | 50/50 | 39.120 / 47.503 / 58.063 / 66.125 | 44/50 |
| balance-train | 6 | 2 | 42/50 | 45.939 / 55.305 / 72.948 / 75.824 | 50/50 |
| balance-train | 6 | 3 | 50/50 | 42.873 / 61.983 / 80.051 / 86.559 | 48/50 |
| balance-heldout | 1 | 1 | 10/50 | 43.341 / 53.569 / 86.851 / 88.220 | 44/50 |
| balance-heldout | 1 | 2 | 2/50 | 45.757 / 58.089 / 78.045 / 82.478 | 50/50 |
| balance-heldout | 1 | 3 | 4/50 | 53.090 / 68.849 / 88.924 / 90.032 | 49/50 |
| balance-heldout | 6 | 1 | 50/50 | 40.241 / 48.575 / 61.363 / 66.477 | 43/50 |
| balance-heldout | 6 | 2 | 45/50 | 45.823 / 56.949 / 72.829 / 74.346 | 50/50 |
| balance-heldout | 6 | 3 | 50/50 | 41.843 / 63.876 / 78.679 / 79.788 | 49/50 |

The level1 chapter1 starter median rises from14.780s to51.411s in training and53.569s in heldout.48/50 training and44/50 heldout first encounters fit45–90s. Short heldout tails reach43.341s. Full-route success falls from24/50 before to13/50 training and10/50 heldout. These progression costs remain visible alongside the longer fights.

## Gear, economy and browser gates
REFERENCE: ENCOUNTER-BALANCE.md, encounter-summary.json, flow/summary.json

The depth rules suite passes320/320 after the numeric adjustment. Full gear/economy receipts and browser timing are pending. Preserve the equipment-only results in BALANCE.md as a separate checkpoint. Browser probes use real Fight/Pause/Resume/Skip/Replay clicks from a fresh offline page under the shared timing lock.
