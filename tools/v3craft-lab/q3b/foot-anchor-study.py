from PIL import Image,ImageDraw
from pathlib import Path
import json,numpy as np,datetime
p=Path('tools/v3craft-lab/q3b');data=json.loads((p/'foot-anchor-transforms.json').read_text());results=[];sheet=Image.new('RGB',(1280,810),'#171526');draw=ImageDraw.Draw(sheet)
for ri,result in enumerate(data['results']):
 rows=[];anchors=None
 for ci,row in enumerate(result['rows']):
  im=Image.open(p/f'raw/ground-crop/{result["width"]}-{row["clip"]}-{row["ms"]}-source.png');a=np.array(im)[:,:,3];ys,xs=np.nonzero(a>=128);bottom=int(ys.max());profile=(a[bottom-7:bottom+1]>=128).sum(axis=0);runs=[];run=[]
  for x in range(a.shape[1]):
   if profile[x]>0:run.append(x)
   elif run:runs.append(run);run=[]
  if run:runs.append(run)
  feet=[np.array(f) for f in row['paintedFeet']]
  if len(feet)!=2:raise RuntimeError(f'Expected2 feet: {feet}')
  matrix=np.array(row['matrix']).reshape(4,4).T;px=row['worldWidth']/row['width']
  def local(v):return np.linalg.inv(matrix)@np.array([v[0]*px-row['worldWidth']/2,row['worldHeight']-v[1]*px,0,1])
  def screen(v):
   q=matrix@v;return np.array([(q[0]+row['worldWidth']/2)/px,(row['worldHeight']-q[1])/px])
  if anchors is None:anchors=[local(f) for f in feet]
  predicted=[screen(f) for f in anchors];box=row['box'];centre=np.array([box['x']+box['width']/2,box['y']+box['height']]);errors=[float(np.linalg.norm(a-b)) for a,b in zip(predicted,feet)]
  rows.append({'clip':row['clip'],'ms':row['ms'],'paintedFeet':[f.tolist() for f in feet],'transported':[f.tolist() for f in predicted],'maxAnchorErrorPx':max(errors),'maxCentreErrorPx':max(float(np.linalg.norm(f-centre)) for f in feet)})
  bg=Image.new('RGB',im.size,'#342b32');bg.paste(im,mask=im.getchannel('A'));d=ImageDraw.Draw(bg)
  for f in feet:d.ellipse((f[0]-3,f[1]-3,f[0]+3,f[1]+3),outline='white',width=1)
  for f in predicted:d.line((f[0]-7,f[1],f[0]+7,f[1]),fill='#40ff94',width=2)
  d.line((centre[0]-7,centre[1],centre[0]+7,centre[1]),fill='#ff6666',width=2)
  crop=(int(xs.min()-12),int(ys.min()-12),int(xs.max()+13),bottom+16);image=bg.crop(crop);image.thumbnail((210,360));x=ci*213;y=ri*405;sheet.paste(image,(x,y));draw.text((x+3,y+362),f'{result["width"]} {row["clip"]} {row["ms"]}',fill='white');draw.text((x+3,y+378),f'anchor {max(errors):.3f}px',fill='white')
 results.append({'width':result['width'],'height':result['height'],'errors':result['errors'],'localAnchors':[f.tolist() for f in anchors],'rows':rows})
sheet.save(p/'raw/ground-crop/foot-anchor-comparison.jpg',quality=94)
out={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'method':'Current isolated feet attachment alpha>=128 bottom8px patches, rest calibration through root inverse; compare transformed two-foot contacts with moving opaque-box centre. Raster centroid tolerance explicit; no production frame readback.','results':results};(p/'foot-anchor-study.json').write_text(json.dumps(out,indent=2)+'\n')
for r in results:print(r['width'],'anchors',r['localAnchors'],'max transported',max(x['maxAnchorErrorPx'] for x in r['rows']),'max centre',max(x['maxCentreErrorPx'] for x in r['rows']))
