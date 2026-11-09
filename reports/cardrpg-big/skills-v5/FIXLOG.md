# Skills V5 repair log

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
