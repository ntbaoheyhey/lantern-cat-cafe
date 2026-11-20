#!/usr/bin/env python3
"""Bounded local articulation repairs; accept only measured improvements."""
import json,hashlib
from callout_dsp import ROOT,WORK,process,save,decode,normalize_callout,recognizer,recognize,cat_speak
from publish_callouts import publish,signed
P=ROOT/'reports/v3-shell/b2/VOICE-CALLOUTS-PRODUCTION.json'
p=json.loads(P.read_text());model=recognizer();trials=[]
for u in p['units']:
 for row in u['lines']:
  target=.7 if row['kind']=='ultimate' else .5
  current=row['wordAccuracy'];path=ROOT/row['path']
  if current>=target and -17<=row['integratedLufs']<=-15:continue
  options=[{'grainGain':.06,'ttsTake':0,'paceMultiplier':1.08},
    {'grainGain':.06,'ttsTake':0,'paceMultiplier':1.2,'pitchWeight':.2},
    {'grainGain':.08,'ttsTake':0,'paceMultiplier':.92,'pitchWeight':.15},
    {'grainGain':.12,'ttsTake':2,'paceMultiplier':1.12,'pitchWeight':0}]
  best=None
  for n,changes in enumerate(options):
   settings={**u['profile'],**changes}
   x,used,details=process(row,row['take']-1,settings)
   trial=WORK/'articulation-repair'/f"{path.stem}-{n}.flac";save(trial,x)
   levels=cat_speak.loudness(trial);asr=recognize(model,trial,row['text'])
   entry={'cueId':row['cueId'],'take':row['take'],'attempt':n+1,'settings':settings,**levels,**asr};trials.append(entry)
   if -17<=levels['integratedLufs']<=-15 and levels['truePeakDbTP']<=-1 and (best is None or asr['wordAccuracy']>best[1]['wordAccuracy']):best=(x,asr,details,levels)
   print(row['cueId'],row['take'],n+1,asr['wordAccuracy'],asr['recognized'],flush=True)
   if best and best[1]['wordAccuracy']>=target:break
  if best and (best[1]['wordAccuracy']>current or row['integratedLufs'] < -17):
   x,asr,details,levels=best;save(path,x)
   log=ROOT/row['recogniserLog']['path'];log.write_text(json.dumps({'audio':signed(path),**asr},indent=2)+'\n')
   row.update(**signed(path),**levels,production=details,wordAccuracy=asr['wordAccuracy'],recognized=asr['recognized'],recogniserLog=signed(log))
  (ROOT/'reports/v3-shell/b2/tests/v-articulation-repairs.json').write_text(json.dumps(trials,indent=2)+'\n')
  P.write_text(json.dumps(p,indent=2)+'\n')
publish(p)
