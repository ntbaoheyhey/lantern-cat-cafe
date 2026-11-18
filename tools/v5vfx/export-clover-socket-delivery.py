"""Export only independently supported Clover hip and gripping-hand tracks."""
from pathlib import Path
import datetime, hashlib, json, math

root=Path(__file__).resolve().parents[2]
source_path=root/'reports/v5/CXV/M-clover-socket-point-study-r12-similarity-provisional-R1.json'
review_path=root/'work/v5/CXV/ref/batch-m/clover-provisional-R1.json'
coordinates_path=Path('/Users/bao/taskbar-hero-chain/reports/v5/CXI/evidence/v8-m-clover-provisional-sockets.json')
source=json.loads(source_path.read_text());review=json.loads(review_path.read_text());coordinates=json.loads(coordinates_path.read_text())
digest=lambda path:hashlib.sha256(Path(path).read_bytes()).hexdigest()
assert source['cat']==coordinates['cat']=='clover'
assert source['sourceSha256']==coordinates['sourceSha256']
assert review['reviewed'] and review['views']==1
assert digest(review['path'])==review['sha256'] and digest(source_path)==review['sourceReportSha256']
mapping={'hip':('hip','hip'),'mainHand':('prop','main-hand')}
scale=512/384;tracks={};sockets={};channels={};proof={};max_error=0
for key,(channel,bone) in mapping.items():
    entry=source['sockets'][key]
    assert entry['accepted'] and entry['survivors']>=6 and entry['minInlierFraction']>=.7
    assert entry['maxInlierErrorPx']<=2 and entry['seamResidualDeliveryPx']<=2 and entry['unsupportedFrames']<=3
    assert entry['initialDeliveryPoint']==coordinates['provisionalSockets'][bone]['xy']
    assert len(entry['worldOffsets'])==300
    track=[[round(x/scale,6),round(-y/scale,6)] for x,y in entry['worldOffsets']]
    assert all(math.isfinite(value) for xy in track for value in xy) and track[0]==[0,0]
    for i in range(300):
        for t in [0,.125,.5,.875,1]:
            a,b=track[i],track[(i+1)%300];wa,wb=entry['worldOffsets'][i],entry['worldOffsets'][(i+1)%300]
            max_error=max(max_error,abs((a[0]+(b[0]-a[0])*t)*scale-(wa[0]+(wb[0]-wa[0])*t)),abs(-(a[1]+(b[1]-a[1])*t)*scale-(wa[1]+(wb[1]-wa[1])*t)))
    tracks[channel]=track;sockets[bone]=entry['initialDeliveryPoint'];channels[bone]=channel
    proof[channel]={k:v for k,v in entry.items() if k!='worldOffsets'}
    proof[channel]['maxStepDeliveryPx']=max(math.dist(track[i],track[(i+1)%300]) for i in range(300))
assert max_error<1e-5 and tracks['hip']!=tracks['prop']
out={'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'cat':'clover','status':'Partial projected socket payload for CXI adapter review; no media registration',
     'sourceReport':str(source_path),'sourceReportSha256':digest(source_path),'sourceSha256':source['sourceSha256'],
     'coordinateContract':str(coordinates_path),'coordinateContractSha256':digest(coordinates_path),
     'units':'DELIVERY PIXEL offsets, +x right, +y down; add to socket position before world conversion and cast warp.',
     'fps':30,'frames':300,'deliverySize':[318,390],'opaqueHeight':384,
     'partialManifest':{'sockets':sockets,'socketTracks':tracks,'socketChannels':channels},
     'unresolved':['head','hp-anchor','off-hand','vfx-origin'],'foot':coordinates['foot'],
     'proof':proof,'conversionChecks':{'framePairs':600,'fractionalChecks':3000,'maxWorldRoundTripError':max_error},
     'visualEvidenceReuse':review,
     'limits':'Existing fresh overlay hash reused without reopening. prop means main-hand grip only; never drive vfx-origin from this track. Head/off-hand lack six survivors; vfx-origin mininlier.529 fails. Prior belt-left proxy remains preserved, not used here. CXI decoded-media/seam/cast/budget/gameplay gates remain open.'}
target=root/'reports/v5/CXV/M-clover-socket-delivery-R1.json'
assert not target.exists(),'Refusing prior evidence overwrite'
target.write_text(json.dumps(out,separators=(',',':'))+'\n')
print(json.dumps({'output':str(target),'sha256':digest(target),'channels':channels,'checks':out['conversionChecks']}))
