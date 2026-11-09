"""Create compact review sheets from hash-verified L7 screenshots.

The sheets are review aids. This script never marks a personal review complete.
"""
import argparse,hashlib,json,math
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw

parser=argparse.ArgumentParser()
parser.add_argument('--partial',action='store_true',help='Prepare completed five-unit groups while capture continues; no acceptance')
args=parser.parse_args()
base=Path('reports/cardrpg-look/validation/l7/atelier')
receipt=json.loads((base/'checks.json').read_text())
assert not receipt['failures']
if not args.partial:assert receipt['passed'] and len(receipt['units'])==25
out=base/'review-sheets'
out.mkdir(exist_ok=True)
records=[]

def sheet(name,rows,columns,width=400,height=300):
    canvas=Image.new('RGB',(columns*width,((len(rows)+columns-1)//columns)*height),'#12272f')
    draw=ImageDraw.Draw(canvas)
    for i,(path,label,want,bounds) in enumerate(rows):
        raw=path.read_bytes()
        actual=hashlib.sha256(raw).hexdigest()
        if want: assert actual==want,str(path)
        with Image.open(path) as image:
            source=image.convert('RGB')
            if bounds:
                # Retain native screenshots, but enlarge each miniature in the
                # review aid. Full viewport thumbnails hide eyes/accessories.
                left,top,right,bottom=bounds
                dx=(right-left)*.12;dy=(bottom-top)*.12
                box=(max(0,int((left-dx)*image.width)),max(0,int((top-dy)*image.height)),
                     min(image.width,math.ceil((right+dx)*image.width)),min(image.height,math.ceil((bottom+dy)*image.height)))
                source=source.crop(box)
            small=ImageOps.contain(source,(width-8,height-30))
        x=(i%columns)*width;y=(i//columns)*height
        canvas.paste(small,(x+(width-small.width)//2,y+24))
        draw.text((x+6,y+6),label,fill='#fff0d2')
        records.append({'sheet':name,'path':str(path),'sha256':actual,'modelBoundsCrop':bounds})
    canvas.save(out/name)

for offset in range(0,len(receipt['units'])//5*5,5):
    rows=[(base/angle['file'],f"{row['owner']} / {round(math.degrees(angle['angle']))} degrees",angle['sha256'],angle['models'][0]['bounds'])
          for row in receipt['units'][offset:offset+5] for angle in row['angles']]
    sheet(f'units-{offset+1:02d}-{offset+5:02d}.jpg',rows,4)
if len(receipt['stages'])==9:
    sheet('dioramas.jpg',[(base/r['file'],f"Chapter {r['chapter']} / {r['camera']}",r['sha256'],None) for r in receipt['stages']],3,640,390)
for tab in (['models','comparison','notes'] if len(receipt['configs'])==6 else []):
    rows=[(base/f"ui-{r['width']}-dpr{r['dpr']}-{tab}.png",f"{r['width']}x{r['height']} DPR{r['dpr']} / {tab}",None,None) for r in receipt['configs']]
    sheet(f'ui-{tab}.jpg',rows,2,640,400)
(out/('partial-manifest.json' if args.partial else 'manifest.json')).write_text(json.dumps({'artifact':receipt['sha256'],'partial':args.partial,'inputs':records,'sheets':[
    {'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(out.glob('*.jpg'))
]},indent=2)+'\n')
print(f'Wrote review aids for {len(records)} verified captures; partial={args.partial}; personal review still required.')
