"""Measure encoded videos, not declarations. SSIM uses 11x11 sigma1.5 windows at 320x180."""
from pathlib import Path
import cv2,numpy as np,json,subprocess,itertools,hashlib,datetime
root=Path(__file__).resolve().parents[2];out=root/'reports/v3-battle/a2/V1';video=root/'apps/web/public/cinematics'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ssim(a,b):
 a=a.astype(np.float64);b=b.astype(np.float64);blur=lambda x:cv2.GaussianBlur(x,(11,11),1.5)
 ma=blur(a);mb=blur(b);va=blur(a*a)-ma*ma;vb=blur(b*b)-mb*mb;co=blur(a*b)-ma*mb
 score=((2*ma*mb+6.5025)*(2*co+58.5225))/((ma*ma+mb*mb+6.5025)*(va+vb+58.5225))
 return float(score[5:-5,5:-5].mean())
def gray(im):return cv2.cvtColor(im,cv2.COLOR_BGR2GRAY)
def fit(im,w,h):
 s=max(w/im.shape[1],h/im.shape[0]);v=cv2.resize(im,(round(im.shape[1]*s),round(im.shape[0]*s)));x=(v.shape[1]-w)//2;y=(v.shape[0]-h)//2;return v[y:y+h,x:x+w]
rows=[];beats={};logs=[]
browser=json.loads((out/'browser.json').read_text());assert not browser['errors']
for specpath in sorted((root/'tools/cinematic-compositor/plates').glob('*.json')):
 spec=json.loads(specpath.read_text());id=spec['id'];log=json.loads((out/(id+'-render.json')).read_text())
 assert log['sourceHash']==sha(root/'tools/cinematic-compositor/compositor.ts'),id+' stale compositor'
 assert log['deformationHash']==sha(root/'tools/cinematic-compositor/summon-motion.mjs'),id+' stale summon deformation'
 assert log['plateHash']==sha(specpath),id+' stale plate'
 assert log['encoded']['webm']['sha256']==sha(video/(id+'.webm')),id+' stale WebM'
 assert log['encoded']['mp4']['sha256']==sha(video/(id+'.mp4')),id+' stale MP4'
 assert not log['errors'] and log['deterministic']
 assert abs(log['frames'][54]['casterClip']['time']-log['frames'][54]['casterClip']['release'])<1e-6,id+' caster release is off beat'
 assert abs(log['frames'][-1]['casterClip']['time']-log['frames'][-1]['casterClip']['duration'])<1e-6,id+' caster recovery truncated'
 cap=cv2.VideoCapture(str(video/(id+'.webm')));frames=[]
 while True:
  ok,im=cap.read()
  if not ok:break
  frames.append(im)
 fps=cap.get(cv2.CAP_PROP_FPS);cap.release();assert len(frames)==spec['frames'] and fps==30,id
 selected=[frames[f] for f in [12,35,54]]
 for f,im in zip([12,35,54],selected):cv2.imwrite(str(out/f'{id}-encoded-{f}.png'),im)
 beats[id]=[cv2.resize(gray(im),(320,180),interpolation=cv2.INTER_AREA) for im in selected]
 field=cv2.imread(str(out/(id+'-field.png')));assert field is not None,id
 h,w=field.shape[:2];climax=fit(frames[54],w,h);diff=np.abs(gray(climax).astype(float)-gray(field).astype(float))
 # Edge columns must change over half their height, beyond 25 luma levels.
 edge=[float((diff[:,x]>25).mean()) for x in [0,-1]]
 within=[ssim(a,b) for a,b in itertools.combinations(beats[id],2)]
 actual=set(k for f in log['frames'] for k,v in f['layers'].items() if v>0);declared={l['type'] for l in spec['layers']}
 assert actual<=declared,id+' undeclared draw'
 motif=max((f['motifCoverage'] or 0) for f in log['frames'])
 samples=[r for r in browser['rows'] if r['id']==id];assert len(samples)==2
 row={'id':id,'coverage':float((diff>25).mean()),'edgeFractions':edge,'changedEdgeColumns':sum(x>=.5 for x in edge),'viewportFill':min(r['viewportFill'] for r in samples),'verifiedLayerTypes':len(actual&declared),'peakParticles':max(f['particles'] for f in log['frames']),'distinctBeats':3 if max(within)<.98 else 1,'withinBeatSSIM':within,'motifCoverage':motif,'casterCorePixels':max(f['casterCorePixels'] for f in log['frames']),'camera':spec['composition']['camera'],'seconds':len(frames)/fps,'webmSHA256':sha(video/(id+'.webm'))}
 rows.append(row);logs.append({'id':id,'verified':sorted(actual&declared),'sourceHash':log['sourceHash'],'webmSHA256':row['webmSHA256'],'frames':log['frames']})
pairs=[{'a':a,'b':b,'beatSSIM':[ssim(x,y) for x,y in zip(beats[a],beats[b])]} for a,b in itertools.combinations(beats,2)]
for p in pairs:p['meanSSIM']=sum(p['beatSSIM'])/3
meta={'generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()}
metrics={'_meta':meta,'method':'VP9 decoded frames12/35/54; standard local Gaussian SSIM at320x180; luma coverage >25 versus that skill last field; video cover crop matched to battle host; both desktop sizes','plates':{'count':len(rows),'minCoverage':min(r['coverage'] for r in rows),'minViewportFill':min(r['viewportFill'] for r in rows),'minChangedEdgeColumns':min(r['changedEdgeColumns'] for r in rows),'minVerifiedLayerTypes':min(r['verifiedLayerTypes'] for r in rows),'minPeakParticles':min(r['peakParticles'] for r in rows),'minDistinctBeats':min(r['distinctBeats'] for r in rows),'maxMeanPairSSIM':max(p['meanSSIM'] for p in pairs),'pairsMeasured':len(pairs),'totalBytes':sum(p.stat().st_size for p in video.iterdir() if p.is_file()),'minMotifCoverage':min(r['motifCoverage'] for r in rows),'distinctCameras':len(set(r['camera'] for r in rows))},'perPlate':rows,'pairs':pairs}
suite=out/'suite.json'
if suite.exists():metrics['suite']=json.loads(suite.read_text())
(out/'metrics.json').write_text(json.dumps(metrics,indent=2)+'\n');(out/'compositor.json').write_text(json.dumps({'_meta':meta,'logs':logs},indent=2)+'\n')
print(json.dumps(metrics['plates'],indent=2));print('Most similar:',sorted(pairs,key=lambda p:p['meanSSIM'])[-1]);print('Coverage:',[(r['id'],round(r['coverage'],3),r['changedEdgeColumns']) for r in rows])
