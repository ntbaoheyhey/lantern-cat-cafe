"""Measure fulltrajectory of unchanged R2 prototype; preserve every sampled failure."""
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
assert sha(base/'probe-footer-trajectory-r1.mjs')==raw['harnessSha256']==pre['harnessSha256']
artifact=json.loads((base/'artifact-verification.json').read_text())
assert all(raw[k]==pre[k]==artifact[k] for k in ['url','sourceCommit','indexSha256'])
def clean_badges(bs):return [{k:v for k,v in b.items() if k!='focus'} for b in bs]
def values(n):return dict(meters=n['meters'],badges=clean_badges(n['badges']))
def stats(a,b):
 d=np.any(a!=b,axis=2);y,x=np.where(d)
 return dict(pixels=int(len(x)),bbox=[int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)] if len(x) else None)
def same(a,b):return json.dumps(a,sort_keys=True,separators=(',',':'))==json.dumps(b,sort_keys=True,separators=(',',':'))
def overlap(a,b):return max(0,min(a['right'],b['right'])-max(a['left'],b['left']))*max(0,min(a['bottom'],b['bottom'])-max(a['top'],b['top']))
def normalized(r):return dict(left=r['x'],top=r['y'],right=r['x']+r['width'],bottom=r['y']+r['height'],width=r['width'],height=r['height'])
def inside(a,b):return a['left']>=b['left'] and a['top']>=b['top'] and a['right']<=b['right'] and a['bottom']<=b['bottom']
def geometry(after):
 info=after['information'];out=[]
 for p in after['panels']:
  box=p['rect'];world=next(n for n in info['nodes'] if n['class']=='b3-world' and n['actor']==p['actor']);visible=not p['hidden'] and p['visibility']=='visible';overflows=[]
  for i,c in enumerate(p['children']):
   for kind,rects in [('box',[c['rect']]),('text',c['textRects'])]:
    for rect in rects:
     if c['display']!='none' and rect['width'] and rect['height'] and not inside(rect,box):overflows.append(dict(child=i,kind=kind,rect=rect))
  focusInside=True
  for c in p['children']:
   if not c['focus']:continue
   width=float(c['outlineWidth'].replace('px',''));extra=max(0,width+float(c['outlineOffset'].replace('px','')));z=c['rect'];focusInside &= not visible or c['outlineStyle']!='none' and width>0 and z['left']-extra>=box['left'] and z['top']-extra>=box['top'] and z['right']+extra<=box['right'] and z['bottom']+extra<=box['bottom']
  controls=[dict(control=n['class'],area=overlap(box,n['rect'])) for n in info['controls'] if visible and overlap(box,n['rect'])>0]
  bodies=[dict(body=a['id'],area=overlap(box,normalized(a['body']))) for a in after['scene']['anchors'] if visible and a.get('body') and a['visible'] and overlap(box,normalized(a['body']))>0]
  party=next(n['rect'] for n in info['controls'] if n['class']=='b3-party');speed=next(n['rect'] for n in info['controls'] if n['class']=='b3-speed')
  out.append(dict(actor=p['actor'],sizeExact=[box['width'],box['height']]==[160,72],insideFooter=inside(box,info['footer']),controlClearance=box['left']>=speed['right']+12 and box['right']<=party['left']-12,identityCorrect=p['name']=='Mochi' and p['groupRole']=='group' and p['groupLabel']=='cxv-identity-name-mochi',visibilityCorrect=p['hidden']==world['hidden'] and p['visibility']==('hidden' if info['cinemaOccluded'] else 'visible'),contentOverflows=overflows,controlBoxConflicts=controls,bodyBoxConflicts=bodies,focusInside=bool(focusInside)))
 return out
results=[];images={};hashes=[]
for run in raw['runs']:
 phases=[]
 for phase in run['captures']:
  frames={};states=[]
  for shot in phase['captures']:
   assert sha(shot['path'])==shot['sha256'];hashes.append(dict(path=shot['path'],sha256=shot['sha256']));frames[shot['variant']]=cv2.imread(shot['path'],cv2.IMREAD_UNCHANGED)
   for when in ['before','after']:states.append(same(shot[when],phase['captures'][0]['before']))
  pairs=[dict(a=a,b=b,**stats(frames[a],frames[b])) for a,b in [('screen0','screen1'),('canvas0','canvas1')]]
  phases.append(dict(phase=phase['phase'],stateComparisons=states,repeatComparisons=pairs,statePass=all(states),repeatPass=all(x['pixels']==0 for x in pairs)));images[(run['mode'],run['cat'],run['skill'],run['statusCase'],run['arm'],phase['phase'])]=frames
 rows=[]
 for row in run['rows']:
  before,after=row['before'],row['after'];nodes=after['information']['nodes'];world=next(n for n in nodes if n['actor']=='mochi' and n['class']=='b3-world');panels=[n for n in nodes if n['class']=='b3-cxv-identity'];prototype=run['arm']=='prototype'
  transfer=not prototype or len(panels)==1 and values(world)==values(panels[0])
  target=panels[0] if prototype and panels else world;survives=bool(run.get('focusTitle')) and any(b['title']==run['focusTitle'] for b in target['badges']);focused=any(b['title']==run.get('focusTitle') and b['focus'] for b in target['badges']) and after['information']['focus']['sameNode'] and after['information']['focus']['originalConnected']
  empty_label=not prototype or target['noEffects']==('No effects' if not world['badges'] else None)
  original_before=[n for n in before['information']['nodes'] if n['class']=='b3-world'];original_after=[n for n in nodes if n['class']=='b3-world']
  g=geometry(after);geometryPass=all(x['sizeExact'] and x['insideFooter'] and x['controlClearance'] and x['identityCorrect'] and x['visibilityCorrect'] and x['focusInside'] and not x['contentOverflows'] and not x['controlBoxConflicts'] and not x['bodyBoxConflicts'] for x in g)
  rows.append(dict(geometry=g,geometryPass=geometryPass,ms=row['ms'],sceneUnchanged=same(before['scene'],after['scene']),worldUnchanged=same(original_before,original_after),footerControlsUnchanged=same(before['information']['controls'],after['information']['controls']),valuesExact=transfer,emptyLabelCorrect=empty_label,panelsExpected=len(panels)==(1 if prototype else 0),focusTitle=run.get('focusTitle'),focusTargetSurvives=survives,focusRetained=focused if survives else None,focus=after['information']['focus']))
 initial=run['initial']['information']['nodes'];initial_world=next(n for n in initial if n['class']=='b3-world' and n['actor']=='mochi');initial_panels=[n for n in initial if n['class']=='b3-cxv-identity']
 empty=None
 if run['statusCase']=='empty':empty=not initial_world['badges'] and (run['arm']=='original' or len(initial_panels)==1 and initial_panels[0]['noEffects']=='No effects' and not initial_panels[0]['badges'])
 results.append(dict(mode=run['mode'],cat=run['cat'],skill=run['skill'],plannedSamples=len(run['plannedTimes']),samplesComplete=[x['ms'] for x in rows]==run['plannedTimes'],allGeometryPass=all(x['geometryPass'] for x in rows),key=run['key'],statusCase=run['statusCase'],arm=run['arm'],rulesExact=run.get('action',{}).get('rulesExact',False),emptyInitialCorrect=empty,phases=phases,rows=rows,allRepeatStatePass=all(p['statePass'] and p['repeatPass'] for p in phases),allTransferPass=all(x['sceneUnchanged'] and x['worldUnchanged'] and x['footerControlsUnchanged'] and x['valuesExact'] and x['emptyLabelCorrect'] and x['panelsExpected'] for x in rows),survivingFocusPass=all(x['focusRetained'] for x in rows if x['focusTargetSurvives'])))
cross=[]
for case in pre['cases']:
 for phase in ['initial','final']:
  key=(case['mode'],case['cat'],case['skill'],case['statusCase']);a=images.get((*key,'original',phase));b=images.get((*key,'prototype',phase))
  if a and b:cross.append(dict(**case,phase=phase,rawCanvas=stats(a['canvas0'],b['canvas0']),screen=stats(a['screen0'],b['screen0'])))
result=dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),sourceCommit=raw['sourceCommit'],indexSha256=raw['indexSha256'],url=raw['url'],raw=dict(path=str(base/'report.json'),sha256=sha(base/'report.json')),preregistration=raw['preregistration'],hashes=hashes,capturePass=raw['pass'],failure=raw.get('failure'),runs=results,crossArm=cross,imagesViewed=0,productionAcceptance=False,focusEvaluation='Not exercised here; separate R2/CXI heldout evidence',limits=['16planned development pages;60Hz plus exact boundaries;sync manually invoked after React update.','All failed controls retained;no native lifecycle or natural reachability acceptance.','No R1 images reopened;no fullpaint or dualmedia acceptance.'])
path=base/'footer-trajectory-measurement.json';assert not path.exists();path.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(dict(path=str(path),hashes=len(hashes),runs=[{k:r[k] for k in ['key','samplesComplete','plannedSamples','allGeometryPass','allRepeatStatePass','allTransferPass','survivingFocusPass']} for r in results],crossArm=cross)))
