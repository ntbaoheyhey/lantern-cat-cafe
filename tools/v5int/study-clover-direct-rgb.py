"""Controlled direct RGB resampling with frozen alpha; study only, no registry edits."""
from pathlib import Path
from datetime import datetime,timezone
import hashlib,json,subprocess,sys
sys.path.insert(0,'/Users/bao/taskbar-hero-cardrpg-a6/work/v5/CXV/python')
import cv2,numpy as np
cv2.setNumThreads(1)
R=Path(__file__).resolve().parents[2];B=R/'work/v5/CXI/batch-m';O=B/'clover-direct-rgb-q21-r1';O.mkdir(exist_ok=False)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
source=B/'sources/clover-idle-original.mp4';matte=B/'matte-r2/clover-premul.rgba';final=B/'clover-four-plane-q21-r1/source.rgba'
for p,h in [(source,'4bbdffe74e33437d9c7dcdc863be0335ac4680bf42cce7dd05db3b0eaaaae150'),(matte,'c7741308c934b742022fe293dc3419c2d28cb72c3c3d7bc960bb56117e86574f'),(final,'21fd9e6e159cbb1390c96dfc1b3dab4dffaa96d1ecb16ed7a97b0cbfcdecb7ac')]:assert sha(p)==h
prior=json.loads((B/'clover-four-plane-q21-r1/report.json').read_text());w,h=212,260
cmd=['ffmpeg','-nostdin','-v','error','-i',str(source),'-vf','scale=421:512:flags=lanczos','-pix_fmt','rgb24','-f','rawvideo','-']
raw=subprocess.check_output(cmd);frames=np.frombuffer(raw,np.uint8).reshape(300,512,421,3)
mid=np.memmap(matte,np.uint8,'r',shape=(300,390,318,4));old=np.memmap(final,np.uint8,'r',shape=(300,h,w,4));newpath=O/'source.rgba';new=np.memmap(newpath,np.uint8,'w+',shape=old.shape)
report={'utc':datetime.now(timezone.utc).isoformat(),'cat':'clover','status':'STUDY_ONLY','sourceRgba':str(newpath),'originalMatte':{'path':str(matte),'sha256':sha(matte)},'inputs':[{'path':str(p),'sha256':sha(p)}for p in [source,matte,final,Path(__file__)]],'logicalSize':[w,h],'opaqueHeight':256,'frames':300,'fps':30,'duration':10,'scale':2/3,'command':cmd,'decodedStudyRGBSha256':hashlib.sha256(raw).hexdigest(),'rows':[],'alphaChangedPixels':0,'exactMatteRGBReproductions':0,'exactFinalRGBAReproductions':0,'trials':[],'bytePolicy':'report-only','nativeAssetAcceptance':False,'loopAccepted':False,'imagesViewed':0,'limits':'Direct RGB is a control with frozen existing estimated alpha;not groundtruth or matte/seam repair. Source coordinates,foot,bindings and10second timeline unchanged.'}
resize=lambda f,size:cv2.resize(f,size,interpolation=cv2.INTER_AREA)
for i,f in enumerate(frames):
 crop=f[2:502,:409];repro=resize(crop,(318,390));repro[mid[i,:,:,3]==0]=0
 assert np.array_equal(repro,mid[i,:,:,:3]);assert np.array_equal(resize(mid[i],(w,h)),old[i]);report['exactMatteRGBReproductions']+=1;report['exactFinalRGBAReproductions']+=1
 direct=resize(crop,(w,h));direct[old[i,:,:,3]==0]=0;new[i,:,:,:3]=direct;new[i,:,:,3]=old[i,:,:,3]
 assert np.array_equal(new[i,:,:,3],old[i,:,:,3]);delta=np.abs(direct.astype(np.int16)-old[i,:,:,:3].astype(np.int16));a=old[i,:,:,3];row={'frame':i,'strata':{}}
 for key,mask in {'all':np.ones(a.shape,bool),'transparent':a==0,'edge':(a>0)&(a<250),'opaque':a>=250}.items():row['strata'][key]={'pixels':int(mask.sum()),'absoluteSum':int(delta[mask].sum()),'max':int(delta[mask].max())if mask.any()else 0}
 row['clamp']={}
 for key,rgba in [('baseline',old[i]),('direct',new[i])]:
  excess=np.maximum(rgba[:,:,:3].astype(np.int16)-rgba[:,:,3:4].astype(np.int16),0);row['clamp'][key]={'absoluteSum':int(excess.sum()),'affectedPixels':int(np.any(excess>0,axis=2).sum()),'max':int(excess.max())}
 report['rows'].append(row)
new.flush();report['sourceRgbaSha256']=sha(newpath);report['aggregate']={}
for key in ['all','transparent','edge','opaque']:
 count=sum(r['strata'][key]['pixels']for r in report['rows']);report['aggregate'][key]={'pixels':count,'rgbMAE':sum(r['strata'][key]['absoluteSum']for r in report['rows'])/(count*3)if count else 0,'max':max(r['strata'][key]['max']for r in report['rows'])}
report['clampAggregate']={k:{'rgbMAE':sum(r['clamp'][k]['absoluteSum']for r in report['rows'])/(300*w*h*3),'affectedPixels':sum(r['clamp'][k]['affectedPixels']for r in report['rows']),'max':max(r['clamp'][k]['max']for r in report['rows'])}for k in ['baseline','direct']}
(O/'operator-report.json').write_text(json.dumps(report,indent=2)+'\n')
video=O/'ycrcb-crf21.mp4';command=list(prior['trials'][0]['command']);command[-1]=str(video);process=subprocess.Popen(command,stdin=subprocess.PIPE);neutral=np.full((h,w),128,np.uint8).tobytes()
for f in new:
 c=cv2.cvtColor(f[:,:,:3],cv2.COLOR_RGB2YCrCb);tile=np.block([[c[:,:,0],c[:,:,1]],[c[:,:,2],f[:,:,3]]]);process.stdin.write(tile.tobytes()+neutral+neutral)
process.stdin.close();assert process.wait()==0
encoded=O/'decoded.rgb';subprocess.run(['ffmpeg','-nostdin','-v','error','-i',str(video),'-vf','scale=in_color_matrix=bt601:in_range=full:out_range=full','-pix_fmt','rgb24','-f','rawvideo',str(encoded)],check=True,stdin=subprocess.DEVNULL)
dec=np.memmap(encoded,np.uint8,'r',shape=(300,h*2,w*2,3));white=[];black=[];edge=[];mask=[]
for f,packed in zip(new,dec):
 tile=packed[:,:,0];color=cv2.cvtColor(np.dstack([tile[:h,:w],tile[:h,w:],tile[h:,:w]]),cv2.COLOR_YCrCb2RGB).astype(float);alpha=tile[h:,w:].astype(float);src=f.astype(float);err=np.abs(np.clip(color+255-alpha[:,:,None],0,255)-np.clip(src[:,:,:3]+255-src[:,:,3:4],0,255));fg=f[:,:,3]>16;boundary=(f[:,:,3]>4)&(f[:,:,3]<250)
 white.append(float(err[fg].mean()));black.append(float(np.abs(color-src[:,:,:3])[fg].mean()));edge.append(float(err[boundary].mean()));mask.append(float(np.abs(alpha-src[:,:,3]).mean()))
trial={'mode':'ycrcb','video':str(video),'bytes':video.stat().st_size,'sha256':sha(video),'encodedDimensions':[w*2,h*2],'foregroundWhiteMAE':float(np.mean(white)),'foregroundBlackMAE':float(np.mean(black)),'edgeFrameMax':max(edge),'maskMAE':float(np.mean(mask)),'command':command};trial['numericPass']=trial['foregroundWhiteMAE']<=3 and trial['edgeFrameMax']<=15 and trial['maskMAE']<=2;report['trials']=[trial]
(O/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'operator':report['aggregate'],'clamp':report['clampAggregate'],'trial':{k:v for k,v in trial.items()if k!='command'}}),flush=True)
