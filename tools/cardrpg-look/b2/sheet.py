from PIL import Image,ImageDraw
from pathlib import Path
import sys
p=Path(sys.argv[1]);files=sorted(p.glob('1280-*.png'));sheet=Image.new('RGB',(960,930),'#172e36');d=ImageDraw.Draw(sheet)
for i,f in enumerate(files[:6]):
 im=Image.open(f).convert('RGB');im.thumbnail((480,280));x=i%2*480;y=i//2*310;sheet.paste(im,(x,y+24));d.text((x+8,y+6),f.stem,fill='#fff1d7')
sheet.save(p/'sheet.jpg',quality=83)
