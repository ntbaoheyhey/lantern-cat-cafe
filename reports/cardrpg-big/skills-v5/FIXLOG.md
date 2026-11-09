# Skills V5 repair log

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

## S5-HARNESS-2 — isolated fallback source and shape labels (PARTIAL)
- Reproduce: `BIG_RULES_ROOT=/tmp/cardrpg-v5a-design1 node .../on.mjs s5-design1`. Routes used the snapshot but probe.mjs hardcoded cwd; original receipt does not establish candidate battle parity. No acceptance or balance sample affected.
- Fix: probe accepts the same explicit BIG_RULES_ROOT as load.mjs; off runner hashes that source too. Corrected full fallback receipt is s5-design1-corrected; original retained. OFF8250 candidate run queued.
- Design1 diagnostic shape labels came from static kits, so conditional Cinnamon4 was labelled fallen even when a team multi-hit event was emitted. Version2 diagnostic reads emitted shape first. Original design1 rows retained; use their action/balance counts, not conditional shape counts. No combat source or denominator change.

## S5-POLICY-NULL — absent Mark duration (FIXED in design2b; verification pending)
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

## S5-TEACUP-FIXTURE — opening Regen omitted from test (PARTIAL; correction queued)
- Reproduce: s5-selected/gates/rules-attempt-1.log;1261pass/1failure. Teacup fixture set round2 but left actor.turns0, so it incorrectly represented a second-turn healer as taking its opening action.
- Attribution: stale test fixture after registered opening-only Regen design; measured battle rules are correct. Hypotheses ranked: (1) turns fixture mismatch confirmed; (2) repeat Regen regression ruled out by turns===0 guard; (3) heal target error ruled out by actual weakest-target event.
- Smallest fix: exercise opening round1 (Regen+basic+Mark), advance turns1/round2 and assert weakest65 heal, then turns2/round3 basic+Mark without Regen. Runtime remains byte-identical.
- Re-run full phase gate coordinator on corrected test source; current OFF8250/fallback receipts remain exact on the same production-rule hash map. Original failed run preserved; no numeric resampling.

## S5-PATCH-WHITESPACE — preserved unified-diff context (FIXED scope attribution)
- Precommit git diff --check flagged a single space on blank context lines inside four retained candidate.patch artifacts. These are required unified-diff context prefixes, not runtime trailing whitespace.
- Preserve the registered patch bytes; check staged source/docs/tools with only *.patch excluded. No production rule or sample change. Compatibility receipts remain bound to unchanged rules.
