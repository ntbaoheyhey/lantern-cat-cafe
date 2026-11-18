#!/usr/bin/env python3
"""Two packed VP9 codec hypotheses; never changes originals or enrolled media."""
from pathlib import Path
from datetime import datetime,timezone
import json,subprocess,hashlib,sys
import cv2
import numpy as np
ROOT=Path(__file__).resolve().parents[2];BASE=ROOT/'work/v5/CXI/batch-m';OUT=BASE/'codec-floor-256-r1';OUT.mkdir(exist_ok=True)
w,h=312,260;raw=np.memmap(BASE/'packed-vp9-256-r1/source.rgba',np.uint8,'r',shape=(300,h,w,4))
report={'utc':datetime.now(timezone.utc).isoformat(),'status':'STUDY_ONLY','hypotheses':['256px H264 YUV420 uncompressed coding floor','VP9 variance adaptive allocation preserves edge quality at fixed CRF'],'opaqueHeight':256,'nativeAssetAcceptance':False,'trials':[]}
trials=[('h264-420-floor','yuv420p','0'),('vp9-444-aq1-crf28','yuv444p','28')]
for name,pix,quality in trials:
 video=OUT/(name+('.mp4' if name.startswith('h264') else '.webm'));decoded_path=OUT/(name+'.rgb')
 options=['-c:v','libx264','-threads','2','-preset','slow','-crf',quality,'-pix_fmt',pix,'-bsf:v','h264_metadata=colour_primaries=1:transfer_characteristics=13:matrix_coefficients=6:video_full_range_flag=0','-movflags','+faststart'] if name.startswith('h264') else ['-c:v','libvpx-vp9','-threads','2','-row-mt','1','-cpu-used','2','-aq-mode','1','-b:v','0','-crf',quality,'-pix_fmt',pix,'-colorspace','smpte170m','-color_trc','iec61966-2-1','-color_primaries','bt709','-color_range','tv']
 command=['ffmpeg','-y','-nostdin','-v','error','-f','rawvideo','-pixel_format','rgb24','-video_size',f'{w}x{h*2}','-framerate','30','-i','-','-an','-vf','scale=out_color_matrix=bt601:out_range=tv',*options,str(video)]
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
(ROOT/'reports/v5/CXI/evidence/v8-m-codec-floor-256-study.json').write_text(json.dumps(report,indent=2)+'\n')
