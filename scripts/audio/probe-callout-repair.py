#!/usr/bin/env python3
"""Inspect natural alternative takes before replacing any production output."""
import json
from callout_dsp import ROOT,WORK,process,save,recognizer,recognize
p=json.loads((ROOT/'reports/v3-shell/b2/VOICE-CALLOUTS-PRODUCTION.json').read_text())
model=recognizer();results=[]
for unit in p['units']:
    if unit['unitId'] not in ['clover','biscuit','mallow','sorrel']:continue
    for row in unit['lines']:
        target=.7 if row['kind']=='ultimate' else .5
        if row['wordAccuracy']>=target:continue
        attempts=[]
        for n in range(4):
            profile={**unit['profile'],'ttsTake':n+2,'paceMultiplier':1.08 if n<2 else 1.18,'pitchWeight':.35 if n<2 else .2}
            x,_,_=process(row,row['take']-1,profile);path=WORK/'repair-probes'/f"{unit['unitId']}-{row.get('slot',row.get('phase'))}-{row['take']}-{n}.flac";save(path,x)
            asr=recognize(model,path,row['text']);attempts.append({'settings':profile,**asr})
            print(row['cueId'],row['take'],n,asr['wordAccuracy'],asr['recognized'],flush=True)
            if asr['wordAccuracy']>=target:break
        results.append({'cueId':row['cueId'],'take':row['take'],'attempts':attempts})
(ROOT/'reports/v3-shell/b2/tests/v-repair-probes.json').write_text(json.dumps(results,indent=2)+'\n')
