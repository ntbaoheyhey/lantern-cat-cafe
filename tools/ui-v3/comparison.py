"""Small original contact sheets and an offline before/after review page."""
from pathlib import Path
from PIL import Image,ImageDraw
import json,html
root=Path(__file__).resolve().parents[2]
reports=root/'reports/ui-v3'
out=root/'docs/ui-v3'
out.mkdir(exist_ok=True,parents=True)
before=json.loads((reports/'before/manifest.json').read_text())
after=json.loads((reports/'after/manifest.json').read_text())
left={(r['width'],r['look'],r['screen']):r for r in before}
rows=[]
for r in after:
 key=(r['width'],r['look'],r['screen'])
 if key in left: rows.append((left[key],r))
for look in ['on','off']:
 chosen=[pair for pair in rows if pair[1]['width']==1280 and pair[1]['look']==look and pair[1]['screen'] in ['home','team','collection','inventory','gacha','prepare','battle','result']]
 sheet=Image.new('RGB',(960,len(chosen)*296),'#102129');draw=ImageDraw.Draw(sheet)
 for i,(a,b) in enumerate(chosen):
  draw.text((12,i*296+5),a['screen']+'  |  BEFORE / AFTER',fill='#f5ebdc')
  for x,r in [(0,a),(480,b)]:
   im=Image.open(root/r['file']).convert('RGB');im.thumbnail((480,270));sheet.paste(im,(x,i*296+26))
 sheet.save(reports/f'contact-{look}.webp',quality=78)
items=[]
for a,b in rows:
 items.append(f'<article data-look="{b["look"]}"><h2>{html.escape(b["screen"])} · {b["width"]} · Look {b["look"]}</h2><div class="pair"><figure><img loading="lazy" src="../../{a["file"]}" alt="Before {b["screen"]}"><figcaption>Before</figcaption></figure><figure><img loading="lazy" src="../../{b["file"]}" alt="After {b["screen"]}"><figcaption>After</figcaption></figure></div></article>')
(out/'before-after.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>The Lantern · UI v3 comparison</title><style>body{margin:24px;background:#102129;color:#f5ebdc;font:16px system-ui}a{color:#f3bb61}h1{font-size:30px}h2{font-size:18px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}figure{margin:0}img{width:100%;border-radius:12px}article{margin:28px 0}figcaption{padding:8px}@media(max-width:700px){.pair{grid-template-columns:1fr}}</style><h1>The Lantern · Living Cafe</h1><p><a href="index.html">Play offline</a> · Matched viewport and look. Review-only Before / after is captured with dev=1. Gameplay fixtures are deterministic; these images do not prove human preference.</p>'+''.join(items)+'</html>')
print(json.dumps({'matched':len(rows),'contactSheets':2}))
