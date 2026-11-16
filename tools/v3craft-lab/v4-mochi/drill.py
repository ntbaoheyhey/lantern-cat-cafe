"""A4 accepted-art motion and texture variants; private reference never becomes input art."""
from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,json,subprocess,io
P=Path('tools/v3craft-lab/v4-mochi');O=Path('reports/v4-art/REVIEW/A4');O.mkdir(parents=True,exist_ok=True);(O/'selected').mkdir(exist_ok=True)
F=Path('apps/web/public/vfx/mochi');F.mkdir(parents=True,exist_ok=True)
for name in ['shield-cut','shield-crest']:
 im=Image.open(f'tools/v3craft-lab/fx/raw/{name}/1.png').convert('RGBA');a=np.array(im);y,x=np.where(a[:,:,3]>=8);b=(max(0,x.min()-12),max(0,y.min()-12),min(im.width,x.max()+13),min(im.height,y.max()+13));im=im.crop(b);im.thumbnail((768,768));im.save(F/(name+'.webp'),quality=94,method=6,exact=True)
manifest=json.loads(Path('apps/web/public/units/mochi/poses/manifest.json').read_text());scale=225/manifest['opaqueHeight'];baseline=np.array(manifest['baseline'])*scale
poses={k:Image.open(f'apps/web/public/units/mochi/poses/{k}.webp').convert('RGBA').resize((round(896*scale),round(896*scale)),Image.Resampling.LANCZOS) for k in ['K0','K1','K2','K5']}
raw=Image.open('apps/web/public/units/needle-moth/runtime.webp').convert('RGBA');raw=raw.crop(raw.getbbox());foe=raw.resize((round(raw.width*225/raw.height),225),Image.Resampling.LANCZOS)
cut=Image.open(F/'shield-cut.webp');crest=Image.open(F/'shield-crest.webp');home=np.array([280.,505.]);target=np.array([1050.,505.]);extent=(manifest['poses']['K2']['opaqueBounds'][2]-manifest['baseline'][0])*scale;contact=np.array([target[0]-foe.width/2-8-extent,target[1]]);distance=contact-home
sm=lambda x:float(np.clip(x,0,1)**2*(3-2*np.clip(x,0,1)))
def location(ms,travel):
 start=300-travel
 t=sm((ms-start)/travel) if ms<300 else 1-sm((ms-440)/360)
 return home+distance*t

def background(label):
 im=Image.new('RGBA',(1280,720),'#393039');d=ImageDraw.Draw(im);d.rectangle((0,535,1280,720),fill='#54453e');d.line((35,505,1245,505),fill='#8a7164',width=2);d.text((20,20),label,fill='white');return im

def actor(im,key,foot):im.alpha_composite(poses[key],tuple(np.rint(foot-baseline).astype(int)))
def placefoe(im):im.alpha_composite(foe,(round(target[0]-foe.width/2),round(target[1]-foe.height)))
metrics=[]
for travel in [200,250]:
 frames=[]
 for ms in [100,250,350,700]:
  im=background(f'Mochi selected keys | approach{travel}ms | {ms}ms');key='K1' if ms<270 else 'K2' if ms<560 else 'K0';foot=location(ms,travel);placefoe(im);actor(im,key,foot)
  if ms==350:
   tex=cut.resize((145,185),Image.Resampling.LANCZOS);p=foot+(np.array(manifest['poses'][key]['sockets']['vfxOrigin'])-np.array(manifest['baseline']))*scale;im.alpha_composite(tex,(round(p[0]-100),round(p[1]-95)))
  frames.append(im.resize((512,288),Image.Resampling.LANCZOS))
 sheet=Image.new('RGB',(1024,576));
 for i,im in enumerate(frames):sheet.paste(im,(i%2*512,i//2*288))
 sheet.save(P/f'dash-{travel}.jpg',quality=94);metrics.append({'variant':travel,'contactGapPx':8,'distancePx':float(np.linalg.norm(distance)),'footAt800':location(800,travel).tolist(),'samples':[{ 'ms':ms,'foot':location(ms,travel).tolist()} for ms in [0,100,250,300,350,440,560,700,800]]})
for label,w,h in [('compact',700,400),('broad',980,520)]:
 im=background('Original shield crest '+label+' peak concept');tex=crest.resize((w,h),Image.Resampling.LANCZOS);layer=Image.new('RGBA',im.size);layer.alpha_composite(tex,(round(720-w/2),round(600-h)));alpha=np.array(layer)[:,:,3];im.alpha_composite(layer);placefoe(im);actor(im,'K5',contact);im.resize((1024,576),Image.Resampling.LANCZOS).convert('RGB').save(P/f'crest-{label}.jpg',quality=94);metrics.append({'variant':label,'width':w,'height':h,'effectAlpha128Area':float((alpha>=128).mean()),'note':'isolated concept layer coverage; production/film not yet'})
(P/'drill.json').write_text(json.dumps({'method':'Own selected drawings; no reference input. Static pixel concept, not runtime proof.','rows':metrics},indent=2)+'\n');print(json.dumps(metrics[-2:]))
# New private pairing from the original video, not a reopened prior sheet.
video=next(Path('/Users/bao/Downloads').glob('*kiXkwkoUuY*mp4'));data=subprocess.check_output(['ffmpeg','-v','error','-ss','41.833333','-i',str(video),'-frames:v','1','-f','image2pipe','-vcodec','png','-threads','1','-']);ref=Image.open(io.BytesIO(data));native=ref.width/640;factor=225/(76*native);cx=326*native;cy=212*native;w=512/factor;h=300/factor;ref=ref.crop((round(cx-w/2),round(cy-h/2),round(cx+w/2),round(cy+h/2))).resize((512,300),Image.Resampling.LANCZOS)
own=background('');placefoe(own);actor(own,'K2',contact);own=own.crop((round(contact[0]-170),245,round(contact[0]+342),545));sheet=Image.new('RGB',(1024,340),'#292631');sheet.paste(ref,(0,40));sheet.paste(own,(512,40));ImageDraw.Draw(sheet).text((10,10),'PRIVATE reference melee at41.833s | body~225px; own selected Mochi K2 right | no tracing/input',fill='white');priv=Path('reports/v4-art/ref/A4');priv.mkdir(parents=True,exist_ok=True);sheet.save(priv/'selected-melee-comparison.jpg',quality=92)
