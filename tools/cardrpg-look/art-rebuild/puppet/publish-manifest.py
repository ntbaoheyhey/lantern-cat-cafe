"""Final same-source puppet artwork formats; reuse existing deliveries."""
from pathlib import Path
import json, hashlib, datetime, argparse
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument("--force",action="store_true",help="Replace derivative formats after a reviewed crop change")
args=parser.parse_args()
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[4]
OUT=ROOT/'assets/cardrpg-look/v3-portraits'
manifest=json.loads((OUT/'manifest.json').read_text())
report=ROOT/'reports/cardrpg-look/art-rebuild/p8'
report.mkdir(parents=True,exist_ok=True)
required=[v for row in manifest['portraits'].values() for field in ['headPortrait','faceIcon','cardArt','puppet'] for v in row.get(field,{}).values() if isinstance(v,str) and v.startswith('assets/')]
if manifest.get('status')=='READY_PUPPET_REVIEWED' and required and all((ROOT/p).is_file() for p in required) and not args.force:
 print(json.dumps({'resumed':True,'units':len(manifest['portraits']),'manifest':str(OUT/'manifest.json')}))
 raise SystemExit(0)
def save_new(image,path):
 if args.force or not path.exists(): image.save(path,'WEBP',quality=92,method=6)
rows=[]
for id,row in manifest['portraits'].items():
 rigpath=ROOT/f'assets/cardrpg-look/v3-puppets/{id}.rig.json';rig=json.loads(rigpath.read_text())
 source=ROOT/row['provenance']['source'];im=Image.open(source).convert('RGBA')
 assert hashlib.sha256(source.read_bytes()).hexdigest()==row['provenance']['sourceSha256']
 # Full-body card already preserves the exact original art; reference those pixels.
 row['cardArt']=dict(row['portrait']);row['cardArt']['usage']='Full-body recruitment and collection card'
 bounds=im.getchannel('A').getbbox();existing=row['provenance']['crop']
 if existing[0]>bounds[0] or existing[1]>bounds[1] or existing[2]<bounds[2] or existing[3]<bounds[3]:
  full=im.crop(bounds);full.thumbnail((460,588),Image.Resampling.LANCZOS);card=Image.new('RGBA',(512,640),'#251620' if row['side']=='enemy' else '#173039');card.alpha_composite(full,((512-full.width)//2,(640-full.height)//2))
  for key,size in [('1x',(256,320)),('2x',(512,640))]:
   path=OUT/f'{id}-card-{key}.webp';save_new(card.resize(size,Image.Resampling.LANCZOS),path);row['cardArt'][key]=str(path.relative_to(ROOT))
  row['cardArt']['provenance']={'source':str(source.relative_to(ROOT)),'alphaBounds':bounds,'method':'Complete original alpha bounds fitted into512x640 with breathing room; Lanczos/WebP92','tool':'tools/cardrpg-look/art-rebuild/puppet/publish-manifest.py'}
 # Head-and-shoulders includes the hat and collar, independently of body aspect.
 w,h=im.size;cx=rig['face'][0]*w;top=im.getchannel('A').getbbox()[1]-h*.015
 cw=max(w*.7,h*.55);ch=cw*1.1;box=[round(cx-cw/2),round(top),round(cx+cw/2),round(top+ch)]
 crop=im.crop(box);background='#251620' if row['side']=='enemy' else '#173039'
 tile=Image.new('RGBA',crop.size,background);tile.alpha_composite(crop);portrait={}
 for name,size in [('1x',(160,176)),('2x',(320,352))]:
  path=OUT/f'{id}-head-{name}.webp';save_new(tile.resize(size,Image.Resampling.LANCZOS),path);portrait[name]=str(path.relative_to(ROOT))
 row['headPortrait']={**portrait,'display':[160,176],'provenance':{'source':str(source.relative_to(ROOT)),'crop':box,'method':'Original concept crop, authored cafe background, Lanczos/WebP92','tool':'tools/cardrpg-look/art-rebuild/puppet/publish-manifest.py'}}
 face={}
 # Existing56/72/144px face crops have already passed small-slot visual review.
 for size,key in [(72,'1x'),(144,'2x')]:
  tile=Image.open(ROOT/row['uiPortrait'][key]).convert('RGBA');mask=Image.new('L',(size*4,size*4));ImageDraw.Draw(mask).ellipse((0,0,size*4-1,size*4-1),fill=255);mask=mask.resize((size,size),Image.Resampling.LANCZOS);tile.putalpha(mask)
  path=OUT/f'{id}-face-{size}.webp';save_new(tile,path);face[key]=str(path.relative_to(ROOT))
 row['faceIcon']={**face,'display':[72,72],'usage':'Round face icon; transparent outside circle','provenance':{'source':row['uiPortrait']['2x'],'method':'Circular alpha mask on the accepted original face crop; no new generation','tool':'tools/cardrpg-look/art-rebuild/puppet/publish-manifest.py'}}
 row['puppet']={'rig':str(rigpath.relative_to(ROOT)),'atlas':str((rigpath.parent/rig['atlas']).relative_to(ROOT)),'motions':['idle','attack','cast','hurt','ultimate','victory','defeat']+(['boss-idle'] if rig['boss'] else [])}
 row['review']='P4/P5 original-concept puppet accepted by Lane B self-review'
 rows.append((id,row))
manifest['version']=4;manifest['status']='READY_PUPPET_REVIEWED';manifest['enabledBy']='lookV2 && lookArt=v3; A6 owns UI adoption';manifest['updatedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat();manifest['formats']=['puppet','cardArt','headPortrait','uiPortrait','faceIcon','skills'];manifest['sourcePolicy']='All25puppets and matching portraits derive from the same original concepts;60skillicons derive from original VFX masters. No new generation or external art.'
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
sheet=Image.new('RGB',(1200,5*330),'#132c35');draw=ImageDraw.Draw(sheet)
for i,(id,row) in enumerate(rows):
 x=i%5*240;y=i//5*330;draw.text((x+6,y+5),id,fill='#fff0d2');im=Image.open(ROOT/row['headPortrait']['1x']).convert('RGBA');sheet.paste(im,(x+8,y+30),im);im=Image.open(ROOT/row['faceIcon']['1x']).convert('RGBA');sheet.paste(im,(x+158,y+40),im);im=Image.open(ROOT/row['cardArt']['1x']).convert('RGBA');im.thumbnail((72,108));sheet.paste(im,(x+159,y+140),im)
sheet.save(report/'formats.webp','WEBP',quality=86)
paths=set()
for row in manifest['portraits'].values():
 for field in ['portrait','cardArt','headPortrait','uiPortrait','faceIcon','puppet']:
  for v in row[field].values():
   if isinstance(v,str) and v.startswith('assets/'):assert (ROOT/v).is_file(),v;paths.add(v)
for row in manifest['skills'].values():
 for key in ['icon1x','icon2x']:assert (ROOT/row[key]).is_file();paths.add(row[key])
receipt={'units':len(rows),'skills':len(manifest['skills']),'uniqueFiles':len(paths),'uniqueBytes':sum((ROOT/p).stat().st_size for p in paths),'newGeneration':False}
(report/'manifest-review.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt))
