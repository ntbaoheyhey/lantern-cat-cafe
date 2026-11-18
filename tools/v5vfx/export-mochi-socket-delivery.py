"""Convert accepted projected tracks to the loader's delivery-pixel units."""
from pathlib import Path
import datetime, hashlib, json, math

root=Path(__file__).resolve().parents[2]
source_path=root/'reports/v5/CXV/M-mochi-socket-candidate-R3.json'
source=json.loads(source_path.read_text())
digest=lambda path:hashlib.sha256(Path(path).read_bytes()).hexdigest()
assert source['cat']=='mochi' and source['worldHeight']==512 and source['deliveryOpaqueHeight']==384
assert source['overlay']['reviewed'] and source['overlay']['views']==1
assert digest(source['overlay']['path'])==source['overlay']['sha256']
mapping={'hip':('hip','hip'),'mainHand':('shieldWrist','main-hand'),'vfxOrigin':('lantern','vfx-origin')}
scale=512/384
tracks={};sockets={};channels={};proof={};max_error=0
for key,(channel,bone) in mapping.items():
    entry=source['sockets'][key]
    assert entry['accepted'] and entry['survivors']>=6 and entry['minInlierFraction']>=.7
    assert entry['seamResidualDeliveryPx']<=2 and entry['unsupportedFrames']<=3
    assert digest(root/entry['evidenceReport'])==entry['evidenceSha256']
    assert len(entry['worldOffsets'])==300
    track=[[round(x/scale,6),round(-y/scale,6)] for x,y in entry['worldOffsets']]
    assert all(math.isfinite(value) for xy in track for value in xy)
    assert track[0]==[0,0]
    for actual,original in zip(track,entry['worldOffsets']):
        max_error=max(max_error,abs(actual[0]*scale-original[0]),abs(-actual[1]*scale-original[1]))
    for i in range(300):
        for t in [0,.125,.5,.875,1]:
            a,b=track[i],track[(i+1)%300];wa,wb=entry['worldOffsets'][i],entry['worldOffsets'][(i+1)%300]
            max_error=max(max_error,abs((a[0]+(b[0]-a[0])*t)*scale-(wa[0]+(wb[0]-wa[0])*t)),
                          abs(-(a[1]+(b[1]-a[1])*t)*scale-(wa[1]+(wb[1]-wa[1])*t)))
    tracks[channel]=track;sockets[bone]=entry['initialDeliveryPoint'];channels[bone]=channel
    proof[channel]={key:value for key,value in entry.items() if key!='worldOffsets'}
assert max_error<1e-5
assert tracks['lantern']!=tracks['shieldWrist']
out={'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'cat':'mochi','status':'Partial socket payload for CXI integration review; no media registration or unresolved-channel acceptance',
     'sourceReport':str(source_path),'sourceReportSha256':digest(source_path),'sourceSha256':source['sourceSha256'],
     'units':'DELIVERY PIXEL offsets, +x right, +y down; add to socket pixel position BEFORE world conversion and cast warp.',
     'conversion':'dxDelivery=dxWorld/(512/384); dyDelivery=-dyWorld/(512/384). Never paste R3 worldOffsets directly into the current loader.',
     'fps':30,'frames':300,'deliverySize':source['deliverySize'],'opaqueHeight':384,
     'partialManifest':{'sockets':sockets,'socketTracks':tracks,'socketChannels':channels},
     'unresolved':['head','hp-anchor','off-hand'],'root':'Use CXI measured static foot[247.25,387]; no root track.',
     'schemaRequest':'Preserve existing head/prop compatibility and extend channel names to hip,shieldWrist,lantern. Keep lantern independent of shield wrist.',
     'proof':proof,'conversionChecks':{'framePairs':900,'fractionalChecks':4500,'maxWorldRoundTripError':max_error},
     'visualEvidenceReuse':source['overlay'],
     'limits':'Existing R3 overlay hash reused without reopening. Source projected translations, not recovered Cubism bones. CXI loader native sampling and final decoded-media placement/edge/seam/budget/gameplay checks remain required.'}
path=root/'reports/v5/CXV/M-mochi-socket-delivery-R3.json'
path.write_text(json.dumps(out,separators=(',',':'))+'\n')
print(json.dumps({'output':str(path),'bytes':path.stat().st_size,'channels':list(tracks),'maxWorldRoundTripError':max_error,'reviewedImageHashReused':source['overlay']['sha256']}))
