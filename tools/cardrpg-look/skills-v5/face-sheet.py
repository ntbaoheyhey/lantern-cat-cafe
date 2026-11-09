from pathlib import Path
import json,os,numpy as np
from PIL import Image,ImageDraw,ImageFont
out=Path(os.environ.get('V5_OUT','reports/cardrpg-look/skills-v5'));r=json.loads((out/'after-browser.json').read_text());rows=[]
font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',19)
small=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',14)
sheet=Image.new('RGB',(1600,1440),'#102129');draw=ImageDraw.Draw(sheet)
for i,row in enumerate(r['marks']):
 full=Image.open(row['real']).convert('RGB');base=Image.open(row['without']).convert('RGB')
 delta=np.abs(np.asarray(full,dtype=float)-np.asarray(base,dtype=float)).max(axis=2);h,w=delta.shape;yy,xx=np.ogrid[:h,:w];faces=[]
 for index,(x,y,rx,ry) in enumerate(row['masks']):
  if rx<=0 or ry<=0:continue
  mask=((xx/w-x)/rx)**2+((1-yy/h-y)/ry)**2<.64
  if row.get('headTops'):mask &= (1-yy/h)<=row['headTops'][index]
  if np.any(mask):faces.append({'fractionAbove8':float(np.mean(delta[mask]>8)),'meanRgbDelta':float(delta[mask].mean())})
 x=i%4*400;y=i//4*360
 draw.text((x+10,y+9),row['name']+' · '+row['subtitle'],font=font,fill='#fff0d2')
 for j,asset in enumerate(['mochi','button-guard']):
  unit=next(u for u in row['units'] if u['asset']==asset);b=unit['box'];left=max(0,int(b[0]*w)-65);top=max(0,int(b[1]*h)-165);right=min(w,int(b[2]*w)+65);bottom=min(h,int(b[3]*h)+35)
  crop=full.crop((left,top,right,bottom));crop.thumbnail((192,286));sheet.paste(crop,(x+4+j*198+(192-crop.width)//2,y+38+(286-crop.height)//2));draw.text((x+12+j*198,y+333),asset,font=small,fill='#e8d7b8')
 rows.append({'id':row['id'],'faces':faces,'calls':row['stats']['calls'],'triangles':row['stats']['triangles'],'effects':row['effectStats']})
sheet.save(out/'status-contact-sheet.webp',quality=90)
result={'method':'16 status fixtures on Mochi and Button Guard at DPR1/fixedTime3.2. Compare identical renderer frame with/without effect root; core ellipse radius .8, offender if >1% pixels differ by RGB>8. Every visible actor face sampled. V0.1 additionally intersects the original ellipse with full model head-top: empty pixels ABOVE the unit are not face pixels; protected regions ON the model are unchanged.','rows':rows,'samples':sum(len(r['faces'])for r in rows),'offenders':[{'id':r['id'],**f}for r in rows for f in r['faces']if f['fractionAbove8']>.01]}
(out/'faces.json').write_text(json.dumps(result,indent=2));print(json.dumps({'samples':result['samples'],'offenders':len(result['offenders']),'draws':max(r['calls']for r in rows),'triangles':max(r['triangles']for r in rows)}))
