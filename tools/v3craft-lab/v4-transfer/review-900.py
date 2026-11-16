"""Supplemental layout only; existing silent fixed-clock recorder, no FPS claim."""
from pathlib import Path
from PIL import Image, ImageDraw
import json, statistics
root = Path('reports/v4-art/REVIEW/A10/transfer')
results = []
for fixture in ('wave1', 'wave3', 'boss'):
    folder = root / f'raw/layout900/{fixture}'
    d = json.loads((folder/'capture.json').read_text()); values = []
    for frame in d['frames']:
        units = frame['units']; cats = [u for u in units if u['side'] == 'party']; foes = [u for u in units if u['side'] == 'enemy']
        if not cats or not foes: continue
        heights = [u['box']['height']/d['height'] for u in cats]; median = statistics.median(heights)
        left = min(u['box']['x'] for u in units)/d['width']; right = 1-max(u['box']['x']+u['box']['width'] for u in units)/d['width']
        row = {'t': frame['t'], 'index': frame['index'], 'catMedian': median, 'catDeviation': max(abs(h/median-1) for h in heights), 'left': left, 'right': right, 'span': 1-left-right, 'gap': (min(u['box']['x'] for u in foes)-max(u['box']['x']+u['box']['width'] for u in cats))/d['width']}
        bosses = [u for u in foes if 'yarn-giant' in u['id']]
        if bosses: row['bossHeight'] = min(u['box']['height']/d['height'] for u in bosses)
        values.append(row)
    limits = {'catMedian': ('min', .30), 'catDeviation': ('max', .08), 'left': ('min', .03), 'right': ('min', .03), 'span': ('min', .80), 'gap': ('max', .20)}
    if fixture == 'boss': limits['bossHeight'] = ('min', .45)
    extrema, failures = {}, []
    for key, (direction, limit) in limits.items():
        worst = (min if direction == 'min' else max)(values, key=lambda v:v[key]); extrema[key] = {k:worst[k] for k in (key,'t','index')}
        failing = [v for v in values if (v[key] < limit if direction == 'min' else v[key] > limit)]
        if failing: failures.append({'metric':key,'count':len(failing),'worst':extrema[key]})
    indices = list(dict.fromkeys(round(i/3)*3 for i in [0,extrema['catDeviation']['index'],extrema['gap']['index'],extrema['span']['index']]))
    sheet = Image.new('RGB', (1024, 624), '#211e26'); draw = ImageDraw.Draw(sheet)
    for slot, index in enumerate(indices):
        image = Image.open(folder/f'frame-{index:05}.png').resize((512,288),Image.Resampling.LANCZOS); x,y = slot%2*512,slot//2*312
        sheet.paste(image,(x,y+24)); draw.text((x+8,y+6),f'900p {fixture} | {index/d["fps"]:.2f}s',fill='white')
    sheet.save(root/f'raw/layout900-{fixture}.jpg',quality=92)
    results.append({'fixture':fixture,'frames':len(d['frames']),'seconds':d['seconds'],'size':[d['width'],d['height']],'parity':d['parity'],'errors':d['errors'],'extrema':extrema,'failures':failures,'reviewFrameIndices':indices})
(root/'layout900.json').write_text(json.dumps({'method':'Existing fixed-clock 1600x900 capture; supplemental layout only, not audio or performance evidence.','results':results},indent=2)+'\n')
print(json.dumps([{'fixture':r['fixture'],'frames':r['frames'],'failures':r['failures']} for r in results]))
