"""Preserve control failures; test surviving-status focus without refitting the prototype."""
from pathlib import Path
import datetime,hashlib,json,sys
import cv2
import numpy as np
cv2.setNumThreads(2)
base=Path(sys.argv[1]).resolve();root=Path(__file__).resolve().parents[2]
assert base.is_relative_to(root/'work/v5/CXV')
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
raw=json.loads((base/'report.json').read_text());pre=json.loads(Path(raw['preregistration']['path']).read_text())
assert sha(raw['preregistration']['path'])==raw['preregistration']['sha256']
for item in json.loads((base/'harness-provenance.json').read_text()):assert sha(base/item['name'])==item['sha256']
assert sha(base/'probe-footer-lifecycle-r2.mjs')==raw['harnessSha256']==pre['harnessSha256']
artifact=json.loads((base/'artifact-verification.json').read_text())
assert all(raw[k]==pre[k]==artifact[k] for k in ['url','sourceCommit','indexSha256'])
def clean_badges(bs):return [{k:v for k,v in b.items() if k!='focus'} for b in bs]
def values(n):return dict(meters=n['meters'],badges=clean_badges(n['badges']))
def stats(a,b):
 d=np.any(a!=b,axis=2);y,x=np.where(d)
 return dict(pixels=int(len(x)),bbox=[int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)] if len(x) else None)
def same(a,b):return json.dumps(a,sort_keys=True,separators=(',',':'))==json.dumps(b,sort_keys=True,separators=(',',':'))
results=[];images={};hashes=[]
for run in raw['runs']:
 phases=[]
 for phase in run['captures']:
  frames={};states=[]
  for shot in phase['captures']:
   assert sha(shot['path'])==shot['sha256'];hashes.append(dict(path=shot['path'],sha256=shot['sha256']));frames[shot['variant']]=cv2.imread(shot['path'],cv2.IMREAD_UNCHANGED)
   for when in ['before','after']:states.append(same(shot[when],phase['captures'][0]['before']))
  pairs=[dict(a=a,b=b,**stats(frames[a],frames[b])) for a,b in [('screen0','screen1'),('canvas0','canvas1')]]
  phases.append(dict(phase=phase['phase'],stateComparisons=states,repeatComparisons=pairs,statePass=all(states),repeatPass=all(x['pixels']==0 for x in pairs)));images[(run['statusCase'],run['arm'],phase['phase'])]=frames
 rows=[]
 for row in run['rows']:
  before,after=row['before'],row['after'];nodes=after['information']['nodes'];world=next(n for n in nodes if n['actor']=='mochi' and n['class']=='b3-world');panels=[n for n in nodes if n['class']=='b3-cxv-identity'];prototype=run['arm']=='prototype'
  transfer=not prototype or len(panels)==1 and values(world)==values(panels[0])
  target=panels[0] if prototype and panels else world;survives=bool(run.get('focusTitle')) and any(b['title']==run['focusTitle'] for b in target['badges']);focused=any(b['title']==run.get('focusTitle') and b['focus'] for b in target['badges'])
  original_before=[n for n in before['information']['nodes'] if n['class']=='b3-world'];original_after=[n for n in nodes if n['class']=='b3-world']
  rows.append(dict(ms=row['ms'],sceneUnchanged=same(before['scene'],after['scene']),worldUnchanged=same(original_before,original_after),footerControlsUnchanged=same(before['information']['controls'],after['information']['controls']),valuesExact=transfer,panelsExpected=len(panels)==(1 if prototype else 0),focusTitle=run.get('focusTitle'),focusTargetSurvives=survives,focusRetained=focused if survives else None,focus=after['information']['focus']))
 initial=run['initial']['information']['nodes'];initial_world=next(n for n in initial if n['class']=='b3-world' and n['actor']=='mochi');initial_panels=[n for n in initial if n['class']=='b3-cxv-identity']
 empty=None
 if run['statusCase']=='empty':empty=not initial_world['badges'] and (run['arm']=='original' or len(initial_panels)==1 and initial_panels[0]['noEffects']=='No effects' and not initial_panels[0]['badges'])
 results.append(dict(key=run['key'],statusCase=run['statusCase'],arm=run['arm'],rulesExact=run.get('action',{}).get('rulesExact',False),emptyInitialCorrect=empty,phases=phases,rows=rows,allRepeatStatePass=all(p['statePass'] and p['repeatPass'] for p in phases),allTransferPass=all(x['sceneUnchanged'] and x['worldUnchanged'] and x['footerControlsUnchanged'] and x['valuesExact'] and x['panelsExpected'] for x in rows),survivingFocusPass=all(x['focusRetained'] for x in rows if x['focusTargetSurvives'])))
cross=[]
for status in ['empty','capacity']:
 for phase in ['initial','final']:
  a=images.get((status,'original',phase));b=images.get((status,'prototype',phase))
  if a and b:cross.append(dict(statusCase=status,phase=phase,rawCanvas=stats(a['canvas0'],b['canvas0']),screen=stats(a['screen0'],b['screen0'])))
result=dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),sourceCommit=raw['sourceCommit'],indexSha256=raw['indexSha256'],url=raw['url'],raw=dict(path=str(base/'report.json'),sha256=sha(base/'report.json')),preregistration=raw['preregistration'],hashes=hashes,capturePass=raw['pass'],failure=raw.get('failure'),runs=results,crossArm=cross,imagesViewed=0,productionAcceptance=False,limits=['Only4development pages;sync manually invoked after React update.','All failed controls retained;no native lifecycle or natural reachability acceptance.','No R1 images reopened;no fullpaint or dualmedia acceptance.'])
path=base/'footer-lifecycle-measurement.json';assert not path.exists();path.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(dict(path=str(path),hashes=len(hashes),runs=[{k:r[k] for k in ['key','emptyInitialCorrect','allRepeatStatePass','allTransferPass','survivingFocusPass']} for r in results],crossArm=cross)))
