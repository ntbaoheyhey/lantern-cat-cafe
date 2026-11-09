"""Overview derivatives from immutable phase screenshots; original images retained."""
import json
from pathlib import Path
from PIL import Image, ImageDraw

for kind, count, row_count in [('cat',24,4),('opponent',12,2)]:
    root=Path(f'reports/cardrpg-look/validation/l5/phase-{kind}-poses')
    if not (root/'poses.json').exists():
        continue
    receipt=json.loads((root/'poses.json').read_text())
    out=root/'review-sheets';out.mkdir(exist_ok=True)
    for owner in dict.fromkeys(row['cat'] for row in receipt['rows']):
        rows=[row for row in receipt['rows'] if row['cat']==owner]
        dest=out/f'{owner}.png'
        if len(rows)!=count or dest.exists():
            continue
        w,h=300,300
        sheet=Image.new('RGB',(6*w,row_count*h),'#102129');draw=ImageDraw.Draw(sheet)
        for index,row in enumerate(rows):
            im=Image.open(root/row['file']).convert('RGB')
            x0,y0,x1,y1=row['projectedBounds'];iw,ih=im.size
            im=im.crop((max(0,int(x0*iw)-15),max(0,int(y0*ih)-15),min(iw,int(x1*iw)+15),min(ih,int(y1*ih)+15)))
            im.thumbnail((w-12,h-32));x=index%6*w;y=index//6*h
            sheet.paste(im,(x+(w-im.width)//2,y+23+(h-32-im.height)//2))
            draw.text((x+8,y+5),f"{row['id']} @ {row['progress']:.2f}",fill='#fff0d2')
        sheet.save(dest)
        print(dest)
    print(kind,len(receipt['rows']),'samples available')
