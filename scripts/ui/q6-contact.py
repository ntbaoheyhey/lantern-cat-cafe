"""Review our own UI screenshots in four-screen sheets, no reference media."""
import argparse
from pathlib import Path
from PIL import Image,ImageDraw
parser=argparse.ArgumentParser()
parser.add_argument('output')
parser.add_argument('images',nargs='+')
args=parser.parse_args()
if len(args.images)>4:raise SystemExit('At most four screens per review sheet')
sheet=Image.new('RGB',(1280,760),'#181626');draw=ImageDraw.Draw(sheet)
for i,path in enumerate(args.images):
    image=Image.open(path).convert('RGB');image.thumbnail((624,345))
    x=(i%2)*640;y=(i//2)*380
    draw.text((x+8,y+7),Path(path).stem,fill='white')
    sheet.paste(image,(x+(640-image.width)//2,y+30+(345-image.height)//2))
sheet.save(args.output)
