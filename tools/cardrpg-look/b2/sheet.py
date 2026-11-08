from PIL import Image,ImageDraw
from pathlib import Path
import sys
root=Path(sys.argv[1]);width=int(sys.argv[2]) if len(sys.argv)>2 else 1280
files=sorted(root.glob(f'{width}-*.png'));out=Image.new('RGB',(960,310*((len(files)+1)//2)),'#152830');d=ImageDraw.Draw(out)
for i,p in enumerate(files):
 im=Image.open(p).convert('RGB');im.thumbnail((476,275));x=i%2*480;y=i//2*310;out.paste(im,(x,y+25));d.text((x+8,y+7),p.stem,fill='#ffdfab')
out.save(root/'sheet.jpg',quality=88)
