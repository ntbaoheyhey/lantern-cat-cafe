"""REFERENCE: PROMPT-A3.md. Contact sheet from real browser captures, no generated art."""
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
import sys,json,hashlib
out=Path(sys.argv[1]); paths=[Path(p) for p in sys.argv[2:]]
width=600;cell_h=390
sheet=Image.new('RGB',(width*2,cell_h*((len(paths)+1)//2)),(16,32,39));d=ImageDraw.Draw(sheet)
for n,p in enumerate(paths):
 im=Image.open(p).convert('RGB');im.thumbnail((width,cell_h-32))
 x=(n%2)*width;y=(n//2)*cell_h
 sheet.paste(im,(x,y+32));d.text((x+8,y+8),str(p.parent.name)+' / '+p.name,fill=(255,233,198))
out.parent.mkdir(parents=True,exist_ok=True);sheet.save(out)
out.with_suffix('.json').write_text(json.dumps({'images':[{'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in paths],'sheetSha256':hashlib.sha256(out.read_bytes()).hexdigest()},indent=2))
