# S2b — Combat classes and ally-only healing

Research started 16 November 2026. G-LEARN experiment matrix and independent holdout are recorded below. Production rules now implement the selected candidate; the sole new parity baseline remains pending.

## Question and proposed mapping

How can every unit communicate melee/ranged/healer behavior while healers only restore, cleanse or protect allies, keeping deterministic turn timing and a viable four-cat team? Keep three classes: guardian/striker -> melee; witch/hexer/controller -> ranged; healer -> healer. Enemy guard/flanker/charger/elite/yarn -> melee; ranger/moth/thread -> ranged; healer -> healer. Confirm every catalog row before implementation. Binding Thread remains ranged because its retained kit damages and snares. A separate tank class adds terminology without a requested movement distinction. [S2b-CATALOG, S2b-ROLES]

## Professional practice and limits

Broderick's qualitative role study emphasizes how conflicting role expectations hurt coordination; it does not prescribe our heal amount. Green treats mitigation, restoration and damage as interdependent flows. The FFXIV guide demonstrates short role descriptions, while the user's heal-only constraint is our explicit design choice, not a claim that all games prohibit healer damage. Separate combat class from existing flavour, crew and support specializations. Healing should visibly target an ally; deterministic selection needs a declared score and stable tie-break. Epic's ordered, state-based decisions inform that implementation, not a need to add a behavior-tree engine. Compare urgency (lowest HP fraction), throughput (largest missing HP), and front-row preference. Judge effective healing after overheal, enemy damage, remaining party HP and battle duration together. [S2b-ROLES, S2b-TRINITY, S2b-FFXIV, S2b-AI]

## Private clip study

Two existing local clips identified by kiXkwkoUuY and ua_e236yxNM; never committed or supplied to a generator. Earlier private sheets were already inspected and are not reopened. V1 41.4–43.2 s shows approach/contact; V1 48.5–50.3 s shows a stationary healer and two +63 ally restores; V2 57.4–59.2 s shows restorative/buff presentation. These short windows run at displayed x2/x3 speed. They establish contrasting visual behavior but cannot establish exact targeting precedence, sustained HPS, team-of-four norms, or that a healer never attacks. Those are explicit design choices or require further measurement. Sheet extraction: reference-frames.py; private/windows.json. [S2b-CLIPS]

## Experiment design

Use Vite build transforms in an isolated temporary bundle. Preserve the production files serving the ongoing S2 baseline. Compare three deterministic healer selectors (lowest HP fraction, largest missing HP, wounded front row then lowest fraction) at two basic-heal sizes (35 and 65), alongside unchanged control. Rewrite all damaging healer effects in the experimental bundle, including Teacup basic; keep enemy/offensive numbers and presentation scheduler fixed initially. Measure all three existing demo fixtures at seeds 1–30 plus canonical seed71, effective healing, remaining HP, outcome and exact scheduled 1x duration. Reuse the existing public firstSession bot for a 30-minute progression sample; record censored/no-loss accounts instead of inventing a first loss. No result constitutes the sole new F6 baseline; that is recorded only after implementation and checks. [S2b-VITE, S2b-SIM]

## Control validation

The isolated Node DepthModel replay exactly reproduced all three canonical seed71 browser hashes and scheduler durations: wave1 213.233s, wave3 573.700s, boss211.133s. Evidence S2b/control-probe.json. The firstSession column will initially retain the existing A6 bot and its authored timing estimate; it is not a measured browser onboarding duration. The main matrix remains pending.

## Quality decision

Select wounded-front priority/basic35 after the independent holdout below. If the unchanged offense cannot meet the boss target, run a second explicit balance experiment within the class exception; never speed up one class or relax the target. G-CLASS requires every cat/enemy classified, healer damage zero, first-loss median12–20min, boss median<=110s/p90<=140s, intended-power wins, E3–E5, one justified baseline, and visible labels at both desktop sizes. G-REG remains mandatory. UI/Guide will use existing labels until scheduled ART integration. Sources: eight entries S2b-* in sources.json, including one paper and four web documents.

## Follow-up balance comparison (planned before implementation)

The unchanged control boss median209.53s (30seeds) already violates110s. Compare three isolated responses on ratio35: halve Yarn Giant HP, double non-healer direct/detonation kit powers, or triple only offensive ultimate powers. Keep each action at800/2200ms and leave economy configuration untouched. Measure fixture outcomes/HP, first-loss estimates, and effective healing; reject fixes that create unwinnable encounters or shift first loss outside12–20min. This is exploratory evidence for the explicitly permitted class-balance exception, not permission to alter contract/economy rules. Use five-seed pilots before the selected larger validation.

Pilot balance result: halving Yarn Giant HP with ratio35 keeps5/5boss wins and0healer damage, but median111.133s still misses110s; p90 119.233s. Existing-bot first loss median11.7385min(n5) also misses12min. Reject as a final selection; do not round either into a pass. S2b/balance-boss-half.json.

Offense-double pilot rejected: boss median124.500s still misses110s, and all5progression accounts had no loss within30min. It accelerates combat while erasing the required early challenge. Wave1 median124.767s; wave3 median353.100s; all5wins and healer damage0. S2b/balance-offense-double.json.

Ultimate-triple pilot also rejected: boss median131.8s/p90145.2s and0/5first losses within30min. Ratio65 in the main matrix restores later first losses in initial seeds; compare a narrow45%Yarn Giant HP variant with65healing next, leaving all offensive kit powers unchanged. This tests whether a single overlong boss can be corrected without removing progression pressure. Results pending.

## Progression-method correction before selection

Source inspection found that `tools/cardrpg-a6/sim.mjs` builds three-cat A6 accounts and estimates time without the current C2 sequence wrapper. Its first-loss results are historical-method comparisons, not the current four-cat gate. Use the existing `tools/cardrpg-c2/sim.mjs` shared policy/public DepthModel with four cats, economyV3 enabled, current scheduled action/round timing, explicit scene-ready and decision budgets. Start with the same five seeds for ratio65+boss45%, then expand. No browser-time pass is inferred. Include no-loss accounts as censored at30min when computing the cohort median, not only accounts that lost.

The lab now deduplicates canonical seed71 when the sample already contains it and reports conventional interpolated medians/percentiles. Existing raw rows remain available for recomputation; this is a measurement correction, not a balance or threshold change.

Further class-balance method comparison: reducing the basic heal35->25 moves the current30-seed first-loss median only20.08473->20.00192min; both fail. Do not round the latter into a pass. Study a narrow5%increase in existing A6 enemy attack scaling with35healing to restore pressure lost when Teacup stops attacking, preserving all action clocks and economy constants. This is a proposed class-balance adjustment under the explicit exception; require fixture wins, current progression, a separate seed holdout and E3-E5 before adoption. No product changes yet.

## Completed current four-cat comparison

Thirty seeds per variant; current C2 scheduler and economyV3,30-minute horizon. All accounts lost within the horizon. Healer variants include Yarn Giant HP45%of its former catalog value; control is unchanged. All three intended-power fixtures won30/30 for every candidate, with healer damage0. Terminal party HP median100%in these fixed level-six fixtures; this is not first-session HP.

| Selector/basic heal | Boss median / p90 seconds | First-loss cohort median minutes | Timing gates |
|---|---:|---:|---|
| control | 209.217 / 214.757 | 18.33587 | FAIL |
| ratio-35 | 95.017 / 109.123 | 20.08473 | FAIL |
| ratio-65 | 95.017 / 109.123 | 20.52115 | FAIL |
| missing-35 | 95.017 / 109.123 | 20.49895 | FAIL |
| missing-65 | 95.017 / 109.123 | 20.75115 | FAIL |
| front-35 | 95.017 / 109.123 | 19.86473 | candidate only |
| front-65 | 95.017 / 109.123 | 20.30646 | FAIL |

Only wounded-front-row priority at35basic healing meets the30-seed timing comparison:19.86473min first loss,95.0167s boss median/109.1233s p90. Its patient selector prioritizes wounded front allies then lowest HP fraction, falls back to any wounded ally and uses a stable ID tie-break. This is our design choice, not a claim about exact reference-clip AI. Test a separate100-seed holdout1001–1100 before selecting it. [S2b-C2-SIM;S2b/current-matrix.json]

The5%enemy-attack pilot failed at20.23718min and changed more numbers. Reject it. The25-heal ratio pilot failed at20.00192min; it is not rounded into a pass. Retain unchanged offensive numbers in the front35candidate apart from the explicitly studied Yarn Giant HP adjustment.

## Independent holdout and implementation decision

Seeds1001–1100 reproduce the selected front35/boss45% candidate with100/100 wins per fixture and zero healer damage. Boss median95.0167s, p90108.9000s; current four-cat cohort first-loss median19.65391min, zero censored accounts. Evidence `S2b/selected-holdout.json`. Implement this candidate: heal35 on basic, wounded front allies before lowest HP fraction, stable ID ties, Yarn Giant catalog HP1292 (=round2870×0.45). Keep other offensive numbers and action clocks unchanged. These are scheduler/public-action simulation results, not browser or human first-session timings. The full G-CLASS gate remains open until runtime guards, UI, E3–E5, regression and the sole new F6 baseline are checked.

Implementation refinement: preserve Clover/Cinnamon restorative legacy active shapes and cooldowns; their Basic+Ultimate A6 loadout and selected timing remain identical. Direct V5 Teacup resolver is heal-only, including callers outside the central battle resolver. New native economy validation uses a separate output directory and frozen runtime to preserve historical E3–E5 evidence. Reusing the old cohort would ignore altered combat rewards, so run the same200seeds/profile over42days instead.

Validation refinement: preserve historical E3 tuning/search evidence, then rerun the fixed policy with the post-class native bank: 18 scenarios ×200 token seeds, all registered assumptions ±20% using fresh affected native profiles, existing unchanged thresholds. Evidence goes to S2b/econ. No economy constants are retuned. Class UI computed contrast is11.132:1 at both sizes; the team shell name-chip selector previously overrode the badge background. The Guide is fully opaque; its backdrop dimming is intentional. Remove the old rear-row sword decoration because a sword next to Clover contradicts the new heal-only badge; row remains in accessible text and tooltip.
