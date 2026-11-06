# I measurement plan
REFERENCE: ../memory/PROMPT.md lines129–134, ../../../docs/design/cardrpg/DESIGN.md, ../../../packages/game-rules/src/cardrpg/depth/equipment.ts, ../../../tools/cardrpg-big/auto-sim.mjs

This is preparation while F5 timing completes. Rules tuning starts after M validation and its phase checkpoint.

Use the phase A automatic controller and existing seven-stop route bot. Compare the starter trio with no equipment and complete common, rare, epic and legendary gear at chapters1–3. Keep level1 and level6 separate. For the main tier comparison, each role uses its thematic set, all enhancements0 and deterministic affix rolls. The no-gear condition removes all ordinary equipment. Report successes and denominators, paired seed changes, action counts and log hashes. Fifty seeds per cell are fixed before measurement. Seeds1–50 are training. Seeds10001–10050 are held out until tuning is frozen.

Audit all eight complete set builds with the same starter team, levels and seeds. Audit all220 distinct three-cat teams against each chapter boss at level6, with20 fixed seeds per team and default rows. Report each cat's participation rate, team-context spread, best/worst teams and every set. These contextual rates remain descriptive. Interpret differences with their denominators.

Evaluate the power contribution of every legendary piece on each starter cat with an otherwise bare team. The proposed display-score limit is10% of total team power from one piece. Also compare actual auto outcomes for every named unique effect. The display score omits utility, so both tables are needed. Boundaries will receive regression tests if a cap is added or repaired. Tune existing knobs only, with each rules change isolated and before/after evidence retained.

Reuse the45-day economy driver with the automatic controller for casual, regular and heavy cohorts. Preserve30 accounts per cohort and every daily record. Report the heavy/casual ratio for each tracked earned currency and pulls, with the brief's3× ceiling. Record saturation and goals still open at day45. Keep seeds and action strategy fixed between revisions.

Read the current depth drop path for the tier table. The older base-game design table uses different drop rules. Include source, exact probabilities, sinks, power ranges, binding and caps from the actual depth implementation. Keep the existing Fuji reader untouched. Add only local eligibility explanations and boundary tests.
