#!/usr/bin/env python3
"""Two measured rate-control hypotheses; never changes originals or enrolled media."""
from pathlib import Path
from datetime import datetime,timezone
import json,subprocess,hashlib
import numpy as np
ROOT=Path(__file__).resolve().parents[2];BASE=ROOT/'work/v5/CXI/batch-m';OUT=BASE/'ratecontrol-r1';OUT.mkdir(exist_ok=True)
w,h=468,390;raw=np.memmap(BASE/'matte-r2/mochi-premul.rgba',np.uint8,'r',shape=(300,h,w,4))
report={'utc':datetime.now(timezone.utc).isoformat(),'status':'STUDY_ONLY','matteUnchanged':True,'nativeAssetAcceptance':False,'trials':[]}
for name,options in [('psnr23',['-tune','psnr']),('aq3_23',['-x264-params','aq-mode=3:aq-strength=1.2:psy-rd=0.4,0'])]:
 video=OUT/(name+'.mp4');decoded_path=OUT/(name+'.rgb')
 command=['ffmpeg','-y','-nostdin','-v','error','-f','rawvideo','-pixel_format','rgb24','-video_size',f'{w}x{h*2}','-framerate','30','-i','-','-an','-vf','scale=out_color_matrix=bt601:out_range=tv','-c:v','libx264','-threads','2','-preset','slow','-crf','23',*options,'-pix_fmt','yuv420p','-bsf:v','h264_metadata=colour_primaries=1:transfer_characteristics=13:matrix_coefficients=6:video_full_range_flag=0','-movflags','+faststart',str(video)]
 p=subprocess.Popen(command,stdin=subprocess.PIPE)
 for f in raw:p.stdin.write(np.concatenate([f[:,:,:3],np.repeat(f[:,:,3:4],3,axis=2)],axis=0).tobytes())
 p.stdin.close();assert p.wait()==0
 subprocess.run(['ffmpeg','-y','-nostdin','-v','error','-i',str(video),'-vf','scale=in_color_matrix=bt601:in_range=tv:out_range=full','-pix_fmt','rgb24','-f','rawvideo',str(decoded_path)],check=True,stdin=subprocess.DEVNULL)
 decoded=np.memmap(decoded_path,np.uint8,'r',shape=(300,h*2,w,3));color_errors=[];edge_errors=[];mask_errors=[]
 for i in range(300):
  f=raw[i].astype(np.float32);color=decoded[i,:h].astype(np.float32);alpha=decoded[i,h:,:,0].astype(np.float32)
  mask_errors.append(float(np.abs(alpha-f[:,:,3]).mean()));original=np.clip(f[:,:,:3]+255-f[:,:,3:4],0,255);actual=np.clip(color+255-alpha[:,:,None],0,255);errors=np.abs(actual-original)
  color_errors.append(float(errors[f[:,:,3]>16].mean()));edge_errors.append(float(errors[(f[:,:,3]>4)&(f[:,:,3]<250)].mean()))
 trial={'name':name,'video':str(video),'bytes':video.stat().st_size,'sha256':hashlib.sha256(video.read_bytes()).hexdigest(),'foregroundMAE':float(np.mean(color_errors)),'edgeFrameMax':max(edge_errors),'maskMAE':float(np.mean(mask_errors)),'command':command}
 trial['numericPass']=trial['bytes']<=1000000 and trial['foregroundMAE']<=3 and trial['edgeFrameMax']<=15 and trial['maskMAE']<=2
 report['trials'].append(trial);(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:v for k,v in trial.items() if k!='command'}),flush=True)
report['completedUTC']=datetime.now(timezone.utc).isoformat();(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
(ROOT/'reports/v5/CXI/evidence/v8-m-ratecontrol-study.json').write_text(json.dumps(report,indent=2)+'\n')
