"""Export the separately validated R6 authored visible-paw anchor for adapter review."""
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
report_path=ROOT/'reports/v5/CXV/M-clover-paw-R6-validation.json'
report=json.loads(report_path.read_text())
assert report['passSparseControls'] and report['passCount']==report['freshHeldoutCount']==24 and not report['fitPerformed']
raw_ref=report['model']['raw']
assert sha(raw_ref['path'])==raw_ref['sha256']
assert sha(report['observations']['path'])==report['observations']['sha256']
assert sha(report['model']['report'])==report['model']['reportSha256']
assert not json.loads(Path(report['model']['report']).read_text())['passSparseControls']
contract_path=Path('/Users/bao/taskbar-hero-chain/reports/v5/CXI/evidence/v8-m-clover-provisional-sockets.json')
contract=json.loads(contract_path.read_text())
video=ROOT/'work/v5/CXV/ref/batch-m/clover.mp4'
assert sha(video)==contract['sourceSha256']
assert contract['deliverySize']==[318,390] and contract['opaqueHeight']==384
points=np.array(json.loads(Path(raw_ref['path']).read_text())[report['model']['field']]['centers'])
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
    status='SCOPED_AUTHORED_PAW_CANDIDATE; actual adapter/native review pending',
    sourceReport=ref(report_path),sourceVideo=ref(video),coordinateContract=ref(contract_path),harness=ref(__file__),
    fps=30,frames=300,deliverySize=[318,390],opaqueHeight=384,foot=contract['foot'],
    semantics='Presentation free paw: midpoint of visible paw+digits bounds clipped at visible sleeve edge and occluding cloth. No hidden wrist or anatomical palm recovery.',
    units='DELIVERY PIXEL offsets,+x right,+y down; independent off-hand socket before cast warp',
    conversion=dict(sourceSize=[526,640],preResize=[421,512],cropRectXYXY=[0,2,409,502],finalResize=[318,390],pixelCenterConvention=True),
    partialManifest=dict(sockets={'off-hand':origin.tolist()},socketTracks={'freePaw':track.tolist()},socketChannels={'off-hand':'freePaw'}),
    uncertainty=dict(manualSourcePxPerAxis=6,manualDeliveryPxPerAxis=(6*pre*final).tolist(),note='Stated observational bound,not an empirical confidence interval'),
    conversionChecks=dict(fractionalChecks=checks,maxWorldError=maximum,maxSourceRoundtripError=roundtrip),
    continuity=dict(maxStepDeliveryPx=float(steps.max()),maxStepFrame=int(steps.argmax()),seamDeliveryPx=float(steps[-1])),
    sourceChecks=dict(freshHeldouts24=report['passCount']==24,noRefit=not report['fitPerformed']),priorCombinedFailurePreserved=report['model'],
    requiredCXILoaderChange='Add independent freePaw channel to loader validation;bind only off-hand. Do not alias prop,head,hip or spout;preserve other channels.',
    runtimeChanged=False,registryChanged=False,imagesReopened=0,
    unresolved=['actual loader freePaw channel and adapter validation','native decoded scene/cast alignment','matte/fringe/halo','Clover tail loop','bytes and normal-laptop performance'],
    limits='Separate R6 paw validation gate only,with unchanged R4 paw data. Does not export the failed combined R4 model or change its data. Sparse single-observer authored approximation; no continuous ground-truth,independent visual,adapter,scene or release claim. Head,HP and all other channels unchanged.')
out=ROOT/'reports/v5/CXV/M-clover-paw-delivery-R6.json'
assert not out.exists()
out.write_text(json.dumps(result,separators=(',',':'))+'\n')
print(json.dumps(dict(output=ref(out),origin=origin.tolist(),continuity=result['continuity'],conversionChecks=result['conversionChecks'])))
