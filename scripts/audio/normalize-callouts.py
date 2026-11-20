#!/usr/bin/env python3
import json
from callout_dsp import ROOT,decode,normalize_callout,save
from publish_callouts import publish
p=json.loads((ROOT/'reports/v3-shell/b2/VOICE-CALLOUTS-PRODUCTION.json').read_text())
for unit in p['units']:
    for row in unit['lines']:
        if row.get('speechDynamics')==1:continue
        path=ROOT/row['path'];save(path,normalize_callout(decode(path)));row['speechDynamics']=1
    print('Dynamics',unit['unitId'],flush=True)
publish(p)
