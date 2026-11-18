"""Fit frozen contacts only; evaluate reserved progression without refitting."""
from pathlib import Path
import datetime,hashlib,json,math,sys
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'work/v5/CXV/python'))
import cv2
import numpy as np
cv2.setNumThreads(2)
BASE=ROOT/'work/v5/CXV/batch-m'
TRAIN=BASE/'action-label-full-r2-143611'
HELD=BASE/'action-label-recovery-r3-144918'
OUT=BASE/'action-label-translation-r1'
THRESHOLDS=(0,1,2,4)
CATS=('mochi','clover','panko','mallow')
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
dx,dy=np.meshgrid(np.arange(-64,65),np.arange(-64,65))
def load(base):
 raw=json.loads((base/'report.json').read_text());a=json.loads((base/'analysis.json').read_text());rows=[]
 for c in a['cases']:
  if not c['valid']:continue
  s=next(x for x in raw['cases'] if x['key']==c['key'])['before'];l=next(x for x in s['labels'] if x['id']=='mochi');b=l['rect'];x0,y0=math.floor(b['x']),math.floor(b['y']);x1,y1=math.ceil(b['x']+b['width']),math.ceil(b['y']+b['height'])
  p=c['pixelDifferences'];assert sha(p['path'])==p['sha256'];m=np.load(p['path']);paint=m['labelPaint'][y0:y1,x0:x1]
  blockers=[x['rect'] for x in s['labels'] if x['id']!='mochi']+[x['rect'] for x in s['hud']]
  blockers += [dict(x=z['face']['x']+s['host']['x'],y=z['face']['y']+s['host']['y'],width=z['face']['width'],height=z['face']['height']) for z in s['anchors'] if z['visible'] and z.get('face')]
  gx,gy=b['x']+dx,b['y']+dy;geo=(gx>=4)&(gy>=4)&(gx+b['width']<=1276)&(gy+b['height']<=716)
  for z in blockers:geo &= ~((gx<z['x']+z['width'])&(gx+b['width']>z['x'])&(gy<z['y']+z['height'])&(gy+b['height']>z['y']))
  rows.append((c,s,(x0,y0,x1,y1),paint,m,geo))
 return rows
def matrix(row,threshold,margin):
 c,s,(x0,y0,x1,y1),paint,m,geo=row
 body=np.logical_or.reduce([m[k+'Contribution']>threshold for k in CATS]).astype(np.uint8)
 if margin:body=cv2.dilate(body,np.ones((2*margin+1,2*margin+1),np.uint8))
 window=np.pad(body,64)[y0:y1+128,x0:x1+128];template=(paint>threshold).astype(np.float32)
 counts=np.rint(cv2.matchTemplate(window.astype(np.float32),template,cv2.TM_CCORR)).astype(np.int32)
 assert counts.shape==(129,129)
 for ix,iy in [(0,0),(64,64),(128,128),(32,96),(96,32)]:
  assert counts[iy,ix]==int(np.count_nonzero(template*window[iy:iy+y1-y0,ix:ix+x1-x0]))
 return counts

train=load(TRAIN);held=load(HELD);assert len(train)==14 and len(held)==16
sensitivity={};accept=np.ones((129,129),bool)
for margin in (0,1,2):
 for threshold in THRESHOLDS:
  good=np.ones((129,129),bool)
  for row in train:good &= row[-1]&(matrix(row,threshold,margin)==0)
  sensitivity[f'threshold{threshold}-margin{margin}']=int(good.sum())
  if margin==2 and threshold==0:accept=good
indices=np.argwhere(accept);ranked=sorted([(int(dx[y,x]),int(dy[y,x])) for y,x in indices],key=lambda p:(p[0]**2+p[1]**2,abs(p[1]),p[0],p[1]))
chosen=ranked[0] if ranked else None
evaluations=[]
if chosen:
 ix,iy=chosen[0]+64,chosen[1]+64
 for suite,rows in [('training',train),('reservedProgression',held)]:
  for row in rows:evaluations.append({'suite':suite,'key':row[0]['key'],'geometryClear':bool(row[-1][iy,ix]),'intersections':{str(t):int(matrix(row,t,2)[iy,ix]) for t in THRESHOLDS}})
OUT.mkdir(exist_ok=False)
np.savez_compressed(OUT/'candidate-grid.npz',dx=dx,dy=dy,accept=accept)
prereg=ROOT/'reports/v5/CXV/M-action-label-translation-R1-preregistration.json'
result={'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'preregistration':{'path':str(prereg),'sha256':sha(prereg)},'harnessSha256':sha(__file__),'train':{'path':str(TRAIN/'analysis.json'),'sha256':sha(TRAIN/'analysis.json')},'holdout':{'path':str(HELD/'analysis.json'),'sha256':sha(HELD/'analysis.json')},'sourceCommit':json.loads((TRAIN/'report.json').read_text())['sourceCommit'],'grid':{'path':str(OUT/'candidate-grid.npz'),'sha256':sha(OUT/'candidate-grid.npz')},'candidates':16641,'passingTrainingCandidates':len(ranked),'sensitivity':sensitivity,'nearest':ranked[:12],'chosen':chosen,'evaluations':evaluations,'reservedPass':bool(chosen) and all(x['geometryClear'] and x['intersections']['0']==0 for x in evaluations if x['suite']=='reservedProgression'),'productionAcceptance':False,'limits':['Fit14old validcontacts only;reserved16progressioncases are evaluated without refitting.','Integer mask translation is a static paint hypothesis; actual CSS placement and background antialiasing may differ.','Previous idle/expanded-status and fresh native candidate capture still required. No appsource edit.']}
p=ROOT/'reports/v5/CXV/M-action-label-translation-R1.json';assert not p.exists();p.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:result[k] for k in ['passingTrainingCandidates','chosen','reservedPass','nearest','sensitivity']}))
