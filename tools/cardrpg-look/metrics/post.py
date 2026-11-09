"""F4 inner-face masks, direct component deltas and gradient retention."""
import json,sys
from pathlib import Path
import numpy as np
import cv2
from PIL import Image
root=Path(sys.argv[1]);receipt=json.loads((root/'checks.json').read_text());rows=[]
for row in receipt['rows']:
    full=np.array(Image.open(root/row['images']['full']).convert('RGB'),dtype=float)
    h,w=full.shape[:2];yy,xx=np.ogrid[:h,:w]
    for component in ['bloom','focus','occlusion']:
        other=np.array(Image.open(root/row['images'][component+'Off']).convert('RGB'),dtype=float)
        delta=np.abs(full-other).max(axis=2)
        for index,(x,y,rx,ry) in enumerate(row['masks']):
            if rx<=0 or ry<=0: continue
            face=((xx/w-x)/rx)**2+((1-yy/h-y)/ry)**2<.64
            if not face.any(): continue
            lap=lambda a:cv2.Laplacian(a@np.array([.2126,.7152,.0722]),cv2.CV_64F)[face].var()
            sharp,base=lap(full),lap(other)
            rows.append(dict(quality=row['quality'],component=component,face=index,pixels=int(face.sum()),meanRgbDelta=float(delta[face].mean()),fractionAbove8=float((delta[face]>8).mean()),maxRgbDelta=float(delta[face].max()),sharpnessRatio=float(sharp/max(base,1e-9))))
offenders=[r for r in rows if r['component'] in ['bloom','focus'] and (r['fractionAbove8']>.01 or r['sharpnessRatio']<.98)]
result={'artifact':receipt['sha256'],'method':'F4 inner ellipse radius^2<.64; bloom/focus <=1% pixels delta>8 and >=98% Laplacian variance. AO measured separately, not exempted silently.','rows':rows,'offenders':offenders}
(root/'metrics.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'faces':len(rows),'offenders':len(offenders)}))
if offenders:sys.exit(1)
