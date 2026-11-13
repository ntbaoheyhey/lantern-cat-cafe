#!/usr/bin/env python3
"""Fast three-line identity probe, using the same renderer and measurement.
No audio files or production evidence are replaced. Final gates use decoded FLAC.
"""
import importlib.util,json,sys
from pathlib import Path
import numpy as np
from voice_features import features

spec=importlib.util.spec_from_file_location('cat_builder',Path(__file__).with_name('build-cat-voices.py'))
b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)
profiles=json.loads(Path(sys.argv[1]).read_text()) if len(sys.argv)>1 else b.profiles
rows=[]
for cat,p in profiles.items():
 probes=[b.render(cat,p,p['lines'][event][0],event,0)[0] for event in ['select','attack','ult']]
 fs=[features(b.normalize(x)) for x in probes]
 rows.append({'id':cat,'profile':p,'mfcc':np.mean([f['mfcc'] for f in fs],axis=0).tolist(),'medianF0':float(np.median([f['medianF0'] for f in fs]))})
threshold=json.loads((b.REPORT/'VOICE-SOURCES.json').read_text())['p25']
for i,a in enumerate(rows):
 ds=[float(np.linalg.norm(np.asarray(a['mfcc'])-c['mfcc'])) if i!=j else 1e9 for j,c in enumerate(rows)]
 j=int(np.argmin(ds));a.update(nearest=rows[j]['id'],distance=ds[j],passed=ds[j]>=threshold)
 print(a['id'],a['nearest'],round(a['distance'],2),'PASS' if a['passed'] else 'FAIL',flush=True)
out=Path(sys.argv[2]) if len(sys.argv)>2 else b.ROOT/'work/v3b2/s4-probe.json'
out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps({'sourceP25':threshold,'method':'Identical renderer and normalized PCM, before final codec; production gate still requires decoded outputs.','cats':rows},indent=2)+'\n')
print('Source p25:',threshold)
