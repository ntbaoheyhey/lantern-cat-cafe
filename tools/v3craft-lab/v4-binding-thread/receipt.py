"""Binding checkpoint: encoded-film observations, telemetry and live probes stay distinct."""
from pathlib import Path
from PIL import Image
import datetime,gzip,hashlib,json,math,statistics,subprocess
import numpy as np

root=Path('reports/v4-art/REVIEW/A7/binding-thread')
read=lambda p:json.loads(Path(p).read_text())
load=lambda p:json.loads(gzip.decompress(Path(p).read_bytes()))
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
write=lambda name,value:(root/name).write_text(json.dumps(value,indent=2)+'\n')
source=read(root/'source-tree.json')
assert all(sha(p)==h for p,h in source.items()),'Production changed since captures'
manifest=read('apps/web/public/units/binding-thread/poses/manifest.json')
size=round(manifest['canvas'][0]*225/manifest['opaqueHeight'])
arrays={k:np.asarray(Image.open(f'apps/web/public/units/binding-thread/poses/{k}.webp').convert('RGBA').resize((size,size),Image.Resampling.LANCZOS)) for k in ['K0','K1','K2','K4']}
base=arrays['K0'];mask=base[:,:,3]>=128;art={}
for k,a in arrays.items():
    if k=='K0':continue
    m=a[:,:,3]>=128;union=m|mask;ys,xs=np.where(union)
    area=int((xs.max()-xs.min()+1)*(ys.max()-ys.min()+1))
    changed=np.max(np.abs(a.astype(float)-base.astype(float)),axis=2)>24
    art[k]={'battleOpaqueHeight':225,'iou':float((m&mask).sum()/union.sum()),'bboxChangedFraction':float((changed&union).sum()/area),'unionBboxArea':area}
own=[];partial=[];films=[];cameras=[]
for relative,fixtures,after in [('.', ['wave1','wave3','boss'],0),('tail60',['boss'],30)]:
    for fixture in fixtures:
        d=load(root/relative/fixture/'capture.json.gz');video=root/relative/(fixture+'.webm')
        assert sha(video)==d['videoSha256'],'Movie hash mismatch'
        films.append({'fixture':fixture,'relative':relative,'sha256':d['videoSha256'],'seconds':d['videoSeconds'],'parity':d['parity'],'errors':d['errors'],'frameMarker':d['frameMarker'],'audio':d['audio']})
        cameras.extend(f['renderCamera'] for f in d['frames'])
        for p in d['plans']:
            if 'binding-thread' not in p['actorId'] or p['clockStart']+p['duration']/1000<after:continue
            endTime=p['clockStart']+p['duration']/1000
            complete=endTime<d['videoSeconds']
            fs=[f for f in d['frames'] if (f.get('action')or{}).get('key')==p['key'] and f['t']<d['videoSeconds']]
            if not fs:continue
            impact=min(fs,key=lambda f:abs(f['action']['elapsed']-p['impact']))
            motion=[m for f in fs for m in f['motion'] if m['id']==p['actorId']]
            end=next((f for f in d['frames'] if endTime<=f['t']<endTime+1/30),None) if complete else None
            em=next((m for m in end['motion'] if m['id']==p['actorId']),None) if end else None
            row={'fixture':fixture,'relative':relative,'key':p['key'],'actor':p['actorId'],'ultimate':p['ultimate'],'clockStart':p['clockStart'],'duration':p['duration'],'impact':p['impact'],'videoSha256':d['videoSha256'],'complete':complete,'maxMotionPixels':max(math.hypot(m['dx'],m['dy']) for m in motion),'maxMotionViewportFraction':max(math.hypot(m['dx'],m['dy']) for m in motion)/d['width'],'returnAfterEndMs':1000*(end['t']-endTime) if end else None,'returnMotionPixels':math.hypot(em['dx'],em['dy']) if em else None,'nearestTelemetryImpactMs':impact['action']['elapsed'] if complete else None,'telemetryImpactErrorMs':abs(impact['action']['elapsed']-p['impact']) if complete else None}
            own.append(row)
            if not complete:partial.append({'relative':relative,'key':p['key'],'reason':'Window extends beyond movie; excluded from completed-window count','actionEndSeconds':endTime,'movieEndSeconds':d['videoSeconds']})
perf=load(root/'tail60/boss/capture.json.gz');frames=[f for f in perf['frames'] if 0<=f['t']<60]
gaps=[b['t']-a['t'] for a,b in zip(frames,frames[1:])]
performance={'recorded':perf['recorded'],'sourceCommit':perf['sourceCommit'],'videoSha256':perf['videoSha256'],'medianRenderFps':1/statistics.median(gaps),'averageRenderFps':(len(frames)-1)/(frames[-1]['t']-frames[0]['t']),'renderFrames':len(frames),'compositorFrames':perf['actualCompositorFrames'],'encodedFps':perf['fps'],'maxCompositorGapSeconds':perf['maxCompositorGapSeconds'],'isolation':'Sequential a7-binding-tail.sh: second live probe exited before this capture; regression and original capture/review jobs already finished; no concurrent generation or owned capture workload.','errors':perf['errors'],'parity':perf['parity']}
write('performance.json',performance)
probes=read(root/'live-probe.json')+read(root/'live-probe-second.json');rows=[x for p in probes for x in p['rows']]
live={'launchSocketErrorPixels':max(x['launchSocketError'] for x in rows if x['launchSocketError'] is not None),'paintedHeadErrorPixels':max(x['paintedHeadError'] for x in rows),'peakUltimateAreaFraction':max(x['areaFraction'] for x in rows if x['ultimate']),'maxFaceCoverageFraction':max(x['maxFaceCoverage'] for x in rows),'maxCameraPixels':max(x['cameraPixels'] for x in rows),'probeEnemies':[p['id'] for p in probes if p.get('present')],'method':'Live-render alpha measurements; film appearance reviewed separately in REVIEW.md.'}
live['maxSampledUnitOcclusionFraction']=max(o['fraction'] for x in rows for o in x.get('occlusion',[]))
assets=[p for q in Path('apps/web/public/units').glob('*/poses') for p in q.rglob('*') if p.is_file()]+[p for p in Path('apps/web/public/vfx').rglob('*') if p.is_file()]
assetBytes=sum(p.stat().st_size for p in assets)
write('asset-budget.json',{'method':'Conservative upper bound: every published unit pose directory plus every public VFX file, including assets absent from first battle and existing Soot poses.','bytes':assetBytes,'limitBytes':6000000,'files':{str(p):p.stat().st_size for p in assets}})
laneBase='6dc737904';lane=subprocess.check_output(['git','diff','--name-only',laneBase,'--'],text=True).splitlines()
allowed=['apps/web/public/units/','apps/web/public/vfx/','apps/web/src/game/cardrpg/battle-v3/','apps/web/src/game/cardrpg/spine/','apps/web/src/game/cardrpg/stage/','apps/web/src/game/cardrpg/vfx-craft/','reports/v4-art/','tools/v3craft-lab/','assets/provenance.json','scripts/v3feel/']
ignored=[p for p in lane if p.endswith('.log') or p=='reports/v3-feel/parity-latest.json']
violations=[p for p in lane if p not in ignored and not any(p.startswith(a) for a in allowed)]
write('lane-diff.json',{'base':laneBase,'paths':[p for p in lane if p not in ignored],'excludedInheritedLocalArtifacts':ignored,'violations':violations})
visible={5:[146,147,148],6:[172,173,174],29:[1048,1049,1050,1051],30:[1116,1117,1118,1119],45:[1736,1737,1738,1739]}
flight=read(root/'projectile-frames.json')
for r in flight:r['visuallyConfirmedFlightFrames']=visible[r['key']]
write('projectile-frames.json',flight)
complete=[x for x in own if x['complete']]
out={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Binding ranged identity, poses and original effects; final ensemble/activation gates remain open','sourceHashesVerified':len(source),'artAtBattleScale':art,'artDifferenceMethod':'Published RGBA WebP resized to225px K0 opaque height; alpha>=128; maxRGBA delta>24; union-bbox denominator','liveMeasurements':live,'filmOwnActions':own,'completeOwnWindows':len(complete),'incompleteWindows':partial,'films':films,'consecutiveVisibleProjectileFrames':min(len(r['visuallyConfirmedFlightFrames']) for r in flight),'filmCameraMaxTranslationPixels':max(math.hypot(c['x'],c['y']) for c in cameras),'filmCameraMaxScaleDelta':max(abs(c['scale']-1) for c in cameras),'performanceMedianFps':performance['medianRenderFps'],'conservativeFirstBattleAssetBytes':assetBytes,'laneViolations':violations,'limits':['Tail60 A46 is truncated; three other ultimate windows cover both Binding enemies.','Films have no decoded frame markers: their captions locate compositor time, while exact350/1100ms impact and800/2200ms duration claims come from paired runtime telemetry.','Shared focus holds through600ms and fades to800ms; exact600ms focus-off conformance remains A9/A11.','Pairwise eight-character ultimate distinctness and production activation remain A9/A11.','Final SHIP class implementation/baseline has not been merged.','Authoring/measurement time-split compliance is not demonstrated.']}
out['scopedGates']={'K2ChangedAtLeast18Percent':art['K2']['bboxChangedFraction']>=.18,'plantedWithin5Percent':all(x['maxMotionViewportFraction']<=.05 for x in own),'threeVisibleProjectileFrames':out['consecutiveVisibleProjectileFrames']>=3,'ultimateArea20To45Percent':.2<=live['peakUltimateAreaFraction']<=.45,'faceCoverageAtMost50Percent':live['maxFaceCoverageFraction']<=.5,'socketAtMost6Pixels':live['launchSocketErrorPixels']<=6,'medianAtLeast50Fps':performance['medianRenderFps']>=50,'assetsAtMost6MB':assetBytes<=6000000,'lane':not violations}
write('acceptance-receipt.json',out)
print(json.dumps({'completeOwnWindows':len(complete),'partialWindows':len(partial),'K2changed':art['K2']['bboxChangedFraction'],'maxMotion':max(x['maxMotionPixels'] for x in own),'maxReturn':max(x['returnMotionPixels']or 0 for x in complete),'missingReturn':sum(x['returnMotionPixels']is None for x in complete),'medianFps':performance['medianRenderFps'],'assets':assetBytes,'gates':out['scopedGates']}))
