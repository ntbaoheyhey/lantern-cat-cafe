"""Make coordinate-bound source diagnostic plots; never warp or change runtime art."""
from pathlib import Path
import datetime,hashlib,json,sys
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'work/v5/CXV/python'))
import cv2,numpy as np
cv2.setNumThreads(1)
BASE=Path('/Users/bao/taskbar-hero-chain/work/v5/CXI/batch-m')
OUT=ROOT/'work/v5/CXV/batch-m/clover-boundary-study-R1'
assert OUT.exists() and not (OUT/'plots.json').exists()
hashfile=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
rawpath=BASE/'matte-r2/clover-premul.rgba'
maskpath=BASE/'clover-dis-endpoint-r1/mask.npy'
mapath=BASE/'clover-rigid-endpoint-r1/mapping.npy'
assert hashfile(rawpath)=='c7741308c934b742022fe293dc3419c2d28cb72c3c3d7bc960bb56117e86574f'
assert hashfile(maskpath)=='50744fec83b0552a8651184b4455cab2dc94b3db6e8407e4387620270af5e8f8'
assert hashfile(mapath)=='2b6ebe61c6c57b2678d011218475b7de8283e2b03f3f858a8f4e6a8644b4be37'
mask=np.load(maskpath);assert mask.shape==(390,318)
raw=np.memmap(rawpath,np.uint8,'r',shape=(300,390,318,4))
roi=[0,215,140,160];x,y,w,h=roi;scale=3;images=[]
for frame in (0,299):
    rgba=np.asarray(raw[frame]).astype(float)
    rgb=np.clip(rgba[:,:,:3]+(1-rgba[:,:,3:4]/255)*220,0,255).astype(np.uint8)
    crop=rgb[y:y+h,x:x+w,::-1].copy();assert crop.shape==(160,140,3)
    plain=cv2.resize(crop,(w*scale,h*scale),interpolation=cv2.INTER_NEAREST)
    over=plain.copy()
    for level,color in ((.001,(20,20,240)),(.999,(240,190,0))):
        binary=(mask[y:y+h,x:x+w]>=level).astype(np.uint8)
        contours,_=cv2.findContours(binary,cv2.RETR_LIST,cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(over,[c*scale+1 for c in contours],-1,color,1)
    canvas=np.full((568,936,3),246,np.uint8)
    cv2.putText(canvas,f'Clover F{frame} | source pixels, no warp | ROI {roi}',(18,22),cv2.FONT_HERSHEY_SIMPLEX,.53,(20,20,20),1,cv2.LINE_AA)
    for left,img,label in ((36,plain,'source over gray'),(504,over,'existing protection boundary')):
        cv2.putText(canvas,label,(left,44),cv2.FONT_HERSHEY_SIMPLEX,.48,(20,20,20),1,cv2.LINE_AA)
        canvas[66:66+h*scale,left:left+w*scale]=img
        for xx in range(0,w,20):
            cv2.putText(canvas,str(xx+x),(left+xx*scale,61),cv2.FONT_HERSHEY_SIMPLEX,.32,(20,20,20),1)
        for yy in range(5,h,20):
            cv2.putText(canvas,str(yy+y),(left-30,66+yy*scale+3),cv2.FONT_HERSHEY_SIMPLEX,.32,(20,20,20),1)
    cv2.putText(canvas,'Red: any warp allowance. Cyan: full allowance. Neither line establishes anatomy.',(18,560),cv2.FONT_HERSHEY_SIMPLEX,.43,(20,20,20),1,cv2.LINE_AA)
    p=OUT/f'source-domain-F{frame}.png';assert not p.exists();assert cv2.imwrite(str(p),canvas)
    images.append(dict(frame=frame,path=str(p),sha256=hashfile(p),dimensions=[936,568],sourceRoi=roi,scale=scale,plainOrigin=[36,66],annotatedOrigin=[504,66],reviewed=False,views=0,bytes=p.stat().st_size,cropRGBMean=float(crop.mean()),cropRGBStdDev=float(crop.std()),sourceRGBAFrameSha256=hashlib.sha256(raw[frame].tobytes()).hexdigest()))
report=dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),source=dict(path=str(rawpath),sha256=hashfile(rawpath),shape=[300,390,318,4],premultiplied=True),original=dict(path='/Users/bao/Downloads/clover.mp4',sha256=hashfile('/Users/bao/Downloads/clover.mp4')),mask=dict(path=str(maskpath),sha256=hashfile(maskpath)),failedMapping=dict(path=str(mapath),sha256=hashfile(mapath)),harnessSha256=hashfile(__file__),method='Fresh nearest-neighbor coordinate plots of unchanged premultiplied source RGBA over gray, alongside pre-existing mask contours. No failed warp rendered; no inferred layer or alpha export.',images=images,runtimeChanged=False,sequenceChanged=False)
(OUT/'plots.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
