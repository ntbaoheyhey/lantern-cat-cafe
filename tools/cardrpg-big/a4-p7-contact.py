# REFERENCE: P7 real-click journey. Contact sheet from unchanged local capture pixels.
from pathlib import Path
from PIL import Image,ImageDraw,ImageOps
import json,hashlib
root=Path.cwd();out=root/'reports/cardrpg-big/a4/p7/journey'
data=json.loads((out/'checks.json').read_text());assert data['complete']
shots=data['captures'];w,h=384,244;sheet=Image.new('RGB',(w*3,h*((len(shots)+2)//3)), '#f5efdf');draw=ImageDraw.Draw(sheet)
for i,row in enumerate(shots):
 p=root/row['path'];image=Image.open(p);assert image.size==(1280,720)
 thumb=ImageOps.contain(image,(w-16,207));x=(i%3)*w+8;y=(i//3)*h+8;sheet.paste(thumb,(x,y));draw.text((x,y+211),row['name'],fill='#203334')
sheet.save(out/'contact.png');print(json.dumps({'captures':len(shots),'size':sheet.size,'sha256':hashlib.sha256((out/'contact.png').read_bytes()).hexdigest()}))
