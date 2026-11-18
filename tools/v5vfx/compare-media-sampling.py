"""Compare pinned media sampling candidates in normalized local coordinates; no decode."""
from pathlib import Path
import argparse,datetime,hashlib,json,math
p=argparse.ArgumentParser();p.add_argument('--before',required=True);p.add_argument('--after',required=True);p.add_argument('--out',required=True);a=p.parse_args()
root=Path(__file__).resolve().parents[2];out=Path(a.out).resolve();assert out.is_relative_to(root/'reports/v5/CXV') and not out.exists()
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
def read(path):
 path=Path(path);d=json.loads(path.read_text());assert d['productionRegistryChanged'] is False
 url=d['registryOverride']['clover'];file=next(f for f in d['files'] if f['url']==url);assert sha(file['path'])==file['sha256']
 return d,json.loads(Path(file['path']).read_text()),dict(path=str(path),sha256=sha(path))
b,m,bref=read(a.before);c,n,cref=read(a.after)
normalize=lambda m,p:[(p[0]-m['foot'][0])*512/m['opaqueHeight'],(m['foot'][1]-p[1])*512/m['opaqueHeight']]
maximum=lambda a,b:max(abs(x-y) for x,y in zip(a,b))
rows=[]
assert m['socketChannels']==n['socketChannels']
for socket in m['sockets']:
 assert socket in n['sockets'];channel=m['socketChannels'].get(socket);best=0;checks=0
 for frame in range(300):
  for fraction in [0,.13,.37,.5,.71,.89,.999]:
   points=[]
   for mf in [m,n]:
    point=mf['sockets'][socket][:];track=mf.get('socketTracks',{}).get(channel)
    if track:
     lo=track[frame];hi=track[(frame+1)%300];point=[point[i]+lo[i]*(1-fraction)+hi[i]*fraction for i in range(2)]
    points.append(normalize(mf,point))
   best=max(best,maximum(*points));checks+=1
 rows.append(dict(socket=socket,channel=channel,fractionalSamples=checks,maxWorldDifference=best))
old={x['path']:x['sha256'] for x in b['runtimeSources']};new={x['path']:x['sha256'] for x in c['runtimeSources']}
geometry=[m[k]*512/m['opaqueHeight'] for k in ['width','height']];geometry2=[n[k]*512/n['opaqueHeight'] for k in ['width','height']]
rect=lambda mf,k:[*normalize(mf,mf[k][:2]),mf[k][2]*512/mf['opaqueHeight'],mf[k][3]*512/mf['opaqueHeight']] if k=='faceROI' else [normalize(mf,mf[k][:2]),normalize(mf,mf[k][2:])]
result=dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),before=bref,after=cref,beforeSource=b['sourceCommit'],afterSource=c['sourceCommit'],afterIndex=c['indexSha256'],harnessSha256=sha(__file__),sourceAdapterUnchanged=old==new,changedRuntimePaths=sorted(k for k in old.keys()|new.keys() if old.get(k)!=new.get(k)),runtimeFiles=len(new),dimensionsBefore=[m['width'],m['height']],dimensionsAfter=[n['width'],n['height']],worldGeometryBefore=geometry,worldGeometryAfter=geometry2,maxGeometryDifference=maximum(geometry,geometry2),socketChannelsExact=True,sockets=rows,faceBefore=rect(m,'faceROI'),faceAfter=rect(n,'faceROI'),opaqueBoundsBefore=rect(m,'opaqueBounds'),opaqueBoundsAfter=rect(n,'opaqueBounds'),imagesViewed=0,applicationChanges=[],limits='Descriptor and normalized coordinate arithmetic only; same adapter source hash reuses prior implementation audit. Opaque bounds retain sampling quantization differences. No new source-anatomy,decoded pixel,matte,seam or performance acceptance;native capture remains required.')
result['coordinatePass']=all(x['maxWorldDifference']<=2e-6 for x in rows) and result['maxGeometryDifference']<=2e-6
out.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:result[k] for k in ['sourceAdapterUnchanged','runtimeFiles','maxGeometryDifference','coordinatePass','sockets','changedRuntimePaths']}))
