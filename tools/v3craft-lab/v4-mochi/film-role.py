from pathlib import Path
import json,gzip,math
root=Path('reports/v4-art/REVIEW/A4');rows=[]
for fixture in ['wave1','wave3','boss']:
 d=json.loads(gzip.decompress((root/fixture/'capture.json.gz').read_bytes()))
 for p in d['plans']:
  if p['actorId']!='mochi':continue
  frames=[f for f in d['frames'] if f.get('action') and f['action']['key']==p['key'] and 0<=f['t']<30]
  if not frames:continue
  impact=min(frames,key=lambda f:abs(f['action']['elapsed']-p['impact']));u=next(u for u in impact['units'] if u['id']=='mochi');start=next((e for e in p['events'] if e['type']=='action_start'),None)
  ids=start['targetIds'] if start else[];target=next((next((u for u in impact['units'] if u['id']==id and u['side']=='enemy'),None) for id in ids if any(u['id']==id and u['side']=='enemy' for u in impact['units'])),None)
  role=next(r for r in impact['motion'] if r['id']=='mochi');last=frames[-1];endRole=next(r for r in last['motion'] if r['id']=='mochi')
  encoded=[s for s in d['resampled'] if s.get('renderFrame') and 0<s['renderFrame']<=len(d['frames']) and (d['frames'][s['renderFrame']-1].get('action') or{}).get('key')==p['key']]
  encodedImpact=min(encoded,key=lambda s:abs(d['frames'][s['renderFrame']-1]['action']['elapsed']-p['impact'])) if encoded else None
  gap=target['box']['x']-u['box']['x']-u['box']['width'] if target and not p['ultimate'] else None
  rows.append({'fixture':fixture,'key':p['key'],'ultimate':p['ultimate'],'duration':p['duration'],'scheduledImpact':p['impact'],'impactSampleMs':impact['action']['elapsed'],'encodedImpactErrorMs':abs(d['frames'][encodedImpact['renderFrame']-1]['action']['elapsed']-p['impact']) if encodedImpact else None,'target':target['id'] if target and not p['ultimate'] else 'allied shield recipients','signedFrontGapPx':gap,'separationLimitPx':d['width']*.04,'impactTranslation':[role['dx'],role['dy']],'lastSampleMs':last['action']['elapsed'],'lastSampleHomeDistance':math.hypot(endRole['dx'],endRole['dy']),'completeEnvelope':last['action']['elapsed']>=p['duration']-1000/30,'maxTranslation':max(math.hypot(r['dx'],r['dy']) for f in frames for r in f['motion'] if r['id']=='mochi')})
(root/'film-role.json').write_text(json.dumps({'method':'Encoded frame-marker binding + same-render snapshots; no retimed video. Basic separation uses actual primary hostile target; support ultimate follows SHIP07:25:18 contract. Subpixel last-frame residual settles by exact deadline in live-probe.','actions':rows},indent=2)+'\n')
print('actions',len(rows),'max encoded impact error',max(r['encodedImpactErrorMs'] or 0 for r in rows),'basic separations',[round(r['signedFrontGapPx'],2) for r in rows if not r['ultimate']],'complete envelopes',sum(r['completeEnvelope'] for r in rows),'ultmaxtranslation',max(r['maxTranslation'] for r in rows if r['ultimate']))
