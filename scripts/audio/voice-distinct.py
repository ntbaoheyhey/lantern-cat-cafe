#!/usr/bin/env python3
import json,hashlib
from pathlib import Path
import numpy as np
from voice_features import decode,features
ROOT=Path(__file__).resolve().parents[2];REPORT=ROOT/'reports/v3-shell/b2'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
catalog=json.loads((ROOT/'assets/audio-sources/CATALOG.json').read_text())['clips']
source_rows=[]
for row in catalog:
 if row.get('kind')!='cat-recording':continue
 p=ROOT/row['path'];source_rows.append({'path':row['path'],'sha256':sha(p),'recordingId':row['recordingId'],**features(decode(p))})
distances=[float(np.linalg.norm(np.asarray(a['mfcc'])-b['mfcc'])) for i,a in enumerate(source_rows) for b in source_rows[i+1:]]
source_p25=float(np.percentile(distances,25))
production=json.loads((REPORT/'VOICE-PRODUCTION.json').read_text())
cats=[]
for cat in production['cats']:
 lines=[]
 for row in cat['lines']:
  p=ROOT/row['path'];lines.append({**row,'sha256':sha(p),**features(decode(p))})
 probe=[next(r for r in lines if r['event']==event) for event in ['select','attack','ult']]
 cats.append({**cat,'lines':lines,'measurementLines':[p['path'] for p in probe], 'mfcc':np.mean([r['mfcc'] for r in probe],axis=0).tolist(),'medianF0':float(np.median([r['medianF0'] for r in probe]))})
matrix=[]
for i,a in enumerate(cats):
 ds=[float(np.linalg.norm(np.asarray(a['mfcc'])-b['mfcc'])) for b in cats];matrix.append(ds)
 nearest=min((j for j in range(len(cats)) if j!=i),key=lambda j:ds[j]);b=cats[nearest]
 a.update(nearestCat=b['id'],nearestMfccDistance=ds[nearest],nearestSourceRecording=b['sourceRecording'],nearestF0Semitones=abs(12*np.log2(max(a['medianF0'],1)/max(b['medianF0'],1))))
result={'method':'24 kHz; 32 mel bands 80–11000 Hz; MFCC coefficients 1–13, unnormalized dB; identical RMS silence rejection for source and processed lines; median F0 90–1400 Hz with first strong autocorrelation peak; rendered select/attack/ultimate means per cat.','sourceBetweenRecordingDistances':distances,'sourceP25':source_p25,'sources':source_rows,'cats':cats,'distanceMatrix':matrix,'catOrder':[r['id'] for r in cats]}
(REPORT/'VOICE-DISTINCT.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'sourceP25':source_p25,'cats':[{'id':r['id'],'nearest':r['nearestCat'],'distance':r['nearestMfccDistance'],'F0':r['medianF0'],'pass':r['nearestMfccDistance']>=source_p25} for r in cats]},indent=2))
