import pathlib,json,re,datetime,subprocess,hashlib
out=pathlib.Path(__file__).resolve().parent
head='280ff4bed495fd28bd489eb5f2dcfd1910f21fc0';base='1fb25edf4c54ada0d161e3c1dd16a4c4550aafba'
core=[json.loads(l) for l in (out/'results.jsonl').read_text().splitlines()]
assert all(x['exit_code']==0 for x in core)
opt=json.loads((out/'optin-results.json').read_text());assert len(opt)==2 and all(x['exit']==0 and x['pngBudgetPass'] for x in opt)
ui=[json.loads(l) for l in (out/'ui-results.jsonl').read_text().splitlines()];assert len(ui)==3 and all(x['exit']==0 for x in ui)
mutants=json.loads((out/'unit-mutants.json').read_text())+json.loads((out/'browser-mutants.json').read_text())+[json.loads((out/'viewport-mutant.json').read_text())]
for m in mutants:
 assert m['control']['exit']==0 and m['control'].get('contract_exit',0)==0
 m['killed']=m['mutant'].get('contract_exit')==1 if 'contract_exit' in m['mutant'] else m['mutant']['exit']==1
 assert m['killed']
assert len(mutants)==22
(out/'mutation-summary.json').write_text(json.dumps({'tried':len(mutants),'killed':len(mutants),'unique_green_controls':len(set(m['control']['log'] for m in mutants)),'cases':mutants},indent=2)+'\n')
def cite(name,pattern='EXIT_CODE=0'):
 p=out/name
 lines=p.read_text().splitlines()
 n=next((i for i,l in reversed(list(enumerate(lines,1))) if pattern in l),1)
 return name+':'+str(n)
r128=cite('logs/repeat-1280x720.log','700 passed');r160=cite('logs/repeat-1600x900.log','700 passed')
o128=cite('logs/optin-existing-hud-1280x720.log','62 passed');o160=cite('logs/optin-existing-hud-1600x900.log','62 passed')
tests=[
('T1','Exact root/nested index and ordinary-module aliases; directory aliases retained','logs/unit.log:6; mutations/deno-root-index-control.log:1; mutations/deno-nested-index-control.log:1; mutation-summary.json'),
('T2','Test/fixture exclusions, deterministic generation, auth/game distinction','logs/unit.log:8; mutations/deno-test-exclusion-control.log:1; mutations/deno-stable-order-control.log:1; mutations/deno-auth-distinction-control.log:1'),
('T3','Actual Deno import guard and stable generation without drift',cite('logs/deno.log')+'; scripts/gen-deno-json.mjs:76'),
('T4','Preboot StageScene relayout defers and applies latest size','mutations/scene-preboot-control.log:1; mutations/scene-preboot.log; apps/web/src/game/stage/StageScene.ts:322'),
('T5','Lifecycle teardown waits for SceneManager readiness','mutations/lifecycle-old-game-guard-control.log:1; mutations/lifecycle-old-game-guard.log; apps/web/src/game/stage/StageCanvas.tsx:69'),
('T6','Original redraw both motion modes and exact-size resize cases',r128+'; '+r160+'; runner.mjs:9'),
('T7','Unchanged HUD/topbar/wallet limits at all existing narrow/desktop sizes',o128+'; '+o160+'; apps/web/e2e/ui/u2-hud.spec.ts:64; apps/web/e2e/ui/u3-layout.spec.ts:46'),
('T8','Desktop status containment,160×10XP track, nonzero proportional fill and semantic color',r128+'; '+r160+'; mutations/hud-control.log:1; apps/web/e2e/ui/baseline-hud.spec.ts:23'),
('T9','Readable actionable guidance with fallback fonts and normal/offline/mock429/mock503 states; keyboard callback',r128+'; '+r160+'; apps/web/e2e/ui/baseline-hud.spec.ts:158'),
('T10','Browser clock interleaving plus shared consumers, classic viewport-aware smoke',r128+'; '+r160+'; mutations/clock-control.log:1; mutations/viewport-smoke-control.log:1; viewport-mutant.json'),
('T11','Database-relative day boundaries and microsecond-safe unchanged claim guards','logs/unit.log:38; mutations/sql-next-day-control.log:1; mutations/sql-claim-rounding-control.log:1'),
('T12','PNG writers opt-in and honor requested destination; byte budgets preserved','browser-mutants.json; optin-results.json; '+o128+'; '+o160),
('T13','F3/G1/G3 metrics default to Playwright output and honor explicit report requests','mutations/f3-metrics-control.log:1; mutations/g1-metrics-control.log:1; mutations/g3-metrics-control.log:1; browser-mutants.json; optin-results.json'),
('T14','Actual reached-screen effects coverage and all-manifest guest/local-signed audits','effects-1280x720/summary.json; effects-1600x900/summary.json; audit-guest/findings.json; audit-signed-in/findings.json; mutations/effects-inert-help.log'),
('T15','Matching reference sizes/screens, keyboard, focus, reduced motion and contrast','reference-observations.json; keyboard.json; ui-diff.md; '+cite('logs/contrast.log')),
('T16','Full original suite, default/classic builds, links and bundle baseline','reuse.json (explicit exact-head full/build reuse); baseline-comparison.json; logs/unit.log:66; '+r128+'; '+r160),
('T17','At least5 meaningful independent mutations, including6 Deno behaviors, lifecycle and clock','mutation-summary.json: 22/22 kills with20 unique green controls; unit-mutants.json; browser-mutants.json; viewport-mutant.json'),
('T18','Decisions, scope/integrity, default-off safety and source preservation','source-review.md; scope.json; integrity-hits.json; final-secret-scan.json; reuse-extra.json (explicit G5 reuse); cleanup.json')
]
assert len(tests)==18
criteria=[
{'id':'C1','score':25,'weight':25,'basis':'25 ×18/18 technical acceptance lines. Every line has own observed evidence; T16 uses the specifically permitted exact-head raw full/build reuse. External workflow DONE lines remain separately pending, not certified.','evidence':[x[2] for x in tests]},
{'id':'C2','score':20,'weight':20,'basis':'All required checks green,1400 independent repeats with zero failures, classic/full build/browser evidence verified at the identical head; no omitted required check.','evidence':['results.jsonl',r128,r160,o128,o160,'reuse.json','reuse-extra.json','ui-results.jsonl']},
{'id':'C3','score':10,'weight':10,'basis':'10 ×22/22 meaningful mutants killed,20 unique green controls. Five artifact mutants have browserexit0/contractexit1; these are explicitly not browser-test failures.','evidence':['mutation-summary.json','unit-mutants.json','browser-mutants.json','viewport-mutant.json']},
{'id':'C4','score':13,'weight':15,'basis':'15−1 documented extra guidance/context row−1 explained retained NEXT/Next wording. Home/Bag structural redesign debt is unchanged, explicitly assigned to CXR1 by the user; no full-redesign fidelity claim.','evidence':['ui-diff.md','reference-observations.json','local-capture-inventory.json','keyboard.json','apps/web/src/shell/Hud.tsx:38','apps/web/src/shell/shell.css:225']},
{'id':'C5','score':10,'weight':10,'basis':'No new duplicated logic, dead API, unjustified suppression/config, missing export type, lint warning or unjustified>5%growth found. Classic gzip+0.14424%,v2+0.14055%.','evidence':['source-review.md','scope.json','baseline-comparison.json',cite('logs/lint.log'),'scripts/gen-deno-json.mjs:15','supabase/tests/src/fixture-clock.ts:4']},
{'id':'C6','score':5,'weight':5,'basis':'No unjustified test-integrity change; seven textual hits explained. Existing game-rules skips/expected failures unchanged and disclosed.','evidence':['integrity-hits.json','source-review.md','full.diff','logs/unit.log:43']},
{'id':'C7','score':10,'weight':10,'basis':'No current technical claim mismatch or false PASS found. Publication correction independently verified against git objects and remote ancestry; raw files and report revisions are distinguished. Historical failures and baseline exclusions are preserved.','evidence':['publication-validation.json','remote-final-observation.json','source-review.md','reuse.json','final-secret-scan.json']},
{'id':'C8','score':5,'weight':5,'basis':'All82 changed paths inventoried; every Tier2 prerequisite has a concrete report/decision justification; zero Tier3 changes.','evidence':['scope.json','source-review.md','full.diff','reports/base0.md']}
]
gates=[
{'id':'G1','status':'PASS_TECHNICAL','evidence':'results.jsonl; reuse.json; remote-final-observation.json; base remains ancestor; exact head unchanged'},
{'id':'G2','status':'PASS_BASE0_SCOPE','evidence':'audit-guest/findings.json; audit-signed-in/findings.json; effects-*/summary.json; keyboard.json; ui-diff.md (zero OPEN BASE0 rows)'},
{'id':'G3','status':'PASS','evidence':'logs/deno.log; reuse.json; baseline-comparison.json: links0 versus main1; budgets below5%growth'},
{'id':'G4','status':'NOT_APPLICABLE_CONTRACTS_MIGRATIONS','evidence':'full.diff; scope.json: neither changed; SQL suite548 passed in logs/unit.log:39'},
{'id':'G5','status':'PASS_REUSED_EXACT_HEAD','evidence':'reuse-extra.json; ../BASE0-VERIFY-R2/checks/public-config.log; four guest-only previews at both flags/sizes, no writes/sign-in/errors'},
{'id':'G6','status':'PASS','evidence':'source-review.md; full.diff; scope.json; integrity-hits.json; final-secret-scan.json; cleanup.json'},
{'id':'G7','status':'EXISTING_REPORT_PUBLICATION_VERIFIED_RECOVERY_GRADE_PENDING_PUBLICATION','evidence':'publication-validation.json; remote-final-observation.json; coordinator must publish this new grade and reconcile independent results before merge'}
]
external=[
{'line':'Two independent repaired-head grades≥92 and all floors; third grader if discrepancy requires','status':'NOT VERIFIED BY THIS INDEPENDENT GRADER','reason':'Other grader scores deliberately not consulted. Coordinator aggregation remains mandatory.'},
{'line':'Serial gated PR merge after current-main/eligibility checks','status':'NOT DONE','reason':'PR246 is OPEN/DRAFT on the exact candidate; no merge authorized/performed in this assignment.'},
{'line':'Post-merge clean-main verification/repeats and live deployment proof','status':'NOT DONE','reason':'Candidate is unmerged. Local score is not live deployment certification. Preview deployment quota was reported in the brief; not independently retried or treated as a technical pass.'},
{'line':'Recovery grade/report publication and current workflow-status reconciliation','status':'PENDING COORDINATOR','reason':'This worker may not commit/push. Prior report snapshot is published, but this newly authored independent grade must still be published.'}
]
grade={'item':'BASE0','grader':'B recovery /root/base0_grade_b_r2_recovery','status':'PASS_LOCAL_TECHNICAL','head':head,'base':base,'branch':'ai/codex-mega-deno0','pr':246,'raw_total':98,'final_total':98,'criteria':criteria,'auto_fails':[],'technical_acceptance_pass':18,'technical_acceptance_total':18,'acceptance':[{'id':i,'line':l,'status':'PASS','evidence':e} for i,l,e in tests],'gates':gates,'external_done_lines':external,'merge_ready':False,'deployment_certified':False,'reuse':['Identical-head coordinator full265/265 browser suite at each size','Identical-head default/classic/v2 builds, bundle scan and links; same-day unchanged-main raw baseline','Identical-head verify-pr246 wrapper and production-public-config guest previews, explicitly permitted by the card'],'not_reused':['No predecessor grader execution is represented as my run','No other grader score or grade file informed this score','Own typecheck/lint/root-unit/repeats/mutants/UI/audit/effects/accessibility/opt-in checks'],'independent_repeats':{'1280x720':700,'1600x900':700,'failures':0,'workers':1},'mutants':{'tried':22,'killed':22,'green_controls':20,'artifact_contract_kills':5},'extra_browser':{'1280x720':62,'1600x900':62},'provider429_observed':[],'new_delivered_pngs':0,'scored_at':datetime.datetime.now().astimezone().isoformat()}
(out/'grade.json').write_text(json.dumps(grade,indent=2)+'\n')
lines=['STATUS: PASS — independent local technical grade98/100; premerge, not mission DONE.','',f'Exact head: {head}. Base/main: {base}. Existing draft PR246, ai/codex-mega-deno0. Grader: /root/base0_grade_b_r2_recovery. The builder/coordinator and prior graders did not determine this score.','',
'## Score and evidence','',
'| Criterion | Points | Basis and cited evidence |','|---|---:|---|']
for c in criteria:lines.append(f"| {c['id']} | {c['score']}/{c['weight']} | {c['basis']} Evidence: {'; '.join(c['evidence'] if c['id']!='C1' else ['T1–T18 table below'])}. |")
lines+=['','Raw98; final98. Auto-fails: none. C1≥23,C2=20,C6=5,C7≥8 and every local criterion≥60%. This one independent grade does not establish the two-grader gate.','',
'## Technical T/DONE acceptance','',
'The denominator covers the18 concrete technical requirements of this premerge BASE0 assignment. Deno clean/stable outputs and the complete original suite are included in T3/T16. The explicitly external two-grade/merge/post-merge/publication obligations are all listed below as pending; this technical score does not mark them complete or waive them. The latest user rule explicitly permits identical-head raw full-suite/build reuse; every such use is labeled.','',
'| Line | Acceptance | Result | Observed evidence / command log |','|---|---|---|---|']
for i,l,e in tests:lines.append(f'| {i} | {l} | PASS | {e} |')
lines+=['','## Execution and reuse disclosures','',
'Own frozen pnpm10.28.0 install, typecheck, lint, complete root pnpm test and Deno generation/drift/import guard all exited0. Root units:5 Node tests and2294 Vitest passes; main’s3 skipped game-rules files,11 skipped cases and2 expected failures are retained unchanged, not concealed. logs/unit.log:6–17,28–58,66 record the counts. No packages/game-rules source/test differs from main.','',
f'Twelve affected browser specs (the7 added/changed spec files plus all shared-clock/resize/redraw consumers) ran repeat10 with one worker: {r128} and {r160},700/700 each. No retry, skip, timeout or assertion change. Positive SCREENSHOTS=1/REPORT_DIR checks plus original u2/u3 HUD limits passed62/62 at each size ({o128}; {o160}). Logs retain the real command, cwd, exact head and viewport.','',
'Own22/22 mutation kills with20 distinct green controls cover7 Deno mapping/generation properties, preboot scene layout, lifecycle readiness, SQL day/claim rounding, deterministic browser-clock interleaving,3 HUD failures,5 artifact side effects, inert Help navigation, and reverting viewport-aware smoke to fixed1280. The clock mutant produces the intended “Cannot fast-forward to the past” regression; it is not a missing server/browser/setup failure. Artifact mutants have browserexit0 plus independent contractexit1; calling these browser-test failures would be wrong. Each source mutation was restored. See mutation-summary.json and per-case diffs/logs.','',
'REUSED, not my execution: coordinator exact-head full browser265/265 at each size; default/classic/v2 build artifacts, bundle scan/links; verify-pr246 wrapper; public-config guest previews. reuse.json and reuse-extra.json identify commands, exits, heads, raw logs and hashes. Same-day main raw baseline is reports/baseline/2026-11-01-resume-main-1fb25ed; main links1, candidate0. Classic gzip663477→664434(+0.14424%); v2678033→678986(+0.14055%). No predecessor test execution or coordinator/other-grader score is substituted for my mandatory reruns.','',
'Own UI evidence:18 matched app/reference screen-size visits;14 keyboard destinations; guest18/local-signed18 audit visits with zero findings; effects10/10 at each size and all9 actual screens in both motion modes; contrast10/10. Home/Bag8 local PNGs personally inspected. All captures stay local; no new PNG is delivered. The visible context row and repeated NEXT/Next wording cost one C4 point each. Full Home/Bag redesign fidelity is expressly not claimed.','',
'## Integrity, scope and report honesty','',
'Complete82-file inventory and manual review: source-review.md,scope.json,full.diff. Seven added textual integrity hits are explained, with no unjustified suppression, assertion deletion, retry or skip. All12 candidate commits have the required author and skip-CI suffix (git-hygiene.json). No dependency version, auth/backend source, contract, migration, workflow, secret or flag default changed. final-secret-scan.json found zero credential-pattern hits; public configuration values were not logged.','',
'The publication reconciliation was checked independently:244 raw/evidence files match20881542; all245 manifest files match the separate37d4b03c correction snapshot,489 byte comparisons with zero mismatches. The correction snapshot is an ancestor of the observed remote ledger head (remote-final-observation.json). REPORT.md revisions are separate from immutable raw evidence; the original245-current-bytes-at20881542 wording is not repeated. Historical failures and corrections remain visible. Snapshot workflow status must be updated by the coordinator when this new grade is published.','',
'## G1–G7 and external DONE lines','',
'| Gate | Result | Evidence |','|---|---|---|']
for g in gates:lines.append(f"| {g['id']} | {g['status']} | {g['evidence']} |")
lines+=['','| External acceptance | Current state | Reason |','|---|---|---|']
for e in external:lines.append(f"| {e['line']} | {e['status']} | {e['reason']} |")
lines+=['','No current local technical blocker remains. The coordinator must publish this evidence, independently aggregate grades without influencing them, complete the serial merge gate, then obtain fresh post-merge main/live proofs. This grader did not merge, deploy, sign in to a real account or perform live writes.','',
'Cleanup: cleanup.json records both owned checkouts clean at the exact head and ports4450–4454 free. No foreign process was killed. Local-only artifacts were moved out of the scratch checkout and excluded from publication; local-evidence-relocation.json resolves their original capture paths. DONE means this bounded independent grading assignment ended, not that BASE0 is merged.']
(out/'grade.md').write_text('\n'.join(lines)+'\n')
print({'raw':98,'final':98,'criteria':[c['score'] for c in criteria],'mutants':len(mutants),'controls':len(set(m['control']['log'] for m in mutants)),'technical_lines':len(tests)})
