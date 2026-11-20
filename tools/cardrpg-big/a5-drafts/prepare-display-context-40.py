from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,subprocess
root=Path.cwd();out=root/'reports/cardrpg-big/a5/b1/display-context-40';assert not out.exists();out.mkdir(parents=True)
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
parent=json.loads((root/'reports/cardrpg-big/a5/engagement/home-02/REGISTERED-METHOD.json').read_text())
control='reports/cardrpg-big/a5/b2/hush-eligibility-22/balance/equipped/results.json'
scripts=['tools/cardrpg-big/a5-contextual-display.mjs','tools/cardrpg-big/a5-contextual-display-run.mjs','tools/cardrpg-big/a4-load.mjs','tools/cardrpg-big/a5-drafts/b1-prep/a5-candidate-fixtures.mjs']
reg={'registeredAt':datetime.now(timezone.utc).isoformat(),'sourceHead':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'runtimeSource':parent['runtimeSource'],'sourceRoot':parent['sourceRoot'],'source':parent['source'],'control':control,'controlSha256':sha(root/control),'scripts':{p:sha(root/p) for p in scripts},'cases':384,'itemRollSeeds':[1,50],'forecastSeeds':[1,20],'comparisonSeeds':[1,50],'acceptanceSeedsUsed':False,'method':'No runtime changes. For all384 original fourth-slot cases, construct each of50 original gear rolls and use the existing forecastV4 fixed20TRAINseeds before/after. Mean signed forecast gain per case is compared to original current22 paired50seed win gain, separately by chapter. The overlap is TRAIN tuning evidence, not independent validation. Item score/gear stats/fixture normalization unchanged. Reuse cached identical full forecast keys; retain negative gains and every case.','screen':'Prospective screening rho >=0.6 per chapter, with mean absolute error and signed reversals reported. Passing only supports a contextual Equipment forecast prototype, never a claim that the existing static display score passes. FullTRAIN500 and fresh registered acceptance, plus UI latency/cancellation/CSP tests, remain necessary before any calibrated score claim.'}
(out/'REGISTERED-METHOD.json').write_text(json.dumps(reg,indent=2)+'\n')
(out/'REGISTERED-METHOD.md').write_text('''# Contextual equipment forecast40 — prospective read-only diagnostic

The shared static display36 failed every registered linear model. No change to rawPowerV4 is warranted because it also sizes actual gear. Test an explicitly contextual alternative: the existing20seed forecast on the same crew before and after the equipment change, against the named chapter boss. This computes game outcomes; it does not relabel raw stats as a win probability.

All384 original fourth-slot cases and all50 original gear rolls remain included. The existing forecast uses TRAIN1–20; compare the mean signed forecast difference to original current22 TRAIN1–50 paired gain in each chapter. These training samples overlap and are not independent validation. Preserve every negative prediction/outcome, saturation and all ties. Reuse full forecast keys only; no altered RNG, fixture, weights, source or acceptance seeds. Full source/script/control hashes precede execution.

Screen Spearman>=0.6 separately in all3chapters; also report mean absolute error and signs that disagree. Passing only supports building a contextual Equipment forecast, not closing the existing static display gate. Any calibrated score still needs fullTRAIN500 and fresh registered acceptance; any UI needs worker latency, cancellation, transfer, cache and CSP checks. No production adoption is automatic.

One coordinator uses110second shared-lock slices,7second handoffs and exact checkpoint resume. Original Home-led60minute browser remains separate and immutable. No model helpers, runtime dependencies or B/protected changes.
''')
print(out)
