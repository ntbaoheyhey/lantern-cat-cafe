# Enemy balance and replay compatibility
REFERENCE: ../../../packages/game-rules/src/cardrpg/depth/{battle,contract,run,save}.ts, replay-validation.json, ../validation/i-replay-regression-fixed.log

Enemy setups formerly stored catalogue IDs. Changing enemy stats would reconstruct older replays with different HP, attack and defense. Version0.7 snapshots these three stats for every enemy, including later Binding Thread summons. The run stores that exact setup for its replay.

The importer accepts0.5/0.6 codes and installs their fixed launch catalogue values while preserving active actors, HP, choices, progress and inventory. New exports useTHC7. Regression tests cover current round trips, both old versions, partial replay, summons after a catalogue mutation, and damaged snapshots.

The focused regression suite passes46/46. An initial test import failure is retained in i-replay-regression.log and corrected in the fixed receipt. Before/after150 paired automatic routes have450 identical encounter outcomes/action counts/rounds/log hashes and chapter wins18/50,44/50,30/50. Source balance values are identical across this repair. The enemy balance change follows in a separate commit.
