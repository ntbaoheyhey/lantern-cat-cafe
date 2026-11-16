"""Blind field-pose evaluation from unchanged fixture films (LEARN/P2.md).
Prepare hides frame/expected labels; compare refuses to run without12 saved labels.
Working crops and key remain ignored, final labelled receipt is compact JSON.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import argparse, collections, datetime, gzip, hashlib, json, random, secrets, subprocess
p=argparse.ArgumentParser();p.add_argument('mode',choices=['prepare','compare']);p.add_argument('--item',default='V4-A6');a=p.parse_args()
raw=Path('tools/v3craft-lab/v4-panko/raw/blind');raw.mkdir(parents=True,exist_ok=True)
receipt=Path('reports/v4-art/REVIEW/A6/blind-labels.json');keyfile=raw/'private-key.json'
now=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
if a.mode=='compare':
 labels=json.loads(receipt.read_text());key=json.loads(keyfile.read_text());assert len(labels['labels'])==12
 assert set(labels['labels'])=={r['id'] for r in key['rows']}
 expected={r['id']:r['expected'] for r in key['rows']};correct=sum(label==expected[k] for k,label in labels['labels'].items())
 out={'count':12,'correct':correct,'labelledAt':labels['labelledAt'],'comparedAt':now(),'labelsArtifact':str(receipt),'labelsSha256':hashlib.sha256(receipt.read_bytes()).hexdigest(),'sampling':key['sampling'],'item':key['item'],'frames':[{**r,'label':labels['labels'][r['id']],'correct':labels['labels'][r['id']]==r['expected']} for r in key['rows']]}
 Path('reports/v4-art/REVIEW/A6/blind-result.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps({'correct':correct,'count':12,'pass':correct>=11}));raise SystemExit
assert not receipt.exists(),'Preserve prior labels; do not overwrite a blind attempt.'
assert not keyfile.exists(),'Preserve prepared blind key; do not silently resample.'
rng=random.Random(secrets.randbits(64));pool=collections.defaultdict(list)
for fixture in ['wave1','wave3','boss']:
 folder=Path('reports/v3-feel/REVIEW')/a.item;data=json.loads(gzip.decompress((folder/fixture/'capture.json.gz').read_bytes()))
 for shot in data['resampled']:
  n=shot.get('renderFrame')
  if isinstance(n,int):n-=1 # capture marker encodes ordinal+1
  else:n=min(range(len(data['frames'])),key=lambda i:abs(data['frames'][i]['t']-shot.get('sourceTime',shot['t'])))
  if not 0<=n<len(data['frames']):continue
  f=data['frames'][n];u=next((u for u in f['units'] if u['id']=='panko'),None)
  if not u:continue
  expected='idle';action=f.get('action');plan=next((p for p in data['plans'] if action and p['key']==action['key']),None)
  if plan:
   ms=action['elapsed'];damage=any(e['type']=='damage' and e.get('amount',0)>0 and 'panko' in e['targetIds'] for e in plan['events'])
   if damage and 0<=ms-plan['impact']<180:expected='hit'
   elif plan['actorId']=='panko':
    if plan['ultimate']:expected='windup' if ms<300 else 'cast' if ms<1800 else 'idle'
    else:expected='idle' if ms<50 or ms>=560 else 'windup' if ms<270 else 'strike'
  if expected=='idle':continue
  b=u['box'];cx=b['x']+b['width']/2;cy=b['y']+b['height']/2
  pool[expected].append({'fixture':fixture,'frame':shot['frame'],'renderOrdinal':n,'expected':expected,'crop':[max(0,min(960,round(cx-160))),max(0,min(464,round(cy-128))),320,256],'video':str(folder/(fixture+'.webm')),'videoSha256':data['videoSha256']})
rows=[]
for category,candidates in pool.items():
 rng.shuffle(candidates);rows+=candidates[:3];pool[category]=candidates[3:]
rest=[r for v in pool.values() for r in v];rng.shuffle(rest);rows+=rest[:12-len(rows)];assert len(rows)==12;rng.shuffle(rows)
for i,r in enumerate(rows):r['id']=f'{i+1:02}'
for fixture in ['wave1','wave3','boss']:
 selected=sorted([r for r in rows if r['fixture']==fixture],key=lambda r:r['frame'])
 if not selected:continue
 frames=sorted({r['frame'] for r in selected});pattern=raw/(fixture+'-%03d.jpg')
 expression='+'.join(f'eq(n\\,{n})' for n in frames)
 subprocess.run(['ffmpeg','-v','error','-y','-i',selected[0]['video'],'-vf','select='+expression,'-fps_mode','vfr','-q:v','2',str(pattern)],check=True)
 for r in selected:
  im=Image.open(raw/f'{fixture}-{frames.index(r["frame"])+1:03}.jpg').convert('RGB');x,y,w,h=r['crop'];im.crop((x,y,x+w,y+h)).save(raw/(r['id']+'.jpg'),quality=95)
for page in range(3):
 sheet=Image.new('RGB',(640,560),'#191923');draw=ImageDraw.Draw(sheet)
 for i,r in enumerate(rows[page*4:page*4+4]):
  x=i%2*320;y=i//2*280;sheet.paste(Image.open(raw/(r['id']+'.jpg')),(x,y+24));draw.text((x+8,y+6),r['id'],fill='white')
 sheet.save(raw/f'sheet-{page+1:02}.jpg',quality=90)
keyfile.write_text(json.dumps({'created':now(),'item':a.item,'sampling':'Random within available pose strata, 3eachofwindup,strike,hit,cast; remaining random from unused pool. Markers decoded by existing frame-marker.mjs; no image scaling.','rows':rows},indent=2)+'\n')
print('Prepared12 randomized field crops in3 sheets. Do not open private-key.json before saving labels.')
