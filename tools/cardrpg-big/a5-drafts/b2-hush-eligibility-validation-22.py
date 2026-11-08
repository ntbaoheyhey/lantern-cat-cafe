"""Prospectively register the resolver-site fix on the unchanged current16 composition matrix."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import subprocess

repo=Path.cwd()
parent=repo/'reports/cardrpg-big/a5/b2/suppression-current-16'
out=repo/'reports/cardrpg-big/a5/b2/hush-eligibility-22'
assert not out.exists()
sha=lambda data: hashlib.sha256(data).hexdigest()
probe_path=repo/'reports/cardrpg-big/a5/b2/hush-eligibility-21'
probe=json.loads((probe_path/'REGISTERED-METHOD.json').read_text())
audit=json.loads((probe_path/'audit.json').read_text())
assert audit['status']=='PASS' and audit['candidatePass']==144 and audit['exactOff']==72
reg=json.loads((parent/'REGISTERED-METHOD.json').read_text())
changed=[p for p in reg['source'] if reg['source'][p]!=probe['source'][p]]
assert set(changed)=={'packages/game-rules/src/cardrpg/depth/battle.ts','packages/game-rules/src/cardrpg/depth/events-v4.ts'}
for path,digest in probe['source'].items():
    assert sha((Path(probe['sourceRoot'])/path).read_bytes())==digest,path
out.mkdir(parents=True)
old_path=str(parent.relative_to(repo)); new_path=str(out.relative_to(repo))
for name in ['matrix.mjs','cohort.mjs','run.mjs']:
    data=(parent/name).read_text().replace(old_path,new_path)
    if name=='run.mjs': data=data.replace('A5 current Hush regression ','A5 Hush eligibility22 regression ')
    (out/name).write_text(data)
now=datetime.now(timezone.utc).isoformat()
reg.update(registeredAt=now,parent=old_path+'/REGISTERED-METHOD.json',
    sourceHead=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),
    sourceRoot=probe['sourceRoot'],source=probe['source'],
    combatSource={p:probe['source'][p] for p in reg['combatSource']},
    scripts={str((out/name).relative_to(repo)):sha((out/name).read_bytes()) for name in ['matrix.mjs','cohort.mjs']},
    method='Exact current16 plus resolver-site Hush attribution and truthful action copy. Same1321 TRAIN1–50 cells and90old earned day7 saves. No AI, kit, fixture, numeric amount/gate or acceptance change.',
    evidence={str(p.relative_to(repo)):sha(p.read_bytes()) for p in probe_path.glob('*.json')},
    timing='Actual summon suppression and its Lantern heal resolve after attack/survival/phase/cap checks. Credit cannot be consumed by ordinary basic attacks or ineligible summons.',
    decision='Review every paired difference and all prior misses before source adoption. This is not a general balance or fresh earned-progression claim.')
(out/'REGISTERED-METHOD.json').write_text(json.dumps(reg,indent=2))
dayreg=json.loads((parent/'day7-checks/REGISTERED-METHOD.json').read_text())
dayreg.update(registeredAt=now,source=reg['combatSource'],candidate='Current16 plus actual Hush eligibility attribution',
    hypothesis='Compare exactly the original90earned saves and recommendation policy. Preserve all outcome/summary/cost differences; not a new45day cohort.',
    runnerSha256=sha((out/'cohort.mjs').read_bytes()))
(out/'day7-checks').mkdir();(out/'day7-checks/REGISTERED-METHOD.json').write_text(json.dumps(dayreg,indent=2))
(out/'REGISTERED-METHOD.md').write_text('''# Hush eligibility22 — prospective composition check

Eligibility21 passes all144controlled cases; current16 passes125, and the signature-only candidate passes137. All72OFF event streams and all controlled attack payloads are exact. Signature20's wider matrix is registered but unstarted and remains unchanged.

Before sampling, apply exactly eligibility21 to the original current16 1,321 TRAIN1–50 cells and90previously earned day7 saves. No changed weights, scenes, kits, AI, statistics, cooldowns, quantities or numeric gates. The only gameplay difference is accurate suppression credit and the timing of its existing eight-HP Lantern heal. Retain every improvement/worsening, and compare with both the current16 matrix and original anchored progression.

No source adoption is implied. This saved-input regression does not replace a fresh earned45-day cohort. Acceptance20001–20500 remains unused. Shared110second leases/sevensecond handoffs, native/headless/single-agent only. Original current16 and eligible17 jobs keep their checkpoints; do not duplicate them.
''')
print(out)
