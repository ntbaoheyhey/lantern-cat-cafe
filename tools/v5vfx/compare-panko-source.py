"""Same-height 1x study film; source art stays labelled separately from captured gameplay."""
from pathlib import Path
import sys,json,subprocess,hashlib,datetime
sys.path.insert(0,str(Path('work/v5/CXV/python').resolve()))
import cv2,numpy as np
p=Path(sys.argv[1] if len(sys.argv)>1 else 'work/v5/CXV/films/M-V1-panko-R1');r=json.loads((p/'report.json').read_text());mode=r['modes'][-1];box=mode['box'];body=box['body'];target=round(body['height']);source=np.load('work/v5/CXV/ref/batch-m/mochi-frames.npy',mmap_mode='r');union=[43,34,562,465];video=p/'panko-vs-mochi-1280x720.mp4'
proc=subprocess.Popen(['ffmpeg','-hide_banner','-loglevel','error','-f','rawvideo','-pix_fmt','bgr24','-s','1280x720','-r','30','-i','-','-c:v','libx264','-crf','19','-pix_fmt','yuv420p','-y',str(video)],stdin=subprocess.PIPE)
selected=[]
for i in range(300):
 im=np.full((720,1280,3),24,np.uint8);cv2.line(im,(640,150),(640,620),(80,80,80),1)
 ref=source[i,union[1]:union[3],union[0]:union[2]];ref=cv2.resize(ref,(round(ref.shape[1]*target/ref.shape[0]),target),interpolation=cv2.INTER_AREA);x=(640-ref.shape[1])//2;y=500-ref.shape[0];im[y:500,x:x+ref.shape[1]]=ref
 shot=cv2.imread(str(p/mode['mode']/'frames'/f'{i:03d}.png'));crop=shot[box['y']:box['y']+box['height'],box['x']:box['x']+box['width']];x=640+(640-crop.shape[1])//2;y=round(500-(body['y']+body['height']-box['y']));im[y:y+crop.shape[0],x:x+crop.shape[1]]=crop
 for xx,title in [(70,'Mochi - commissioned source MP4'),(710,'Panko - captured dev prototype')]:
  cv2.putText(im,title,(xx,100),cv2.FONT_HERSHEY_SIMPLEX,.72,(235,235,235),1,cv2.LINE_AA)
  cv2.putText(im,f'1x speed / {target}px body height / {i/30:.2f}s',(xx,135),cv2.FONT_HERSHEY_SIMPLEX,.55,(200,200,200),1,cv2.LINE_AA)
 cv2.putText(im,'Designer black source is not the delivery matte. Right: paused simulation sampled at 30Hz, full route 1280x720.',(48,650),cv2.FONT_HERSHEY_SIMPLEX,.53,(185,185,185),1,cv2.LINE_AA)
 proc.stdin.write(im.tobytes())
 if i in [15,75,165,255]:
  small=cv2.resize(im,(1024,576),interpolation=cv2.INTER_AREA);path=p/f'comparison-{i}.jpg';cv2.imwrite(str(path),small,[cv2.IMWRITE_JPEG_QUALITY,90]);selected.append({'frame':i,'path':str(path.resolve()),'width':1024,'height':576,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
proc.stdin.close();code=proc.wait();assert code==0
report={'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'video':str(video.resolve()),'sha256':hashlib.sha256(video.read_bytes()).hexdigest(),'dimensions':[1280,720],'frames':300,'fps':30,'durationSeconds':10,'sameBodyHeightPx':target,'sourceHeightPx':431,'pankoMeasuredHeight':body['height'],'sourcePhase':'F0..299','pankoPhase':'simulation20+n/30 plus existing per-actor idle offset','captureReport':str((p/'report.json').resolve()),'captureReportSha256':hashlib.sha256((p/'report.json').read_bytes()).hexdigest(),'reviews':selected,'limitation':'Captured deterministic dev study; no delivery alpha or performance claim.'};(p/'comparison.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
