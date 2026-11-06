# I measurement plan
REFERENCE: ../memory/PROMPT.md lines129–134, ../../../docs/design/cardrpg/DESIGN.md, ../../../packages/game-rules/src/cardrpg/depth/equipment.ts, ../../../tools/cardrpg-big/auto-sim.mjs

This is preparation while F5 timing completes. Rules tuning starts after M validation and its phase checkpoint.

Use the phase A automatic controller and existing seven-stop route bot. Compare the starter trio with no equipment and complete common, rare, epic and legendary gear at chapters1–3. Keep level1 and level6 separate. For the main tier comparison, each role uses its thematic set, all enhancements0 and deterministic affix rolls. The no-gear condition removes all ordinary equipment. Report successes and denominators, paired seed changes, action counts and log hashes. Fifty seeds per cell are fixed before measurement. Seeds1–50 are training. Seeds10001–10050 are held out until tuning is frozen.

Audit all eight complete set builds with the same starter team, levels and seeds. Audit all220 distinct three-cat teams against each chapter boss at level6, with20 fixed seeds per team and default rows. Report each cat's participation rate, team-context spread, best/worst teams and every set. These contextual rates remain descriptive. Interpret differences with their denominators.

Evaluate the power contribution of every legendary piece on each starter cat with an otherwise bare team. The proposed display-score limit is10% of total team power from one piece. Also compare actual auto outcomes for every named unique effect. The display score omits utility, so both tables are needed. Boundaries will receive regression tests if a cap is added or repaired. Tune existing knobs only, with each rules change isolated and before/after evidence retained.

Reuse the45-day economy driver with the automatic controller for casual, regular and heavy cohorts. Preserve30 accounts per cohort and every daily record. Report the heavy/casual ratio for each tracked earned currency and pulls, with the brief's3× ceiling. Record saturation and goals still open at day45. Keep seeds and action strategy fixed between revisions.

Read the current depth drop path for the tier table. The older base-game design table uses different drop rules. Include source, exact probabilities, sinks, power ranges, binding and caps from the actual depth implementation. Keep the existing Fuji reader untouched. Add only local eligibility explanations and boundary tests.

## Expanded training probes
REFERENCE: ../sim/gear-expanded-before.json, ../sim/gear-pilot-0-3.json, ../../../tools/cardrpg-big/gear-sim.mjs

The first four main-stat-only probes leave epic and legendary campaigns at100%. Before opening heldout seeds, evaluate main-stat factors0.3/0.4 crossed with affix-range factors0.25/0.5/0.75, with30 training seeds per cell. Overrides stay in memory and each receipt records every original/effective value. Include the maximum compatible-roll/+12 bound before selecting production values. Level6 bare teams already win98–100%, so report that ceiling explicitly when assessing tier separation.

Also evaluate main0.75 with affix0.25 before heldout seeds. It preserves a positive first enhancement for the starter weapon under the existing6% rounding formula. This candidate reduces the maximum-roll legendary bound while keeping common main stats closer to the starter experience.

Full before/after receipts now measure all eight sets at both levels1 and6. Preserve the earlier level6-only receipt. The selected main0.75/affix0.25 values will be evaluated on the original50 training seeds and50 heldout seeds, plus the full45-day economy. UI and combat will read old saved rolls against the current affix bounds so the measured power ceiling also applies to previously created equipment.

## Encounter length after lane split
REFERENCE: ../memory/PROMPT.md ADDENDUM LANES 2026-11-06, ../flow/GATES.md, ../../../tools/cardrpg-big/encounter-probe.mjs

Lane A owns the existing enemy-stat/count knobs. Lane B owns animation budgets and supplies its measurement tool. First use a headless probe through the actual DepthModel replay plans with inter-action80ms and explicit plan durations. Keep the estimate separate from browser wall-clock evidence. The first training pilot uses seeds2001–2010, level1, chapter1, with starter gear, bare and four complete rarity sets. Explore enemyHP factors1/2/3/4/5 with paired attack factors1/.5/.55/.4/.35. Values stay in memory, the tutorial cushion keeps its existing stats, and every override is recorded. Further candidates use training seeds only. Reuse initial gear heldout10001–10050 solely for comparison and reserve30001–30050 for the final encounter candidate.

The acceptance target remains45–90seconds for typical chapter1 encounters atx1, bounded action/round budgets and sensible progression. Record route wins, first-encounter distribution, all encounter plans, and every stall. Rerun the complete gear-tier/set/cat/single-piece and45-day economy receipts after any production enemy-stat change. Actual first-open/click/frame evidence uses a frozen artifact and the shared timing lock.

The first30cells all replay identically through DepthModel. HP4/ATK0.4 gives starter first-encounter planned median66.394s and maximum143.786s on ten training seeds, with1/10complete-route wins. That maximum and low route success require a broader pilot. Next compare HP3.5/ATK0.4, HP4/ATK0.45, HP4.5/ATK0.4 and HP4/ATK0.55 across both levels1/6 and all chapters with20training seeds2001–2020. Source enemy stats remain at the checkpoint values. Retain every result, including saturation and long healer fights.


Formation-level review identifies the long outliers as two Button Guards with repeated shields. For a third training pilot, keep generalHP4/ATK0.45 and override only existing per-enemy values. Button GuardHP441, Spool RamHP750, Kettle KnightHP850, Pollen ScoutHP675, Crumb SentinelHP900, Yarn GiantHP2050, Rain SpoolHP2625, Pantry CrownHP3050. Use20training seeds2001–2020 at both levels and all chapters. These override HP factors are2.1for the guard and2.5for elites/bosses. Compare starter route success, first-encounter bounds and gear-tier steps before deciding whether to apply any source change.

The third probe improves starter route8/20 but saturates the upper rarities. A fourth keeps ordinary enemies atHP4.25× and comparesATK0.45/0.50/0.55×. GuardHP430/DEF18 keeps its tank role while addressing repeated-shield tails. Elite/boss HP stays3.5× (Ram1050, Knight1190, Scout945, Sentinel1260, Yarn2870, Rain3675, Pantry4270). Use20training seeds at both levels/all chapters. The goal is a typical starter first encounter45–90s with improved chapter1 tier steps, while retaining all higher-level ceilings and route failures in the evidence. Enemy defense is now recorded alongside originalHP/ATK.

A final training probe checksHP4.25 withATK0.40/0.425 and guardHP480/DEF18, retaining the elite/bossHP values from pilot4. The additional guardHP addresses the39s short tail from pilot4. A second paired variant sets Rain SpoolATK58 and Pantry CrownATK60 to test chapter2/3 upper-tier saturation through their existing attack values. Both use20training seeds2001–2020. Choose on duration distribution, starter route success and tier steps together, then freeze before opening30001–30050. Report all-level6 ceiling cells explicitly.

Freeze candidate from pilot-five-b at HP4.25/ATK0.40, with its recorded guard/elite/boss overrides, before opening30001–30050. Training level1 full-route wins by bare/common/rare/epic/legendary are4/13/18/19/20 in chapter1,0/7/12/17/20 in chapter2 and2/3/5/11/20 in chapter3, all out of20. Starter chapter1 first encounters are44.620–87.881s planned,19/20 within45–90s. Level6 ceiling cells remain a disclosed miss. Run a50-seed paired duration baseline on2001–2050 before applying these existing enemy knobs, then train/heldout duration, full gear and economy after. Browser evidence remains pending.
