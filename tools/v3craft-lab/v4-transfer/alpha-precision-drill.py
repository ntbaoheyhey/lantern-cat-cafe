"""Private bounded-opacity precision trials. Never label changed alpha lossless."""
import datetime
import gc
import hashlib
import json
import subprocess
import time
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, _avif
from skimage.color import rgb2lab

ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'reports/v4-art/REVIEW/A10/scene-ready-transfer'
RAW=OUT/'raw/alpha-precision-r1'
REPORT=OUT/'alpha-precision-r1.json'
assert not REPORT.exists()
RAW.mkdir(parents=True,exist_ok=True)
BASE=json.loads((OUT/'drill-r3.json').read_text())
SHA=lambda b:hashlib.sha256(b).hexdigest()
SETTINGS=dict(format='AVIF',quality=60,subsampling='4:4:4',speed=6,codec='aom',max_threads=2,advanced={'a:lossless':'1','a:cq-level':'0'})


def opacity_lut(step):
    # Isolate zero/opaque and both sides of the runtime's >=128 hull boundary.
    # Additional low-opacity bands avoid shifting common coverage classifications.
    boundaries=[0,1,8,16,24,32,64,128,192,224,254,255,256]
    lut=np.arange(256,dtype=np.uint8)
    for lo,stop in zip(boundaries,boundaries[1:]):
        hi=stop-1
        anchors=sorted(set([lo,hi]+list(range(lo,stop,step))))
        for value in range(lo,stop):
            lut[value]=min(anchors,key=lambda a:(abs(a-value),a))
    original=np.arange(256)
    assert np.max(np.abs(lut.astype(int)-original))<=step/2
    for threshold in boundaries[1:-1]:
        assert np.array_equal(original>=threshold,lut>=threshold)
    return lut


LUTS={f'alpha-step{step}':opacity_lut(step) for step in (4,8)}


def measure(original,decoded,lut):
    a,b=np.asarray(original),np.asarray(decoded)
    assert a.shape==b.shape
    source_alpha=a[:,:,3];actual_alpha=b[:,:,3]
    delta=np.abs(source_alpha.astype(int)-actual_alpha.astype(int))
    mask=source_alpha>=128
    ac,bc=a[:,:,:3][mask],b[:,:,:3][mask]
    sums=np.zeros((2,3),dtype=np.float64);errors=[]
    for start in range(0,len(ac),65536):
        al=rgb2lab((ac[start:start+65536].astype(np.float32)/255).reshape(-1,1,3)).reshape(-1,3)
        bl=rgb2lab((bc[start:start+65536].astype(np.float32)/255).reshape(-1,1,3)).reshape(-1,3)
        sums[0]+=al.sum(axis=0,dtype=np.float64);sums[1]+=bl.sum(axis=0,dtype=np.float64)
        errors.append(np.linalg.norm(al-bl,axis=1))
    de=np.concatenate(errors);mean_lab=float(np.linalg.norm((sums[0]-sums[1])/len(ac)))
    quantized_exact=bool(np.array_equal(lut[source_alpha],actual_alpha))
    support_exact=bool(np.array_equal(source_alpha>0,actual_alpha>0))
    hull_exact=bool(np.array_equal(source_alpha>=128,actual_alpha>=128))
    return {'dimensionsExact':True,'sourceAlphaExact':bool(np.array_equal(source_alpha,actual_alpha)),
        'quantizedAlphaExact':quantized_exact,'alphaMaxDelta':int(delta.max()),
        'alphaChangedPixels':int(np.count_nonzero(delta)),'alphaMeanAbsoluteDelta':float(delta.mean()),
        'alphaMassRelativeDelta':float((actual_alpha.astype(np.float64).sum()-source_alpha.astype(np.float64).sum())/source_alpha.sum()),
        'nonzeroSupportExact':support_exact,'opaque128ClassExact':hull_exact,
        'maskedMeanLabDelta':mean_lab,'perPixelDeltaE76':{'mean':float(de.mean()),'p95':float(np.percentile(de,95)),'max':float(de.max())},
        'existingExactAlphaCheckPassed':bool(np.array_equal(source_alpha,actual_alpha)),
        'boundedTrialChecks':quantized_exact and support_exact and hull_exact and mean_lab<=6,
        'runtimeAndFilmAcceptance':False}


def comparison(row):
    original=Image.open(ROOT/row['source']).convert('RGBA');box=row['crop']
    images=[('original',original)]+[(c['method'],Image.open(ROOT/c['path']).convert('RGBA')) for c in row['candidates']]
    sheet=Image.new('RGB',(984,710),'#241c2b');draw=ImageDraw.Draw(sheet)
    for col,(label,im) in enumerate(images):
        x=col*328;draw.text((x+4,5),row['kind']+'/'+row['owner']+' / '+label,fill='white')
        for y,color in [(28,(36,28,43,255)),(374,(214,198,165,255))]:
            tile=Image.new('RGBA',(320,320),color);tile.alpha_composite(im.crop(box));sheet.paste(tile.convert('RGB'),(x+4,y))
    draw.text((4,352),'Same native crop on dark/light; alpha changes retained; not runtime or film acceptance',fill='white')
    path=RAW/(row['kind']+'-'+row['owner']+'-comparison.png');sheet.save(path)
    return {'path':str(path.relative_to(ROOT)),'sha256':SHA(path.read_bytes()),'reviewed':False}


receipt={'started':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'scope':'Private bounded-opacity precision experiment; changed alpha is not lossless equivalence',
 'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
 'scriptSha256AtRun':SHA(Path(__file__).read_bytes()),'boundDrillR3Sha256':SHA((OUT/'drill-r3.json').read_bytes()),
 'encoder':{'libavif':_avif.libavif_version,'codecs':_avif.codec_versions()},'settings':SETTINGS,
 'opacityLuts':{name:lut.tolist() for name,lut in LUTS.items()},'baseline':BASE['baseline'],
 'newMappingByteReserve':8192,'assets':[],'complete':False}
for source in BASE['assets']:
    path=ROOT/source['source'];assert SHA(path.read_bytes())==source['sourceSha256']
    original=Image.open(path).convert('RGBA')
    row={k:source[k] for k in ['owner','kind','source','sourceSha256','sourceBytes','size','observedOriginalTransferBytes','observedResponseOverhead']}
    row['candidates']=[]
    for method,lut in LUTS.items():
        output=RAW/(row['kind']+'-'+row['owner']+'-'+method+'.avif');assert not output.exists()
        adjusted=original.copy();adjusted.putalpha(Image.fromarray(lut[np.asarray(original.getchannel('A'))]))
        started=time.monotonic();adjusted.save(output,**SETTINGS)
        decoded=Image.open(output).convert('RGBA');checks=measure(original,decoded,lut)
        assert checks['quantizedAlphaExact'] and checks['nonzeroSupportExact'] and checks['opaque128ClassExact']
        row['candidates'].append({'method':method,'path':str(output.relative_to(ROOT)),'sha256':SHA(output.read_bytes()),'bytes':output.stat().st_size,'seconds':time.monotonic()-started,**checks})
        del adjusted,decoded;gc.collect()
    if source.get('comparison'):
        row['crop']=source['comparison']['crop'];row['comparison']=comparison(row)
    receipt['assets'].append(row);REPORT.write_text(json.dumps(receipt,indent=2)+'\n')
    print(row['kind'],row['owner'],[(c['method'],c['bytes'],c['alphaMaxDelta'],round(c['maskedMeanLabDelta'],4)) for c in row['candidates']],flush=True)
    del original;gc.collect()
receipt['projections']=[]
for method in LUTS:
    candidates=[next(c for c in a['candidates'] if c['method']==method) for a in receipt['assets']]
    owned=sum(c['bytes']+a['observedResponseOverhead'] for a,c in zip(receipt['assets'],candidates))
    total=BASE['baseline']['nonImageBytes']+BASE['baseline']['unchangedAuxiliaryImageBytes']+owned+receipt['newMappingByteReserve']
    receipt['projections'].append({'method':method,'ownedBytesWithObservedOverhead':owned,'totalBytesIncludingMappingReserve':total,'withinBudgetProjection':total<=8000000,'boundedTrialChecks':all(c['boundedTrialChecks'] for c in candidates),'exactSourceAlpha':all(c['sourceAlphaExact'] for c in candidates),'measuredProductionPass':False})
receipt.update(complete=True,finished=datetime.datetime.now(datetime.timezone.utc).isoformat())
REPORT.write_text(json.dumps(receipt,indent=2)+'\n');print('complete',receipt['projections'],flush=True)
