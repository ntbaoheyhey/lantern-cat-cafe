"""Consolidate A6 saved-film and live evidence without changing production."""
from pathlib import Path
import datetime, gzip, hashlib, json, math, statistics, subprocess
import numpy as np
from PIL import Image

root=Path('reports/v4-art/REVIEW/A6')
read=lambda p:json.loads(Path(p).read_text())
load=lambda p:json.loads(gzip.decompress(Path(p).read_bytes()))
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
source=read(root/'source-tree.json')
assert all(sha(p)==h for p,h in source.items()),'Production changed since capture'
size=round(896*225/407)
arrays={k:np.asarray(Image.open(f'apps/web/public/units/panko/poses/{k}.webp').convert('RGBA').resize((size,size),Image.Resampling.LANCZOS)) for k in ['K0','K1','K2','K4','K5']}
base=arrays['K0']; mask=base[:,:,3]>=128; art={}
for k,a in arrays.items():
    if k=='K0': continue
    m=a[:,:,3]>=128; union=m|mask; ys,xs=np.where(union)
    area=(xs.max()-xs.min()+1)*(ys.max()-ys.min()+1)
    changed=np.max(np.abs(a.astype(float)-base.astype(float)),axis=2)>24
    art[k]={'battleOpaqueHeight':225,'iou':float((m&mask).sum()/union.sum()),'bboxChangedFraction':float((changed&union).sum()/area)}
probe=read(root/'live-probe.json')['results']; rows=[q for v in probe for q in v['rows']]
faces=read(root/'face-coverage.json')
perf=load('reports/v3-feel/REVIEW/V4-A6-PERF/boss/capture.json.gz')
frames=[f for f in perf['frames'] if 0<=f['t']<30]
gaps=[b['t']-a['t'] for a,b in zip(frames,frames[1:])]
performance={'recorded':perf['recorded'],'sourceCommit':perf['sourceCommit'],'videoSha256':perf['videoSha256'],'medianRenderFps':1/statistics.median(gaps),'averageRenderFps':(len(frames)-1)/(frames[-1]['t']-frames[0]['t']),'renderFrames':len(frames),'compositorFrames':perf['actualCompositorFrames'],'encodedFps':perf['fps'],'maxCompositorGapSeconds':perf['maxCompositorGapSeconds'],'isolation':'Main regression/captures and sequential live/face probes finished before this capture. No other owned capture jobs.','errors':perf['errors'],'parity':perf['parity']}
(root/'performance.json').write_text(json.dumps(performance,indent=2)+'\n')
own=[]; partial=[]
for fixture in ['wave1','wave3','boss']:
    original=load(root/fixture/'capture.json.gz')
    for p in original['plans']:
        if p['actorId']!='panko': continue
        d=original; supplementary=False
        if p['clockStart']+p['duration']/1000>d['videoSeconds']:
            partial.append({'fixture':fixture,'key':p['key'],'originalVideoSha256':d['videoSha256'],'reason':'Action ends after original30s film'})
            d=load(root/'tail36'/fixture/'capture.json.gz')
            p=next(q for q in d['plans'] if q['key']==p['key'] and q['skillId']==p['skillId'])
            supplementary=True
        fs=[f for f in d['frames'] if (f.get('action') or {}).get('key')==p['key'] and f['t']<d['videoSeconds']]
        impact=min(fs,key=lambda f:abs(f['action']['elapsed']-p['impact']))
        unit=next(u for u in impact['units'] if u['id']=='panko')
        targets=[t for e in p['events'] if e['type']=='action_start' for t in e['targetIds']]
        hostile=[u for u in impact['units'] if u['id'] in targets and u['side']=='enemy']
        done=p['clockStart']+p['duration']/1000
        end=next((f for f in d['frames'] if done<=f['t']<done+1/30),None)
        em=next((m for m in end['motion'] if m['id']=='panko'),None) if end else None
        motion=[m for f in fs for m in f['motion'] if m['id']=='panko']
        gap=max(0,hostile[0]['box']['x']-unit['box']['x']-unit['box']['width']) if hostile else None
        own.append({'fixture':fixture,'key':p['key'],'ultimate':p['ultimate'],'clockStart':p['clockStart'],'duration':p['duration'],'impact':p['impact'],'videoSha256':d['videoSha256'],'supplementary36s':supplementary,'impactSampleMs':impact['action']['elapsed'],'impactErrorMs':abs(impact['action']['elapsed']-p['impact']),'frontGapPixels':gap,'frontGapFraction':gap/d['width'] if gap is not None else None,'maxMotionPixels':max(math.hypot(m['dx'],m['dy']) for m in motion),'returnAfterEndMs':1000*(end['t']-done) if end else None,'returnMotionPixels':math.hypot(em['dx'],em['dy']) if em else None,'complete':max(f['action']['elapsed'] for f in fs)>=p['duration']-1000/30})
out={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sourceHashesVerified':len(source),'artAtBattleScale':art,'artDifferenceMethod':'RGBA WebP at225px opaque height; alpha>=128; maxRGBA delta>24; unionbbox denominator','socketErrorPixels':max(math.hypot(q['source']['x']-q['fx']['source']['x'],q['source']['y']-q['fx']['source']['y']) for q in rows if q.get('fx')),'liveMaxCameraPixels':max(q['cameraPixels'] for q in rows),'ultimateAreaFractions':[q['effectArea'] for q in rows if q['ultimate'] and 'effectArea' in q],'maxForegroundFaceCoverage':max(f['foregroundAlphaCoverage'] for r in faces['rows'] for f in r['faces']),'filmOwnActions':own,'originalIncompleteWindows':partial,'limits':['Pairwise eight-hero ultimate distinctness remains A9.','Craft production activation remains A9/A11.','A7 enemy effects and final SHIP healer semantics remain open.','Time-split compliance is not demonstrated.']}
(root/'acceptance-receipt.json').write_text(json.dumps(out,indent=2)+'\n')
lane=subprocess.check_output(['git','diff','--name-only','1544ca1df..HEAD'],text=True).splitlines()
allowed=['apps/web/public/units/','apps/web/public/vfx/','apps/web/src/game/cardrpg/battle-v3/','apps/web/src/game/cardrpg/spine/','apps/web/src/game/cardrpg/stage/','apps/web/src/game/cardrpg/vfx-craft/','reports/v4-art/','tools/v3craft-lab/','assets/provenance.json','scripts/v3feel/']
violations=[p for p in lane if not any(p.startswith(a) for a in allowed)]
(root/'lane-diff.json').write_text(json.dumps({'base':'1544ca1df','paths':lane,'violations':violations},indent=2)+'\n')
print(json.dumps({'ownWindows':len(own),'complete':sum(x['complete'] for x in own),'K2changed':art['K2']['bboxChangedFraction'],'maxGap':max(x['frontGapPixels'] or 0 for x in own),'maxImpactError':max(x['impactErrorMs'] for x in own),'maxReturnMotion':max(x['returnMotionPixels'] or 0 for x in own),'missingReturn':sum(x['returnMotionPixels'] is None for x in own),'performance':performance['medianRenderFps'],'laneViolations':violations}))
