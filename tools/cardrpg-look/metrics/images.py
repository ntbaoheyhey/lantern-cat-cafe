"""Image measurements support visual judgement; projected boxes are not semantic masks."""
import argparse,json
from pathlib import Path
import cv2,numpy as np
from PIL import Image,ImageDraw
from skimage.metrics import structural_similarity
p=argparse.ArgumentParser();p.add_argument('directory');p.add_argument('--before');a=p.parse_args()
root=Path(a.directory); manifest=json.loads((root/'captures.json').read_text()); rows=[]
def crop(im,box):
    x0,y0,x1,y1=box; h,w=im.shape[:2]
    return im[max(0,int(y0)):min(h,int(y1)),max(0,int(x0)):min(w,int(x1))]
def measures(im):
    gray=cv2.cvtColor(im,cv2.COLOR_RGB2GRAY); hsv=cv2.cvtColor(im,cv2.COLOR_RGB2HSV)
    edges=cv2.Canny(gray,50,140); count,labels,stats,_=cv2.connectedComponentsWithStats(edges)
    lengths=stats[1:,cv2.CC_STAT_AREA]; ink=(gray<60).astype(np.uint8)
    thickness=cv2.distanceTransform(ink,cv2.DIST_L2,3)[ink>0]*2
    quant=(im.astype(np.int32)//32).reshape(-1,3)
    codes=quant[:,0]*64+quant[:,1]*8+quant[:,2]
    n=np.bincount(codes,minlength=512); order=np.argsort(n)[-6:][::-1]
    colors=np.array([[(i//64)*32+16,((i//8)%8)*32+16,(i%8)*32+16] for i in range(512)])
    return {'laplacianVariance':float(cv2.Laplacian(gray,cv2.CV_64F).var()),
      'edgeContinuity':float(lengths[lengths>=8].sum()/max(1,lengths.sum())),
      'meanLuminance':float(gray.mean()/255),'meanSaturation':float(hsv[:,:,1].mean()/255),
      'valueBins':(np.bincount(np.digitize(gray,[85,170]).ravel(),minlength=3)/gray.size).tolist(),
      'palette':[{'hex':'#'+''.join(f'{v:02x}' for v in colors[i]),'fraction':float(n[i]/len(quant))} for i in order],
      'darkStrokeWidthStd':float(thickness.std()) if len(thickness) else None,
      'outlineNote':'Dark-region distance transform proxy, not isolated silhouette thickness.'}
for row in manifest['rows']:
    im=np.array(Image.open(root/row['file']).convert('RGB')); dpr=manifest.get('dpr',2)
    measured={'file':row['file'],'kind':row['kind'],'whole':measures(im),'subjects':[]}
    mask=np.ones(im.shape[:2],dtype=bool)
    for subject in row.get('crops',[]):
        x0,y0,x1,y1=[int(v*dpr) for v in subject['box']]
        mask[max(0,y0):min(im.shape[0],y1),max(0,x0):min(im.shape[1],x1)]=False
    c=row.get('canvas')
    if c:
        canvasMask=np.zeros_like(mask);x,y,w,h=[int(c[k]*dpr) for k in ['x','y','width','height']]
        canvasMask[max(0,y):y+h,max(0,x):x+w]=True; mask &= canvasMask
    background=im[mask]
    backgroundY=float(cv2.cvtColor(background.reshape(1,-1,3),cv2.COLOR_RGB2GRAY).mean()/255) if len(background) else 0
    backgroundS=float(cv2.cvtColor(background.reshape(1,-1,3),cv2.COLOR_RGB2HSV)[:,:,1].mean()/255) if len(background) else 0
    measured['background']={'luminance':backgroundY,'saturation':backgroundS,'mask':'canvas excluding projected subject bounds'}
    for s in row.get('crops',[]):
        box=[v*dpr for v in s['box']]; subject=crop(im,box)
        if not subject.size:continue
        v=measures(subject);v.update({'asset':s['asset'],'box':box,'pixels':list(subject.shape[:2])})
        v['backgroundLuminanceSeparation']=abs(v['meanLuminance']-backgroundY)
        v['subjectBackgroundContrast']=(max(v['meanLuminance'],backgroundY)+.05)/(min(v['meanLuminance'],backgroundY)+.05)
        v['subjectBackgroundSaturationRatio']=v['meanSaturation']/max(.001,backgroundS)
        measured['subjects'].append(v)
    if a.before and (Path(a.before)/row['file']).exists():
        prev=np.array(Image.open(Path(a.before)/row['file']).convert('RGB'))
        if prev.shape==im.shape:
            measured['ssim']=float(structural_similarity(prev,im,channel_axis=2,data_range=255))
            measured['meanAbsolutePixelDifference']=float(np.abs(prev.astype(float)-im).mean())
    rows.append(measured)
    if row['kind'] in ['unit','stage']:
        small=cv2.resize(im,(640,round(im.shape[0]*640/im.shape[1])),interpolation=cv2.INTER_AREA)
        g=cv2.cvtColor(small,cv2.COLOR_RGB2GRAY); squint=np.choose(np.digitize(g,[85,170]),[40,128,220]).astype('uint8')
        dest=root/'squint';dest.mkdir(exist_ok=True);Image.fromarray(squint).save(dest/row['file'])
(root/'metrics.json').write_text(json.dumps({'method':'Laplacian/Canny/3-value/quantized-palette; crops include occluders/background. No invented perceptual pass. Texel density requires separate mesh UV analysis.','rows':rows},indent=2)+'\n')
print(json.dumps({'images':len(rows),'subjects':sum(len(r['subjects']) for r in rows)}))
