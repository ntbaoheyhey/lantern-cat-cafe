"""Full-canvas runtime pose contact sheets; originals remain untouched."""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps

p=argparse.ArgumentParser()
p.add_argument('directory',type=Path)
a=p.parse_args()
receipt=json.loads((a.directory/'poses.json').read_text())
ids=sorted({row['id'] for row in receipt['rows']})
out=a.directory/'sheets'
out.mkdir(exist_ok=True)
for skill in ids:
    rows=[row for row in receipt['rows'] if row['id']==skill]
    if len(rows)!=6:
        continue
    sheet=Image.new('RGB',(1440,660),'#1d3039')
    draw=ImageDraw.Draw(sheet)
    for i,row in enumerate(rows):
        im=Image.open(a.directory/row['file']).convert('RGB')
        im=ImageOps.contain(im,(720,190),Image.Resampling.LANCZOS)
        x,y=i%2*720,i//2*220
        sheet.paste(im,(x+(720-im.width)//2,y+25))
        draw.text((x+8,y+6),f"{skill} / {row['progress']:.0%} / full canvas",fill='#fff0d2')
    sheet.save(out/f'{skill}.png')
print(json.dumps({'completeSkills':len(list(out.glob('*.png'))),'artifactSha256':receipt['sha256'],'output':str(out)}))
