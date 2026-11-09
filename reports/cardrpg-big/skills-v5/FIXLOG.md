# Skills V5 repair log

## S5-A5-DAY7-ADVICE — one earned loss without an improving recommendation (PARTIAL)
- Reproduce: registered TRAIN day7 `heavy-3.save`, account root 4 and route seed 55437, chapter 3/band 6, in `s5/selected/day7/results.json`. Account levels are 7/7/6; the route loses at boss node 6-0 after 19 rounds, with Pantry Crown at 44 HP. The input save SHA256 is `11db8c14fd90d5041b61eb60808278389bf170e233d324dbaa35b7108b7ceb68`.
- Measure: before 21/21 losses had available advice; selected 50/51 do. Casual wins within two attempts are 19/30, regular 21/30; heavy first-attempt wins are 15/30. The three win-rate conditions pass, while the every-loss-advice gate regresses to MISS.
- Ranked hypotheses: (1) no affordable legal candidate beats the current build in the fixed ten-seed forecast; (2) the forecast does not represent this near-win encounter well; (3) helper pressure changes which preparation decisions help. The retained result establishes absence of a recommendation, not which hypothesis caused it.
- Smallest next fix: replay this exact earned account and audit candidate availability and forecast values before changing one V5-only recommendation term. Do not grant resources, force advice without evidence, or replace the loss seed. The selected three-package S5 design remains unchanged.
- Verification/status: all 90 earned account cases are retained, with paired advice/no-advice retries when available. Full combat/progression matrices and OFF8,250/fallback180+45 source closure remain exact. PARTIAL; carry this specific loss into the pre-S6 review.

## S5-A5-ESSENCE-RATIO — progression regression (PARTIAL)
- Reproduce: complete 90-account × 45-day TRAIN receipts in `s5/{before,selected}/economy/results.json`; unchanged public-command policy and style budgets. `economy-summary.mjs` reports the original ≤3× heavy/casual gate.
- Measure: essence ratio 2.808208× PASS → 3.079646× MISS. The other currency/pull ratios remain below 3×, regular Legendary-by-day7 is 29/30, and selector timing passes. Cumulative essence by style/day and source hashes are retained in `s5/selected/economy-attribution.json`.
- Ranked hypotheses: (1) changed combat outcomes alter route-earned rewards; (2) early rewards compound into subsequent equipment and route success; (3) daily caps affect heavy and casual cohorts differently. The aggregate receipts establish the ratio regression, not the individual causal contributions.
- Smallest next fix: trace one retained casual account's missing reward opportunity and the matching heavy account before changing a combat or reward term. Do not alter style budgets or the ratio denominator. The three S5 design packages remain exhausted.
- Verification/status: all 4,050 account-days and full combat matrices are retained; OFF8,250/fallback180+45 source closure remains exact. Day7/collectible confirmation continues on the same source. PARTIAL; revisit before S6, with no acceptance sampling or extra S5 candidate.

## S5-BARE-ATTRIBUTION-BITS — read-only diagnostic decoder (FIXED)
- Reproduce: initial read-only aggregation of `s5/before/pieces/results.json` interpreted outcome bit 1 as the without-item result. Its assertion against the saved 321 misses failed (the inverted interpretation found 5). The command stopped before writing any report; simulations and existing summaries were untouched.
- Ranked hypotheses: (1) reversed outcome bits, confirmed against `bare-matrix.mjs:128`; (2) incomplete cells, ruled out for all 2,304 rows; (3) source drift, not indicated by this arithmetic mismatch.
- Smallest fix: decode bit 2 as without-item and bit 1 as with-item, matching the registered runner. Verify every pair of win counts and gain against each existing summary before writing the attribution file.
- Verification: all 4,608 before/selected cells agree; counts are 321 → 33. No production rule changed; selected OFF8,250/fallback180+45 and affected full combat matrices remain bound to `s5-selected/audit.json`. FIXED; no battle sample or design attempt consumed.

## S5-A5-BARE-ITEM — fewer failing cells, larger worst gain (PARTIAL)
- Reproduce: completed `s5/{before,selected}/pieces/results.json`, 2,304 cells × TRAIN1–500 each. Read-only paired aggregation and receipt hashes: `s5/selected/bare-item-attribution.json`.
- Measure: failed cells 321 → 33; worst gain 47.6 → 51 percentage points. The unchanged single-item gate is ≤12 points, so it remains MISS despite the lower failure count. Display share remains below 10%.
- Ranked hypotheses: (1) survivability effects cross sharp win thresholds; (2) new helper/status pressure changes the benefit of particular carriers; (3) reference difficulty floors conceal effects in other cells. These hypotheses have not been isolated by ablation.
- Smallest next fix: trace the retained worst cell and isolate one item effect on TRAIN. The three S5 design packages remain exhausted; no fourth package, new fixture or replacement denominator is introduced.
- Verification/status: full affected combat matrices and exact OFF8,250/fallback180+45 checks are retained; progression continues on the same source. PARTIAL; revisit with complete progression evidence before S6.

## S5-GUARDIAN-ATTRIBUTION-HASH — diagnostic setup serialization (FIXED)
- Reproduce: `node tools/cardrpg-big/skills-v5/diagnose-guardian-use.mjs`, first fixed replay `matched/oven/0/1`. Original script/log retained in `s5/selected/guardian-attribution-preflight/attempt-1.*`; no attribution result was emitted.
- Measure: expected saved hash `dbebf34a9ce69484f307b5e70fda481a115ecc5a7d360e748f8def1f86d0750f`, diagnostic `5982589ca15638e39c8d12f215c8ffa15307d7882b91046da7edc353dbe9c49c`.
- Ranked hypotheses: (1) initial setup property order differs in the JSON-bound battle hash (`skillsV5` preceded `challengeLevel`); (2) a reconstructed fixture differs; (3) diagnostic observation mutates battle state. No combat regression is established by this harness failure.
- Smallest correction: match the registered setup property order. Rerun the same eighteen existing seed1 observations and require every original battle hash. No candidate, acceptance seed or changed frequency estimate. Production-rule hashes remain identical to the passing OFF8250/fallback180+45 and six-gate closure in `s5-selected/audit.json`.

Addendum received during S5. TRAIN remains 1–500. Existing baseline slices continue unchanged; acceptance 20001–20500 is UNUSED. Every entry retains failed samples. At most three candidate attempts per issue per phase; revisit open issues once before S6. OFF legacy digest and ON fallback hashes are prerequisites for adoption.

## S5-DESIGN-1 — multi-target play and dormant skills (attempt 1, PARTIAL: measuring)
- Reproduce: `V5_METRICS_OUT=reports/cardrpg-big/skills-v5/s5/before/metrics node tools/cardrpg-big/skills-v5/metrics.mjs`; immutable completed 10,500 battles, TRAIN1–500.
- Before: combined original-pool multi-foe14.283%, multi-ally25.356%; normal12.036 rounds. Named Thread has Mark in100% of battles; Night lamp0.2%; original crews0%. Velvet basic is correct. Cinnamon ultimate0; Mochi3/Inkcap3/Velvet3 zero in named crews. Baseline per-skill counts are exploratory base-stat diagnostics, not D4 matched-power evidence.
- Ranked hypotheses: (1) singleton bosses suppress shape opportunities; (2) Cinnamon's fixed revive target and single-patient heal make its support kit structurally incomplete; (3) policy ignores prevention from Link/Shelter, status refresh duration and future Mark/Spread, while repeatable basics dominate.
- Smallest first candidate: D1 boss/elite existing helpers and phase reinforcements; D2 exact authorised Cinnamon amendment. Register source before sampling. Later policy/cooldown changes are separate attempts and do not revive rejected Mark-strike.
- Checks: unit regression tests, unchanged original-pool and per-crew denominators; additional matched-power D4 table and D5 role patterns. Full affected A5 matrices after candidate selection; OFF8250 + fallback180battles/45routes on each candidate. No acceptance sampling during repair.
- Outcome: pending; current baseline source remains production while isolated candidate is prepared.
- Design1 fixed TRAIN1–50 prefix: original450 battles32.089% multi-foe,29.595% multi-ally,12.08 normal rounds,82% all-cat ultimate coverage. D1 improves shape use; D2 legal ultimate works. Matched D4 still misses eight cats. Keep baseline full500 distinct; no direct claim of paired500 improvement yet.
- Design2 registered before sampling: expected decoy/Link prevention, Mark two-round future hits and Spread payoff; cooldown1 on five dominant basics; Sorrel3 shield45 and Biscuit2 Warm. Enemy Guard Warm, Teacup Regen/Mark and Thread signature Daze supply keyword contexts without homogenising cat kits. Same fixed TRAIN1–50 prefix. Black cup power stays55.
- Design2b measured: multi32.940%, support30.045%, normal17.967 rounds versus design1 32.089/29.595/12.080. Mark appears55.556% of original-pool battles, but normal pacing regresses severely. REJECTED as a package. Third candidate must remove the broad basic cooldown and enemy sustain changes before any selected full500 run; all samples retained.

## S5-HARNESS-2 — isolated fallback source and shape labels (FIXED)
- Reproduce: `BIG_RULES_ROOT=/tmp/cardrpg-v5a-design1 node .../on.mjs s5-design1`. Routes used the snapshot but probe.mjs hardcoded cwd; original receipt does not establish candidate battle parity. No acceptance or balance sample affected.
- Fix: probe accepts the same explicit BIG_RULES_ROOT as load.mjs; off runner hashes that source too. Corrected full fallback receipt is s5-design1-corrected; original retained. OFF8250 candidate run queued.
- Design1 diagnostic shape labels came from static kits, so conditional Cinnamon4 was labelled fallen even when a team multi-hit event was emitted. Version2 diagnostic reads emitted shape first. Original design1 rows retained; use their action/balance counts, not conditional shape counts. No combat source or denominator change.

## S5-POLICY-NULL — absent Mark duration (FIXED)
- Reproduce/attribute: design2 policy multiplied status count by `find(scent)!.remaining`; JavaScript evaluates that property even when count is zero. Static review found it before the waiting diagnostic acquired a lease.
- Smallest fix: optional remaining defaults0. Original design2 source/registration retained; its waiting diagnostic/check wrappers cancelled before any samples, as recorded in design2/preflight-cancel.json. Design2b registers the corrected source and the same TRAIN1–50 cases. This is a runtime repair, not a new numeric trial or rerolled sample.
- Re-run: deterministic checks + diagnostic + OFF/ON compatibility. No adoption before these pass.

## S5-BASELINE — inherited numeric misses (PARTIAL; no extra attempt consumed)
- Reproduce: registered `s5/before/{equipped,teams,sets,tiers,elites,pieces}` matrices and `s5/display-grid`.
- Before: fourth-slot13/384 misses, worst41pp; cats62.41–93.12%; named crews and sets miss; display Spearman.442/.228/.139. Full bare-item sweep continues at its existing checkpoint.
- Attribution: saturated matched-power cells and sharp win boundaries; new V5 designs change the premise and will be remeasured without fixture/gate changes.
- Existing rejected candidates remain rejected: policy-horizon, Mark-strike, 320 static display fits, and A5 pressure/reply/fixture trials.
- Next: measure design effects, up to three smallest repairs per remaining issue; retain PARTIAL if not closed. Revisit before S6.

## S5-HARNESS-1 — snapshot extraction (FIXED)
- Reproduce: system Python3 `TarFile.extractall(filter='data')` rejects `filter` on this installed version. No sample executed and no source changed.
- Attribution: interpreter API difference. Fix: extract only the locally generated `git archive HEAD packages/game-rules/src` archive using the supported API. Candidate directory was empty; same commit retained. No runtime/hash change.

## S5-TYPE-SNAPSHOT — missing generated client fixtures (PARTIAL; correction prepared)
- Reproduce: `/tmp/cardrpg-v5a-design2-type.log`, snapshot tsc. First error is missing `../client/cafe`; source-only snapshot omitted existing generated client modules imported by unchanged tests.
- Hypothesis/attribution: snapshot packaging, not candidate type errors. Copy the existing client directory into the snapshot, retaining the failed log. Re-run typecheck plus affected unit checks on corrected candidate; production six gates still required after adoption. No rules/sample changes.

## S6-PRECHECK — fallback diagnostic fixture (FIXED before first use)
- Inspection found the supplemental design-metrics-v2 matched fixture used setSkillsV5(false), which did not explicitly enable gameplayV4 for fallback skill preparation. No fallback or acceptance run had used this tool; existing ON design trials are unaffected.
- Smallest fix: design-metrics-v3 selects setGameplayV4(true) in fallback, exactly matching matrix.mjs. Version2 retained for existing registrations. Both modes now retain their legal four-skill kits. S6 registration will bind v3 and supplemental28,500 row count; original10,500 base rows/4,500 probe denominator remain separately asserted.

- S5-POLICY-NULL follow-up: cancelled coordinator43481 and requeued waiting wrapper46994 before acquisition. Earlier wrapper termination returned0 and its series requeued; no design2 results/partial existed. Receipt design2/cancel-coordinator.json. Design2b deterministic5checks and corrected snapshot typecheck PASS.
- S5-BASELINE completion: full4,505cells/2,252,500celltrials; bare321/2304misses,worst47.6pp; tiers18/24 (fallback23/24), sets83.55–94.625%; source/receipt audit PASS, numeric19PASS/20MISS. No after-change claim.

## S5-HARNESS-CANCEL — cancelled lock wrapper requeued (FIXED)
- Reproduce: original design2/preflight-cancel.json stopped only waiting wrapper43502; slice1 returned0 without results, and coordinator43481 started slice2. No sample acquired.
- Attribution: series accepted exit0 without checking completion. Smallest fix: exit0 requires results.json; checkpoint75 alone resumes. Cancelled obsolete coordinator and queued wrapper before acquisition; exact receipts retained. No combat source/sample changes; OFF/ON hashes unaffected.
- Validation: same resumed design3 uses its existing rows/registration; new selected/acceptance series will use the completion assertion.

## S5-HARNESS-METADATA — conditional ultimate status label (FIXED before full500)
- Inspection: v3 records Cinnamon4 executed team shape but static base revival effects, omitting Warm in D5 metadata. Combat, targets, keywords and skill counts are correct.
- Fix: report maps the emitted Cinnamon4 team mode to its defined Warm status; original diagnostic outputs remain retained. Subsequent full500/acceptance reports bind the corrected reporter. This does not consume a new battle sample or numeric design attempt. Source unchanged, OFF/ON checks unaffected.

- S5-TYPE-SNAPSHOT second harness issue: design3 command used root node_modules/typescript/bin/tsc, absent in this pnpm workspace. Original /tmp/cardrpg-v5a-design3-type.log retained. Corrected command resolves the existing compiler through pnpm --filter @taskbar-hero/game-rules exec tsc; same source/config, no new dependency or combat sample.

- S5-DESIGN-1 attempt3: design3 fixed1–50 original450 multi32.367/support30.166/normal13.243; D4ten/twelvecats, D3thirty-one/thirty-two, D5PASS. Selected provisionally as richer-play tradeoff; normal/support/ultimate gates stillMISS. Three attempts exhausted; issue PARTIAL. Full500 affected A5 checks plus OFF/ON required before promotion; pre-S6 revisit remains scheduled.

- Design3 full500 probe confirmed28,500 rows: original4500multi32.525%,support29.842%,normal13.238rounds,ultallcat78.7%; D4Mochi/Panko stillMISS,D3ThreadBurn499/1500 andNightlampBitter478/1500 below1/3,D5PASS. No prefix result substituted for full500; source type and A5fallback hashes PASS. Affected A5 matrices and OFF8250 continue.

- S5-TYPE-SNAPSHOT: corrected design3 compiler resolves, but snapshot has no tsconfig (TS5058). Three packaging failures retained; no further snapshot retries. Exact selected production runtime plus amended tests passes workspace typecheck; use s5-selected/gates/typecheck-attempt-1.log. Persisted originals and attribution in s5/design3/preflight/. Packaging PARTIAL; shipping typecheck PASS.

## S5-BUILD-BUFFER — fixture diff overflow (FIXED)
- Reproduce: BIG_SKILLS_V5=1 BIG_GAMEPLAY_V4=1 BIG_LOOK_V2=1 BIG_PYTHON=/tmp/cardrpg-a5-tools/bin/python BIG_OUTPUT_DIR=/tmp/cardrpg-v5a-selected-artifact node tools/cardrpg-big/build.mjs. Initial log retained s5-selected/build/attempt-1.log.
- Attribute: build.mjs:89 computed a boolean dirty flag by capturing the whole git diff; updated3.70MB fixture exceeded Node default1MB stdout buffer (ENOBUFS), after compilation.
- Smallest fix: git diff --name-only for the same dirty boolean; source hashes still read every input byte. No runtime/fixture/sample change. Re-run identical build; existing OFF/ON and six-gate source checks remain bound to unchanged runtime.

## S5-REPORT-LINEAGE — selected-source closure reference (FIXED before reporting)
- Reproduce: reporting/registration scripts referenced s5/audit.json, which is the retained S4/S7 before-design closure, instead of the new s5-selected closure. No S5 selected score, S8 run or S6 sample has executed.
- Attribution: phase alias mismatch in prepared tooling. Smallest fix: selected report, self-score, Home and acceptance registration require s5-selected/audit.json; keep the earlier audit byte-for-byte.
- Validation: selected closure still requires six source gates and both current-rule compatibility receipts. Report-generation assertions run after these finish. Runtime/sample/tool registrations already in progress are unchanged.

- S5-BUILD-BUFFER correction completed: identical runtime builds20,961,816bytes/SHA4e310b07f9dfb005abdff830d498e8d0f6615553e1710a2ce12eeedad3a3638e. Attempt2 log preserved; OFF8250 and fallback180/45 exact.

## S5-TEACUP-FIXTURE — opening Regen omitted from test (FIXED)
- Reproduce: s5-selected/gates/rules-attempt-1.log;1261pass/1failure. Teacup fixture set round2 but left actor.turns0, so it incorrectly represented a second-turn healer as taking its opening action.
- Attribution: stale test fixture after registered opening-only Regen design; measured battle rules are correct. Hypotheses ranked: (1) turns fixture mismatch confirmed; (2) repeat Regen regression ruled out by turns===0 guard; (3) heal target error ruled out by actual weakest-target event.
- Smallest fix: exercise opening round1 (Regen+basic+Mark), advance turns1/round2 and assert weakest65 heal, then turns2/round3 basic+Mark without Regen. Runtime remains byte-identical.
- Re-run full phase gate coordinator on corrected test source; current OFF8250/fallback receipts remain exact on the same production-rule hash map. Original failed run preserved; no numeric resampling.

## S5-PATCH-WHITESPACE — preserved unified-diff context (FIXED scope attribution)
- Precommit git diff --check flagged a single space on blank context lines inside four retained candidate.patch artifacts. These are required unified-diff context prefixes, not runtime trailing whitespace.
- Preserve the registered patch bytes; check staged source/docs/tools with only *.patch excluded. No production rule or sample change. Compatibility receipts remain bound to unchanged rules.

## S5-SUPPORT-SHARE — multi-ally below35% (PARTIAL, three design attempts used)
- Reproduce: registered selected/metrics TRAIN1–500, original4,500 battles;29.8415% versus25.3558% before. Original180 prefix retained separately.
- Ranked attribution: (1) Mochi2/Panko2 have very low use despite support needs; (2) Cinnamon3 remains one-patient Regen; (3) efficient single-target sustain competes with multi-ally casts. Hypotheses2–3 are not causal estimates.
- Smallest attempted fixes: exact Cinnamon ally splash/team fallback, then later support-row effects and prevention scoring. Three registered design packages retained; no fourth S5 attempt. Current OFF8250/fallback hashes exact; full affected A5 matrices continue. Revisit pacing/support tradeoff before S6 without moving the35%gate.

## S5-NORMAL-PACING — normal mean above12rounds (PARTIAL, three design attempts used)
- Reproduce: same selected original4,500-battle receipt; normals13.2377 versus12.036before. Design2b17.967 was rejected; restoring three basic cooldowns and limiting opening enemy buffs reduced this to13.243 on its fixed prefix.
- Ranked attribution: (1) prevention/Mark setup displaces immediate damage; (2) enemy Warm/Regen prolong relevant encounters; (3) support choices can outlive their useful window. Full current mean is observed; individual causal contributions are not isolated.
- Smallest third package retained improved10/12skill diversity at explicit pacing cost. No source retune while selected matrices run. S8 natural x1 boss/opening evidence remains required; no rounds-to-seconds conversion is substituted. Both compatibility hashes exact.

## S5-ULTIMATES — not every cat casts in every normal (PARTIAL)
- Reproduce: selected metrics all-cat ultimate78.7% versus66.6667%before. Cinnamon fallback fixes the illegal/no-casualty action, but unconditional coverage still misses100%.
- Ranked hypotheses: (1) short encounters finish before an individual legal ultimate is chosen; (2) current prevention/status value sometimes favors another skill; (3) losses suppress later actions. Exact per-battle action records are retained; no artificial casualties or forced action rotation.
- D2 and three design packages are the attempted fixes. Keep this gate and its same normal-battle denominator. Current compatibility exact; S8 elapsed pacing first, then pre-S6 review.

## S5-D3-COVERAGE — two of32crew-keyword assertions miss (PARTIAL)
- Reproduce: selected/DESIGN-REPORT.md and design-report.json, TRAIN500. Thread Burn499/1500<500; Night lamp Bitter478/1500<500. Original-pool Mark is now55.5556%, from0%; Velvet basic was already correct.
- Ranked attribution: (1) Thread sometimes prevents Kettle's low-HP Burn; (2) Night lamp's intended signature control prevents Yarn Bitter; (3) keyword availability depends on encounter mechanic. The displayed counts establish absence, not which causal mechanism dominates each seed.
- Mark future-hit/Spread scoring, enemy counterplay contexts and opening-only buffs were tested in three design packages. Do not weaken control roles merely to manufacture status events. Revisit these specific missing seeds before S6; no threshold rounding from499to500. Current OFF/ON hashes exact.

## S5-D4-DIVERSITY — Mochi and Panko basics dominate (PARTIAL)
- Reproduce: selected/DESIGN-REPORT.md matched18,000battles; Mochi1/2=71.92/0.38%,Panko1/2=69.99/0.29%; ten cats pass all four5–60%shares. Defend stays in every cat denominator.
- Ranked attribution: (1) basic damage plus free protection beats a pure shield at current pressure; (2) team ultimate crowds out smaller shield; (3) row support remains weak when allies occupy separate rows.
- Tried targeted basic cooldowns (design2b rejected at17.967normal rounds), then later row-support shapes/prevention value (selecteddesign3). Three packages used. No arbitrary policy quota or gate change. Current compatibility exact; full A5 effects continue and pre-S6 revisit remains required.

## S5-A5-ITEMS-DISPLAY — inherited item and score misses (PARTIAL)
- Reproduce: before/numeric-gates.json: fourth-slot13/384misses,worst41pp; bare321/2304,worst47.6pp; display Spearman.442/.228/.139. Raw paired seeds remain in corresponding results.json.
- Ranked attribution: (1) nonlinear set completion crossing encounter win boundaries; (2) burst/status utility absent from static display weighting; (3) saturation makes scalar power a poor predictor. No causal claim from correlations alone.
- Existing pressure/reply trials and320display fits stayREJECTED. New V5 premise is remeasured on the same registered full500selected matrix before any conclusion. No display score or balance gate was changed; current OFF/ON exact. Revisit resulting misses before S6.

## S5-A5-CATS-SETS-CREWS — inherited matched-power misses (PARTIAL)
- Reproduce: before/numeric-gates.json cats62.41–93.12%,sets83.55–94.625%,named crews miss5pp gaps. Every cat has a top-pick cell; this does not satisfy its55–75%range.
- Ranked hypotheses: (1) equal displayed power does not normalize status/shape value; (2) fixed encounters overreward some roles; (3) single-target bosses suppressed crowd kits. D1 specifically addresses hypothesis3 without changing fixtures.
- Smallest approved fix is selected helper/kit design, followed by unchanged full500matrix. Prior fixture/cat/pressure rejections remain. Current OFF/ON hashes exact; selected results pending and pre-S6 revisit required.

## S5-A5-TIERS-BANDS-CALIBRATION — inherited difficulty misses (PARTIAL)
- Reproduce: before/numeric-gates.json TRAIN18/24tier improvements, reference matched median45.4% versus55–60%, intended-band spread misses. FallbackTRAIN23/24 remains separate; acceptance half is unused.
- Ranked hypotheses: (1) encounter difficulty varies across chapters at the same display power; (2) gear-driven win thresholds saturate; (3) utility scales nonlinearly under V5. No fixture rescale was adopted to hide these outcomes.
- Selected design is remeasured with all original tier/band cases and heldout gate44/48 unchanged. Current compatibility exact. Do not call18/24 or22/24 an acceptance pass; revisit before S6.

## S5-REACTION-COVERAGE — Spread opportunities below40% before design (PARTIAL)
- Reproduce: before/numeric-gates.json Spread25.9333%ofThreadbattles; other three reaction gates pass. Same first-three example seeds and every failed battle remain in receipts.
- Ranked attribution: (1) singleton enemy has no spread recipient; (2) another skill may defeat a target before Mark; (3) role competition between rupture and spread. D1 and Mark/Spread policy address the first two without reintroducing Mark-strike power85.
- Selected full500reaction coverage will be evaluated alongside unchanged A5 gates, not inferred from its five presentation fixtures. Current OFF/ON hashes exact; pre-S6 revisit required if still below40%.

- Compatibility closure follow-up: design1 OFF8250 exact plus corrected candidate fallback180/45 exact; design2b OFF8250 and fallback180/45 exact. Current selected source has both exact receipts. Original misbound design1 fallback receipt remains retained and is not used as proof.
- Committed source6772eb343 artifact matches successful precommit bytes exactly:20,961,816/SHA4e310b07f9dfb005abdff830d498e8d0f6615553e1710a2ce12eeedad3a3638e. Current fixture-only test correction does not alter shipped HTML.

- S5-TEACUP-FIXTURE verification: full current rules1262PASS (+2expected failures/11skips), web1785PASS, type/lintPASS. Current production-rule OFF8250/fallback180/45 exact; test-only correction leaves artifact SHA unchanged. E2E/build phase checks continue.

## S5-REACTION-COVERAGE — selected full TRAIN verification (FIXED)
- Reproduce: selected/metrics/results.json, registered TRAIN1–500, intended named crews, unchanged three encounters. Wildfire98.6%, Rupture99.9%, Crumb Burst99.9%, Spread54.9%; all exceed40%.
- D1 helpers restore Spread recipients; bounded future Mark/Spread scoring retains Black cup power55. Selected six source gates PASS and OFF8250/fallback180+45 exact in s5-selected/audit.json. Full A5 effects remain pending; reaction gate is FIXED independently.

## S5-D3-COVERAGE — exact missing-seed attribution (PARTIAL; pre-S6 revisit)
- Reproduce: `node tools/cardrpg-big/skills-v5/diagnose-keyword-misses.mjs`; receipt `s5/selected/keyword-attribution.json`. All 23 replay hashes match the existing full TRAIN observations. No new samples, candidate or fourth design attempt.
- Thread seed214: Kettle acts below half HP in round8 and attempts Burn on both front cats. Biscuit and Brioche both resist. This corrects the earlier unproven suggestion that control prevented this specific Burn. Observed coverage remains499/1500, below500/1500.
- Night lamp's22missing boss seeds: every phase2 signature is interrupted or Dazed, and the emitted marker is the softened basic. Its signature-control role directly suppresses Bitter opportunities. Coverage remains478/1500; no display/event omission is observed.
- Ranked follow-up options: (1) a distinct secondary Bitter opponent context, (2) a later-unlocked primer/support combo role providing exposure, (3) adjust timing without weakening successful Daze. These require a future registered design; none is applied in this diagnostic.
- Keep PARTIAL after three S5 packages. The current OFF8250/fallback180+45 exact and six-gate closure bind unchanged production rules. Full A5 confirmation continues; D3 denominator/threshold unchanged.

## S5-EVIDENCE-WHITESPACE — raw captured log bytes (FIXED scope attribution)
- Staged whitespace check reports eight WebServer blank-line prefixes in `s5-selected/gates/e2e-attempt-1.log`. This is hash-bound captured output, not source whitespace.
- Preserve original evidence bytes. Source/docs/tools whitespace check passes with raw `*.log` and retained `*.patch` excluded. No runtime or sample change.

## S5-A5-FOURTH-SLOT-REGRESSION — selected helper/kit package (PARTIAL)
- Reproduce: `s5/selected/equipped/results.json`, unchanged384cells × TRAIN1–500. Selected35/384misses,worst47pp versus before13/384,worst41pp; original A5 was63/384,worst88.8pp. Display-share maximum4.5197% remains below10%.
- Ranked hypotheses: (1) existing set completion interacts with the new status/helper targets; (2) changed support/control choices cross win thresholds; (3) extra helper pressure magnifies survivability items. These are ranked explanations, not isolated causal measurements.
- Smallest attempted change remains the registered three-package design sequence. No fourth S5 attempt or item normalization is introduced during the full sweep. Retain richer-play gains and this regression as PARTIAL; review completed cat/set/band evidence before S6.
- Both OFF8250 and ON fallback180/45 hashes are exact on selected production rules, and six source gates pass in `s5-selected/audit.json`. Affected full matrices continue on the same source and seeds.

- S5-GUARDIAN-ATTRIBUTION-HASH correction verified: all eighteen saved battle hashes match after matching setup key order. Original failure retained; `guardian-attribution-preflight/correction-1.log` records the successful identical-seed replay. No production code or measured distribution changed.

## S5-D4-GUARDIANS — eligibility attribution (PARTIAL; pre-S6 revisit)
- Reproduce: `node tools/cardrpg-big/skills-v5/diagnose-guardian-use.mjs`; `s5/selected/guardian-attribution.json`. Fixed seed1 in all nine existing matched encounters for Oven and Afternoon tea, eighteen exact saved hashes. This diagnostic does not replace the full500 shares.
- Measure: Mochi skill2 legal40/40 turns, chosen0; basic31/40. Panko skill2 legal74/74, chosen0; basic51/74. An eligible target had room below the policy shield cap on38/40 and74/74 turns respectively. Full500 skill1/2 shares remain71.92/0.38% and69.99/0.29%, both D4 MISS.
- Attribution: skill availability is ruled out in this fixed replay set; the automatic evaluator ranks other legal choices higher. Ranked unresolved causes: (1) immediate damage/removal value outweighs preventive support; (2) shield value is capped and discounted; (3) existing support companions already supply protection. The individual score contributions have not been causally ablated.
- Smallest next candidate: value the distinct prevention window of these later skills, or a targeted basic cooldown with paired pacing checks. Broad cooldown changes already regressed normal rounds17.967 and stay REJECTED. Three S5 design packages are exhausted; no fourth numeric attempt.
- Verification: source hashes and every replay hash match the selected build. OFF8250 and fallback180+45 remain exact in `s5-selected/audit.json`; affected full A5 matrices continue on that same source. Retain PARTIAL and revisit with the completed balance evidence before S6.

## S5-GATE-REPORTER-SYNTAX — report-only template escaping (FIXED)
- Reproduce: `node --check tools/cardrpg-big/skills-v5/record-gate-misses.mjs`; original script/log retained under `s5/gate-reporter-preflight/attempt-1.*`. Double-escaped Markdown backticks terminated the JavaScript template. No reporting or sample execution occurred.
- Smallest fix: use ordinary escaped backticks. Re-run parser preflight before using the reporter. Production rules, registered matrices and OFF/ON receipts are unchanged; this tool only appends measured misses after receipt closure.

- S5-GATE-REPORTER-SYNTAX verification: parser correction passes (`s5/gate-reporter-preflight/correction-1.log`). S8 observation-miss reporter also parses. Both tools read completed receipts only; no samples or runtime changes. The prepared S8 display table now reads selected TRAIN correlations, preserving the before values separately.

## S6-Z-PREFLIGHT — missing declared capture (FIXED before registration)
- Reproduce: static enumeration of `z-pack.mjs` has only20 captures after expanding its seven-screen loop, while registration and closure require21. Original script: `s6/z-preflight/before.mjs`; no Z registration or browser sample has run.
- Attribution: the earned Cafe service/daily reward panel was omitted. Ranked alternatives: (1) missing board capture confirmed; (2) equipment branch could omit another capture; (3) navigation loop count mismatch ruled out by its seven entries.
- Smallest fix: include the expanded earned service board as the21st declared screen; assert equipment exists instead of silently skipping its comparison. Keep the21-screen/126-capture plan and all three widths/both looks.
- Verify: syntax preflight plus static21-screen enumeration. Runtime and current OFF8250/fallback180+45 hashes are unchanged; the once-only pack will validate actual captures on its registered delivery artifact in S6.
- Edit-command correction: the first Python patch command had a literal backslash-n after a colon and failed parsing before executing any statement. No files or samples changed in that attempt; corrected command uses real newlines.

## S8-PERFORMANCE-PREFLIGHT — empty telemetry could pass (FIXED before registration)
- Reproduce: static evaluation `Math.max(0,...[])` returns0; the original sampler would report both cast and draw maxima as0 with no ready-action frames. No browser or acceptance sample was run.
- Attribute: 1. Empty ready-action selection; 2. missing scene telemetry; 3. failed renderer initialization. These are measurement-integrity failure modes, not measured runtime defects.
- Smallest fix: require a nonempty ready-action cohort with finite frame/draw values and observed rendered geometry. Missing telemetry now leaves the original observation incomplete instead of passing a zero maximum.
- Verify: syntax check; actual model.plan and TurnScene.stats field names confirmed read-only. All production rule bytes still match selected OFF8250/fallback180+45 receipts; actual browser validation remains scheduled exactly once in S8. Before/after source hashes: s8/performance-preflight/checks.json.

## S5-A5-SETS-CREW — saturation and coherent-gain regression (PARTIAL)
- Reproduce: all64set cells and663team/crew cells on fixed TRAIN1–500 in s5/before and s5/selected; read-only aggregation retained in s5/selected/set-crew-attribution.json with source/result hashes.
- Measure: coherent gain21.667pp PASS →29.400pp MISS against unchanged10–25pp; selected chapter gains10.8/48.8/28.6pp. Five of8sets exceed75%; selected set rates72.925–94.400%. Every set wins100% in scenes3–7 both before and after; their tied leading niches do not establish distinct strengths.
- Attribution limit: the registered TRAIN-selected coherent crew changes from Brioche/Velvet/Marigold to Mochi/Clover/Mallow. This before/after gate result is not a same-crew causal comparison; acceptance will predeclare and hold the selected crew fixed across both modes.
- Ranked hypotheses: 1. Helper/status kit synergy and TRAIN crew selection increase the measured advantage; 2. random crews expose uneven matchup difficulty; 3. the already saturated set fixture hides useful set differences. Only saturation and the recorded outcome arithmetic are established here, not an isolated causal lever.
- Smallest next fix: isolate one coherent-crew synergy on TRAIN and separate its effect from unchanged reference difficulty. Existing three S5 design packages are retained; no fourth package, renamed niche gate, or fixture recalibration is adopted.
- Verify/status: complete500seed team/set receipts are preserved; current OFF8250/fallback180+45/six-gate source closure remains exact. The remaining affected full matrices continue on the same source. PARTIAL; revisit with those completed matrices before S6.

## S5-NORMAL-PACING — retained cohort attribution (PARTIAL; pre-S6 review input)
- Reproduce: source-bound s5/selected/metrics/results.json; aggregation only in s5/selected/pacing-attribution.json. Original three-crew full500 normal mean remains13.238rounds against8–12, no denominator change.
- Measure: original starter crew18.212rounds, original Oven probe8.894, original Thread probe12.607. The approved named crews separately measure Oven9.148, Thread7.857, Night lamp13.866, Afternoon tea20.689; named-crew values do not replace the original probe.
- Ranked hypotheses: 1. Particular sustain/setup combinations trade damage for extra turns; 2. different foe survival changes opportunities; 3. team selection changes the mix of successful and failed fights. Cohort means alone do not isolate a skill coefficient.
- Smallest next fix: trace one starter-crew support/setup decision rather than reintroduce the rejected broad cooldown package. Three S5 design packages remain exhausted; no fourth candidate or re-roll.
- Verification/status: all full500 probe rows retained, current production bytes still match selected OFF8250/fallback180+45/six-gate closure. Natural earned-boss seconds remain unmeasured until S8. PARTIAL.

## S5-A5-TIERS-BANDS — full selected TRAIN result (PARTIAL)
- Reproduce: completed210cells×500TRAIN seeds in s5/selected/tiers/results.json; unchanged summary arithmetic. Exact missed tier pairs and band cells: s5/selected/tier-attribution.json.
- Measure: before18/24positive comparisons →selected19/24, zero reversals; intended-band misses1/33 →13/33. The unchanged combined44/48 gate cannot pass this candidate even if all24acceptance comparisons pass (maximum43). Acceptance remains UNUSED.
- Ranked hypotheses: 1. Helper/status pressure changes tier thresholds; 2. low-win floors in level1 chapter2/3 cells suppress adjacent-tier gain; 3. reference matched-power normalization masks real kit differences. All five sub2pp pairs lie in those cells. Exact pair outcomes establish the miss; mechanisms are not independently ablated.
- Smallest next fix: trace the first retained sub2pp tier pair on TRAIN and isolate one scaling term. Three S5 design packages are already exhausted; no fourth candidate, relaxed threshold or retrospective sample selection.
- Verify/status: all210cells retain500outcomes and source registration; current OFF8250/fallback180+45/six-gate closure remains exact. Full elite/item/progression checks continue unchanged; report this gate as PARTIAL/MISS regardless of later source-test passes.

## S5-A5-ELITE-SATURATION — full selected TRAIN result (PARTIAL attribution)
- Reproduce: completed880elite cells×500TRAIN seeds in s5/before/elites/results.json and s5/selected/elites/results.json; read-only aggregation with result/source hashes in s5/selected/elite-attribution.json.
- Measure: all220crews are within5pp of the best at all four elite encounters both before and after; the four named crews have zero gaps. These elite gate assertions PASS, but a saturated fixture supplies limited evidence of distinct kit strength. Boss-specific named-crew misses remain separate.
- Ranked hypotheses: 1. Level6epic matched-power parties overpower these fixed elite encounters; 2. matched display power does not calibrate encounter difficulty; 3. helper/status changes are too small to escape that ceiling. The completed outcomes establish the ceiling, not individual causes.
- Smallest next fix: investigate encounter difficulty in a future TRAIN design, preserving the current fixture and registered acceptance. No extra S5 candidate or replacement denominator.
- Verification/status: all880×500outcomes retained; selected OFF8250/fallback180+45 and six-gate closure remain exact. Full bare-item/progression confirmation continues. Balance calibration remains PARTIAL; the measured elite diversity gate is not relabelled a miss.

- S5-D4 source review: `s5/selected/PREVENTION-REVIEW.md` narrows the unresolved prevention heuristic: shield uses a fixed cap/discount; incoming `due` omits shape expansion; Shelter alone has no independent value term; Link value vanishes at full HP. These are code properties, not causal ablations. No new sample or fourth candidate; current hashes/registered sweep unchanged.

## S6-Z-OVERLAY-PREFLIGHT — sibling fallback was outside the layout diagnostic (FIXED measurement; visual result pending)
- Reproduce: B-OUTBOX 2026-11-09T06:30:20Z reports its integrated P1/1440 fallback strip over a Kettle plate. A's retained s7/fallback-ui captures cover shell geometry before miniatures are ready; their original limited scope is unchanged. Static review of z-pack.mjs found contrast/overflow checks but no strip-versus-plate intersection measurement.
- Ranked hypotheses: 1. The sibling strip intersects a projected HP plate (observed in B's artifact); 2. renderer framing differs between A and B; 3. current capture checks omit a visible sibling (confirmed by source review). No collision in A's current artifact is claimed without a ready-scene observation.
- Smallest fix: add visible-strip/HP-plate rectangles and intersections to the already planned automatic-battle capture; require ready-scene coverage in its summary and disclose the count in V5A-REPORT. This adds no screenshot, battle sample, runtime mutation, or numeric acceptance gate.
- Verify: node syntax checks and git diff whitespace checks PASS; no Z registration/sample exists. Production source closure is rechecked against s5-selected OFF8250/fallback180+45 receipts. Actual overlay verdict stays NOT VERIFIED until the once-only Z capture; B owns its integrated CSS correction.
- Coordination command failures: two append commands contained literal backslash-n after a Python with statement and failed parsing before any write; the third append used one simple statement and published sync3112c8017. No sample or application state changed.

## S5-NORMAL-PACING — exact starter replay follow-up (PARTIAL)
- Reproduce: `diagnose-starter-pacing.mjs`, retained pre-use registration and action traces in `s5/selected/pacing-replay*.json`. Both fixed seed1 normal hashes match saved full-500 observations; no new sample or candidate.
- Measure: first normal12rounds/34party actions; healer normal25rounds/74actions. Support with offense available9/25actions; enemy healing0/606HP. Patient steep occurs at full living-party HP2/6times respectively. Full-500 mean13.238 and denominator unchanged.
- Ranked attribution: 1. Prevention/Regen horizon can outrank immediate damage; 2. healer sustain delays removals; 3. setup timing changes future payoff. The trace establishes choices and healing, not causal benefit of alternative actions.
- Smallest future fix: isolate one support horizon term on TRAIN with survival and pacing paired. No fourth S5 package; broad cooldown and Mark-strike remain rejected.
- Verification/status: exact saved battle hashes; unchanged selected OFF8250/fallback180+45/six-gate closure. [PACING-REVIEW.md](s5/selected/PACING-REVIEW.md) keeps limitations explicit. PARTIAL for the pre-S6 revisit.
- Report-write correction: an initial Python command contained a literal backslash-n after a `with` statement and failed parsing before execution; no file, sample or commit changed. The corrected patch writes prose only.

## S5-GATE A5.fourth-slot — PARTIAL
- Reproduce: fixed TRAIN1–500, `node tools/cardrpg-big/skills-v5/numeric-gates.mjs reports/cardrpg-big/skills-v5/s5/selected`; registered cases and saved outcomes: `reports/cardrpg-big/skills-v5/s5/selected/equipped/results.json`. Gate unchanged: Every paired gain ≤12pp.
- Measure: before {"misses":13,"cells":384,"worstPp":41}; after {"misses":35,"cells":384,"worstPp":47}. Original MISS is retained. Full per-skill/per-crew details remain in `reports/cardrpg-big/skills-v5/s5/selected/DESIGN-REPORT.md`.
- Ranked hypotheses (not isolated causal estimates): Set thresholds interact with helpers/statuses; survivability items cross win boundaries; paired fixture saturation.
- Smallest next fix: Isolate a single set/proc contribution on the same TRAIN pairs before considering a smaller V5-only effect. No item normalization is adopted. Three S5 design packages are already retained; no fourth candidate is introduced by this report.
- Verification/status: full affected matrices and both mode-compatibility checks are recorded in `reports/cardrpg-big/skills-v5/s5/selected/receipt-audit.json` and `reports/cardrpg-big/skills-v5/s5-selected/audit.json`; current gate remains **PARTIAL / MISS**. Passing source/hash checks do not override it.

## S5-GATE A5.bare-piece — PARTIAL
- Reproduce: fixed TRAIN1–500, `node tools/cardrpg-big/skills-v5/numeric-gates.mjs reports/cardrpg-big/skills-v5/s5/selected`; registered cases and saved outcomes: `reports/cardrpg-big/skills-v5/s5/selected/pieces/results.json`. Gate unchanged: Every paired gain ≤12pp.
- Measure: before {"cells":2304,"misses":321,"worstGainPp":47.6,"maxShare":0.04799521767347804}; after {"cells":2304,"misses":33,"worstGainPp":51,"maxShare":0.04799521767347804}. Original MISS is retained. Full per-skill/per-crew details remain in `reports/cardrpg-big/skills-v5/s5/selected/DESIGN-REPORT.md`.
- Ranked hypotheses (not isolated causal estimates): Set thresholds interact with helpers/statuses; survivability items cross win boundaries; paired fixture saturation.
- Smallest next fix: Isolate a single set/proc contribution on the same TRAIN pairs before considering a smaller V5-only effect. No item normalization is adopted. Three S5 design packages are already retained; no fourth candidate is introduced by this report.
- Verification/status: full affected matrices and both mode-compatibility checks are recorded in `reports/cardrpg-big/skills-v5/s5/selected/receipt-audit.json` and `reports/cardrpg-big/skills-v5/s5-selected/audit.json`; current gate remains **PARTIAL / MISS**. Passing source/hash checks do not override it.

## S5-GATE A5.display-correlation — PARTIAL
- Reproduce: fixed TRAIN1–500, `node tools/cardrpg-big/skills-v5/numeric-gates.mjs reports/cardrpg-big/skills-v5/s5/selected`; registered cases and saved outcomes: `reports/cardrpg-big/skills-v5/s5/selected/summary.json`. Gate unchanged: Spearman ≥.6 each chapter.
- Measure: before [0.4424499486471425,0.22787749567562532,0.13887629371546384]; after [0.4255760817961126,0.3711899936462595,0.15094751238119097]. Original MISS is retained. Full per-skill/per-crew details remain in `reports/cardrpg-big/skills-v5/s5/selected/DESIGN-REPORT.md`.
- Ranked hypotheses (not isolated causal estimates): Static utility weights disagree with nonlinear win effects; saturated cells weaken rank correlation; set completion dominates individual item estimates.
- Smallest next fix: The320 registered shared-weight fits were all rejected. Investigate one attributable utility term; keep the existing Spearman gate. Three S5 design packages are already retained; no fourth candidate is introduced by this report.
- Verification/status: full affected matrices and both mode-compatibility checks are recorded in `reports/cardrpg-big/skills-v5/s5/selected/receipt-audit.json` and `reports/cardrpg-big/skills-v5/s5-selected/audit.json`; current gate remains **PARTIAL / MISS**. Passing source/hash checks do not override it.

## S5-GATE A5.cats — PARTIAL
- Reproduce: fixed TRAIN1–500, `node tools/cardrpg-big/skills-v5/numeric-gates.mjs reports/cardrpg-big/skills-v5/s5/selected`; registered cases and saved outcomes: `reports/cardrpg-big/skills-v5/s5/selected/teams/results.json`. Gate unchanged: Every cat55–75%, each top pick somewhere.
- Measure: before 62.412%–93.119%; after 51.045%–79.168%. Original MISS is retained. Full per-skill/per-crew details remain in `reports/cardrpg-big/skills-v5/s5/selected/DESIGN-REPORT.md`.
- Ranked hypotheses (not isolated causal estimates): Unequal encounter difficulty despite matched displayed power; helper/status synergy favors particular kits; support/control choices cross win thresholds.
- Smallest next fix: Separate kit effects from reference-fixture difficulty on TRAIN; preserve the approved crews, reference fixture and current gates. Three S5 design packages are already retained; no fourth candidate is introduced by this report.
- Verification/status: full affected matrices and both mode-compatibility checks are recorded in `reports/cardrpg-big/skills-v5/s5/selected/receipt-audit.json` and `reports/cardrpg-big/skills-v5/s5-selected/audit.json`; current gate remains **PARTIAL / MISS**. Passing source/hash checks do not override it.

## S5-GATE A5.fixture-calibration — PARTIAL
- Reproduce: fixed TRAIN1–500, `node tools/cardrpg-big/skills-v5/numeric-gates.mjs reports/cardrpg-big/skills-v5/s5/selected`; registered cases and saved outcomes: `reports/cardrpg-big/skills-v5/s5/selected/teams/results.json`. Gate unchanged: Reference matched-power median55–60% on TRAIN; measured on acceptance.
- Measure: before {"median":0.454,"byChapter":[{"chapter":2,"rate":0.448},{"chapter":3,"rate":0.454},{"chapter":1,"rate":0.99}],"note":"Unchanged fixture; no calibration or gate adjustment adopted."}; after {"median":0.34,"byChapter":[{"chapter":2,"rate":0.212},{"chapter":3,"rate":0.34},{"chapter":1,"rate":0.866}],"note":"Unchanged fixture; no calibration or gate adjustment adopted."}. Original MISS is retained. Full per-skill/per-crew details remain in `reports/cardrpg-big/skills-v5/s5/selected/DESIGN-REPORT.md`.
- Ranked hypotheses (not isolated causal estimates): Unequal encounter difficulty despite matched displayed power; helper/status synergy favors particular kits; support/control choices cross win thresholds.
- Smallest next fix: Separate kit effects from reference-fixture difficulty on TRAIN; preserve the approved crews, reference fixture and current gates. Three S5 design packages are already retained; no fourth candidate is introduced by this report.
- Verification/status: full affected matrices and both mode-compatibility checks are recorded in `reports/cardrpg-big/skills-v5/s5/selected/receipt-audit.json` and `reports/cardrpg-big/skills-v5/s5-selected/audit.json`; current gate remains **PARTIAL / MISS**. Passing source/hash checks do not override it.

## S5-GATE A5.sets — PARTIAL
- Reproduce: fixed TRAIN1–500, `node tools/cardrpg-big/skills-v5/numeric-gates.mjs reports/cardrpg-big/skills-v5/s5/selected`; registered cases and saved outcomes: `reports/cardrpg-big/skills-v5/s5/selected/sets/results.json`. Gate unchanged: Each set35–75% and leads ≥1 shared situation.
- Measure: before 83.550%–94.625%; after 72.925%–94.400%. Original MISS is retained. Full per-skill/per-crew details remain in `reports/cardrpg-big/skills-v5/s5/selected/DESIGN-REPORT.md`.
- Ranked hypotheses (not isolated causal estimates): Set thresholds interact with helpers/statuses; survivability items cross win boundaries; paired fixture saturation.
- Smallest next fix: Isolate a single set/proc contribution on the same TRAIN pairs before considering a smaller V5-only effect. No item normalization is adopted. Three S5 design packages are already retained; no fourth candidate is introduced by this report.
- Verification/status: full affected matrices and both mode-compatibility checks are recorded in `reports/cardrpg-big/skills-v5/s5/selected/receipt-audit.json` and `reports/cardrpg-big/skills-v5/s5-selected/audit.json`; current gate remains **PARTIAL / MISS**. Passing source/hash checks do not override it.

## S5-GATE A5.crew-gain — PARTIAL
- Reproduce: fixed TRAIN1–500, `node tools/cardrpg-big/skills-v5/numeric-gates.mjs reports/cardrpg-big/skills-v5/s5/selected`; registered cases and saved outcomes: `reports/cardrpg-big/skills-v5/s5/selected/teams/results.json`. Gate unchanged: Coherent minus random10–25pp.
- Measure: before {"chosen":["brioche","velvet","marigold"],"gainPp":21.666666666666668}; after {"chosen":["mochi","clover","mallow"],"gainPp":29.399999999999995}. Regression from an earlier PASS. Full per-skill/per-crew details remain in `reports/cardrpg-big/skills-v5/s5/selected/DESIGN-REPORT.md`.
- Ranked hypotheses (not isolated causal estimates): Unequal encounter difficulty despite matched displayed power; helper/status synergy favors particular kits; support/control choices cross win thresholds.
- Smallest next fix: Separate kit effects from reference-fixture difficulty on TRAIN; preserve the approved crews, reference fixture and current gates. Three S5 design packages are already retained; no fourth candidate is introduced by this report.
- Verification/status: full affected matrices and both mode-compatibility checks are recorded in `reports/cardrpg-big/skills-v5/s5/selected/receipt-audit.json` and `reports/cardrpg-big/skills-v5/s5-selected/audit.json`; current gate remains **PARTIAL / MISS**. Passing source/hash checks do not override it.

## S5-GATE V5.named-crews — PARTIAL
- Reproduce: fixed TRAIN1–500, `node tools/cardrpg-big/skills-v5/numeric-gates.mjs reports/cardrpg-big/skills-v5/s5/selected`; registered cases and saved outcomes: `reports/cardrpg-big/skills-v5/s5/selected/summary.json`. Gate unchanged: All4approved crews within5pp of best at every boss/elite.
- Measure: before 3/7 encounters miss; after 3/7 encounters miss. Original MISS is retained. Full per-skill/per-crew details remain in `reports/cardrpg-big/skills-v5/s5/selected/DESIGN-REPORT.md`.
- Ranked hypotheses (not isolated causal estimates): Unequal encounter difficulty despite matched displayed power; helper/status synergy favors particular kits; support/control choices cross win thresholds.
- Smallest next fix: Separate kit effects from reference-fixture difficulty on TRAIN; preserve the approved crews, reference fixture and current gates. Three S5 design packages are already retained; no fourth candidate is introduced by this report.
- Verification/status: full affected matrices and both mode-compatibility checks are recorded in `reports/cardrpg-big/skills-v5/s5/selected/receipt-audit.json` and `reports/cardrpg-big/skills-v5/s5-selected/audit.json`; current gate remains **PARTIAL / MISS**. Passing source/hash checks do not override it.

## S5-GATE V5.D3-keyword-crews — PARTIAL
- Reproduce: fixed TRAIN1–500, `node tools/cardrpg-big/skills-v5/numeric-gates.mjs reports/cardrpg-big/skills-v5/s5/selected`; registered cases and saved outcomes: `reports/cardrpg-big/skills-v5/s5/selected/design-report.json`. Gate unchanged: Each of8keywords in≥1/3 battles of every named crew.
- Measure: before not instrumented in the earlier cohort; after see the32 per-crew keyword assertions in the linked design report. Original MISS is retained. Full per-skill/per-crew details remain in `reports/cardrpg-big/skills-v5/s5/selected/DESIGN-REPORT.md`.
- Ranked hypotheses (not isolated causal estimates): Recorded Thread Burn attempts can both resist; Night lamp Daze suppresses Yarn Bitter; encounter mechanics determine exposure opportunities.
- Smallest next fix: Consider a distinct secondary Bitter context without weakening successful control. Exact23miss replays are retained; no fourth S5 package. Three S5 design packages are already retained; no fourth candidate is introduced by this report.
- Verification/status: full affected matrices and both mode-compatibility checks are recorded in `reports/cardrpg-big/skills-v5/s5/selected/receipt-audit.json` and `reports/cardrpg-big/skills-v5/s5-selected/audit.json`; current gate remains **PARTIAL / MISS**. Passing source/hash checks do not override it.

## S5-GATE V5.D4-skill-diversity — PARTIAL
- Reproduce: fixed TRAIN1–500, `node tools/cardrpg-big/skills-v5/numeric-gates.mjs reports/cardrpg-big/skills-v5/s5/selected`; registered cases and saved outcomes: `reports/cardrpg-big/skills-v5/s5/selected/design-report.json`. Gate unchanged: Each skill5–60% of all its cat actions in matched battles.
- Measure: before not instrumented in the earlier cohort; after mochi: mochi-1 71.925%, mochi-2 0.384%, mochi-3 9.029%, mochi-4 18.525%; panko: panko-1 69.986%, panko-2 0.286%, panko-3 9.093%, panko-4 19.700%. Original MISS is retained. Full per-skill/per-crew details remain in `reports/cardrpg-big/skills-v5/s5/selected/DESIGN-REPORT.md`.
- Ranked hypotheses (not isolated causal estimates): The automatic evaluator prefers other legal moves; capped/discounted shield value can underreward prevention; existing support companions cover the same need.
- Smallest next fix: Value the distinct Warm welcome/Bread cover opportunity. Eighteen exact replays rule out availability in those cases; broad basic cooldowns remain rejected. Three S5 design packages are already retained; no fourth candidate is introduced by this report.
- Verification/status: full affected matrices and both mode-compatibility checks are recorded in `reports/cardrpg-big/skills-v5/s5/selected/receipt-audit.json` and `reports/cardrpg-big/skills-v5/s5-selected/audit.json`; current gate remains **PARTIAL / MISS**. Passing source/hash checks do not override it.

## S5-GATE A5.tiers — PARTIAL
- Reproduce: fixed TRAIN1–500, `node tools/cardrpg-big/skills-v5/numeric-gates.mjs reports/cardrpg-big/skills-v5/s5/selected`; registered cases and saved outcomes: `reports/cardrpg-big/skills-v5/s5/selected/tiers/results.json`. Gate unchanged: TRAIN24comparisons; combined44/48 evaluated after acceptance.
- Measure: before Detailed measured values retained in reports/cardrpg-big/skills-v5/s5/before/tiers/results.json; after Detailed measured values retained in reports/cardrpg-big/skills-v5/s5/selected/tiers/results.json. Original MISS is retained. Full per-skill/per-crew details remain in `reports/cardrpg-big/skills-v5/s5/selected/DESIGN-REPORT.md`.
- Ranked hypotheses (not isolated causal estimates): Intended-band saturation; item/status scaling changes tier benefits; helper pressure changes survivability thresholds.
- Smallest next fix: Identify the first failing tier pair and its actual outcome differences before a narrowly scoped V5 change. Three S5 design packages are already retained; no fourth candidate is introduced by this report.
- Verification/status: full affected matrices and both mode-compatibility checks are recorded in `reports/cardrpg-big/skills-v5/s5/selected/receipt-audit.json` and `reports/cardrpg-big/skills-v5/s5-selected/audit.json`; current gate remains **PARTIAL / MISS**. Passing source/hash checks do not override it.

## S5-GATE A5.band-ladder — PARTIAL
- Reproduce: fixed TRAIN1–500, `node tools/cardrpg-big/skills-v5/numeric-gates.mjs reports/cardrpg-big/skills-v5/s5/selected`; registered cases and saved outcomes: `reports/cardrpg-big/skills-v5/s5/selected/tiers/results.json`. Gate unchanged: Bare→legendary≥15pp; no intended-band saturation.
- Measure: before 1/33 intended-band cells miss; after 13/33 intended-band cells miss. Original MISS is retained. Full per-skill/per-crew details remain in `reports/cardrpg-big/skills-v5/s5/selected/DESIGN-REPORT.md`.
- Ranked hypotheses (not isolated causal estimates): Intended-band saturation; item/status scaling changes tier benefits; helper pressure changes survivability thresholds.
- Smallest next fix: Identify the first failing tier pair and its actual outcome differences before a narrowly scoped V5 change. Three S5 design packages are already retained; no fourth candidate is introduced by this report.
- Verification/status: full affected matrices and both mode-compatibility checks are recorded in `reports/cardrpg-big/skills-v5/s5/selected/receipt-audit.json` and `reports/cardrpg-big/skills-v5/s5-selected/audit.json`; current gate remains **PARTIAL / MISS**. Passing source/hash checks do not override it.

## S5-GATE V5.full500.multi-ally — PARTIAL
- Reproduce: fixed TRAIN1–500, `node tools/cardrpg-big/skills-v5/numeric-gates.mjs reports/cardrpg-big/skills-v5/s5/selected`; registered cases and saved outcomes: `reports/cardrpg-big/skills-v5/s5/selected/metrics/results.json`. Gate unchanged: ≥35% support actions touch multiple allies.
- Measure: before 25.355780199032374; after 29.841532412734946. Original MISS is retained. Full per-skill/per-crew details remain in `reports/cardrpg-big/skills-v5/s5/selected/DESIGN-REPORT.md`.
- Ranked hypotheses (not isolated causal estimates): Guardian support moves are rarely selected; Cinnamon Clean apron remains single-patient; efficient single-target sustain competes with multi-ally casts.
- Smallest next fix: The exact Cinnamon ally-splash/team fallback and later support rows are already selected. A future change should target one prevention opportunity with paired pacing checks. Three S5 design packages are already retained; no fourth candidate is introduced by this report.
- Verification/status: full affected matrices and both mode-compatibility checks are recorded in `reports/cardrpg-big/skills-v5/s5/selected/receipt-audit.json` and `reports/cardrpg-big/skills-v5/s5-selected/audit.json`; current gate remains **PARTIAL / MISS**. Passing source/hash checks do not override it.

## S5-GATE V5.full500.normal-rounds — PARTIAL
- Reproduce: fixed TRAIN1–500, `node tools/cardrpg-big/skills-v5/numeric-gates.mjs reports/cardrpg-big/skills-v5/s5/selected`; registered cases and saved outcomes: `reports/cardrpg-big/skills-v5/s5/selected/metrics/results.json`. Gate unchanged: Mean8–12normal rounds.
- Measure: before 12.036; after 13.237666666666666. Original MISS is retained. Full per-skill/per-crew details remain in `reports/cardrpg-big/skills-v5/s5/selected/DESIGN-REPORT.md`.
- Ranked hypotheses (not isolated causal estimates): Setup/prevention replaces immediate damage; opening enemy sustain lengthens some fights; support can be chosen after its best window.
- Smallest next fix: Broad cooldowns were rejected after17.967rounds. Next isolate one support/setup valuation term and retain full normal-battle denominators. Three S5 design packages are already retained; no fourth candidate is introduced by this report.
- Verification/status: full affected matrices and both mode-compatibility checks are recorded in `reports/cardrpg-big/skills-v5/s5/selected/receipt-audit.json` and `reports/cardrpg-big/skills-v5/s5-selected/audit.json`; current gate remains **PARTIAL / MISS**. Passing source/hash checks do not override it.

## S5-GATE V5.full500.ultimates — PARTIAL
- Reproduce: fixed TRAIN1–500, `node tools/cardrpg-big/skills-v5/numeric-gates.mjs reports/cardrpg-big/skills-v5/s5/selected`; registered cases and saved outcomes: `reports/cardrpg-big/skills-v5/s5/selected/metrics/results.json`. Gate unchanged: ≥1executed ultimate per cat per normal battle.
- Measure: before 66.66666666666667; after 78.7. Original MISS is retained. Full per-skill/per-crew details remain in `reports/cardrpg-big/skills-v5/s5/selected/DESIGN-REPORT.md`.
- Ranked hypotheses (not isolated causal estimates): Short encounters end before each cat casts; another legal skill can have higher policy value; defeats suppress later actions.
- Smallest next fix: Cinnamon no-casualty fallback is implemented. Examine one actual missed-ultimate window without forced rotation or artificial casualties. Three S5 design packages are already retained; no fourth candidate is introduced by this report.
- Verification/status: full affected matrices and both mode-compatibility checks are recorded in `reports/cardrpg-big/skills-v5/s5/selected/receipt-audit.json` and `reports/cardrpg-big/skills-v5/s5-selected/audit.json`; current gate remains **PARTIAL / MISS**. Passing source/hash checks do not override it.

## S5-GATE V5.probe180.multi-ally — PARTIAL
- Reproduce: fixed TRAIN1–500, `node tools/cardrpg-big/skills-v5/numeric-gates.mjs reports/cardrpg-big/skills-v5/s5/selected`; registered cases and saved outcomes: `reports/cardrpg-big/skills-v5/s5/selected/metrics/results.json`. Gate unchanged: ≥35% support actions touch multiple allies.
- Measure: before 25.352664576802507; after 30.061790487138957. Original MISS is retained. Full per-skill/per-crew details remain in `reports/cardrpg-big/skills-v5/s5/selected/DESIGN-REPORT.md`.
- Ranked hypotheses (not isolated causal estimates): Guardian support moves are rarely selected; Cinnamon Clean apron remains single-patient; efficient single-target sustain competes with multi-ally casts.
- Smallest next fix: The exact Cinnamon ally-splash/team fallback and later support rows are already selected. A future change should target one prevention opportunity with paired pacing checks. Three S5 design packages are already retained; no fourth candidate is introduced by this report.
- Verification/status: full affected matrices and both mode-compatibility checks are recorded in `reports/cardrpg-big/skills-v5/s5/selected/receipt-audit.json` and `reports/cardrpg-big/skills-v5/s5-selected/audit.json`; current gate remains **PARTIAL / MISS**. Passing source/hash checks do not override it.

## S5-GATE V5.probe180.normal-rounds — PARTIAL
- Reproduce: fixed TRAIN1–500, `node tools/cardrpg-big/skills-v5/numeric-gates.mjs reports/cardrpg-big/skills-v5/s5/selected`; registered cases and saved outcomes: `reports/cardrpg-big/skills-v5/s5/selected/metrics/results.json`. Gate unchanged: Mean8–12normal rounds.
- Measure: before 12.108333333333333; after 13.3. Original MISS is retained. Full per-skill/per-crew details remain in `reports/cardrpg-big/skills-v5/s5/selected/DESIGN-REPORT.md`.
- Ranked hypotheses (not isolated causal estimates): Setup/prevention replaces immediate damage; opening enemy sustain lengthens some fights; support can be chosen after its best window.
- Smallest next fix: Broad cooldowns were rejected after17.967rounds. Next isolate one support/setup valuation term and retain full normal-battle denominators. Three S5 design packages are already retained; no fourth candidate is introduced by this report.
- Verification/status: full affected matrices and both mode-compatibility checks are recorded in `reports/cardrpg-big/skills-v5/s5/selected/receipt-audit.json` and `reports/cardrpg-big/skills-v5/s5-selected/audit.json`; current gate remains **PARTIAL / MISS**. Passing source/hash checks do not override it.

## S5-GATE V5.probe180.ultimates — PARTIAL
- Reproduce: fixed TRAIN1–500, `node tools/cardrpg-big/skills-v5/numeric-gates.mjs reports/cardrpg-big/skills-v5/s5/selected`; registered cases and saved outcomes: `reports/cardrpg-big/skills-v5/s5/selected/metrics/results.json`. Gate unchanged: ≥1executed ultimate per cat per normal battle.
- Measure: before 66.66666666666667; after 75. Original MISS is retained. Full per-skill/per-crew details remain in `reports/cardrpg-big/skills-v5/s5/selected/DESIGN-REPORT.md`.
- Ranked hypotheses (not isolated causal estimates): Short encounters end before each cat casts; another legal skill can have higher policy value; defeats suppress later actions.
- Smallest next fix: Cinnamon no-casualty fallback is implemented. Examine one actual missed-ultimate window without forced rotation or artificial casualties. Three S5 design packages are already retained; no fourth candidate is introduced by this report.
- Verification/status: full affected matrices and both mode-compatibility checks are recorded in `reports/cardrpg-big/skills-v5/s5/selected/receipt-audit.json` and `reports/cardrpg-big/skills-v5/s5-selected/audit.json`; current gate remains **PARTIAL / MISS**. Passing source/hash checks do not override it.

## S5-GATE A5.economy.ratiosAtMost3 — PARTIAL
- Reproduce: fixed TRAIN1–500, `node tools/cardrpg-big/skills-v5/numeric-gates.mjs reports/cardrpg-big/skills-v5/s5/selected`; registered cases and saved outcomes: `reports/cardrpg-big/skills-v5/s5/selected/economy/summary.json`. Gate unchanged: Unchanged A5 registered gate.
- Measure: before true; after false. Regression from an earlier PASS. Full per-skill/per-crew details remain in `reports/cardrpg-big/skills-v5/s5/selected/DESIGN-REPORT.md`.
- Ranked hypotheses (not isolated causal estimates): The exact numeric condition is not met in the retained rows; combat outcomes can alter earned progression; no individual causal contribution has yet been isolated.
- Smallest next fix: Inspect the first failing registered row before proposing a narrowly scoped TRAIN change; retain the current threshold and all samples. Three S5 design packages are already retained; no fourth candidate is introduced by this report.
- Verification/status: full affected matrices and both mode-compatibility checks are recorded in `reports/cardrpg-big/skills-v5/s5/selected/receipt-audit.json` and `reports/cardrpg-big/skills-v5/s5-selected/audit.json`; current gate remains **PARTIAL / MISS**. Passing source/hash checks do not override it.

## S5-GATE A5.day7.everyLossHasAvailableImprovement — PARTIAL
- Reproduce: fixed TRAIN1–500, `node tools/cardrpg-big/skills-v5/numeric-gates.mjs reports/cardrpg-big/skills-v5/s5/selected`; registered cases and saved outcomes: `reports/cardrpg-big/skills-v5/s5/selected/day7/results.json`. Gate unchanged: Unchanged A5 registered gate.
- Measure: before true; after false. Regression from an earlier PASS. Full per-skill/per-crew details remain in `reports/cardrpg-big/skills-v5/s5/selected/DESIGN-REPORT.md`.
- Ranked hypotheses (not isolated causal estimates): The exact numeric condition is not met in the retained rows; combat outcomes can alter earned progression; no individual causal contribution has yet been isolated.
- Smallest next fix: Inspect the first failing registered row before proposing a narrowly scoped TRAIN change; retain the current threshold and all samples. Three S5 design packages are already retained; no fourth candidate is introduced by this report.
- Verification/status: full affected matrices and both mode-compatibility checks are recorded in `reports/cardrpg-big/skills-v5/s5/selected/receipt-audit.json` and `reports/cardrpg-big/skills-v5/s5-selected/audit.json`; current gate remains **PARTIAL / MISS**. Passing source/hash checks do not override it.

## S8-BOSS-REPORT-SCOPE — preserve every natural boss duration (FIXED reporting; measurements pending)
- Reproduce: inspect `s8-report.mjs` and `delivery-report.mjs` before S8 aggregation. The report originally displayed the earned day7 pacing gate but omitted the durations already measured in the fixed performance fixtures and Home journey.
- Measure/attribute: the raw fixtures and Home battles retain all durations; omission was in report selection, not simulation or sampling.
- Ranked hypotheses: 1. Reporter focused on inherited A5 earned-day7 gate; 2. performance receipts were summarized only as frame/draw statistics.
- Smallest fix: show all six natural fixture durations and every Home boss result, compare both boss pools separately with the original45–90s target, and include any miss in the Appendix pacing row. Keep the registered earned-day7 self-score component unchanged and identified.
- Verification: reporter scripts pass syntax checks. The existing queue will aggregate these same receipts; no new battle, selected success, source-rule change or replacement sample. S8 source/hash closure remains required.

## S8-ATTRIBUTION-PATHS — checkout prefixes looked like new modules (FIXED)
- Reproduce: initial `observation-attribution.mjs` diagnostic compared literal manifest module IDs; retained output is `s8/observation-attribution-paths-attempt-1.json`. It counted686 additions/658 removals in the first config.
- Attribute: baseline manifest IDs include the temporary checkout prefix; candidate IDs are repository relative. Raw loaded-byte and CPU gates were unaffected.
- Ranked hypotheses: 1. Path normalization mismatch (confirmed by paired module names); 2. real changed module membership (evaluate after normalization).
- Smallest fix: normalize only checkout prefixes, retaining repository/node_modules suffixes and virtual IDs; preserve all original chunk rows. Re-read the same18 observations and6 performance receipts. No browser or combat rerun.
- Verification: diagnostic syntax and all source-receipt assertions pass after correction; before output retained. Shipping runtime, OFF/ON hashes and original startup/performance gates are unchanged; S8 closure remains required.

## S8-GATE reward-cadence — PARTIAL
- Reproduce: the single registered observation in `s8/home/metrics.json`; aggregate with `node tools/cardrpg-big/skills-v5/s8-report.mjs`. Unchanged gate: 30-minute reward gap <=300s.
- Measure: before "Home03 723s"; observed "929.859s". Historical evidence is not substituted for current measurements.
- Ranked hypotheses (not established causes): 1. Long loss/retry intervals; 2. fixed bot upgrade policy; 3. sparse visible rewards in the reached route.
- Smallest next fix: Attribute the longest retained gap to its exact route and outcome before changing rewards. No second hour without a justified change. This report does not apply a runtime change or run a new sample.
- Verification/status: S8 six source gates and OFF8250/fallback180+45 compatibility remain exact in `s8/audit.json`; all affected observations are retained in `s8/observations.json`. **PARTIAL / MISS**; revisit the original evidence before S6, without moving gates.

## S8-GATE combat-dead-time — PARTIAL
- Reproduce: the single registered observation in `s8/home/metrics.json`; aggregate with `node tools/cardrpg-big/skills-v5/s8-report.mjs`. Unchanged gate: combat walltime reduction >=40%.
- Measure: before "Home03 2.0%"; observed "-10.440741855978247%". Historical evidence is not substituted for current measurements.
- Ranked hypotheses (not established causes): 1. More actions from helpers and support; 2. repeated losses; 3. the natural playback clock.
- Smallest next fix: Compare action counts and losses in the original timeline. Broad cooldown changes remain rejected; no unmeasured speed change. This report does not apply a runtime change or run a new sample.
- Verification/status: S8 six source gates and OFF8250/fallback180+45 compatibility remain exact in `s8/audit.json`; all affected observations are retained in `s8/observations.json`. **PARTIAL / MISS**; revisit the original evidence before S6, without moving gates.

## S8-GATE earned-boss — PARTIAL
- Reproduce: the single registered observation in `s8/day7/checks.json`; aggregate with `node tools/cardrpg-big/skills-v5/s8-report.mjs`. Unchanged gate: earned day7 boss won in 45–90s.
- Measure: before "A5 paired fixture 64.921s"; observed {"bossVictory":true,"boss45to90s":false}. Historical evidence is not substituted for current measurements.
- Ranked hypotheses (not established causes): 1. Helper/sustain action count; 2. earned crew power; 3. route outcome before reaching the boss.
- Smallest next fix: Inspect the fixed account route and actual boss actions; no best-account selection or rounds-to-seconds substitution. This report does not apply a runtime change or run a new sample.
- Verification/status: S8 six source gates and OFF8250/fallback180+45 compatibility remain exact in `s8/audit.json`; all affected observations are retained in `s8/observations.json`. **PARTIAL / MISS**; revisit the original evidence before S6, without moving gates.

## S8-GATE boss-pacing-fixed — PARTIAL
- Reproduce: the single registered observation in `s8/observations.json`; aggregate with `node tools/cardrpg-big/skills-v5/s8-report.mjs`. Unchanged gate: every observed boss45–90s; fixed and Home pools reported separately.
- Measure: before "General V5 boss target45–90s"; observed [{"case":"boss-native","cpu":1,"enemies":["yarn-giant"],"seconds":280.0368999999911,"result":"party","source":"reports/cardrpg-big/skills-v5/s8/performance/boss-native/checks.json"}]. Historical evidence is not substituted for current measurements.
- Ranked hypotheses (not established causes): 1. Helper/sustain action count; 2. party kit and earned power; 3. first-use loading before playback.
- Smallest next fix: Inspect the exact retained boss actions and report every loss. This additional report of the original general pacing target does not replace the earned-day7 gate or change the registered self-score. This report does not apply a runtime change or run a new sample.
- Verification/status: S8 six source gates and OFF8250/fallback180+45 compatibility remain exact in `s8/audit.json`; all affected observations are retained in `s8/observations.json`. **PARTIAL / MISS**; revisit the original evidence before S6, without moving gates.

## S8-GATE boss-pacing-home — PARTIAL
- Reproduce: the single registered observation in `s8/observations.json`; aggregate with `node tools/cardrpg-big/skills-v5/s8-report.mjs`. Unchanged gate: every observed boss45–90s; fixed and Home pools reported separately.
- Measure: before "General V5 boss target45–90s"; observed [{"index":3,"seed":3280124206,"enemies":["yarn-giant"],"seconds":68.174,"result":"enemy"},{"index":6,"seed":3057134794,"enemies":["yarn-giant"],"seconds":88.392,"result":"party"},{"index":9,"seed":3593217473,"enemies":["rain-spool"],"seconds":64.53,"result":"enemy"},{"index":12,"seed":2256061393,"enemies":["rain-spool"],"seconds":89.967,"result":"enemy"},{"index":15,"seed":30332408,"enemies":["rain-spool"],"seconds":81.018,"result":"enemy"},{"index":18,"seed":899726880,"enemies":["rain-spool"],"seconds":83.999,"result":"enemy"},{"index":21,"seed":188593055,"enemies":["rain-spool"],"seconds":78.715,"result":"enemy"},{"index":24,"seed":126583848,"enemies":["rain-spool"],"seconds":73.245,"result":"party"},{"index":27,"seed":3425957772,"enemies":["pantry-crown"],"seconds":98.922,"result":"party"},{"index":30,"seed":2542255639,"enemies":["yarn-giant"],"seconds":61.611,"result":"party"},{"index":33,"seed":1245215347,"enemies":["rain-spool"],"seconds":85.154,"result":"enemy"},{"index":36,"seed":3483962368,"enemies":["rain-spool"],"seconds":83.868,"result":"enemy"},{"index":39,"seed":3859915983,"enemies":["rain-spool"],"seconds":70.967,"result":"enemy"},{"index":42,"seed":511631122,"enemies":["rain-spool"],"seconds":62.32,"result":"enemy"},{"index":45,"seed":1732749953,"enemies":["rain-spool"],"seconds":68.855,"result":"enemy"},{"index":48,"seed":2868178150,"enemies":["rain-spool"],"seconds":69.705,"result":"enemy"},{"index":51,"seed":1281318595,"enemies":["rain-spool"],"seconds":81.589,"result":"enemy"}]. Historical evidence is not substituted for current measurements.
- Ranked hypotheses (not established causes): 1. Helper/sustain action count; 2. party kit and earned power; 3. first-use loading before playback.
- Smallest next fix: Inspect the exact retained boss actions and report every loss. This additional report of the original general pacing target does not replace the earned-day7 gate or change the registered self-score. This report does not apply a runtime change or run a new sample.
- Verification/status: S8 six source gates and OFF8250/fallback180+45 compatibility remain exact in `s8/audit.json`; all affected observations are retained in `s8/observations.json`. **PARTIAL / MISS**; revisit the original evidence before S6, without moving gates.

## S8-GATE draws — PARTIAL
- Reproduce: the single registered observation in `s8/observations.json`; aggregate with `node tools/cardrpg-big/skills-v5/s8-report.mjs`. Unchanged gate: peak draw calls <=130.
- Measure: before "Earlier B fixture evidence is a separate renderer"; observed 234. Historical evidence is not substituted for current measurements.
- Ranked hypotheses (not established causes): 1. Helper count; 2. overlapping effects; 3. visible actor geometry.
- Smallest next fix: Provide the exact peak fixture/action to lane B; do not omit helpers from the test. This report does not apply a runtime change or run a new sample.
- Verification/status: S8 six source gates and OFF8250/fallback180+45 compatibility remain exact in `s8/audit.json`; all affected observations are retained in `s8/observations.json`. **PARTIAL / MISS**; revisit the original evidence before S6, without moving gates.

## S8-GATE offline-cold — PARTIAL
- Reproduce: the single registered observation in `s8/performance/opening-cpu4/checks.json`; aggregate with `node tools/cardrpg-big/skills-v5/s8-report.mjs`. Unchanged gate: offline CPU4 opening max <=120ms.
- Measure: before "A4 166.6ms"; observed "183.29999999999995ms". Historical evidence is not substituted for current measurements.
- Ranked hypotheses (not established causes): 1. Renderer compilation/upload; 2. JS decode/evaluation; 3. scheduler variance in the single observation.
- Smallest next fix: Inspect original cold frames and retain the sample. A measured runtime change is required before any new profile. This report does not apply a runtime change or run a new sample.
- Verification/status: S8 six source gates and OFF8250/fallback180+45 compatibility remain exact in `s8/audit.json`; all affected observations are retained in `s8/observations.json`. **PARTIAL / MISS**; revisit the original evidence before S6, without moving gates.

## S8-GATE startup-1280-cpu1-max — PARTIAL
- Reproduce: the single registered observation in `s8/startup/summary.json`; aggregate with `node tools/cardrpg-big/skills-v5/s8-report.mjs`. Unchanged gate: candidate task CPU max <= current main.
- Measure: before 311.402; observed 318.32099999999997. Historical evidence is not substituted for current measurements.
- Ranked hypotheses (not established causes): 1. Different loaded modules or evaluation; 2. native scheduling variance; 3. initialization work after the onboarding click.
- Smallest next fix: Use all three original paired observations and their chunk membership. Do not reroll an outlier or claim statistical equivalence. This report does not apply a runtime change or run a new sample.
- Verification/status: S8 six source gates and OFF8250/fallback180+45 compatibility remain exact in `s8/audit.json`; all affected observations are retained in `s8/observations.json`. **PARTIAL / MISS**; revisit the original evidence before S6, without moving gates.

## S8-GATE startup-1280-cpu4-median — PARTIAL
- Reproduce: the single registered observation in `s8/startup/summary.json`; aggregate with `node tools/cardrpg-big/skills-v5/s8-report.mjs`. Unchanged gate: candidate task CPU median <= current main.
- Measure: before 1051.76; observed 1090.3229999999999. Historical evidence is not substituted for current measurements.
- Ranked hypotheses (not established causes): 1. Different loaded modules or evaluation; 2. native scheduling variance; 3. initialization work after the onboarding click.
- Smallest next fix: Use all three original paired observations and their chunk membership. Do not reroll an outlier or claim statistical equivalence. This report does not apply a runtime change or run a new sample.
- Verification/status: S8 six source gates and OFF8250/fallback180+45 compatibility remain exact in `s8/audit.json`; all affected observations are retained in `s8/observations.json`. **PARTIAL / MISS**; revisit the original evidence before S6, without moving gates.

## S8-GATE startup-1440-cpu1-median — PARTIAL
- Reproduce: the single registered observation in `s8/startup/summary.json`; aggregate with `node tools/cardrpg-big/skills-v5/s8-report.mjs`. Unchanged gate: candidate task CPU median <= current main.
- Measure: before 303.124; observed 303.649. Historical evidence is not substituted for current measurements.
- Ranked hypotheses (not established causes): 1. Different loaded modules or evaluation; 2. native scheduling variance; 3. initialization work after the onboarding click.
- Smallest next fix: Use all three original paired observations and their chunk membership. Do not reroll an outlier or claim statistical equivalence. This report does not apply a runtime change or run a new sample.
- Verification/status: S8 six source gates and OFF8250/fallback180+45 compatibility remain exact in `s8/audit.json`; all affected observations are retained in `s8/observations.json`. **PARTIAL / MISS**; revisit the original evidence before S6, without moving gates.

## S8-GATE startup-1440-cpu1-max — PARTIAL
- Reproduce: the single registered observation in `s8/startup/summary.json`; aggregate with `node tools/cardrpg-big/skills-v5/s8-report.mjs`. Unchanged gate: candidate task CPU max <= current main.
- Measure: before 305.74399999999997; observed 306.993. Historical evidence is not substituted for current measurements.
- Ranked hypotheses (not established causes): 1. Different loaded modules or evaluation; 2. native scheduling variance; 3. initialization work after the onboarding click.
- Smallest next fix: Use all three original paired observations and their chunk membership. Do not reroll an outlier or claim statistical equivalence. This report does not apply a runtime change or run a new sample.
- Verification/status: S8 six source gates and OFF8250/fallback180+45 compatibility remain exact in `s8/audit.json`; all affected observations are retained in `s8/observations.json`. **PARTIAL / MISS**; revisit the original evidence before S6, without moving gates.

## S6-DELIVERY-WAITER — FIXED tooling syntax
- Reproduce: original passive waiter in `s6/delivery-preflight/waiter-attempt-1.py` fails Python parsing at line27. A repair wrapper repeated the same separator typo; both diagnostics are recorded in `attempts.log`. Neither attempt started a child or a new sample.
- Attribute/hypothesis1: a literal backslash-n was written where an actual newline was intended.
- Smallest fix, third attempt: replace only that separator with an actual newline. Corrected source compiles. Waiter observes original runner33012 and starts existing delivery commands only after all20 scopes finish.
- Verification: Python compile PASS. Registered source/tool files unchanged; OFF/fallback receipts remain from S8 for unchanged production bytes. S6 closure is pending. No gate, sample or runtime modification.

## S6-REPORT-VALUES — FIXED reporting omission
- Reproduce: retained `s6/report-preflight/delivery-report-before-values.mjs` fell back to PASS/MISS strings for all economy/day-7 measurement cells, and showed the earned boss verdict without its elapsed seconds.
- Attribute/hypothesis1: the numeric gate receipt stores those progression assertions as booleans; the reporter did not read the corresponding underlying summaries. Gate evaluation and original outcomes were unaffected.
- Smallest fix: read both modes' completed economy/day-7 receipts when rendering the report; show actual rates, counts, medians, censored accounts, currency ratios and original earned-boss seconds. Add plain gate labels. Do not change the registered evaluator, samples or thresholds.
- Verification: reporter syntax PASS; all registered source/tool hashes remain exact. Full rendered-value verification waits for both modes' completed receipts in the existing delivery queue. S8 compatibility remains applicable; S6 source/hash closure is pending.

## S6-FOURTH-SLOT-TRADEOFF — PARTIAL
- Reproduce: read the completed paired `s6/{on,off}/equipped/results.json` receipts; fixed384 cases ×500 seeds,20001–20500. `s6/equipment-attribution.json` binds both file hashes and every chapter maximum.
- Measure: fallback58/384 misses, worst87.4pp; V5 38/384 misses, worst48.4pp. Forty-nine fallback misses become passes, but29 fallback passes become misses;9 fail in both. The two global maxima occur in different named cases, recorded in `s6/EQUIPMENT-REVIEW.md`. TRAIN V5 had35 misses/worst47pp.
- Ranked hypotheses, not isolated causes: 1. New helper and support interactions move survival thresholds; 2. policy choices amplify changes in available protection; 3. set completion effects interact with the different battle length.
- Smallest next fix: in a future TRAIN phase, isolate one of the29 newly failing cases and separate its fourth-piece contributions before changing a V5-only term. Current held-out candidate is unchanged; any retune needs a newly registered30001–30500 block.
- Verification/status: every current cell retains500 outcomes, Wilson intervals and paired digests. Scope/baseline13 and registered source/tool hashes pass; S8 OFF/fallback receipts remain exact for unchanged production bytes. The separate bare-item scope and full S6 closure are pending. Original12pp gate remains PARTIAL/MISS; aggregate improvement does not erase regressions.

## S6-BOSS-CREW-TRADEOFF — PARTIAL
- Reproduce: `node tools/cardrpg-big/skills-v5/paired-boss-review.mjs` reads both completed `s6/{on,off}/teams/results.json` receipts: 663 cells per mode, 500 seeds each on 20001–20500. No new battles. Source SHA256s and exact tables are in `s6/boss-attribution.json` and `s6/BOSS-CREW-REVIEW.md`.
- Measure: cat gates improve from 6/12 to 9/12, but Soot regresses from 61.83% to 50.70%. Cinnamon78.72% and Velvet76.12% remain above75%. Four previously passing named crew/boss cells fail with V5; two previously failing cells pass. The TRAIN-selected coherent crew gains31.2pp versus the unchanged10–25pp target; reference median32.4% misses55–60%.
- Ranked hypotheses (not isolated causes): 1. Boss helpers and kit interactions change encounter difficulty despite equal displayed power; 2. companion combinations change the value of setup and protection; 3. policy timing shifts burst and sustain opportunities differently across bosses.
- Smallest next fix: isolate Soot with fixed partners and a recorded losing TRAIN seed, then separate helper pressure from its legal skill choices before altering one V5-only policy term. Preserve the named crews and all original fixture budgets. No post-acceptance tuning or fourth S5 design package is introduced here.
- Verification/status: all663 cells per mode retain500 outcomes, matching keys and Wilson intervals. Registered source/tool hashes remain exact; scope/baseline13PASS and unchanged-production S8 OFF/fallback receipts still apply. Full S6 source closure and elite matrices remain pending. Original cat, named-crew, coherent-gain and reference-calibration gates stay PARTIAL/MISS; future retuning needs registered30001–30500.

## S6-SET-SATURATION — PARTIAL
- Reproduce: completed `s6/{on,off}/sets/results.json`,64cells per mode×500seeds; `s6/set-attribution.json` binds both hashes and arithmetic. No new battles.
- Measure: 0/8 fallback sets versus3/8 V5 sets meet35–75% plus a leading scene. Rainlace82.425→94.350% worsens its upper-bound excess. Five of eight fixed situations have100% wins for every set in both modes; leading ties do not establish distinct niches.
- Ranked hypotheses (not isolated causes): 1. Fixed nonboss encounters are too weak at this reference budget; 2. Rainlace sustain interacts with V5 helpers/statuses; 3. policy target choices amplify kit-specific threshold effects.
- Smallest next fix: on TRAIN, separate one Rainlace contribution from the same fixed team and retain the original eight-situation denominator. Investigate fixture calibration without silently adjusting it. Current candidate, tie rule and acceptance remain unchanged.
- Verification/status: complete64×500 outcome receipts/Wilson intervals retained; source and registered tools unchanged, S8 OFF/fallback exact for current production. Full S6 closure remains queued. Original set gate remains PARTIAL/MISS; any changed candidate requires registered30001–30500.

## S6-TIER-REGRESSION — PARTIAL
- Reproduce: completed `s6/{on,off}/tiers/results.json`,210 cells×500 seeds per mode; source-bound arithmetic in `s6/tier-attribution.json` and `s6/TIER-REVIEW.md`. Each mode uses its own original24 TRAIN comparisons.
- Measure: fallback46/48PASS versus V5 37/48MISS at the unchanged44/48 threshold; both have zero reversals. All six V5 acceptance gains below2pp are level1 in chapters2–3. Intended-band misses are0/33 fallback versus12/33 V5; no complete-band saturation explains those twelve failures.
- Ranked hypotheses (not isolated causes): 1. Helper/enemy pressure dominates low-level item benefits; 2. nonlinear kit survival changes narrow the value of adjacent tiers; 3. route encounters and boss-only bands respond differently to equipment scaling.
- Smallest next fix: on TRAIN isolate one level1 chapter2 adjacent-tier pair with identical seeds and first-divergence evidence before changing a V5-only term. Keep all48 comparisons, all33 bands and the2pp/15pp gates.
- Verification/status:210 complete500-outcome cells per mode retained; registered runtime/tools unchanged; S8 OFF/fallback receipts remain exact for current production. Full S6 closure remains queued. Overall tier and band gates stay PARTIAL/MISS; retuning requires registered30001–30500.

## S6-INHERITED-GUIDE — PARTIAL pending delivery check
- Reproduce: A5/PLAYTEST-KIT.md still opened only source27f192301; gameplay-v4.html had no A5 section. The new standalone V5 guide did not itself refresh those inherited entry points.
- Attribution/hypothesis1: the delivery builder covered the new guide while omitting the older entry points requested by A5 Z.
- Smallest fix: link the older kit to the current V5 kit and retain its historical protocol. Extend the queued guide build with an A5/Skills V5 section, three once-only Z screenshots, historical A4/current V5 comparisons with sample caveats, and the original seven-day progression table. Do not change the game artifact, A4 index, rules or acceptance samples.
- Preflight attempt1: the historical guide has no header element; the insertion assertion caught that before any build. Attempt2 anchors to its observed section#prepare. No artifact or sample was produced by the failed preflight.
- Verification: syntax checks now; three-width offline guide/link/image checks run after the existing delivery queue produces its registered Z pack. Runtime and acceptance tools remain unchanged. Mark FIXED only after those checks and image review; current status PARTIAL.

## S6-BARE-ITEM-THRESHOLD — PARTIAL
- Reproduce: completed `s6/on/pieces/results.json`, fixed2,304 cases ×500 seeds,20001–20500. V5 receipt was produced by the original acceptance runner33012; fallback remains in the same paired run.
- Measure: V5 has36/2,304 misses, worst47.8pp against the unchanged12pp cap (TRAIN33misses/worst51pp). Maximum: Rainlace legendary relic on Mochi, level6, chapter1; without item89/500 wins, with item328/500. Its displayed share is at most2.463%, which does not bound its win-rate effect.
- Ranked hypotheses, not isolated causes: 1. Sustain crosses a survival threshold; 2. helper pressure changes the timing of that threshold; 3. policy choices amplify protection from the item.
- Smallest next fix: after the paired review, isolate one failing interaction on TRAIN while keeping the original bare-team budget and seeds. No held-out retune or item normalization is applied.
- Verification/status: all2,304 cells retain500 outcomes and digests. All70 registered source/tool hashes remain exact; unchanged-production S8 OFF/fallback checks still apply. Paired fallback, full S6 closure and affected progression scopes remain pending. Current gate PARTIAL/MISS; any later changed candidate needs registered30001–30500.

### S6-BARE-ITEM-THRESHOLD paired completion
- Original fallback finished:22/2,304 misses, maximum60.4pp (Bellsteel legendary charm/Mochi/level6/chapter3,0→302wins/500). V5 has36misses/max47.8pp:21 old misses pass,35 old passes fail,1 fails in both. Thus the lower maximum does not mean a lower miss count.
- Source-bound `s6/BARE-ITEM-REVIEW.md` / `pieces-attribution.json` verify all4,608 cells and500 outcomes each without new battles. Thirty-four V5 misses occur at level6/chapter1 and two at level6/chapter3; zero-win fixture floors are retained. The gate stays PARTIAL/MISS; no retune, gate movement or sample substitution. Full S6 source/hash closure remains in the original queue.
