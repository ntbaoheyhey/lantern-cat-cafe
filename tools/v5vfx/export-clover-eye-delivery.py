"""Export the separately passing R5 authored eye-line anchor for adapter review."""
from pathlib import Path
import datetime
import hashlib
import json
import sys

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'work/v5/CXV/python'))
import numpy as np

sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
ref=lambda p:dict(path=str(p),sha256=sha(p))
report_path=ROOT/'reports/v5/CXV/M-clover-eye-events-R5-model.json'
report=json.loads(report_path.read_text())
assert report['passSparseControls'] and all(report['checks'].values())
assert report['heldoutPassCount']==report['heldoutCount']==24
assert sha(report['raw']['path'])==report['raw']['sha256']
assert sha(report['observations']['path'])==report['observations']['sha256']
assert sha(report['priorFailure']['path'])==report['priorFailure']['sha256']
assert not json.loads(Path(report['priorFailure']['path']).read_text())['passSparseControls']
contract_path=Path('/Users/bao/taskbar-hero-chain/reports/v5/CXI/evidence/v8-m-clover-provisional-sockets.json')
contract=json.loads(contract_path.read_text())
video=ROOT/'work/v5/CXV/ref/batch-m/clover.mp4'
assert sha(video)==contract['sourceSha256']
assert contract['deliverySize']==[318,390] and contract['opaqueHeight']==384
points=np.array(json.loads(Path(report['raw']['path']).read_text())['centers'])
assert points.shape==(300,2) and np.isfinite(points).all()
pre=np.array([421/526,512/640]);crop=np.array([0,2]);final=np.array([318/409,390/500])
delivery=((points+.5)*pre-crop)*final-.5
origin=np.round(delivery[0],6);track=np.round(delivery-delivery[0],6)
assert (track[0]==0).all() and (delivery>=0).all() and (delivery<[318,390]).all()
foot=np.array(contract['foot']['xy']);maximum=0.;checks=0
for i in range(300):
    j=(i+1)%300
    for part in [0,.125,.5,.875,1]:
        represented=origin+track[i]*(1-part)+track[j]*part
        direct=((points[i]*(1-part)+points[j]*part+.5)*pre-crop)*final-.5
        maximum=max(maximum,float(np.abs((represented-direct)*[4/3,-4/3]).max()));checks+=1
roundtrip=float(np.abs(((delivery+.5)/final+crop)/pre-.5-points).max())
assert checks==1500 and maximum<2e-6 and roundtrip<1e-10
steps=np.linalg.norm(np.roll(delivery,-1,axis=0)-delivery,axis=1)
result=dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),cat='clover',
    status='SCOPED_AUTHORED_HEAD_CANDIDATE; actual adapter/native review pending',
    sourceReport=ref(report_path),sourceVideo=ref(video),coordinateContract=ref(contract_path),harness=ref(__file__),
    fps=30,frames=300,deliverySize=[318,390],opaqueHeight=384,foot=contract['foot'],
    semantics='Presentation head: midpoint of visible eye-line centers, four eyelid/aperture joins; closed lids use visible crease endpoints. Not anatomical head center.',
    units='DELIVERY PIXEL offsets,+x right,+y down; independent head socket before cast warp',
    conversion=dict(sourceSize=[526,640],preResize=[421,512],cropRectXYXY=[0,2,409,502],finalResize=[318,390],pixelCenterConvention=True),
    partialManifest=dict(sockets={'head':origin.tolist()},socketTracks={'head':track.tolist()},socketChannels={'head':'head'}),
    uncertainty=dict(manualSourcePxPerAxis=8,manualDeliveryPxPerAxis=(8*pre*final).tolist(),note='Stated observational bound,not an empirical confidence interval'),
    conversionChecks=dict(fractionalChecks=checks,maxWorldError=maximum,maxSourceRoundtripError=roundtrip),
    continuity=dict(maxStepDeliveryPx=float(steps.max()),maxStepFrame=int(steps.argmax()),seamDeliveryPx=float(steps[-1])),
    sourceChecks=report['checks'],priorCombinedFailurePreserved=report['priorFailure'],
    runtimeChanged=False,registryChanged=False,imagesReopened=0,
    unresolved=['off-hand;no paw export from rejected R4','native decoded scene/cast alignment','matte/fringe/halo','Clover tail loop','bytes and normal-laptop performance'],
    limits='Separate R5 head gate only. Does not export the failed combined R4 model or change its data. Sparse single-observer authored approximation; no continuous ground-truth,independent visual,adapter,scene or release claim. HP and all other channels unchanged.')
out=ROOT/'reports/v5/CXV/M-clover-eye-delivery-R5.json'
assert not out.exists()
out.write_text(json.dumps(result,separators=(',',':'))+'\n')
print(json.dumps(dict(output=ref(out),origin=origin.tolist(),continuity=result['continuity'],conversionChecks=result['conversionChecks'])))
