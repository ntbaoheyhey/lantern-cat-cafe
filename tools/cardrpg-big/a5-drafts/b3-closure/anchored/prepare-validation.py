from pathlib import Path
import json,hashlib,datetime
repo=Path('/Users/bao/taskbar-hero-cardrpg-a4');root=Path('/tmp/cardrpg-a5-band-anchored-03');out=repo/'reports/cardrpg-big/a5/b3/anchored-validation-03';out.mkdir(parents=True,exist_ok=True)
for f in ['economy.mjs','economy-summary.mjs','matrix.mjs']:(root/f).write_bytes((Path('/tmp/cardrpg-a5-band-ramp-02/linear')/f).read_bytes())
reg=json.loads((repo/'reports/cardrpg-big/a5/b3/linear-validation-01/REGISTERED-METHOD.json').read_text());reg['registeredAt']=datetime.datetime.now(datetime.timezone.utc).isoformat();reg['method']=reg['method'].replace('linear difficulty ramp','anchored60 difficulty ramp (bands1–5/10–50 exact)')
for field in ['source','runtimeSource']:
 reg[field]={p:hashlib.sha256((root/'source'/p).read_bytes()).hexdigest() for p in reg[field]}
(out/'REGISTERED-METHOD.json').write_text(json.dumps(reg,indent=2))
dayreg=json.loads((repo/'reports/cardrpg-big/a5/b3/band-anchored-03/REGISTERED-METHOD.json').read_text());dayreg['registeredAt']=reg['registeredAt'];dayreg['inputs']='reports/cardrpg-big/a5/b3/anchored-validation-03/day7';dayreg['hypothesis']='Fresh earned-day7 validation after same90accounts/45days with anchored60 ramp. Same seeds, budgets, public commands, advice and gates. No injections or fresh acceptance.'
(out/'day7-checks').mkdir(exist_ok=True);(out/'day7-checks/REGISTERED-METHOD.json').write_text(json.dumps(dayreg,indent=2))
coordinator=Path('/tmp/cardrpg-a5-band-ramp-02/linear/run-validation.mjs').read_text().replace('/tmp/cardrpg-a5-band-ramp-02/linear','/tmp/cardrpg-a5-band-anchored-03').replace('linear-validation-01','anchored-validation-03').replace('A5 early-band validation','A5 anchored-band validation')
(root/'run-validation.mjs').write_text(coordinator)
print('Registered fresh anchored90accounts45days and original TRAIN1–50 matrix')
