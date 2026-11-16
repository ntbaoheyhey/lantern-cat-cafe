"""Small review sheets from the real WebGL lab captures, never synthetic film evidence."""
from pathlib import Path
from PIL import Image,ImageDraw
import json,os
p=Path('tools/v3craft-lab/v4-binding-thread');raw=p/'raw'/os.environ.get('ART_DRILL_ROUND','runtime')
for travel in [150,250]:
    sheet=Image.new('RGB',(960,620),'#201d24');draw=ImageDraw.Draw(sheet)
    for i,(mode,ms) in enumerate([('basic',100),('basic',200),('basic',250),('basic',300),('basic',350),('basic',450),('ultimate',950),('ultimate',1250)]):
        x=(i%2)*480;y=(i//2)*155
        image=Image.open(raw/f'{travel}-{mode}-{ms}.png').crop((150,340,1180,660)).resize((480,149),Image.Resampling.LANCZOS)
        sheet.paste(image,(x,y));draw.text((x+8,y+3),f'{travel}ms / {mode} at {ms}ms',fill='white',stroke_width=1,stroke_fill='black')
    sheet.save(raw/f'drill-{travel}.jpg',quality=90)
print(json.dumps({'sheets':[str(raw/f'drill-{t}.jpg') for t in [150,250]],'maxWidth':960}))
