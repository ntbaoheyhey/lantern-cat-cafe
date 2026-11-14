#!/usr/bin/env python3
"""Bounded vocal EQ search, then unprompted ASR selection. No metric changes."""
import json,hashlib
import numpy as np
from callout_dsp import ROOT,WORK,PROFILES,process,save,features,decode,recognizer,recognize,colour_response,cat_speak
rows=json.loads((ROOT/'reports/v3-shell/b2/VOICE-ROSTER.json').read_text())['rows']
threshold=json.loads((ROOT/'reports/v3-shell/b2/VOICE-DISTINCT.json').read_text())['sourceP25']
rng=np.random.default_rng(131126);candidates={};base={};settings={'pitchWeight':.35,'filterWeight':0,'grainGain':.18,'tailSeconds':.2}
# Speech remains within an intelligible telephone-to-full-band range. Broad
# chest/nasal resonances express character, not an inaudible identity marker.
for cat in PROFILES:
    probes=[r for r in rows if r['unitId']==cat and (r.get('slot') in [1,2] or r.get('phase')=='release')]
    base[cat]=[]
    for row in probes:
        p=WORK/'selection-clear-base'/f"{cat}-{row.get('slot',row.get('phase'))}-{hashlib.sha256(row['text'].encode()).hexdigest()[:8]}.flac"
        if not p.exists():save(p,process(row,settings=settings)[0])
        base[cat].append((row,decode(p)))
    candidates[cat]=[]
    for n in range(110):
        eq={'highpass':float(rng.choice([45,80,150,250,400,600,850])),
            'lowpass':float(rng.choice([1700,2300,3000,4200,6000,9000,11500])),
            'highSlope':float(rng.choice([1,1.5,2,3])), 'lowSlope':float(rng.choice([1,1.5,2,3])),
            'resonanceHz':float(rng.uniform(220,3200)), 'resonanceDb':float(rng.uniform(-14,16))}
        fs=[features(cat_speak.spectral(x,lambda f:colour_response(f,eq))) for _,x in base[cat]]
        f=np.mean([r['mfcc'] for r in fs],axis=0)
        candidates[cat].append({'id':n,'eq':eq,'mfcc':f.tolist()})
    print(cat,'110 physical EQ candidates',flush=True)
(ROOT/'reports/v3-shell/b2/tests/v-eq-candidates.json').write_text(json.dumps({'settings':settings,'threshold':threshold,'candidates':candidates},indent=2)+'\n')
# Best of independent deterministic farthest-point starts. Local ASR results
# are cached by candidate; a rejected voice remains visible in the log.
model=recognizer();asr={};best=None;log=[]
for trial in range(80):
    order=list(PROFILES);rng.shuffle(order);selected={}
    for cat in order:
        def dist(c):return min((float(np.linalg.norm(np.asarray(c['mfcc'])-s['mfcc'])) for s in selected.values()),default=100)
        pool=sorted(candidates[cat],key=lambda c:dist(c),reverse=True) if selected else list(candidates[cat])
        if not selected:rng.shuffle(pool)
        for c in pool:
            if dist(c)<threshold+.5:break
            key=f"{cat}/{c['id']}"
            if key not in asr:
                row,x=base[cat][-1];x=cat_speak.normalize(cat_speak.spectral(x,lambda f:colour_response(f,c['eq'])))
                p=WORK/'selection-asr'/f"{cat}-{c['id']}.flac";save(p,x)
                asr[key]=recognize(model,p,row['text']);log.append({'cat':cat,'candidate':c['id'],**asr[key]})
                print('ASR',cat,c['id'],asr[key]['wordAccuracy'],asr[key]['recognized'],flush=True)
                (ROOT/'reports/v3-shell/b2/tests/v-eq-asr.json').write_text(json.dumps(log,indent=2)+'\n')
            if asr[key]['wordAccuracy']>=.7:selected[cat]=c;break
        if cat not in selected:break
    if best is None or len(selected)>len(best):
        best=selected;print('Selected',len(best),'/12 on trial',trial,flush=True)
        (ROOT/'reports/v3-shell/b2/tests/v-eq-selection.json').write_text(json.dumps({'settings':settings,'threshold':threshold,'selected':best,'asr':log},indent=2)+'\n')
    if len(selected)==12:break
print('Final selected:',len(best),flush=True)
