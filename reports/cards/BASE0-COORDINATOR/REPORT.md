STATUS: IN-PROGRESS

# BASE0 exact-head verification — living draft

Candidate `5db4949096e93eedeb98dff94ef1ec7019485f96` on ai/codex-mega-deno0, draft PR246; base `1fb25edf4c54ada0d161e3c1dd16a4c4550aafba`. Coordinator built/fixed/verified; no formal grade or merge is claimed. Authoritative current evidence is in reports/cards/BASE0-COORDINATOR on the ledger branch. Earlier product reports and interrupted runs remain historical; this report identifies the current candidate explicitly.

The candidate repairs explicit-index Deno maps, preboot scene resize, readable HUD/XP/guidance and narrow compatibility, viewport-aware smoke, opt-in artifact writes, reached-screen effects checks and stale documentation links. Additional inherited SQL fixtures had expired against database NOW(); test-only clocks now derive the following database day, with early-claim/replay and leap/year-boundary regressions. Production guards, migration/auth/contract source, dependency versions and flag defaults are unchanged.

| Gate | Current result | Evidence |
| --- | --- | --- |
| G1 | PASS: frozen install, Deno drift, typecheck, lint, root units, default/classic/v2builds; completebrowser264/264at eachsize; changed specs470/470repeat10at eachsize. | full/results.jsonl and repeat-1280x720/,repeat-1600x900/ |
| G2 | PASS for BASE0 compatibility scope: guest18 and local-signed18visits, zero findings; effects10/10eachsize; keyboard7destinations eachsize; contrast;18correctly framed reference comparisons with explicit dispositions. | audit-guest/,audit-signed-in/,effects-*/,accessibility/,reference-r2/,ui-diff.md |
| G3 | PASS: bundle scan, links, Deno imports, generation drift; gzip growth under5% versus same-day main. | full/ and review/bundle-comparison.json |
| G4 | NOT APPLICABLE: no contracts or migrations changed. Full SQL unit suite passes. | review/integrity-findings.json and full/test.log |
| G5 | PASS: production classic+v2 previews from observed live public configuration, bothsizes; no sign-in, backend writes or unexpectederrors; values withheld. | public-config/ and checks/public-config.log |
| G6 | PASS:79files classified,12integrity flags justified, zero matching secret patterns;11branch commits have correct author/suffix; source review and scoped differences recorded. | review/ |
| G7 | Publication pending coordinator push; no merge readiness until pushed and two formal grades pass. | This report and current handoff |

Required PR wrapper: bash scripts/verify-pr.sh246 without comments, isolated TMPDIR/ports, exit0. The wrapper appropriately skips contract tests because contracts did not change. See checks/verify-pr-246.log and wrapper-tmp/verify-pr-246.log.

Mutation verification:23verified kills, zero survivors,13green controls, tracked scratch source restored. The initial recovery selector matched two locations and stopped before applying the last mutant; it is a setup failure, not a kill. A statement-specific recovery completed the missing case with controls. F3/error artifact mutants have browserexit0 plus independent contractexit1; viewport mutation has an actual dimension-contract failure. Preserve these distinctions. Evidence:mutations/completed.json,results.json and per-case logs/diffs.

Report corrections and limits: interrupted e68eee0/07d219b runs are NOT VERIFIED, not currentPASS. Initial reference framing was corrected without product changes. The prepared live demo harness initially assumed20seconds despite the existing30second claim interval; documented35second observation preserves the180second total and all actual progression assertions. The user-approved merged-core live baseline now passes bothsizes in about31seconds, but it is NOT a fullnine-stage or postmerge deployment certification. Fullnine becomes mandatory when CXU3 and CXC2 both merge. Deployment mapping and postmerge main/live checks remain pending an authorized merge.

Potential minor code-quality observation for independent review: the compact prop added to the shared HUD interface/call remains unused after CSS owns viewport handling. It has no behavioral role; no claim is made that this prop implements compact styling. Graders should evaluate this directly.

Delivered visual figures: eight reference-r2PNGs and the five existing product-branch BASE0PNGs; each under200KiB. Effects/mutation diagnostic imagery/videos and older failed-capture artifacts remain raw local evidence, separate from the delivered figure set. No source asset was copied from TBH Index.

Next: publish evidence, obtain two independent fresh graders with every floor/auto-fail rule, then evaluate G1-G7 and serial merge. Any candidate-head change invalidates these exact-head results and requires the prescribed fresh checks/grades.

Branch ai/codex-mega-deno0; merge commit NONE; PR https://github.com/ntbaoheyhey/taskbar-hero/pull/246; report reports/cards/BASE0-COORDINATOR/REPORT.md; status IN-PROGRESS.
