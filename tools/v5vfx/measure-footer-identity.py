"""Strict repeat/state checks and descriptive screen/raw-canvas differences; no art acceptance."""
from pathlib import Path
import datetime,hashlib,json,sys,math,importlib.util
import cv2
import numpy as np
cv2.setNumThreads(2)
ROOT=Path(__file__).resolve().parents[2]
base=Path(sys.argv[1]).resolve();assert base.is_relative_to(ROOT/'work/v5/CXV')
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
rawpath=base/'report.json';raw=json.loads(rawpath.read_text());prepath=Path(raw['preregistration']['path']);pre=json.loads(prepath.read_text())
assert sha(prepath)==raw['preregistration']['sha256'];assert raw['harnessSha256']==pre['harness']['sha256']
artifactpath=base/'artifact-verification.json';artifact=json.loads(artifactpath.read_text())
assert all(raw[k]==pre[k]==artifact[k] for k in ['sourceCommit','indexSha256','url'])
for item in json.loads((base/'harness-provenance.json').read_text()):assert sha(base/item['name'])==item['sha256']
spec=importlib.util.spec_from_file_location('prior',ROOT/'tools/v5vfx/measure-action-labels.py');prior=importlib.util.module_from_spec(spec);spec.loader.exec_module(prior);prior.MEDIA=('mochi',)
def mismatches(a,b,path='$'):
 if type(a)!=type(b):return [path+':type']
 if isinstance(a,dict):
  found=[path+':keys'] if set(a)!=set(b) else []
  for k in sorted(set(a)&set(b)):found+=mismatches(a[k],b[k],path+'.'+k)
  return found
 if isinstance(a,list):
  found=[path+':length'] if len(a)!=len(b) else []
  for i,(x,y) in enumerate(zip(a,b)):found+=mismatches(x,y,path+'['+str(i)+']')
  return found
 return [] if a==b else [path]
def stats(mask):
 y,x=np.where(mask);return {'pixels':int(len(x)),'bbox':None if not len(x) else [int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)]}
def rectmask(rects,width,height,guard=0):
 mask=np.zeros((height,width),bool)
 for r in rects:
  if r:
   x0=max(0,math.floor(r['x']-guard));y0=max(0,math.floor(r['y']-guard));x1=min(width,math.ceil(r['x']+r['width']+guard));y1=min(height,math.ceil(r['y']+r['height']+guard));mask[y0:y1,x0:x1]=True
 return mask
def overlap(a,b):return max(0,min(a['x']+a['width'],b['x']+b['width'])-max(a['x'],b['x']))*max(0,min(a['y']+a['height'],b['y']+b['height'])-max(a['y'],b['y']))
def capacity(state):
 nodes=state['presentation']['footer'];byclass=lambda c:next(x['rect'] for x in nodes if c in (x['class'] or '').split())
 footer,speed,party,actions=[byclass(c) for c in ['b3-bottom','b3-speed','b3-party','b3-bottom-actions']];f=pre['footerCapacity']
 panels=[{'x':speed['right']+f['controlClearance']+i*(f['panelWidth']+f['panelGap']),'y':footer['top']+f['topOffset'],'width':f['panelWidth'],'height':f['panelHeight']} for i in range(f['count'])]
 contained=all(p['x']>=footer['left'] and p['y']>=footer['top'] and p['x']+p['width']<=party['left']-f['controlClearance'] and p['y']+p['height']<=footer['bottom'] for p in panels)
 conflicts=[{'panel':i,'body':a['id'],'area':overlap(p,a['body'])} for i,p in enumerate(panels) for a in state['scene']['anchors'] if a['visible'] and a.get('body') and overlap(p,a['body'])>0]
 controlconflicts=[{'panel':i,'class':n['class'],'area':overlap(p,n['rect'])} for i,p in enumerate(panels) for n in nodes if 'b3-bottom'!=(n['class'] or '') and overlap(p,n['rect'])>0]
 return {'panels':panels,'footer':footer,'speed':speed,'party':party,'actions':actions,'rightSlack':party['left']-f['controlClearance']-panels[-1]['x']-panels[-1]['width'],'contained':contained,'bodyConflicts':conflicts,'controlConflicts':controlconflicts,'nominalBoxPass':contained and not conflicts and not controlconflicts,'limit':'Outer computed boxes only; complete portrait glow/focus paint and actual panel content/association not implemented or accepted.'}
results=[];hashes=0
for case in raw['cases']:
 phases=[];imagesByPhase={}
 for phase in case['phases']:
  if phase.get('skipped'):phases.append(phase);continue
  images={};states=[]
  for capture in phase['captures']:
   assert sha(capture['path'])==capture['sha256'];hashes+=1;images[capture['variant']]=cv2.imread(capture['path'],cv2.IMREAD_UNCHANGED)
   for when in ['before','after']:
    state=capture[when];diff=mismatches(phase['before'],state);inherited=prior.stable(state['scene'],phase['before']['scene'],case['fixedTime'],case['mode']=='reduced')
    states.append({'variant':capture['variant'],'when':when,'fullEqual':not diff,'mismatchedPaths':diff,'inherited':inherited})
  assert list(images)==pre['sequence'];repeat=[]
  for a,b in [('screen0','screen1'),('screen0','screen2'),('canvas0','canvas1'),('canvas0','canvas2')]:repeat.append({'a':a,'b':b,**stats(np.any(images[a]!=images[b],axis=2))})
  phases.append({'phase':phase['phase'],'states':states,'statePass':all(x['fullEqual'] and all(x['inherited'].values()) for x in states),'repeatPass':all(x['pixels']==0 for x in repeat),'repeatComparisons':repeat});imagesByPhase[phase['phase']]=images
 baseline=next(p for p in case['phases'] if p['phase']=='baseline')['before'];baseScene=baseline['scene'];originalInfo={x['actor']:x for x in baseline['information'] if x['class']=='b3-world'};paired=[]
 for phase in case['phases']:
  if phase.get('skipped') or phase['phase']=='baseline':continue
  state=phase['before'];scene=state['scene'];currentOriginals={x['actor']:x for x in state['information'] if x['class']=='b3-world'};panels=state['panels'];active=phase['phase']!='restored';checks={k:scene[k]==baseScene[k] for k in ['battle','plan','sceneTime','renderTime','host','anchors','hud','labels','media']};checks['originalFooter']=state['presentation']['footer']==baseline['presentation']['footer'];checks['expectedPanelActors']=[p['actor'] for p in panels]==(['mochi'] if active else []);checks['otherInformation']=all(currentOriginals[k]==v for k,v in originalInfo.items() if k!='mochi');checks['originalMochiValues']=all(currentOriginals['mochi'][k]==originalInfo['mochi'][k] for k in ['meters','badges']);checks['worldVisibility']=currentOriginals['mochi']['visibility']==('hidden' if active else originalInfo['mochi']['visibility'])
  panelChecks=[]
  for panel in panels:
   transferred=next(x for x in state['information'] if x['class']=='b3-cxv-identity' and x['actor']==panel['actor']);original=originalInfo[panel['actor']];box=panel['rect'];overflows=[]
   for i,c in enumerate(panel['children']):
    for kind,rects in [('box',[c['rect']]),('text',c['textRects'])]:
     for rect in rects:
      if rect['width'] and rect['height'] and not (rect['left']>=box['left'] and rect['top']>=box['top'] and rect['right']<=box['right'] and rect['bottom']<=box['bottom']):overflows.append({'child':i,'kind':kind,'rect':rect})
   focus=[c for c in panel['children'] if c['focus']];focusInside=True
   for c in focus:
    width=float(c['outlineWidth'].replace('px',''));offset=float(c['outlineOffset'].replace('px',''));extra=max(0,width+offset);rect=c['rect'];focusInside&=rect['left']-extra>=box['left'] and rect['top']-extra>=box['top'] and rect['right']+extra<=box['right'] and rect['bottom']+extra<=box['bottom'] and c['outlineStyle']!='none' and width>0
   controls=[n for n in state['presentation']['footer'] if n['class']!='b3-bottom'];conflicts=[n['class'] for n in controls if overlap(box,n['rect'])>0];bodyConflicts=[a['id'] for a in scene['anchors'] if a.get('body') and a['visible'] and overlap(box,a['body'])>0]
   panelChecks.append({'actor':panel['actor'],'sizeExact':[box['width'],box['height']]==[160,72],'valuesExact':all(transferred[k]==original[k] for k in ['meters','badges']),'nameVisible':panel['name']=='Mochi' and panel['groupRole']=='group' and panel['groupLabel']=='cxv-identity-name-mochi' and panel['visibility']=='visible' and not panel['hidden'],'noEffectsCorrect':transferred['noEffects']==(None if original['badges'] else 'No effects'),'badgeCount':len(transferred['badges']),'contentOverflows':overflows,'controlBoxConflicts':conflicts,'bodyBoxConflicts':bodyConflicts,'focusInside':focusInside,'focused':len(focus),'focusExpected':not phase['phase'].startswith('focus-') or len(focus)==1})
  rawDelta=stats(np.any(imagesByPhase['baseline']['canvas0']!=imagesByPhase[phase['phase']]['canvas0'],axis=2));screenDelta=np.any(imagesByPhase['baseline']['screen0']!=imagesByPhase[phase['phase']]['screen0'],axis=2);rects=[x['rect'] for x in baseScene['labels'] if x['id']=='mochi']+[p['rect'] for p in panels];intent=rectmask(rects,1280,720,2)
  paired.append({'phase':phase['phase'],'geometryAndRules':checks,'panels':panelChecks,'rawCanvas':rawDelta,'screenAll':stats(screenDelta),'screenOutsideIntendedBounds':stats(screenDelta&~intent),'limit':'Screen difference localization only; full control glow/actual painted support and prior restoration failures remain open.'})
 results.append({'key':case['key'],'statusCase':case['statusCase'],'phases':phases,'paired':paired,'phaseRepeatsPass':all(p.get('skipped') or p['statePass'] and p['repeatPass'] for p in phases),'rawBodyPass':all(p['rawCanvas']['pixels']==0 for p in paired),'geometryRulesPass':all(all(p['geometryAndRules'].values()) for p in paired),'contentPass':all(c['sizeExact'] and c['valuesExact'] and c['nameVisible'] and c['noEffectsCorrect'] and not c['contentOverflows'] and not c['controlBoxConflicts'] and not c['bodyBoxConflicts'] and c['focusInside'] and c['focusExpected'] for p in paired for c in p['panels'])})
result={'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'raw':{'path':str(rawpath),'sha256':sha(rawpath)},'preregistration':raw['preregistration'],'artifact':{'path':str(artifactpath),'sha256':sha(artifactpath)},'sourceCommit':raw['sourceCommit'],'indexSha256':raw['indexSha256'],'url':raw['url'],'capturePass':raw['pass'],'captureFailure':raw.get('failure'),'hashes':hashes,'cases':results,'imagesViewed':0,'productionAcceptance':False,'limits':['Four development cases, not fulltrajectory or dual-media acceptance.','Source application unchanged; DOM-only prototype; no production readiness from these checks.','Strict conceal/restoration failures remain retained; this is not a new label paint mask.']}
p=base/'footer-identity-measurement.json';assert not p.exists();p.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'path':str(p),'hashes':hashes,'capturePass':raw['pass'],'cases':[{k:c[k] for k in ['key','phaseRepeatsPass','rawBodyPass','geometryRulesPass','contentPass']} for c in results]}))
