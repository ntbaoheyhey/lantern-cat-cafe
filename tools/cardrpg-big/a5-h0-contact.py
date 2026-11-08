# REFERENCE: PROMPT-A5 H0. Thumbnail contact sheets of actual screenshots; no generated imagery.
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps
import json, hashlib
root=Path('reports/cardrpg-big/a5/h0')
session=json.loads((root/'session/timeline.json').read_text())
day7=json.loads((root/'day7/checks.json').read_text())
assert session['complete'] and day7['complete']
shots=session['captures']+day7['captures']
w,h=384,242
sheet=Image.new('RGB',(w*3,h*((len(shots)+2)//3)),'#f5efdf')
draw=ImageDraw.Draw(sheet)
for i,row in enumerate(shots):
    source=Image.open(row['path'])
    assert source.size==(1280,720)
    x,y=(i%3)*w+8,(i//3)*h+8
    sheet.paste(ImageOps.contain(source,(w-16,207)),(x,y))
    text=row.get('label',row.get('name','screen'))
    if 'atMs' in row: text=f"{row['atMs']/60000:.1f}m {text}"
    draw.text((x,y+210),text[:58],fill='#203334')
sheet.save(root/'contact.png')
print(json.dumps({'screens':len(shots),'pixels':sheet.size,'sha256':hashlib.sha256((root/'contact.png').read_bytes()).hexdigest()}))
