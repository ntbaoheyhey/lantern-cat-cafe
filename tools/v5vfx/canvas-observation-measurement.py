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
 images={};checks=[]
 for cap in case['captures']:
  assert sha(cap['path'])==cap['sha256'];hashes+=1
  im=cv2.imread(cap['path'],cv2.IMREAD_UNCHANGED);assert list(im.shape[1::-1])==cap['dimensions'];images[cap['variant']]=im
  for when in ['before','after']:
   state=cap[when];diff=mismatches(case['before'],state);inherited=prior.stable(state['scene'],case['before']['scene'],case['fixedTime'],case['mode']=='reduced')
   checks.append({'variant':cap['variant'],'when':when,'fullEqual':not diff,'mismatchedPaths':diff,'inherited':inherited,'fontLoaded':state['presentation']['fontStatus']=='loaded'})
 assert list(images)==pre['sequence'];repeats=[]
 for a,b in [('screen0','screen1'),('screen0','screen2'),('canvas0','canvas1'),('canvas0','canvas2')]:
  assert images[a].shape==images[b].shape;repeats.append({'a':a,'b':b,**stats(np.any(images[a]!=images[b],axis=2))})
 s=case['before'];pres=s['presentation'];rect=pres['canvas']['rect'];bitmap=pres['renderer']['bitmap'];mapping=rect['width']==bitmap[0] and rect['height']==bitmap[1] and all(float(rect[k]).is_integer() for k in ['x','y','width','height']) and all(n['style']['transform']=='none' for n in pres['ancestors'] if n['pseudo'] is None)
 cross={'supportedMapping':mapping}
 if mapping:
  x,y,w,h=[int(rect[k]) for k in ['x','y','width','height']];screen=images['screen0'][y:y+h,x:x+w,:3];canvas=images['canvas0'][:,:,:3];assert screen.shape==canvas.shape
  diff=np.any(screen!=canvas,axis=2);rects=[a['rect'] for a in s['scene']['labels']]+[a['rect'] for a in s['scene']['hud']];shifted=[{**r,'x':r['x']-x,'y':r['y']-y} for r in rects];union=rectmask(shifted,w,h,2)
  cross.update(allPixels=stats(diff),insideLabelHudGuard=stats(diff&union),outsideLabelHudGuard=stats(diff&~union),canvasAlphaValues=np.unique(images['canvas0'][:,:,3]).tolist() if images['canvas0'].shape[2]==4 else None,interpretation='Descriptive difference only; DOM paint, compositor/color management or other causes are not distinguished. No release/art gate.')
 results.append({'key':case['key'],'stateChecks':checks,'repeatComparisons':repeats,'repeatPass':all(x['pixels']==0 for x in repeats),'statePass':all(c['fullEqual'] and all(c['inherited'].values()) and c['fontLoaded'] for c in checks),'screenCanvas':cross,'footerCapacity':capacity(s),'arenaAfter':[n for n in pres['ancestors'] if n['pseudo']=='::after' and 'dp-arena' in (n['class'] or '').split()]})
r={'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'raw':{'path':str(rawpath),'sha256':sha(rawpath)},'preregistration':raw['preregistration'],'artifact':{'path':str(artifactpath),'sha256':sha(artifactpath)},'sourceCommit':raw['sourceCommit'],'indexSha256':raw['indexSha256'],'url':raw['url'],'harness':{'path':__file__,'sha256':sha(__file__)},'capturePass':raw['pass'],'captureFailure':raw.get('failure'),'hashes':hashes,'cases':results,'rulesExact':all(a['rulesEqual'] and a['observedBattle']==a['expectedBattle'] for a in raw['actions']),'methodPass':raw['pass'] and len(results)==5 and all(c['statePass'] and c['repeatPass'] for c in results),'imagesViewed':0,'productionAcceptance':False}
p=base/'canvas-observation-measurement.json';assert not p.exists();p.write_text(json.dumps(r,indent=2)+'\n');print(json.dumps({'path':str(p),'methodPass':r['methodPass'],'hashes':hashes,'cases':[{'key':c['key'],'statePass':c['statePass'],'repeatPass':c['repeatPass'],'outside':c['screenCanvas'].get('outsideLabelHudGuard'),'footerSlack':c['footerCapacity']['rightSlack']} for c in results]}))
