#!/usr/bin/env python3
"""Test full-resolution channels inside ordinary H264 luma; no runtime enrollment."""
from pathlib import Path
from datetime import datetime,timezone
import json,subprocess,hashlib,sys
import cv2
import numpy as np
cv2.setNumThreads(2)
ROOT=Path(__file__).resolve().parents[2];BASE=ROOT/'work/v5/CXI/batch-m';quality=int(sys.argv[1]) if len(sys.argv)>1 else 23;assert quality in [20,23]
roi='--roi' in sys.argv;assert not roi or quality==23
vp9='--vp9' in sys.argv;assert not vp9 or (quality==23 and not roi)
full='--full-range' in sys.argv;assert not full or (roi and not vp9)
label='four-plane-roi-full-r1' if full else ('four-plane-vp9-r1' if vp9 else ('four-plane-roi-r1' if roi else ('four-plane-r1' if quality==23 else 'four-plane-q20')));OUT=BASE/label;OUT.mkdir(exist_ok=True)
assert not (OUT/'report.json').exists(), 'Preserve prior study evidence'
w,h=312,260;raw=np.memmap(BASE/'packed-vp9-256-r1/source.rgba',np.uint8,'r',shape=(300,h,w,4))
report={'utc':datetime.now(timezone.utc).isoformat(),'status':'STUDY_ONLY','hypothesis':'Full-resolution four-plane luma avoids YUV420 chroma loss; compare direct and decorrelated color at fixed quality.','opaqueHeight':256,'frames':300,'fps':30,'duration':10,'matteUnchanged':True,'nativeAssetAcceptance':False,'trials':[]}
for mode in (['rgba','ycrcb'] if quality==23 and not roi and not vp9 else ['ycrcb']):
 name=mode+f'-crf{quality}';video=OUT/(name+('.webm' if vp9 else '.mp4'));decoded_path=OUT/(name+'.rgb')
 command=['ffmpeg','-y','-nostdin','-v','error','-f','rawvideo','-pixel_format','yuv420p','-video_size',f'{w*2}x{h*2}','-framerate','30','-i','-','-an','-c:v','libx264','-threads','2','-preset','slow','-crf',str(quality),'-pix_fmt','yuv420p','-color_primaries','bt709','-color_trc','iec61966-2-1','-colorspace','smpte170m','-color_range','tv','-bsf:v','h264_metadata=colour_primaries=1:transfer_characteristics=13:matrix_coefficients=6:video_full_range_flag=0','-movflags','+faststart',str(video)]
 if roi:command[-1:-1]=['-vf',f'addroi=0:0:{w}:{h}:-0.12,addroi={w}:{h}:{w}:{h}:-0.04']
 if full:
  command[command.index('-i'):command.index('-i')]=['-color_range','pc']
  command=[x.replace('video_full_range_flag=0','video_full_range_flag=1') for x in command]
  command[command.index('-color_range',command.index('-i'))+1]='pc'
 if vp9:
  command=['ffmpeg','-y','-nostdin','-v','error','-f','rawvideo','-pixel_format','yuv420p','-video_size',f'{w*2}x{h*2}','-framerate','30','-i','-','-an','-c:v','libvpx-vp9','-profile:v','0','-threads','2','-row-mt','1','-cpu-used','2','-b:v','0','-crf',str(quality),'-pix_fmt','yuv420p','-color_primaries','bt709','-color_trc','iec61966-2-1','-colorspace','smpte170m','-color_range','tv',str(video)]
 p=subprocess.Popen(command,stdin=subprocess.PIPE)
 neutral=np.full((h,w),128,np.uint8).tobytes()
 for f in raw:
  color=f[:,:,:3] if mode=='rgba' else cv2.cvtColor(f[:,:,:3],cv2.COLOR_RGB2YCrCb)
  tile=np.block([[color[:,:,0],color[:,:,1]],[color[:,:,2],f[:,:,3]]])
  y=tile if full else np.round(16+tile.astype(np.float32)*219/255).astype(np.uint8)
  p.stdin.write(y.tobytes()+neutral+neutral)
 p.stdin.close();assert p.wait()==0
 subprocess.run(['ffmpeg','-y','-nostdin','-v','error','-i',str(video),'-vf',f'scale=in_color_matrix=bt601:in_range={"full" if full else "tv"}:out_range=full','-pix_fmt','rgb24','-f','rawvideo',str(decoded_path)],check=True,stdin=subprocess.DEVNULL)
 dec=np.memmap(decoded_path,np.uint8,'r',shape=(300,h*2,w*2,3));white_errors=[];black_errors=[];edge_errors=[];mask_errors=[]
 for i in range(300):
  tile=dec[i,:,:,0];packed=np.dstack([tile[:h,:w],tile[:h,w:],tile[h:,:w]])
  color=(packed if mode=='rgba' else cv2.cvtColor(packed,cv2.COLOR_YCrCb2RGB)).astype(np.float32);alpha=tile[h:,w:].astype(np.float32);f=raw[i].astype(np.float32)
  original=np.clip(f[:,:,:3]+255-f[:,:,3:4],0,255);actual=np.clip(color+255-alpha[:,:,None],0,255);err=np.abs(actual-original)
  white_errors.append(float(err[f[:,:,3]>16].mean()));black_errors.append(float(np.abs(color-f[:,:,:3])[f[:,:,3]>16].mean()));edge_errors.append(float(err[(f[:,:,3]>4)&(f[:,:,3]<250)].mean()));mask_errors.append(float(np.abs(alpha-f[:,:,3]).mean()))
 trial={'mode':mode,'video':str(video),'bytes':video.stat().st_size,'sha256':hashlib.sha256(video.read_bytes()).hexdigest(),'encodedDimensions':[w*2,h*2],'foregroundWhiteMAE':float(np.mean(white_errors)),'foregroundBlackMAE':float(np.mean(black_errors)),'edgeFrameMax':max(edge_errors),'maskMAE':float(np.mean(mask_errors)),'command':command}
 trial['numericPass']=trial['bytes']<=1000000 and trial['foregroundWhiteMAE']<=3 and trial['edgeFrameMax']<=15 and trial['maskMAE']<=2
 report['trials'].append(trial);(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:v for k,v in trial.items() if k!='command'}),flush=True)
report['completedUTC']=datetime.now(timezone.utc).isoformat();(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
name='v8-m-four-plane-roi-full-study.json' if full else ('v8-m-four-plane-vp9-study.json' if vp9 else ('v8-m-four-plane-roi-study.json' if roi else ('v8-m-four-plane-study.json' if quality==23 else 'v8-m-four-plane-q20-study.json')))
(ROOT/'reports/v5/CXI/evidence'/name).write_text(json.dumps(report,indent=2)+'\n')
