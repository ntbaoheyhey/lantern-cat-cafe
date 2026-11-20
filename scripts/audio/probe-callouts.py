#!/usr/bin/env python3
"""Three authored callouts per cat, same MFCC metric as S4; local ASR."""
import json,sys
import numpy as np
from callout_dsp import ROOT,WORK,PROFILES,process,save,features,decode,recognizer,recognize
settings=json.loads(sys.argv[1]) if len(sys.argv)>1 else {}
name=sys.argv[2] if len(sys.argv)>2 else 'pilot'
rows=json.loads((ROOT/'reports/v3-shell/b2/VOICE-ROSTER.json').read_text())['rows']
results=[];model=recognizer()
for cat in PROFILES:
    probes=[r for r in rows if r['unitId']==cat and (r.get('slot') in [1,2] or r.get('phase')=='release')]
    measured=[]
    for row in probes:
        x,used,details=process(row,settings=settings);path=WORK/'probes'/name/f"{cat}-{row.get('slot',row.get('phase'))}.flac";save(path,x)
        r={**row,'path':str(path.relative_to(ROOT)),**features(decode(path))}
        if row.get('phase')=='release':r.update(recognize(model,path,row['text']))
        measured.append(r)
    results.append({'id':cat,'sourceRecording':f"freesound:{PROFILES[cat]['source']}",'lines':measured,'mfcc':np.mean([r['mfcc'] for r in measured],axis=0).tolist(),'medianF0':float(np.median([r['medianF0'] for r in measured]))})
    print(cat,'ultimate:',measured[-1].get('recognized'),measured[-1].get('wordAccuracy'),flush=True)
for i,a in enumerate(results):
    ds=[float(np.linalg.norm(np.asarray(a['mfcc'])-b['mfcc'])) if i!=j else float('inf') for j,b in enumerate(results)]
    j=int(np.argmin(ds));b=results[j]
    a.update(nearestCat=b['id'],nearestMfccDistance=ds[j],nearestSourceRecording=b['sourceRecording'],nearestF0Semitones=float(abs(12*np.log2(max(a['medianF0'],1)/max(b['medianF0'],1)))))
out={'settings':settings,'cats':results}
(ROOT/f'reports/v3-shell/b2/tests/v-probe-{name}.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps([{'id':r['id'],'nearest':r['nearestCat'],'distance':r['nearestMfccDistance'],'accuracy':r['lines'][-1].get('wordAccuracy')} for r in results],indent=2))
