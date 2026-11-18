"""Retain strict failures and attribute animation additions by actual object/DOM identity."""
from pathlib import Path
import datetime, hashlib, json, sys
import cv2
import numpy as np
cv2.setNumThreads(2)
root=Path(__file__).resolve().parents[2];base=Path(sys.argv[1]).resolve()
assert base.is_relative_to(root/'work/v5/CXV')
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
same=lambda a,b:json.dumps(a,sort_keys=True,separators=(',',':'))==json.dumps(b,sort_keys=True,separators=(',',':'))
raw=json.loads((base/'report.json').read_text());pre=json.loads(Path(raw['preregistration']['path']).read_text())
assert sha(raw['preregistration']['path'])==raw['preregistration']['sha256']
artifact=json.loads((base/'artifact-verification.json').read_text())
assert all(raw[k]==pre[k]==artifact[k] for k in ['sourceCommit','indexSha256','url'])
for p in json.loads((base/'harness-provenance.json').read_text()):assert sha(base/p['name'])==p['sha256']
assert sha(base/'probe-footer-animation-r1.mjs')==raw['harnessSha256']==pre['harnessSha256']
def diff(a,b,path='$'):
 if type(a)!=type(b):return[path+':type']
 if isinstance(a,dict):return ([path+':keys'] if set(a)!=set(b) else [])+[p for k in sorted(set(a)&set(b)) for p in diff(a[k],b[k],path+'.'+k)]
 if isinstance(a,list):return ([path+':length'] if len(a)!=len(b) else [])+[p for i,(x,y) in enumerate(zip(a,b)) for p in diff(x,y,path+'['+str(i)+']')]
 return [] if a==b else [path]
def image_delta(a,b):
 mask=np.any(a!=b,axis=2);y,x=np.where(mask)
 return dict(pixels=int(len(x)),bbox=[int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)] if len(x) else None)
def badges(node):return [{k:v for k,v in x.items() if k!='focus'} for x in node['badges']]
def meter_pairs(state):
 values=[]
 for cat in ['mochi','clover']:
  candidates=[x for x in state['animationTargets']['meters'] if x.get('owner',{}).get('actor')==cat and x.get('meter',{}).get('class')=='b3-rage']
  world=next((x for x in candidates if x['owner']['class']=='b3-world'),None);panel=next((x for x in candidates if x['owner']['class']=='b3-cxv-identity'),None)
  if world and panel:values.append(dict(cat=cat,world=world,panel=panel,widthDifferenceCSSpx=panel['rect']['width']-world['rect']['width'],ariaValueEqual=panel['meter']['value']==world['meter']['value']))
 return values
hashes=[];runs=[];images={}
for run in raw['runs']:
 phases=[]
 for phase in run['captures']:
  frames={};comparisons=[]
  for shot in phase['captures']:
   assert sha(shot['path'])==shot['sha256'];hashes.append(dict(path=shot['path'],sha256=shot['sha256']));frames[shot['variant']]=cv2.imread(shot['path'],cv2.IMREAD_UNCHANGED)
   for when in ['before','after']:comparisons.append(dict(variant=shot['variant'],when=when,equal=same(shot[when],phase['captures'][0]['before']),mismatches=diff(shot[when],phase['captures'][0]['before'])))
  repeats=[dict(a=a,b=b,**image_delta(frames[a],frames[b])) for a,b in [('screen0','screen1'),('canvas0','canvas1')]]
  phases.append(dict(phase=phase['phase'],states=comparisons,repeats=repeats,pass_=all(x['equal'] for x in comparisons) and all(x['pixels']==0 for x in repeats)))
  images[(run['mode'],run['arm'],phase['phase'])]=frames
 rows=[]
 for row in run['rows']:
  before,after=row['before'],row['after'];old={x['observerId']:x for x in before['animationTargets']['animations']};new={x['observerId']:x for x in after['animationTargets']['animations']}
  added=[new[k] for k in new.keys()-old.keys()];removed=[old[k] for k in old.keys()-new.keys()];changed=[dict(id=k,paths=diff(old[k],new[k]),before=old[k],after=new[k]) for k in old.keys()&new.keys() if not same(old[k],new[k])]
  nodes=after['information']['nodes'];panels=[x for x in nodes if x['class']=='b3-cxv-identity'];transfers=[]
  for panel in panels:
   world=next(x for x in nodes if x['class']=='b3-world' and x['actor']==panel['actor']);transfers.append(dict(actor=panel['actor'],valuesExact=same(world['meters'],panel['meters']) and same(badges(world),badges(panel)),emptyCorrect=panel['noEffects']==(None if world['badges'] else 'No effects')))
  predicted=bool(added) and all(x['kind']=='CSSTransition' and x['transitionProperty']=='width' and x['timing']['duration']==300 and x['target'].get('owner')=={'class':'b3-cxv-identity','actor':'mochi'} and x['target'].get('meter',{}).get('class')=='b3-rage' for x in added)
  originalBefore=[x for x in before['information']['nodes'] if x['class']=='b3-world'];originalAfter=[x for x in nodes if x['class']=='b3-world']
  rows.append(dict(ms=row['ms'],strictSceneEqual=same(before['scene'],after['scene']),strictSceneMismatchPaths=diff(before['scene'],after['scene']),worldEqual=same(originalBefore,originalAfter),controlsEqual=same(before['information']['controls'],after['information']['controls']),panelActorsExpected=[x['actor'] for x in panels]==(['mochi','clover'] if run['arm']=='prototype' else []),transfers=transfers,added=added,removed=removed,changed=changed,allExistingAnimationsExact=not removed and not changed,predictedMochiRageAddition=predicted if added else None,beforeMeterPairs=meter_pairs(before),afterMeterPairs=meter_pairs(after)))
 runs.append(dict(key=run['key'],mode=run['mode'],arm=run['arm'],rulesExact=run.get('action',{}).get('rulesExact',False),phases=phases,rows=rows,strictPass=all(x['strictSceneEqual'] and x['worldEqual'] and x['controlsEqual'] for x in rows),repeatPass=all(x['pass_'] for x in phases)))
cross=[]
for mode in ['normal','reduced']:
 for phase in ['initial','final']:
  a=images.get((mode,'original',phase));b=images.get((mode,'prototype',phase))
  if a and b:cross.append(dict(mode=mode,phase=phase,rawCanvas=image_delta(a['canvas0'],b['canvas0']),screen=image_delta(a['screen0'],b['screen0'])))
result=dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),url=raw['url'],sourceCommit=raw['sourceCommit'],indexSha256=raw['indexSha256'],raw=dict(path=str(base/'report.json'),sha256=sha(base/'report.json')),preregistration=raw['preregistration'],capturePass=raw['pass'],failure=raw.get('failure'),hashes=hashes,runs=runs,crossArm=cross,imagesViewed=0,productionAcceptance=False,limits=['Attribution only. Original strict failures remain failures.','No property removed, clock corrected, animation disabled, mask widened or transition repair.','Same R2 prototype; selected dualmedia diagnostic pages, not heldouts or native lifecycle proof.'])
p=base/'footer-animation-measurement.json';assert not p.exists();p.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(dict(path=str(p),hashes=len(hashes),runs=[dict(key=x['key'],strictPass=x['strictPass'],repeatPass=x['repeatPass'],additions=sum(len(y['added']) for y in x['rows'])) for x in runs],crossArm=cross)))
