"""Keep encoded-film, runtime telemetry, live alpha probes and open gates distinct."""
from pathlib import Path
import datetime,gzip,hashlib,json,math,statistics,subprocess
root=Path('reports/v4-art/REVIEW/A7/teacup-healer')
read=lambda p:json.loads(Path(p).read_text())
load=lambda p:json.loads(gzip.decompress(Path(p).read_bytes()))
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
write=lambda name,value:(root/name).write_text(json.dumps(value,indent=2)+'\n')
source=read(root/'source-hashes.json');assert all(sha(p)==h for p,h in source.items()),'Production changed since capture'
own=[];films=[];perf=[]
for item,fixtures,after in [('V4-A7-TEACUP',['wave1','wave3','boss'],0),('V4-A7-TEACUP-TAIL90',['wave1','wave3'],30)]:
    base=Path('reports/v3-feel/REVIEW')/item
    for fixture in fixtures:
        d=load(base/fixture/'capture.json.gz');assert sha(base/(fixture+'.webm'))==d['videoSha256']
        encoded=[(s,d['frames'][s['renderFrame']]) for s in d['resampled']]
        assert all(f['ordinal']==s['renderFrame'] for s,f in encoded)
        films.append({'item':item,'fixture':fixture,'sha256':d['videoSha256'],'sourceCommit':d['sourceCommit'],'seconds':d['videoSeconds'],'encodedFps':d['fps'],'parity':d['parity'],'errors':d['errors'],'audio':d['audio']})
        frames=[f for f in d['frames'] if 0<=f['t']<d['videoSeconds']];gaps=[b['t']-a['t'] for a,b in zip(frames,frames[1:])]
        perf.append({'item':item,'fixture':fixture,'medianRenderFps':1/statistics.median(gaps),'averageRenderFps':(len(frames)-1)/(frames[-1]['t']-frames[0]['t']),'compositorFrames':d['actualCompositorFrames'],'maxCompositorGapSeconds':d['maxCompositorGapSeconds']})
        for p in d['plans']:
            if 'teacup-healer' not in p['actorId'] or p['clockStart']+p['duration']/1000<after:continue
            fs=[(s,f) for s,f in encoded if (f.get('action')or{}).get('key')==p['key']]
            if not fs:continue
            end=p['clockStart']+p['duration']/1000;complete=end<d['videoSeconds'];motions=[m for s,f in fs for m in f['motion'] if m['id']==p['actorId']]
            nearest=min(fs,key=lambda sf:abs(sf[1]['action']['elapsed']-p['impact']))
            ret=next((f for s,f in encoded if f['frameAt']>=end),None) if complete else None
            rm=next((m for m in ret['motion'] if m['id']==p['actorId']),None) if ret else None
            heal_ids=sorted({i for e in p['events'] if e['type']=='heal' and e.get('amount',0)>0 for i in e['targetIds']})
            damage=[e for e in p['events'] if e['type']=='damage' and e.get('amount',0)>0]
            hit=[m for s,f in fs if 0<=f['action']['elapsed']-p['impact']<=200 for m in f['motion'] if m['id'] in heal_ids]
            focus=[{'frame':s['frame'],'elapsed':f['action']['elapsed'],'brightness':f['focus']['brightness']} for s,f in fs if 600<f['action']['elapsed']<800 and f['focus']['brightness']<1]
            own.append({'item':item,'fixture':fixture,'key':p['key'],'actor':p['actorId'],'ultimate':p['ultimate'],'start':p['clockStart'],'duration':p['duration'],'impact':p['impact'],'complete':complete,'encodedFrames':len(fs),'nearestEncodedImpactFrame':nearest[0]['frame'],'nearestEncodedImpactElapsed':nearest[1]['action']['elapsed'],'impactSamplingErrorMs':abs(nearest[1]['action']['elapsed']-p['impact']),'maxMotionPixels':max(math.hypot(m['dx'],m['dy']) for m in motions),'returnPixels':math.hypot(rm['dx'],rm['dy']) if rm else None,'maxCameraPixels':max(math.hypot(f['renderCamera']['x'],f['renderCamera']['y']) for s,f in fs),'healedIds':heal_ids,'damageEventCount':len(damage),'healedRecipientMaxHitOffset':max([m['hitOffset'] for m in hit],default=0),'healedRecipientMaxFlash':max([m['flash'] for m in hit],default=0),'post600FocusFrames':focus})
probes=read(root/'live-probe-r2.json');rows=[x for p in probes for x in p['rows']]
live={'method':'Live-render alpha probes; separate from encoded-film appearance.','peakUltimateAreaByFixture':{p['fixture']:max([x['areaFraction'] for x in p['rows'] if x['ultimate']],default=0) for p in probes if p['present']},'maxFaceCoverage':max(x['maxFaceCoverage'] for x in rows),'socketError':max(x['paintedSocketError'] for x in rows if x['paintedSocketError'] is not None),'actualRecipientIdsMatch':all(sorted(x['actualRecipientIds'])==sorted(x['expectedHealIds']) for x in rows),'maxUnitOcclusion':max(o['fraction'] for x in rows for o in x['occlusion'])}
assets=read(root/'asset-budget.json');art=read(root/'published-pose-metrics.json');layout=read(root/'layout900.json') if (root/'layout900.json').exists() else {'status':'pending','failures':['900p capture running']}
markers=read(root/'encoded-markers.json')+read(root/'tail90/encoded-markers.json');assert all(r['pass'] for r in markers)
lane=subprocess.check_output(['git','diff','--name-only','6dc737904','--'],text=True).splitlines()
allowed=['apps/web/public/units/','apps/web/public/vfx/','apps/web/src/game/cardrpg/battle-v3/','apps/web/src/game/cardrpg/spine/','apps/web/src/game/cardrpg/stage/','apps/web/src/game/cardrpg/vfx-craft/','reports/v4-art/','tools/v3craft-lab/','assets/provenance.json','scripts/v3feel/']
ignored=[p for p in lane if p.endswith('.log') or p=='reports/v3-feel/parity-latest.json'];violations=[p for p in lane if p not in ignored and not any(p.startswith(a) for a in allowed)]
write('lane-final.json',{'base':'6dc737904','paths':[p for p in lane if p not in ignored],'excludedInheritedLocalArtifacts':ignored,'violations':violations})
isolated=next(p for p in perf if p['item'].endswith('TAIL90') and p['fixture']=='wave3')
write('performance.json',{'selected':isolated,'allFilms':perf,'isolation':'Wave3 follows wave1 encoding in one sequential job; original regression/review jobs exited; no concurrent owned capture, generation or heavy review job during wave3 recording.'})
limits=['Old SHIP class rules still cause basic damage/reflect; healer-only acceptance is OPEN.','Shared ultimate focus fades after600ms until800ms; strict600ms off remains OPEN.','Pairwise ensemble, activation and time-split compliance remain OPEN.','900p recording is supplemental silent fixed-clock layout evidence.']
out={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Teacup drawn poses and original ally blossom presentation; not full A7 acceptance','sourceHashesVerified':len(source),'completeOwnWindows':sum(r['complete'] for r in own),'completeOwnUltimates':sum(r['complete'] and r['ultimate'] for r in own),'ownActions':own,'incompleteReviewWindows':[{'set':label,'fixture':f['fixture'],'key':a['key'],'own':a['own'],'start':min(a['times']),'end':max(a['times'])} for label in ['original','tail90'] for f in read(root/('film-review.json' if label=='original' else 'tail90/film-review.json')) for a in f['actions'] if not a['complete']],'films':films,'encodedMarkerFramesVerified':sum(r['frames'] for r in markers),'poseMetrics':art,'liveMeasurements':live,'layout900':layout,'assetBytes':assets['bytes'],'laneViolations':violations,'limits':limits}
out['scopedGates']={'poseNumerical':all(r['numericalGatesPass'] for r in art['rows']),'ultimateArea20To45PercentLive':all(.20<=v<=.45 for v in live['peakUltimateAreaByFixture'].values()),'faces50PercentLive':live['maxFaceCoverage']<=.5,'socket6PixelsLive':live['socketError']<=6,'actualHealRecipientsLive':live['actualRecipientIdsMatch'],'blind':read(root/'blind-result.json')['pass'],'tenCompleteOwnWindows':out['completeOwnWindows']>=10,'markers':all(r['pass'] for r in markers),'plantedWithin5Percent':all(r['maxMotionPixels']<=64 for r in own),'healedRecipientNoHitOrFlash':all(not r['healedRecipientMaxHitOffset'] and not r['healedRecipientMaxFlash'] for r in own if r['healedIds']),'healerOnly':all(r['damageEventCount']==0 for r in own),'healerCameraStatic':all(r['maxCameraPixels']==0 for r in own),'median50Fps':isolated['medianRenderFps']>=50,'assets6MB':assets['bytes']<=6000000,'lane':not violations,'layout900':not layout['failures']}
write('acceptance-receipt.json',out)
print(json.dumps({'completeOwnWindows':out['completeOwnWindows'],'ultimates':out['completeOwnUltimates'],'gates':out['scopedGates']}))
