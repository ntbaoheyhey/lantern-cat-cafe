"""Private comparisons of two GPU filtering drills; no acceptance inferred."""
from pathlib import Path
import json
import hashlib
import math
import sys
from datetime import datetime, timezone
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'reports/v4-art/REVIEW/A10/scene-ready-transfer'
panko_native = '--panko-native' in sys.argv
panko_detail = panko_native or '--panko-detail' in sys.argv
label = 'panko-native-r1' if panko_native else 'panko-filter-r1' if panko_detail else 'pma-filter-r1'
RAW = OUT / ('raw/'+label+'-comparisons')
REPORT = OUT / (label+'-comparison.json')
assert not REPORT.exists()
paths = [OUT / 'browser-resolution-baseline.json', OUT / (label+'.json')]
baseline, drill = [json.loads(p.read_text()) for p in paths]
assert baseline['complete'] and baseline['pass'] and drill['complete'] and drill['pass']
labels = ['baseline', *drill['methods']]
indexed = [{(r['fixture'], r['height']): r for r in baseline['results']}]
indexed += [{(r['fixture'], r['height']): r for r in drill['results'] if r['method'] == method} for method in drill['methods']]
for cases in indexed:
    for case in cases.values():
        assert hashlib.sha256((ROOT / case['snapshot']).read_bytes()).hexdigest() == case['snapshotSha256']
RAW.mkdir(parents=True, exist_ok=True)
sheets, geometry = [], []
groups = [((fixture, height), ('panko','panko')) for height in (720,900) for fixture in ('wave3','boss')] if panko_detail else [(('wave1', 720), ('mochi', 'soot')), (('wave3', 720), ('panko', 'clover')), (('boss', 720), ('binding-thread', 'yarn-giant'))]
for key, owners in groups:
    sheet = Image.new('RGB', (984, 700), '#241c2b'); draw = ImageDraw.Draw(sheet)
    for row, owner in enumerate(owners):
        a = next(a for a in indexed[0][key]['state']['actors'] if a['asset'] == owner)
        face = a['face']; cx, cy = round(face['x'] + face['width']/2), round(face['y'] + face['height']/2 + 60)
        box = (cx-160, cy-160, cx+160, cy+160)
        if panko_detail and row==1:box=(cx-80,cy-140,cx+80,cy+20)
        for col, (label, cases) in enumerate(zip(labels, indexed)):
            draw.text((col*328+4, row*350+4), f'{owner} {key[1]}p '+('face2x ' if panko_detail and row==1 else '')+label, fill='white')
            crop=Image.open(ROOT/cases[key]['snapshot']).convert('RGB').crop(box)
            if panko_detail and row==1:crop=crop.resize((320,320),Image.Resampling.LANCZOS)
            sheet.paste(crop, (col*328+4, row*350+24))
    path = RAW/f'{key[0]}-{key[1]}-native.png'; sheet.save(path); sheets.append(path)
if not panko_detail:
    sheet = Image.new('RGB', (984, 1899), '#241c2b'); draw = ImageDraw.Draw(sheet)
    for row, (label, cases) in enumerate(zip(labels, indexed)):
        draw.text((4, row*633+2), 'boss 900p / '+label+' / equal viewport downscale', fill='white')
        sheet.paste(Image.open(ROOT/cases[('boss', 900)]['snapshot']).convert('RGB').resize((984, 615), Image.Resampling.LANCZOS), (0, row*633+18))
    path = RAW/'boss-900-stage.png'; sheet.save(path); sheets.append(path)
for method, cases in zip(labels[1:], indexed[1:]):
    for key, case in cases.items():
        for a in indexed[0][key]['state']['actors']:
            b = next(b for b in case['state']['actors'] if b['id'] == a['id'])
            feet = math.hypot(a['feet']['x']-b['feet']['x'], a['feet']['y']-b['feet']['y'])
            ratios = [b['face'][k]/a['face'][k] for k in ('width','height')]
            geometry.append({'method':method,'fixture':key[0],'height':key[1],'id':a['id'],'feetDelta':feet,'headRatios':ratios,'pass':feet<=3 and all(abs(v-1)<=.05 for v in ratios)})
receipt = {'at':datetime.now(timezone.utc).isoformat(),'sourceHashes':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in paths},
           'scope':'Two private fixed-state GPU drills; no animation, production-transfer or visual acceptance.', 'geometry':geometry,'staticGeometryPass':all(r['pass'] for r in geometry),
           'comparisons':[{'path':str(p.relative_to(ROOT)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'reviewed':False} for p in sheets]}
REPORT.write_text(json.dumps(receipt, indent=2)+'\n')
print('four private comparisons; staticGeometryPass',receipt['staticGeometryPass'])
