"""Full-cycle packed alpha support, frozen idle projection and label-lane study.

No image is generated or viewed. Native actions and art acceptance stay open.
"""
from pathlib import Path
import datetime
import gzip
import hashlib
import json
import math
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'work/v5/CXV/python'))
import cv2
import numpy as np
cv2.setNumThreads(2)

CAPTURE = ROOT / 'work/v5/CXV/batch-m/authored-label-native-r1-140808'
GPU = Path('/Users/bao/taskbar-hero-chain/work/v5/CXI/batch-m/gpu-phase-r6-135609/report.json')
PREREG = ROOT / 'reports/v5/CXV/M-media-envelope-R1-preregistration.json'
OUT = ROOT / 'work/v5/CXV/batch-m/media-envelope-r1'
THRESHOLDS = (0, 1, 2, 4)


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def add_rect(mask, box):
    x, y, w, h = (box[k] for k in ('x', 'y', 'width', 'height'))
    x0, y0, x1, y1 = max(0, math.floor(x)), max(0, math.floor(y)), min(1280, math.ceil(x+w)), min(720, math.ceil(y+h))
    mask[y0:y1, x0:x1] = True


def project_support(alpha, manifest, body, threshold):
    left, top, right, bottom = manifest['opaqueBounds']
    sx, sy = body['width']/(right-left), body['height']/(bottom-top)
    # A nonzero source texel can influence its neighbours under linear sampling.
    support = cv2.dilate((alpha > threshold).astype(np.uint8), np.ones((3, 3), np.uint8))
    # cv2 integer coordinates are pixel centres; preserve centre-to-centre mapping.
    transform = np.array([[sx, 0, body['x']-left*sx+(sx-1)/2],
                          [0, sy, body['y']-top*sy+(sy-1)/2]], dtype=np.float64)
    projected = cv2.warpAffine(support, transform, (1280, 720), flags=cv2.INTER_NEAREST,
                               borderMode=cv2.BORDER_CONSTANT)
    return cv2.dilate(projected, np.ones((3, 3), np.uint8)).astype(bool)


def main():
    assert not OUT.exists()
    OUT.mkdir(parents=True)
    gpu = json.loads(GPU.read_text())
    artifact_path = CAPTURE / 'regression-heldouts/artifact-verification.json'
    artifact = json.loads(artifact_path.read_text())
    media_hashes = {x['sha256'] for x in artifact['mediaFiles']}
    manifests, unions, files, summaries = {}, {}, [], {}
    for item in gpu['manifests']:
        cat = item['cat'];path = Path(item['path'])
        assert sha(path) == item['sha256']
        assert item['sha256'] in media_hashes and item['videoSha256'] in media_hashes
        manifest = manifests[cat] = json.loads(path.read_text())
        assert manifest['format'] == 'h264-ycrcb-alpha-four-plane'
        refs = sorted((r for r in gpu['references'] if r['cat'] == cat), key=lambda r:r['referenceFrame'])
        assert [r['referenceFrame'] for r in refs] == list(range(300))
        union = np.zeros((manifest['height'], manifest['width']), dtype=np.uint8)
        for row in refs:
            stored = Path(row['path']).read_bytes()
            raw = gzip.decompress(stored) if row.get('encoding') == 'gzip' else stored
            assert hashlib.sha256(raw).hexdigest() == row['sha256']
            w, h = row['videoSize'];assert (w, h) == (manifest['width']*2, manifest['height']*2)
            rgba = np.frombuffer(raw, np.uint8).reshape(h, w, 4)
            if row.get('canvasPath'):
                canvas = np.fromfile(row['canvasPath'], np.uint8).reshape(h, w, 4)
                assert np.array_equal(rgba[::-1, :, :3], canvas[:, :, :3])
            alpha = rgba[::-1, :, :][h//2:, w//2:, 0]
            np.maximum(union, alpha, out=union)
            files.append({'path':row['path'], 'storedSha256':hashlib.sha256(stored).hexdigest(), 'rgbaSha256':row['sha256'], 'cat':cat, 'frame':row['referenceFrame']})
        unions[cat] = union
        summaries[cat] = {'frames':len(refs), 'logicalSize':[manifest['width'],manifest['height']],
                          'supportPixels':{str(t):int((union>t).sum()) for t in THRESHOLDS}}
    files_path=OUT/'verified-files.json';files_path.write_text(json.dumps(files, separators=(',', ':'))+'\n')
    alpha_path=OUT/'source-support.npz';np.savez_compressed(alpha_path, **unions)
    axis = np.arange(-160, 161, dtype=np.int32)
    dx, dy = np.meshgrid(axis, axis);dx=dx.ravel();dy=dy.ravel()
    stable = {cat:np.ones(dx.shape, dtype=bool) for cat in manifests}
    rows=[];projections=[]
    for suite in ('regression-heldouts','expanded-status'):
        raw_path=CAPTURE/suite/'report.json';analysis_path=CAPTURE/suite/'analysis.json'
        raw=json.loads(raw_path.read_text());analysis=json.loads(analysis_path.read_text())
        for case, measured in zip(raw['cases'],analysis['cases']):
            assert case['frame']==measured['sourceFrame'] and case['mode']==measured['mode'] and measured['valid']
            s=case['captures'][0]['before'];assert s['plan'] is None
            data_path=Path(measured['pixelDifferences']['path']);assert sha(data_path)==measured['pixelDifferences']['sha256']
            data=np.load(data_path)
            footprints={}
            coverage={}
            for cat, manifest in manifests.items():
                body=next(a['body'] for a in s['anchors'] if a['id']==cat)
                footprints[cat]=project_support(unions[cat],manifest,body,0)
                contribution=data[cat+'Contribution']
                coverage[cat]={str(t):{'observed':int((contribution>t).sum()),
                                     'outsideEnvelope':int(((contribution>t)&~footprints[cat]).sum())} for t in THRESHOLDS}
            blockers=footprints['mochi']|footprints['clover']
            for a in s['anchors']:
                if not a['visible']:continue
                if a['id'] not in manifests:add_rect(blockers,a['body'])
                if a.get('face'):add_rect(blockers,a['face'])
            for hud in s['hud']:add_rect(blockers,hud['rect'])
            lane_rows=[]
            for cat in manifests:
                blocked=blockers.copy()
                for label in s['labels']:
                    if label['id']!=cat:add_rect(blocked,label['rect'])
                box=next(l['rect'] for l in s['labels'] if l['id']==cat)
                x0=np.floor(box['x']).astype(int)+dx;y0=np.floor(box['y']).astype(int)+dy
                x1=np.ceil(box['x']+box['width']).astype(int)+dx;y1=np.ceil(box['y']+box['height']).astype(int)+dy
                inside=(x0>=4)&(y0>=4)&(x1<=1276)&(y1<=716)
                integral=cv2.integral(blocked.astype(np.uint8),sdepth=cv2.CV_32S)
                xc0=x0.clip(0,1280);xc1=x1.clip(0,1280);yc0=y0.clip(0,720);yc1=y1.clip(0,720)
                counts=integral[yc1,xc1]-integral[yc0,xc1]-integral[yc1,xc0]+integral[yc0,xc0]
                valid=inside&(counts==0);stable[cat]&=valid
                order=np.lexsort((dy,dx,np.abs(dy),dx*dx+dy*dy));good=order[valid[order]]
                nearest=None if not len(good) else {'dx':int(dx[good[0]]),'dy':int(dy[good[0]]),'distanceCSSpx':float(np.hypot(dx[good[0]],dy[good[0]]))}
                lane_rows.append({'cat':cat,'original':box,'baselineBlockedPixels':int(counts[(dx==0)&(dy==0)][0]),'validOffsets':int(valid.sum()),'nearest':nearest})
            rows.append({'suite':suite,'mode':case['mode'],'frame':case['frame'],'coverage':coverage,'labels':lane_rows})
            projections.append({'suite':suite,'mode':case['mode'],'frame':case['frame'],'mochi':footprints['mochi'],'clover':footprints['clover']})
    # Save numerical arrays only. No plots, thumbnails, or exported artwork.
    projection_path=OUT/'projected-support.npz'
    np.savez_compressed(projection_path,**{f'{r["suite"]}-{r["mode"]}-{r["frame"]}-{cat}':r[cat] for r in projections for cat in manifests})
    row_path=OUT/'rows.json';row_path.write_text(json.dumps(rows,indent=2)+'\n')
    candidates={}
    order=np.lexsort((dy,dx,np.abs(dy),dx*dx+dy*dy))
    for cat,valid in stable.items():
        indices=order[valid[order]]
        candidates[cat]={'count':int(valid.sum()),'nearest':[{'dx':int(dx[i]),'dy':int(dy[i]),'distanceCSSpx':float(np.hypot(dx[i],dy[i]))} for i in indices[:8]]}
    result={'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'gpu':{'path':str(GPU),'sha256':sha(GPU)},'artifact':{'path':str(artifact_path),'sha256':sha(artifact_path)},
            'preregistration':{'path':str(PREREG),'sha256':sha(PREREG)},'harness':{'path':str(Path(__file__)),'sha256':sha(__file__)},
            'files':{'path':str(files_path),'sha256':sha(files_path)},'sourceSupport':{'path':str(alpha_path),'sha256':sha(alpha_path)},
            'projectedSupport':{'path':str(projection_path),'sha256':sha(projection_path)},'rows':{'path':str(row_path),'sha256':sha(row_path)},
            'sources':summaries,'verifiedFrames':len(files),'cases':len(rows),'offsetsPerCase':len(dx),
            'projectionContainsObservedContribution':all(v['outsideEnvelope']==0 for row in rows for cat in row['coverage'].values() for v in cat.values()),
            'maxEscapedPixels':max(v['outsideEnvelope'] for row in rows for cat in row['coverage'].values() for v in cat.values()),
            'stableOffsets':candidates,'productionAcceptance':False,'imagesViewed':0,
            'limits':['Complete300frame texture alpha support,projected onto18frozen idlelayouts only.','Mask support uses bilinear source dilation+oneCSSpixel margin;projection must contain observed contributions before interpretation.','Integer translation is a fitted hypothesis;actual label raster/layout,legal casts,camera,performance,fringe and seamless loop remain unverified.']}
    (ROOT/'reports/v5/CXV/M-media-envelope-R1.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({k:result[k] for k in ['verifiedFrames','cases','projectionContainsObservedContribution','maxEscapedPixels','stableOffsets']}))


if __name__=='__main__':main()
