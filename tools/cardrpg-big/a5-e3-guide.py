# REFERENCE: GAMEPLAY-V4.md, A5-REPORT.md, B3-PROGRESSION.md. Real captured opening only.
from pathlib import Path
from PIL import Image, ImageDraw
import base64, html, json, math
root=Path(__file__).resolve().parents[2]
base=root/'reports/cardrpg-big/a5/e3'
rows=[json.loads((base/f'browser-{w}/checks.json').read_text()) for w in (1280,1440,1024)]
assert all(r['complete'] for r in rows)
payoff=json.loads((base/'payoff.json').read_text())['rows'][0]
scenes=[(1280,'placement-chosen','Choose who stands in front','Place Soot in Front, compare the formation, then return him to the Back. Mochi stays in Front.'),(1280,'placement-payoff','See why your placement mattered','The cushion takes one gentle turn. The result names the front cat and both rows’ actual HP loss.'),(1440,'invitation-reveal','A welcome at the door','Open the earned welcome invitation and let the envelope reveal its guest. Its result is saved before the animation.'),(1280,'upgrade-choice','A wand or a fuller cup?','Spend the actual180fish and30threads on one existing recipe. This walkthrough chooses Soot’s wand.'),(1280,'equipment-compare','Compare, then equip',f"Soot’s attack rises from{payoff['stats']['before']['attack']} to{payoff['stats']['after']['attack']}. In the exact next battle, his direct damage changes from{payoff['sootDamage']['before']} to{payoff['sootDamage']['after']}. Both versions win."),(1280,'scouted-boss','Know what is waiting','Finish the first route stop. The map reveals the boss’s opening pattern; two clues remain to discover.')]
cards=[]
for w,name,title,copy in scenes:
 r=next(r for r in rows if r['width']==w);c=next(c for c in r['captures'] if c['name']==name)
 data=base64.b64encode((root/c['path']).read_bytes()).decode()
 cards.append(f'<article><small>{w}×{r["height"]} · observed {c["atMs"]/1000:.1f}s</small><h2>{html.escape(title)}</h2><p>{html.escape(copy)}</p><img alt="{html.escape(title)}" src="data:image/png;base64,{data}" loading="lazy"></article>')
table=''.join(f'<tr><td>{r["width"]}×{r["height"]}</td><td>{r["encounters"][0]["wallMs"]/1000:.3f}s</td><td>{next(e["atMs"] for e in r["timeline"] if e["kind"]=="equipped")/1000:.3f}s</td><td>{next(e["atMs"] for e in r["timeline"] if e["kind"]=="scouted")/1000:.3f}s</td></tr>' for r in rows)
page='''<!-- REFERENCE: docs/design/cardrpg/GAMEPLAY-V4.md; reports/cardrpg-big/a5/A5-REPORT.md; reports/cardrpg-big/a5/B3-PROGRESSION.md -->
<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The Lantern · Your first five minutes</title>
<style>*{box-sizing:border-box}body{margin:0;background:#201c2a;color:#f5ead9;font:16px/1.6 system-ui,sans-serif}main{max-width:1180px;margin:auto;padding:48px 32px}h1,h2{font-family:Georgia,serif;line-height:1.15}h1{font-size:48px;max-width:800px}h2{font-size:27px}p{max-width:78ch}small,.eyebrow{color:#efd095}a{color:#f4d7a0}header{padding-bottom:32px}article{margin:0 0 32px;padding:24px;border:1px solid #675464;border-radius:14px;background:#2c2637}img{width:100%;height:auto;border-radius:8px;display:block;margin-top:20px}table{width:100%;border-collapse:collapse;margin:24px 0}th,td{text-align:left;padding:12px;border-bottom:1px solid #675464}.note{padding:20px;border-left:4px solid #efd095;background:#30283c}footer{padding:16px 0 32px}@media(max-width:800px){main{padding:24px 16px}h1{font-size:36px}article{padding:16px}}</style>
<main><header><p class="eyebrow">THE LANTERN · A5 OPENING</p><h1>A small choice. A story you can see.</h1><p>Place a cat. Welcome a friend. Make one piece your own. Discover the first clue on tonight’s route.</p><p><a href="../../reports/cardrpg-big/a5/e3/artifact/index.html">Open the measured offline preview</a> · <a href="../../reports/cardrpg-big/a5/E3-FIRST-FIVE-MINUTES.md">Read the evidence</a></p></header>
'''+''.join(cards)+'''<section><h2>What was measured</h2><p>Fresh saves, real clicks, x1 automatic fights and natural invitation reveals. No imported progress, skips or accelerated clock.</p><table><thead><tr><th>Viewport</th><th>Practice win ≤25s</th><th>Placement + invite + equip ≤180s</th><th>Scouted map ≤300s</th></tr></thead><tbody>'''+table+'''</tbody></table><p class="note">These are automated proxy timings, not human reading times or a human playtest. The scenes combine the labelled desktop observations. Day7 cohort balance, thirty-minute cadence and later acceptance remain separate work; this opening does not establish those gates.</p></section><footer>Preview only · No purchases, wallet use or on-chain issuance.</footer></main></html>'''
(root/'docs/cardrpg3/a5-first-5-minutes.html').write_text(page)
thumbs=[]
for r in rows:
 for c in r['captures']:
  im=Image.open(root/c['path']).convert('RGB');im.thumbnail((384,240))
  tile=Image.new('RGB',(400,276),'#201c2a');tile.paste(im,((400-im.width)//2,26));ImageDraw.Draw(tile).text((8,7),f"{r['width']} / {c['name']}",fill='#f5ead9');thumbs.append(tile)
sheet=Image.new('RGB',(1600,276*math.ceil(len(thumbs)/4)),'#201c2a')
for i,im in enumerate(thumbs):sheet.paste(im,((i%4)*400,(i//4)*276))
sheet.save(base/'contact.png')
print(json.dumps({'guideBytes':len(page.encode()),'captures':len(thumbs)}))
