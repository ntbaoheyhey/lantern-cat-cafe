import json,sys
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
root=Path(sys.argv[1]);out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
r=json.loads((root/'captures.json').read_text());rows=[];sheet=Image.new('RGB',(1280,960),'#172e36');d=ImageDraw.Draw(sheet)
for i,row in enumerate(r['rows']):
 faces=[]
 for n,f in enumerate(row['frames']):
  full=np.asarray(Image.open(f['real']).convert('RGB'),dtype=float);base=np.asarray(Image.open(f['without']).convert('RGB'),dtype=float);delta=np.abs(full-base).max(axis=2);h,w=delta.shape;yy,xx=np.ogrid[:h,:w]
  for x,y,rx,ry in row['samples'][n]['masks']:
   if rx<=0 or ry<=0:continue
   mask=((xx/w-x)/rx)**2+((1-yy/h-y)/ry)**2<.64
   if np.any(mask):faces.append({'frame':n,'fractionAbove8':float(np.mean(delta[mask]>8)),'meanRgbDelta':float(delta[mask].mean())})
 peak=Image.open(row['frames'][3]['real']).convert('RGB');peak.thumbnail((426,214));x=i%3*426;y=i//3*240;sheet.paste(peak,(x,y+24));d.text((x+5,y+6),row['name'],fill='#fff1d7')
 rows.append({'id':row['id'],'faceSamples':faces,'peakCalls':max(s['realStats']['calls'] for s in row['samples']),'peakTriangles':max(s['realStats']['triangles'] for s in row['samples']),'truncated':max(s['realEffects']['truncated'] for s in row['samples'])})
sheet.save(out/'sheet.png')
result={'sha256':r['sha256'],'method':'Inherited six-frame face ellipse: fractional RGB delta>8 must be <=.01. No pair matrix. Peak frame contact sheet at action progress .60.','rows':rows,'faceOffenders':[{'id':row['id'],**s} for row in rows for s in row['faceSamples'] if s['fractionAbove8']>.01],'errors':r['errors']};(out/'checks.json').write_text(json.dumps(result,indent=2));print(json.dumps({'faces':sum(len(row['faceSamples']) for row in rows),'offenders':len(result['faceOffenders']),'maxCalls':max(x['peakCalls'] for x in rows),'maxTriangles':max(x['peakTriangles'] for x in rows)}))
