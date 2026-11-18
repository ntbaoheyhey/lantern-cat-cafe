#!/usr/bin/env python3
"""Fail-loud offline codec/loop gate. Native placement remains separate; byte sizes are report-only."""
import json,subprocess,hashlib,sys
from pathlib import Path
from datetime import datetime,timezone
import numpy as np
ROOT=Path(__file__).resolve().parents[2];BASE=ROOT/'work/v5/CXI/batch-m'
receipt=json.loads((ROOT/'reports/v5/CXI/evidence/v8-m-mochi-candidate.json').read_text())
files=[Path(f['path']) for f in receipt['files']];video,poster,manifest_path=files
manifest=json.loads(manifest_path.read_text());w,h=manifest['width'],manifest['height']
checks=[]
def check(name,passed,value):checks.append({'name':name,'pass':bool(passed),'value':value})
for p,expected in zip(files,receipt['files']):check('hash '+p.name,hashlib.sha256(p.read_bytes()).hexdigest()==expected['sha256'],p.stat().st_size)
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height,nb_frames,r_frame_rate,duration,pix_fmt,color_space,color_transfer','-of','json',str(video)]))['streams'][0]
check('ten seconds 300 frames 30fps',probe['nb_frames']=='300' and probe['r_frame_rate']=='30/1' and float(probe['duration'])==10,probe)
check('packed dimensions',probe['width']==w and probe['height']==h*2,[probe['width'],probe['height']])
video_bytes_report_only=video.stat().st_size  # OWNER INBOX-CXI386 removes byte caps.
check('explicit BT601 sRGB metadata',probe.get('color_space')=='smpte170m' and probe.get('color_transfer')=='iec61966-2-1',probe)
source=np.memmap(BASE/'matte-r2/mochi-premul.rgba',np.uint8,'r',shape=(300,h,w,4))
decoded_path=BASE/'candidate-mochi/decoded.rgb'
subprocess.run(['ffmpeg','-y','-nostdin','-v','error','-i',str(video),'-vf','scale=in_color_matrix=bt601:in_range=tv:out_range=full','-pix_fmt','rgb24','-f','rawvideo',str(decoded_path)],check=True,stdin=subprocess.DEVNULL)
decoded=np.memmap(decoded_path,np.uint8,'r',shape=(300,h*2,w,3))
mask_errors=[];color_errors=[];edge_errors=[]
for i in range(300):
 f=source[i].astype(np.float32);color=decoded[i,:h].astype(np.float32);alpha=decoded[i,h:,:,0].astype(np.float32)
 mask_errors.append(float(np.abs(alpha-f[:,:,3]).mean()))
 original=np.clip(f[:,:,:3]+255-f[:,:,3:4],0,255);actual=np.clip(color+255-alpha[:,:,None],0,255)
 errors=np.abs(actual-original);foreground=f[:,:,3]>16;edge=(f[:,:,3]>4)&(f[:,:,3]<250)
 color_errors.append(float(errors[foreground].mean()));edge_errors.append(float(errors[edge].mean()))
check('mask mean <=2 levels',np.mean(mask_errors)<=2,float(np.mean(mask_errors)))
check('foreground white-composite mean <=3 levels',np.mean(color_errors)<=3,float(np.mean(color_errors)))
check('edge frame maximum <=15 levels',max(edge_errors)<=15,max(edge_errors))
regions={'face':[150,48,347,181],'tail':[20,170,200,335],'prop':[330,170,465,365]}
seams={}
for name,(x0,y0,x1,y1) in regions.items():
 frames=decoded[:,:h]
 values=[]
 def distance(i,j):
  a=frames[i,y0:y1,x0:x1].astype(np.float32);b=frames[j,y0:y1,x0:x1].astype(np.float32)
  ma=decoded[i,h+y0:h+y1,x0:x1,0].astype(np.float32);mb=decoded[j,h+y0:h+y1,x0:x1,0].astype(np.float32)
  return float(np.abs((a+255-ma[:,:,None])-(b+255-mb[:,:,None])).mean())
 values=[distance(i,i-1) for i in range(1,300)];p95=float(np.percentile(values,95));seam=distance(299,0)
 seams[name]={'seamMAE':seam,'adjacentP95':p95,'ratio':seam/max(1,p95)};check(name+' loop <=1.5x adjacentP95 +1',seam<=p95*1.5+1,seams[name])
report={'utc':datetime.now(timezone.utc).isoformat(),'kind':'offline-only','cat':'mochi','crf':receipt.get('crf',28),'manifestSha256':hashlib.sha256(manifest_path.read_bytes()).hexdigest(),'checks':checks,'pass':all(c['pass']for c in checks),'nativeAssetAcceptance':False,'videoBytes':video_bytes_report_only,'bytePolicy':'report-only; OWNER INBOX-CXI386'}
(BASE/f'candidate-mochi/offline-gate-crf{receipt.get("crf",28)}.json').write_text(json.dumps(report,indent=2)+'\n')
(ROOT/'reports/v5/CXI/evidence/v8-m-mochi-offline-gate.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report));sys.exit(0 if report['pass'] else 1)
