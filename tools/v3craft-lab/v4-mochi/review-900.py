"""Reduce the existing silent fixed-clock boss recording without altering it."""
from pathlib import Path
from PIL import Image, ImageDraw
import json, statistics, math
root = Path('reports/v4-art/REVIEW/A4')
folder = root / '900/boss'
d = json.loads((folder / 'capture.json').read_text())
values = []
for f in d['frames']:
    units = f['units']; cats = [u for u in units if u['side'] == 'party']; foes = [u for u in units if u['side'] == 'enemy']
    hs = [u['box']['height'] / d['height'] for u in cats]
    if not hs or not foes: continue
    median = statistics.median(hs)
    left = min(u['box']['x'] for u in units) / d['width']
    right = 1 - max(u['box']['x'] + u['box']['width'] for u in units) / d['width']
    values.append({'t': f['t'], 'index': f['index'], 'catMedian': median,
                   'catDeviation': max(abs(h / median - 1) for h in hs), 'left': left, 'right': right,
                   'span': 1-left-right,
                   'gap': (min(u['box']['x'] for u in foes) - max(u['box']['x'] + u['box']['width'] for u in cats)) / d['width'],
                   'boss': next((u['box']['height']/d['height'] for u in foes if u['kind'] == 'boss'), None)})
limits = {'catMedian': ('min', .30), 'catDeviation': ('max', .08), 'left': ('min', .03), 'right': ('min', .03), 'span': ('min', .80), 'gap': ('max', .20), 'boss': ('min', .45)}
extrema = {}; failures = []
for key, (direction, limit) in limits.items():
    valid = [v for v in values if v[key] is not None]
    if not valid: continue
    worst = (min if direction == 'min' else max)(valid, key=lambda v:v[key])
    extrema[key] = {k:worst[k] for k in [key, 't', 'index']}
    failing = [v for v in valid if v[key] < limit] if direction == 'min' else [v for v in valid if v[key] > limit]
    if failing: failures.append({'metric':key, 'count':len(failing), 'worst':extrema[key]})
actions = []
for i,p in enumerate(d['plans']):
    f = d['frames'][p['frame']]
    a = f['action']
    if not a: continue
    impact = f['t'] + (a['impact']-a['elapsed'])/1000
    actions.append({'key':i,'actor':p['actorId'],'skill':p['skillId'],'impact':impact,'times':[impact-.3+j*.1 for j in range(9)]})
out = root/'raw/action-strips'
out.mkdir(parents=True,exist_ok=True)
for page in range(math.ceil(len(actions)/40)):
    batch = actions[page*40:(page+1)*40]
    sheet = Image.new('RGB',(1024,24+len(batch)*101),'#221f29');draw=ImageDraw.Draw(sheet)
    draw.text((8,5),'1440x900 boss | fixed-clock silent recording | 10fps contact windows',fill='white')
    for row,a in enumerate(batch):
        y=24+row*101
        draw.text((8,y),f'A{a["key"]:02} {a["actor"] or "ROUND"} {a["skill"]} | impact {a["impact"]:.3f}s',fill='white')
        for j,t in enumerate(a['times']):
            index=round(t*10)*3
            p=folder/f'frame-{index:05d}.png'
            if 0<=t<30 and p.exists():sheet.paste(Image.open(p).convert('RGB').resize((112,70),Image.Resampling.LANCZOS),(8+j*112,y+17))
            else:draw.text((8+j*112,y+38),'OUTSIDE',fill='#ffa86a')
    sheet.save(out/f'boss900-{page+1:02}.jpg',quality=88)
(root/'film-framing-900.json').write_text(json.dumps({'fixture':'boss','width':d['width'],'height':d['height'],'frames':len(d['frames']),'parity':d['parity'],'errors':d['errors'],'method':'Existing fixed-clock silent recording; nearest100ms saved film frame for contact strips. Audio reviewed separately in720p.','extrema':extrema,'failures':failures,'actions':actions},indent=2)+'\n')
print('900 boss',len(values),'frames',len(actions),'actions','failures',failures)
