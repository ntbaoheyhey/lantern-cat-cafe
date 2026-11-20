#!/usr/bin/env python3
"""Local DSP auditions: choose distinctive physical voice profiles.
Fixed source per cat; bounded pitch, broad resonance and spectral rolloff.
This produces candidates only. Final acceptance uses full encoded production.
"""
import importlib.util,json,sys
from pathlib import Path
import numpy as np
from voice_features import features
spec=importlib.util.spec_from_file_location('cat_builder',Path(__file__).with_name('build-cat-voices.py'))
b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)
rng=np.random.default_rng(131104);candidates=[]
for cat,p in b.profiles.items():
 pool=[]
 for n in range(56):
  q={**p,'baseSemitones':round(float(np.clip(p['baseSemitones']+rng.uniform(-5,5),-12,12)),2),
     'brightness':round(float(np.exp(rng.uniform(np.log(500),np.log(7000))))),
     'rolloff':round(float(rng.uniform(1,3.5)),2),'colorHz':round(float(np.exp(rng.uniform(np.log(220),np.log(3200))))),
     'colorDb':round(float(rng.uniform(-5,15)),2),'vowelMix':round(float(rng.uniform(.2,.65)),2)}
  probes=[features(b.render(cat,q,q['lines'][e][0],e,0)[0]) for e in ['select','attack','ult']]
  voiced=np.mean([f['voicedFrames']/f['audibleFrames'] for f in probes])
  # Keep a usable voiced cat excitation; reject hiss-only or excessively filtered candidates.
  if voiced<.2 or any(f['medianF0']==0 for f in probes):continue
  pool.append({'profile':q,'mfcc':np.mean([f['mfcc'] for f in probes],axis=0).tolist(),
               'medianF0':float(np.median([f['medianF0'] for f in probes])),'voicedFraction':float(voiced)})
 if not pool:raise ValueError('No voiced candidates: '+cat)
 candidates.append(pool);print(cat,len(pool),'candidates',flush=True)

# Several deterministic restarts of coordinate descent over all twelve voices.
def score(rows):
 x=np.asarray([r['mfcc'] for r in rows]);d=np.linalg.norm(x[:,None,:]-x[None,:,:],axis=2)+np.eye(len(x))*1e6
 nearest=d.min(axis=1);return float(nearest.min()+.08*nearest.mean())
best=None;best_score=-1
for trial in range(32):
 chosen=[pool[int(rng.integers(len(pool)))] for pool in candidates]
 for sweep in range(10):
  changed=False
  for i in rng.permutation(len(chosen)):
   old=chosen[i];winning=score(chosen);winner=old
   for c in candidates[i]:
    chosen[i]=c;s=score(chosen)
    if s>winning+1e-6:winning=s;winner=c
   chosen[i]=winner;changed=changed or winner is not old
  if not changed:break
 current=score(chosen)
 if current>best_score:best_score=current;best=list(chosen)
out=b.ROOT/'work/v3b2/s4-profiles-selected.json';out.write_text(json.dumps({cat:c['profile'] for cat,c in zip(b.profiles,best)},indent=2)+'\n')
report={'method':'56 bounded DSP candidates per fixed source, reject weak/no voiced excitation; 32 coordinate-descent restarts. Original MFCC pipeline and source threshold unchanged. Normalized/encoded verification remains required.',
        'candidateCount':sum(map(len,candidates)),'profiles':best,'score':best_score}
(b.REPORT/'tests/s4-profile-selection.json').write_text(json.dumps(report,indent=2)+'\n')
for cat,c in zip(b.profiles,best):
 nearest=min(float(np.linalg.norm(np.asarray(c['mfcc'])-other['mfcc'])) for other in best if c is not other)
 print(cat,round(nearest,2),c['profile']['brightness'],c['profile']['rolloff'],c['profile']['colorHz'],flush=True)
