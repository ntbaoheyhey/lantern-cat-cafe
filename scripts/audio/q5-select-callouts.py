#!/usr/bin/env python3
"""Select measured takes, verify character separation, then optionally publish."""
import argparse, copy, datetime, gzip, json, math, shutil
import numpy as np
from callout_dsp import ROOT, decode, features
from publish_callouts import publish, signed

parser=argparse.ArgumentParser();parser.add_argument('--publish',action='store_true');args=parser.parse_args()
B=ROOT/'reports/v3-shell/b2';source=B/'VOICE-CALLOUTS-PRODUCTION.json'
original=json.loads(source.read_text());production=copy.deepcopy(original)
labels=['formant-probes','onset-probes','wording-probes','wording-clover-round2']
selected={};inputs=[]
for label in labels:
 path=B/'q5'/f'{label}.json';report=json.loads(path.read_text())
 assert report['sourceProduction']==signed(source), 'Probe belongs to another production version'
 inputs.append(signed(path))
 for row in report['rows']:
  trial=next((a for a in row['attempts'] if a['meetsRecognitionAndLevels']),None)
  if trial and (row['source']['path'] not in selected or 'originalText' in row):
   selected[row['source']['path']]={'row':row,'trial':trial,'report':signed(path)}

changes=[]
for unit in production['units']:
 for row in unit['lines']:
  choice=selected.get(row['path'])
  if not choice:continue
  proposal=choice['row'];trial=choice['trial'];candidate=ROOT/trial['path']
  assert proposal['source']==signed(ROOT/row['path'])
  assert signed(candidate)['sha256']==trial['sha256'], 'Lost or modified probe must not be selected'
  for material in trial['sources']:assert signed(ROOT/material['path'])==material
  assert -17<=trial['integratedLufs']<=-15 and trial['truePeakDbTP']<=-1
  before={key:row[key] for key in ['path','sha256','text','wordAccuracy']}
  row.update(text=proposal['text'],production=trial['production'],wordAccuracy=trial['wordAccuracy'],recognized=trial['recognized'],**features(decode(candidate)))
  changes.append({'destination':row['path'],'before':before,'candidate':signed(candidate),'report':choice['report'],'text':row['text'],'wordAccuracy':row['wordAccuracy']})

lines=[r for u in production['units'] for r in u['lines']]
for row in lines:assert row['wordAccuracy']>=(.7 if row['kind']=='ultimate' else .5), row['cueId']
for cue in {r['cueId'] for r in lines}:
 variants=[r for r in lines if r['cueId']==cue]
 assert len({r['text'] for r in variants})==1, 'All variants must say the same authored phrase'

roster=json.loads((B/'VOICE-ROSTER.json').read_text())['roster']
cats=[]
for unit in production['units']:
 if next(r['tier'] for r in roster if r['unitId']==unit['unitId'])!='playable':continue
 probes=[r for r in unit['lines'] if r['take']==1 and (r.get('slot') in [1,2] or r.get('phase')=='release')]
 cats.append({'id':unit['unitId'],'sourceRecording':probes[0]['production']['profile']['source'],'mfcc':np.mean([r['mfcc'] for r in probes],axis=0).tolist(),'medianF0':float(np.median([r['medianF0'] for r in probes]))})
threshold=float(np.percentile(json.loads((B/'VOICE-DISTINCT.json').read_text())['sourceBetweenRecordingDistances'],25))
for cat in cats:
 other=min((c for c in cats if c!=cat),key=lambda c:math.dist(cat['mfcc'],c['mfcc']))
 distance=math.dist(cat['mfcc'],other['mfcc']);pitch=abs(12*math.log2(max(1,cat['medianF0'])/max(1,other['medianF0'])))
 cat.update(nearestCat=other['id'],nearestMfccDistance=distance,nearestF0Semitones=pitch,passes=distance>=threshold and (cat['sourceRecording']!=other['sourceRecording'] or pitch>=3))
report={'date':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source':signed(source),'inputs':inputs,'changes':changes,'cats':cats,'distinctnessThreshold':threshold,'allDistinct':all(c['passes'] for c in cats),'skillLines':sum(r['kind']=='skill' for r in original['recognised']),'ultimateLines':sum(r['kind']=='ultimate' for r in original['recognised']),'published':False}
(B/'q5/selection.json').write_text(json.dumps(report,indent=2)+'\n')
assert report['allDistinct'], 'Do not publish a loss of measured character identity'
print('Selected',len(changes),'takes; all recognition checks and',len(cats),'identities pass.',flush=True)
if not args.publish:raise SystemExit(0)

archive=B/'q5/production-before-selection.json.gz'
assert not archive.exists(), 'Preserve the previous publication; do not overwrite its archive'
archive.write_bytes(gzip.compress(source.read_bytes()))
licence_path=ROOT/'apps/web/public/audio/LICENSES.json';licences=json.loads(licence_path.read_text());by_path={r['path']:r for r in licences['files']}
for unit in production['units']:
 for row in unit['lines']:
  choice=selected.get(row['path'])
  if not choice:continue
  trial=choice['trial'];path=ROOT/row['path'];shutil.copyfile(ROOT/trial['path'],path)
  asr={k:trial[k] for k in ['expected','recognized','wordAccuracy','model','prompt','beamSize','temperature','language']}
  log=ROOT/row['recogniserLog']['path'];log.write_text(json.dumps({'audio':signed(path),**asr},indent=2)+'\n')
  row.update(**signed(path),recogniserLog=signed(log))
  entry=by_path[row['path']]
  entry.update(sha256=row['sha256'],processingDate=report['date'],prompt=row['text'],processingEvidence='reports/v3-shell/b2/q5/selection.json',sourceFiles=trial['sources'])
  if trial['production']['settings'].get('preserveFormants'):entry['formantProcessor']={'tool':'pyworld 0.3.5','license':'MIT','evidence':'assets/audio-sources/license-evidence/pyworld-LICENSE.txt'}
licence_path.write_text(json.dumps(licences,indent=2)+'\n')
publish(production)
report.update(published=True,publishedSource=signed(source))
(B/'q5/selection.json').write_text(json.dumps(report,indent=2)+'\n')
print('Published measured callouts and signed recognition logs.',flush=True)
