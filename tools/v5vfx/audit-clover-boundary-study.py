"""Audit sparse analyst endpoint labels; does not generate or accept a repair."""
from pathlib import Path
import ast,datetime,hashlib,json,sys
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'work/v5/CXV/python'))
import cv2,numpy as np
cv2.setNumThreads(1)
BASE=Path('/Users/bao/taskbar-hero-chain/work/v5/CXI/batch-m')
OUT=ROOT/'work/v5/CXV/batch-m/clover-boundary-study-R1'
assert not (OUT/'audit.json').exists()
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
annpath=OUT/'annotations.json';ann=json.loads(annpath.read_text())
assert sha(ann['source']['path'])==ann['source']['sha256']
raw=np.memmap(ann['source']['path'],np.uint8,'r',shape=(300,390,318,4))
mask=np.load(BASE/'clover-dis-endpoint-r1/mask.npy');h,w=mask.shape
labels={};regions=[];images=[];yy,xx=np.mgrid[:h,:w].astype(float);grid=np.stack((xx,yy),axis=-1)
extent=(yy>=232)&(yy<358)&(xx<118)
def warm(frame):
    f=raw[frame];red,green,blue=np.moveaxis(f[:,:,:3].astype(float),-1,0)
    z=((red>green*1.035)&(red>blue*1.15)&(f[:,:,3]>48)&extent).astype(np.uint8)
    n,l,stats,c=cv2.connectedComponentsWithStats(z,8)
    return l==1+np.argmax(stats[1:,cv2.CC_STAT_AREA])
for entry in ann['frames']:
    frame=entry['frame'];f=raw[frame];lab=np.zeros((h,w),np.uint8);heuristic=warm(frame)
    for group,value in [('certainTail',1),('certainCloth',2)]:
        for region in entry[group]:
            poly=np.array(region['polygon'],np.int32);assert (poly>=0).all() and (poly[:,0]<w).all() and (poly[:,1]<h).all()
            region_mask=np.zeros((h,w),np.uint8);cv2.fillPoly(region_mask,[poly],1);region_mask=region_mask.astype(bool)
            assert not np.any(lab[region_mask]),'Conflicting semantic labels'
            assert np.all(f[:,:,3][region_mask]>=250),'Certain interior label touches transparent edge'
            lab[region_mask]=value
            regions.append(dict(frame=frame,name=region['name'],className=group,pixels=int(region_mask.sum()),minAlpha=int(f[:,:,3][region_mask].min()),warmHeuristicPixels=int((region_mask&heuristic).sum()),protectedPixels=int((region_mask&(mask==0)).sum()),transitionPixels=int((region_mask&(mask>0)&(mask<.999999)).sum())))
    lab[(lab==0)&(f[:,:,3]<=4)]=3;labels[frame]=lab;np.save(OUT/f'sparse-labels-F{frame}.npy',lab)
    rgb=np.clip(f[:,:,:3].astype(float)+(1-f[:,:,3:4]/255)*220,0,255).astype(np.uint8)
    overlay=rgb.copy();colors={1:[35,120,245],2:[220,50,150]}
    for value,color in colors.items():overlay[lab==value]=np.round(.65*overlay[lab==value]+.35*np.array(color)).astype(np.uint8)
    canvas=np.full((560,936,3),246,np.uint8)
    cv2.putText(canvas,f'F{frame}: sparse endpoint labels; remaining visible pixels UNKNOWN',(18,22),cv2.FONT_HERSHEY_SIMPLEX,.5,(20,20,20),1,cv2.LINE_AA)
    for left,img,title in [(36,rgb,'source'),(504,overlay,'blue tail interior / pink front cloth')]:
        tile=img[215:375,:140,::-1];canvas[66:546,left:left+420]=cv2.resize(tile,(420,480),interpolation=cv2.INTER_NEAREST)
        cv2.putText(canvas,title,(left,44),cv2.FONT_HERSHEY_SIMPLEX,.43,(20,20,20),1,cv2.LINE_AA)
        for x in range(0,140,20):cv2.putText(canvas,str(x),(left+x*3,61),cv2.FONT_HERSHEY_SIMPLEX,.32,(20,20,20),1)
        for y in range(220,375,20):cv2.putText(canvas,str(y),(left-30,66+(y-215)*3+3),cv2.FONT_HERSHEY_SIMPLEX,.32,(20,20,20),1)
    path=OUT/f'labels-F{frame}.png';assert not path.exists();assert cv2.imwrite(str(path),canvas)
    images.append(dict(path=str(path),sha256=sha(path),dimensions=[936,560],frame=frame,reviewed=False,views=0))
prior=json.loads((BASE/'clover-rigid-endpoint-r1/report.json').read_text());tool=Path('/Users/bao/taskbar-hero-chain/tools/v5int/study-clover-rigid-endpoint.py')
assert sha(tool)==prior['toolSha256']
tree=ast.parse(tool.read_text());definition=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='rigid_mls');ns={'np':np}
exec(compile(ast.Module(body=[definition],type_ignores=[]),str(tool),'exec'),ns)
unmasked=ns['rigid_mls'](grid,np.array(prior['controls']),np.array(prior['targets']));saved=np.load(BASE/'clover-rigid-endpoint-r1/mapping.npy');assert np.array_equal(grid+(unmasked-grid)*mask[...,None],saved)
def support(mapping,source_labels):
    floor=np.floor(mapping).astype(np.int64);fraction=mapping-floor;weights=np.zeros((h,w,5),float)
    for dx,dy in ((0,0),(1,0),(0,1),(1,1)):
        x,y=floor[...,0]+dx,floor[...,1]+dy;valid=(x>=0)&(x<w)&(y>=0)&(y<h)
        category=np.where(valid,source_labels[np.clip(y,0,h-1),np.clip(x,0,w-1)],4)
        weight=(fraction[...,0] if dx else 1-fraction[...,0])*(fraction[...,1] if dy else 1-fraction[...,1])
        for label in range(5):weights[...,label]+=weight*(category==label)
    assert np.allclose(weights.sum(axis=-1),1,atol=1e-12)
    return weights
assert np.all(support(grid,labels[0])[labels[0]==1,1]==1)
assert np.all(support(grid-[w*2,h*2],labels[0])[...,4]==1)
rows=[];names=['unknown','annotatedTail','annotatedCloth','alphaEmpty','outsideRaster']
for map_name,mapping in [('identity',grid),('protectedMLS',saved),('unmaskedMLS',unmasked)]:
    weights=support(mapping,labels[299])
    for domain_name,domain in [('annotatedTailTarget',labels[0]==1),('expandedWarmTarget',warm(0))]:
        selected=weights[domain];rows.append(dict(mapping=map_name,targetDomain=domain_name,pixels=len(selected),weightedSupportFraction=dict(zip(names,selected.mean(axis=0).tolist())),pixelsTouchingCategory=dict(zip(names,(selected>1e-9).sum(axis=0).tolist()))))
report=dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),source=ann['source'],annotations=dict(path=str(annpath),sha256=sha(annpath)),harnessSha256=sha(__file__),sourceFunctionSha256=sha(tool),exactSavedMapReproduced=True,regions=regions,rows=rows,reviewImages=images,visualReviewed=False,runtimeChanged=False,sequenceChanged=False,acceptedRepair=False,limits='Sparse analyst observations at two endpoints, not recovered layer alpha or material correspondences. Unknown dominates unannotated visible pixels. No claim that green is cloth or warm is tail. Existing failed maps are measured only; no remapped raster generated.')
(OUT/'audit.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
