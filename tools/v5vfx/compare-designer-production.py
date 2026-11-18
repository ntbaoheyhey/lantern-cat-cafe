"""Equal-height, 1x commissioned source beside own production capture."""
from pathlib import Path
import sys,json,subprocess,hashlib,datetime
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'work/v5/CXV/python'))
import cv2,numpy as np
out=Path(sys.argv[1]).resolve();assert out.is_relative_to(ROOT/'work/v5/CXV')
capture=out/'report.json';report=json.loads(capture.read_text());assert report['pass']
cat=report['cat'];assert cat in ['mochi','clover']
source_path=ROOT/f'work/v5/CXV/ref/batch-m/{cat}-frames.npy';source=np.load(source_path,mmap_mode='r')
union={'mochi':[43,34,562,465],'clover':[2,6,507,623]}[cat]
first=next(r for r in report['rows'] if not r['reduced'] and r['frame']==0);body=first['body'];target=round(body['height'])
left=max(0,int(np.floor(body['x']-24)));top=max(0,int(np.floor(body['y']-24)));right=min(1280,int(np.ceil(body['x']+body['width']+24)));bottom=min(720,int(np.ceil(body['y']+body['height']+24)))
video=out/f'{cat}-source-vs-production-1280x720.mp4';assert not video.exists()
process=subprocess.Popen(['ffmpeg','-v','error','-f','rawvideo','-pix_fmt','bgr24','-s','1280x720','-r','30','-i','-','-c:v','libx264','-crf','19','-pix_fmt','yuv420p',str(video)],stdin=subprocess.PIPE)
previews=[]
try:
 for frame in range(300):
  canvas=np.full((720,1280,3),24,np.uint8);cv2.line(canvas,(640,150),(640,620),(80,80,80),1)
  original=source[frame,union[1]:union[3],union[0]:union[2]];original=cv2.resize(original,(round(original.shape[1]*target/original.shape[0]),target),interpolation=cv2.INTER_AREA)
  x=(640-original.shape[1])//2;canvas[500-target:500,x:x+original.shape[1]]=original
  path=out/'frames'/f'{frame:03d}.png';shot=cv2.imread(str(path));assert shot.shape[:2]==(720,1280)
  crop=shot[top:bottom,left:right];x=640+(640-crop.shape[1])//2;y=round(500-(body['y']+body['height']-top));assert y>=150 and y+crop.shape[0]<620
  canvas[y:y+crop.shape[0],x:x+crop.shape[1]]=crop
  for xx,title in [(55,cat.title()+' - commissioned source'),(695,cat.title()+' - captured production candidate')]:
   cv2.putText(canvas,title,(xx,95),cv2.FONT_HERSHEY_SIMPLEX,.67,(235,235,235),1,cv2.LINE_AA)
   cv2.putText(canvas,f'1x / {target}px measured body / source frame {frame:03d}',(xx,130),cv2.FONT_HERSHEY_SIMPLEX,.54,(200,200,200),1,cv2.LINE_AA)
  cv2.putText(canvas,'Left: original black MP4. Right: real battle crop, exact native decoder phase; deterministic 30Hz capture.',(40,650),cv2.FONT_HERSHEY_SIMPLEX,.55,(185,185,185),1,cv2.LINE_AA)
  cv2.putText(canvas,'Candidate '+report['sourceCommit'][:9]+' / full judge route at1280x720 / no realtime performance claim',(40,682),cv2.FONT_HERSHEY_SIMPLEX,.52,(185,185,185),1,cv2.LINE_AA)
  process.stdin.write(canvas.tobytes())
  if frame in [0,99,199,299]:
   small=cv2.resize(canvas,(1024,576),interpolation=cv2.INTER_AREA);p=out/f'comparison-{frame:03d}.jpg';assert not p.exists();cv2.imwrite(str(p),small,[cv2.IMWRITE_JPEG_QUALITY,92])
   previews.append({'frame':frame,'path':str(p),'dimensions':[1024,576],'bytes':p.stat().st_size,'rgbMean':small.mean(axis=(0,1))[::-1].tolist(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'reviewed':False,'views':0})
finally:
 process.stdin.close()
assert process.wait()==0
result={'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'cat':cat,'sourceCommit':report['sourceCommit'],'indexSha256':report['indexSha256'],'url':report['url'],'capture':str(capture),'captureSha256':hashlib.sha256(capture.read_bytes()).hexdigest(),'sourceFrames':str(source_path),'sourceCrop':union,'sourcePhase':'frames0..299/30Hz','candidatePhase':'native decoder0..299, phase offset removed','sameBodyHeightPx':target,'candidateMeasuredBodyHeight':body['height'],'crop':[left,top,right,bottom],'video':str(video),'videoSha256':hashlib.sha256(video.read_bytes()).hexdigest(),'frames':300,'fps':30,'durationSeconds':10,'dimensions':[1280,720],'previews':previews,'limits':'Equal-height motion comparison, not an alpha reconstruction or realtime FPS test. Source black background is retained and labelled.'}
(out/'comparison.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'video':str(video),'height':target,'previews':len(previews)}))
