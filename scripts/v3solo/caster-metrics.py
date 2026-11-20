"""Camera-independent, translation-registered original caster silhouette change."""
import sys,json,hashlib
from pathlib import Path
import cv2,numpy as np
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[2]
label=sys.argv[1] if len(sys.argv)>1 else 'gesture1'
out=root/'reports/v3-solo/Q7'/f'{label}-casters'
data=json.loads((out/'capture.json').read_text());rows=[]
for row in data['rows']:
 masks=[]
 for frame in [12,54]:
  source=next(r for r in row['frames'] if r['frame']==frame)
  path=root/source['path'];assert hashlib.sha256(path.read_bytes()).hexdigest()==source['sha256']
  image=cv2.imread(str(path),cv2.IMREAD_UNCHANGED)
  masks.append((cv2.resize(image[:,:,3],(640,360),interpolation=cv2.INTER_AREA)>=64).astype(np.float32))
 a,b=masks
 assert a.sum()>1000 and b.sum()>1000,row['id']
 raw=float((a*b).sum()/((a+b)>0).sum())
 padded=np.pad(a,((360,360),(640,640)))
 _,intersection,_,location=cv2.minMaxLoc(cv2.matchTemplate(padded,b,cv2.TM_CCORR));intersection=round(intersection)
 iou=float(intersection/(a.sum()+b.sum()-intersection))
 rows.append({'id':row['id'],'source':row['source'],'fixedRootIoU':raw,'casterIoU':iou,'registration':[location[0]-640,location[1]-360],'entranceArea':int(a.sum()),'climaxArea':int(b.sum()),'frames':row['frames'],'motion':row.get('motion')})
 print(row['id'],round(iou,4),'PASS' if iou<=.85 else 'FAIL')
 # Each review image contains only three pose samples; original art, no refs.
 sheet=Image.new('RGB',(1200,450),'#191827');draw=ImageDraw.Draw(sheet)
 for i,frame in enumerate([12,35,54]):
  im=Image.open(out/f'{row["id"]}-{frame}.png')
  box=im.getbbox();assert box
  im=im.crop((max(0,box[0]-20),max(0,box[1]-20),min(1280,box[2]+20),min(720,box[3]+20)))
  im.thumbnail((390,390));sheet.paste(im,(i*400+(400-im.width)//2,40+(390-im.height)//2),im)
  draw.text((i*400+10,12),f'{row["id"]} | frame {frame}',fill='white')
 draw.text((10,432),f'Translation-registered IoU: {iou:.4f}; fixed-root IoU: {raw:.4f}',fill='white')
 sheet.save(out/f'{row["id"]}-review.jpg')
result={'_meta':data['_meta'],'method':'Alpha>=64 at640x360. Maximize intersection under translation only by cross-correlation. No scale/rotation fitting. Fixed camera, root angle and360px semantic height. Higher registered IoU conservatively rejects camera-only differences.','plates':rows}
(out/'silhouettes.json').write_text(json.dumps(result,indent=2)+'\n')
