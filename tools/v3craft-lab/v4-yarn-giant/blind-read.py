"""Nine shuffled real-film crops; write labels before comparing the private key."""
from pathlib import Path
from PIL import Image,ImageDraw
import argparse,collections,datetime,gzip,hashlib,json,random,secrets,subprocess
p=argparse.ArgumentParser();p.add_argument('mode',choices=['prepare','compare']);p.add_argument('--attempt',type=int,default=1);a=p.parse_args()
capture=Path('reports/v3-feel/REVIEW/V4-A7-YARN');root=Path('reports/v4-art/REVIEW/A7/yarn-giant');raw=Path('tools/v3craft-lab/v4-yarn-giant/raw')/f'blind-{a.attempt}';raw.mkdir(parents=True,exist_ok=True)
suffix='' if a.attempt==1 else f'-r{a.attempt}';labels_path=root/f'blind-labels{suffix}.json';key_path=raw/'private-key.json';now=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
if a.mode=='compare':
    labels=json.loads(labels_path.read_text());key=json.loads(key_path.read_text());assert len(labels['labels'])==9
    assert set(labels['labels'])=={r['id'] for r in key['rows']}
    rows=[{**r,'label':labels['labels'][r['id']],'correct':labels['labels'][r['id']]==r['expected']} for r in key['rows']]
    correct=sum(r['correct'] for r in rows)
    receipt={'count':9,'correct':correct,'pass':correct>=8,'labelledAt':labels['labelledAt'],'comparedAt':now(),'labelsArtifact':str(labels_path),'labelsSha256':hashlib.sha256(labels_path.read_bytes()).hexdigest(),'sampling':key['sampling'],'frames':rows}
    (root/f'blind-result{suffix}.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps({'correct':correct,'count':9,'pass':correct>=8}));raise SystemExit
assert not labels_path.exists() and not key_path.exists(),'Never overwrite a blind attempt.'
rng=random.Random(secrets.randbits(64));pool=collections.defaultdict(list)
for fixture in ['wave1','wave3','boss']:
    data=json.loads(gzip.decompress((capture/fixture/'capture.json.gz').read_bytes()))
    for shot in data['resampled']:
        ordinal=shot.get('renderFrame');n=ordinal if isinstance(ordinal,int) else -1
        if not 0<=n<len(data['frames']):continue
        frame=data['frames'][n];action=frame.get('action');plan=next((p for p in data['plans'] if action and p['key']==action['key']),None)
        if not plan:continue
        ms=action['elapsed']
        for u in frame['units']:
            if 'yarn-giant' not in u['id']:continue
            damage=any(e['type']=='damage' and e.get('amount',0)>0 and u['id'] in e['targetIds'] for e in plan['events'])
            expected=None;boundaries=[]
            if damage and plan['actorId']!=u['id'] and 0<=ms-plan['impact']<180:expected='hit';boundaries=[plan['impact'],plan['impact']+180]
            elif plan['actorId']==u['id'] and not plan['ultimate']:
                expected='windup' if 50<=ms<270 else 'strike' if 330<=ms<440 else None;boundaries=[50,270,330,440]
            if not expected or min(abs(ms-b) for b in boundaries)<=34:continue
            b=u['box'];cx=b['x']+b['width']/2;cy=b['y']+b['height']/2
            pool[expected].append({'fixture':fixture,'unit':u['id'],'frame':shot['frame'],'renderOrdinal':n,'expected':expected,'crop':[round(cx-(b['width']+32)/2),round(cy-(b['height']+32)/2),round(b['width']+32),round(b['height']+32)],'bodyHeight':b['height'],'video':str(capture/(fixture+'.webm')),'videoSha256':data['videoSha256']})
rows=[]
for category in ['windup','strike','hit']:
    assert len(pool[category])>=3,f'Insufficient film samples for {category}'
    rows+=rng.sample(pool[category],3)
rng.shuffle(rows)
for i,r in enumerate(rows):r['id']=f'{i+1:02}'
for fixture in ['wave1','wave3','boss']:
    selected=[r for r in rows if r['fixture']==fixture]
    if not selected:continue
    frames=sorted({r['frame'] for r in selected});expr='+'.join(f'eq(n\\,{n})' for n in frames)
    subprocess.run(['ffmpeg','-v','error','-y','-i',selected[0]['video'],'-vf','select='+expr,'-fps_mode','vfr','-q:v','2',str(raw/(fixture+'-%03d.jpg'))],check=True)
    for r in selected:
        im=Image.open(raw/f'{fixture}-{frames.index(r["frame"])+1:03}.jpg');x,y,w,h=r['crop'];crop=im.crop((x,y,x+w,y+h));scale=225/r['bodyHeight'];crop=crop.resize((round(w*scale),round(h*scale)),Image.Resampling.LANCZOS);assert crop.width<=500 and crop.height<=280;tile=Image.new('RGB',(500,280),'#211e26');tile.paste(crop,((500-crop.width)//2,(280-crop.height)//2));tile.save(raw/(r['id']+'.jpg'),quality=94)
sheet=Image.new('RGB',(1000,1520),'#211e26');draw=ImageDraw.Draw(sheet)
for i,r in enumerate(rows):
    x=i%2*500;y=i//2*304;sheet.paste(Image.open(raw/(r['id']+'.jpg')),(x,y+24));draw.text((x+8,y+6),r['id'],fill='white')
sheet.save(raw/'sheet.jpg',quality=92)
key_path.write_text(json.dumps({'created':now(),'sampling':'3 each of windup/strike/received-hit, held interiors >34ms from swaps; Yarn body225px; own retaliation excluded from received-hit category and own strikes use the90ms contact hold; shuffled before labels; existing encoded frame ordinals.','rows':rows},indent=2)+'\n')
print(json.dumps({'count':9,'sheet':str(raw/'sheet.jpg'),'labelsToWrite':str(labels_path),'key':'hidden until labels are saved'}))
