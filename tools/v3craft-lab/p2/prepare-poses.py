"""Soot authoring normalization; measured method from LEARN/P1-poses and P2.

No source drawing is overwritten. Final exports require --export after review.
"""
from pathlib import Path
import datetime, json, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import binary_dilation
from scipy.cluster.vq import kmeans2
from scipy.optimize import linear_sum_assignment
from skimage.color import rgb2lab, deltaE_ciede2000

root=Path('tools/v3craft-lab/p2');raw=root/'raw';normal=raw/'normalized';normal.mkdir(parents=True,exist_ok=True)
base=Image.open('apps/web/public/units/soot/runtime.webp').convert('RGBA')
def bounds(im):
    y,x=np.where(np.asarray(im)[:,:,3]>=128)
    return np.array([x.min(),y.min(),x.max()+1,y.max()+1],dtype=int)
def foot(im):
    a=np.asarray(im)[:,:,3]>=128;b=bounds(im);y,x=np.where(a & (np.indices(a.shape)[0]>=b[3]-5))
    return np.array([x.mean(),b[3]],dtype=float)
def palette(im):
    a=np.asarray(im);p=a[:,:,:3][a[:,:,3]>=128][::8]/255
    return kmeans2(rgb2lab(p.reshape(-1,1,3)).reshape(-1,3),6,iter=60,minit='++',seed=42)[0]
def delta(a,b):
    cost=deltaE_ciede2000(a[:,None,:],b[None,:,:]);i,j=linear_sum_assignment(cost)
    return float(cost[i,j].mean())
def clean(im):
    a=np.array(im);keep=binary_dilation(a[:,:,3]>=160,iterations=2)
    a[:,:,3]=np.where(keep & (a[:,:,3]>=4),a[:,:,3],0)
    return Image.fromarray(a)
def match(im):
    a=np.array(im);ref=np.asarray(base);valid=a[:,:,3]>=128;refvalid=ref[:,:,3]>=128
    for channel in range(3):
        v,c=np.unique(a[:,:,channel][valid],return_counts=True)
        rv,rc=np.unique(ref[:,:,channel][refvalid],return_counts=True)
        q=np.cumsum(c)/c.sum();rq=np.cumsum(rc)/rc.sum()
        lut=np.interp(np.arange(256),v,np.interp(q,rq,rv))
        a[:,:,channel]=np.round(lut[a[:,:,channel]]).astype(np.uint8)
    return Image.fromarray(a)

# Anatomical ear-tip to lowest chin fur, excluding cloak; author checked on small sheets.
heads={'K0':[191,355], 'K1-A1':[336,675], 'K1-A2':[373,700], 'K1-A3':[394,708], 'K1-A4':[369,684],
       'K2-A1':[315,657], 'K2-A2':[394,724], 'K2-A3':[396,714], 'K2-A4':[387,696],
       'K4-A1':[410,697], 'K4-A2':[418,694], 'K4-A3':[372,707], 'K4-A4':[432,725],
       'K5-A1':[375,695], 'K5-A2':[377,695], 'K5-A3':[363,682], 'K5-A4':[378,701]}
selections={'K1':'K1-A2','K2':'K2-A4','K4':'K4-A4','K5':'K5-A2'}
second={'K1':'K1-A3','K2':'K2-A3','K4':'K4-A1','K5':'K5-A1'}
bb=bounds(base);bf=foot(base);bh=int(bb[3]-bb[1]);bp=palette(base);baseMask=np.asarray(base)[:,:,3]>=128
rows=[];images={'K0':base};transforms={}
for pose in ['K1','K2','K4','K5']:
    for i in range(1,5):
        key=f'{pose}-A{i}';path=Path(f'tools/v3craft-lab/poses/raw/soot/{key}.png')
        if not path.exists():path=Path(f'tools/v3craft-lab/poses/raw/soot-{key}.png')
        source=Image.open(path).convert('RGBA');im=clean(source);b=bounds(im);f=foot(im);scale=bh/(b[3]-b[1]);offset=np.rint(bf-f*scale).astype(int)
        scaled=match(im).resize(tuple(np.rint(np.array(im.size)*scale).astype(int)),Image.Resampling.LANCZOS)
        target=Image.new('RGBA',base.size);target.alpha_composite(scaled,tuple(offset));target.save(normal/f'{key}.png')
        images[key]=target;mask=np.asarray(target)[:,:,3]>=128;nb=bounds(target)
        unbounded=b*np.array([scale,scale,scale,scale])+np.tile(offset,2)
        clipped=bool(unbounded[0]<0 or unbounded[1]<0 or unbounded[2]>base.width or unbounded[3]>base.height)
        ratio=((heads[key][1]-heads[key][0])/(b[3]-b[1]))/((heads['K0'][1]-heads['K0'][0])/bh)
        iou=float((mask&baseMask).sum()/(mask|baseMask).sum());reach=float((nb[2]-bb[2])/bh)
        de=delta(bp,palette(target));rawDelta=delta(bp,palette(im))
        numeric=bool(de<=8 and .92<=ratio<=1.08 and not clipped and (pose!='K1' or iou<=.85) and (pose!='K2' or (iou<=.75 and reach>=.12)))
        rows.append(dict(candidate=key,source=str(path),iou=iou,frontReachBodyFraction=reach,paletteDeltaE00=de,rawPaletteDeltaE00=rawDelta,headRatioRelative=ratio,clipped=clipped,heightPx=int(nb[3]-nb[1]),alignmentFootDriftPx=int(abs(nb[3]-bb[3])),numericPass=numeric,accepted=False))
        transforms[key]=dict(scale=float(scale),offset=offset.tolist(),sourceFoot=f.tolist(),sourceBounds=b.tolist(),headSource=heads[key])
    # Best two at 2x 196px field height, stacked to retain wide strike silhouettes.
    sheet=Image.new('RGB',(1024,900),'#272437');draw=ImageDraw.Draw(sheet)
    for row,key in enumerate([selections[pose],second[pose]]):
        im=images[key];b=bounds(im);crop=im.crop((max(0,b[0]-8),max(0,b[1]-8),min(640,b[2]+8),min(640,b[3]+8)))
        factor=392/bh;crop=crop.resize((round(crop.width*factor),round(crop.height*factor)),Image.Resampling.LANCZOS)
        sheet.paste(crop,(35,row*450+35),crop)
        comparison=base.crop(tuple(bb));comparison=comparison.resize((round(comparison.width*factor),392),Image.Resampling.LANCZOS);sheet.paste(comparison,(680,row*450+35),comparison)
        draw.text((10,row*450+7),key+' at2x field | K0 comparison right',fill='white')
    sheet.save(raw/f'{pose}-best-two.jpg',quality=93)
result=dict(at=datetime.datetime.now(datetime.timezone.utc).isoformat(),scope='Art selection only; normalized feet are imposed alignment, not runtime acceptance',
    recipe='Core alpha160 dilated2px; discard alpha<4; opaque-only per-channel quantile histogram matching to approved K0; Lanczos common opaque height and bottom-five-row contact centroid.',
    baseBounds=bb.tolist(),baseFoot=bf.tolist(),headLandmarks=heads,transforms=transforms,rows=rows,selections=selections,second=second,productionAccepted=False)
(root/'pose-art.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(rows))
if '--export' in sys.argv:
    for selected in selections.values():assert next(r for r in rows if r['candidate']==selected)['numericPass'],selected
    out=Path('apps/web/public/units/soot/poses');out.mkdir(parents=True,exist_ok=True)
    for pose,selected in {'K0':'K0',**selections}.items():images[selected].save(out/f'{pose}.webp',lossless=True,method=6)
