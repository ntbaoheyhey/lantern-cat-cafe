from pathlib import Path
from PIL import Image,ImageDraw
import json
P=Path('tools/v3craft-lab/v4-panko');records=[]
im=Image.open('apps/web/public/units/panko/runtime.webp').convert('RGBA');im=im.crop(im.getbbox());im.thumbnail((210,225))
foe=Image.open('apps/web/public/units/needle-moth/runtime.webp').convert('RGBA');foe=foe.crop(foe.getbbox());foe.thumbnail((210,225))
for travel in [150,200]:
 sheet=Image.new('RGB',(1024,1024),'#302b38');d=ImageDraw.Draw(sheet)
 for i,t in enumerate([150,250,350,800]):
  z=max(0,min(1,(t-(300-travel))/travel));s=z*z*(3-2*z);x=200+(760-im.width/2-8-200)*s
  if t>440:
   z=min(1,(t-440)/360);x=760-im.width/2-8-(760-im.width/2-8-200)*z*z*(3-2*z)
  top=i*256;left=0;sheet.paste(im,(round(left+x-im.width/2),top+240-im.height),im);sheet.paste(foe,(760,top+240-foe.height),foe)
  d.text((12,top+8),f'Panko {travel}ms dash @ {t}ms',fill='white')
  records.append({'travelMs':travel,'t':t,'centre':x,'conceptGapAtContact':8 if t==350 else None,'returnError':abs(x-200) if t==800 else None})
 sheet.save(P/f'dash-{travel}-r2.jpg',quality=92)
(P/'drill.json').write_text(json.dumps({'scope':'own Panko timing layout concepts, not film gates','rows':records,'selection':200,'reason':'200ms spreads acceleration while preserving350impact and800return'},indent=2)+'\n')
print('Panko dash150/200ms drill authored; 350impact/800return. Not production proof.')
