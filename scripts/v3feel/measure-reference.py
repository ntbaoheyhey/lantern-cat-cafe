"""Reproducible, conservative reference pixel measurements; no reference art is shipped.

Positive RGB difference inside a manually observed effect region estimates effect
coverage. This is not a ground-truth matte: animated bodies, text and compression
can contaminate it. Report the threshold sensitivity, never silently call it alpha.
"""
import json, subprocess, io, datetime
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[2]
craft = root/'reports/v3-feel/CRAFT'
private = root/'reports/v3-feel/ref/QR/measurements'
private.mkdir(parents=True, exist_ok=True)
selection = json.loads((craft/'reference-selection.json').read_text())
observations = json.loads((craft/'reference-observations.json').read_text())
by_id = {a['id']: a for a in selection['actions']}
def frame(index, time):
    # Measure exactly the sampled frame that was inspected, not a second seek
    # that can land one source frame earlier around a hard impact.
    n = round((time-index['start'])*index['fps'])
    sheet = Image.open(root/index['sheets'][n//24]).convert('RGB')
    h = round(320*(1080/1620 if index['sourceId']=='v1' else 888/1920))
    x = n%4*320; y = (n%24)//4*(h+22)
    return sheet.crop((x,y,x+320,y+h))

rows = []
for o in observations['actions']:
    a = by_id[o['id']]
    index = json.loads((root/'reports/v3-feel/ref/QR'/a['id']/'index.json').read_text())
    peak = frame(index, o['peak']); before = frame(index, o['baseline'])
    rgb = np.asarray(peak).astype(float)/255
    previous = np.asarray(before).astype(float)/255
    h,w = rgb.shape[:2]
    x0,y0,x1,y1 = [int(v*(w if i%2==0 else h)) for i,v in enumerate(o['roi'])]
    region = np.zeros((h,w), bool); region[y0:y1,x0:x1] = True
    delta = np.max(rgb-previous,axis=2)
    masks = [(delta > threshold)&region for threshold in [.10,.18,.26]]
    mask = masks[1]
    hsv = np.asarray(peak.convert('HSV')).astype(float)/255
    linear = np.where(rgb <= .04045,rgb/12.92,((rgb+.055)/1.055)**2.4)
    luminance = linear@np.array([.2126,.7152,.0722])
    sample = np.asarray(peak).copy();sample[~mask] = (sample[~mask]*.18).astype('uint8')
    canvas = Image.new('RGB',(1280,h*2+28),'#15141c');canvas.paste(peak.resize((640,h*2)),(0,0));canvas.paste(Image.fromarray(sample).resize((640,h*2)),(640,0))
    draw=ImageDraw.Draw(canvas);draw.text((8,h*2+7),f"{a['id']} {o['peak']:.3f}s | positive-difference estimate, threshold .18; NOT ground-truth alpha",fill='white')
    path=private/(a['id']+'.jpg');canvas.save(path,quality=87)
    noncontext = [v for k,v in o['phases'].items() if v and k not in ['context','nextAction']]
    rows.append({**a,**o,'sheetPaths':index['sheets'],'sourcePath':index['source'],
        'estimatedPeakAreaFraction':float(mask.mean()),
        'areaSensitivityRange':[float(m.mean()) for m in masks],
        'peakRoiAreaFraction':float(region.mean()),
        'effectSpanSeconds':(max(v[1] for v in noncontext)-min(v[0] for v in noncontext)+1)/10,
        'meanEffectSaturation':float(hsv[:,:,1][mask].mean()) if mask.any() else None,
        'peakLuminanceP95':float(np.quantile(luminance[mask],.95)) if mask.any() else None,
        'measurementSheet':str(path.relative_to(root)),
        'measurementLimit':'Positive-difference mask may include moving actors and numbers; field ROI excludes portrait HUD. U05 samples in-field impact, not full-screen cinematic. Values are estimates, not acceptance-grade isolation.'})
missing = [r['id'] for r in rows if r['meanEffectSaturation'] is None]
summary={'missingMeasurements':missing,'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'method':'320px observed contact-sheet samples; ROI from observed shape; positive max-RGB delta > .18 vs same-action pre-contact frame; sensitivity .10/.26; saturation HSV; p95 linear Rec.709 luminance',
    'sampleFps':10,'phasePrecisionMs':100,'soundHeard':False,
    'referenceMedianSaturation':None if missing else float(np.median([r['meanEffectSaturation'] for r in rows])),
    'referenceMedianPeakLuminance':None if missing else float(np.median([r['peakLuminanceP95'] for r in rows])),
    'actions':rows}
(root/'reports/v3-feel/REF-EFFECTS.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps({k:v for k,v in summary.items() if k!='actions'}))
