"""A5 original selected-art healing drill; reference is private comparison only."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageEnhance
import numpy as np,json,subprocess,io
P=Path('tools/v3craft-lab/v4-clover');F=P/'textures';F.mkdir(exist_ok=True)
for name in ['healing-sprig','healing-canopy']:
 im=Image.open(f'tools/v3craft-lab/fx/raw/{name}/1.png').convert('RGBA');a=np.array(im);y,x=np.where(a[:,:,3]>=8)
 im=im.crop((max(0,int(x.min())-8),max(0,int(y.min())-8),min(im.width,int(x.max())+9),min(im.height,int(y.max())+9)))
 im.thumbnail((1024,768));im.save(F/(name+'.webp'),quality=94,method=6,exact=True)
manifest=json.loads((P/'exported/manifest.json').read_text());scale=225/manifest['opaqueHeight'];baseline=np.array(manifest['baseline'])*scale
poses={k:Image.open(P/'exported'/f'{k}.webp').convert('RGBA').resize((round(896*scale),round(896*scale)),Image.Resampling.LANCZOS) for k in ['K0','K1','K2','K5']}
ally=Image.open('apps/web/public/units/mochi/poses/K0.webp').convert('RGBA');ma=json.loads(Path('apps/web/public/units/mochi/poses/manifest.json').read_text());ascale=225/ma['opaqueHeight'];ally=ally.resize((round(896*ascale),round(896*ascale)),Image.Resampling.LANCZOS);abase=np.array(ma['baseline'])*ascale
sprig=Image.open(F/'healing-sprig.webp').convert('RGBA');canopy=Image.open(F/'healing-canopy.webp').convert('RGBA');home=np.array([290.,540.]);recipient=np.array([700.,550.]);rows=[]
def smooth(x):x=float(np.clip(x,0,1));return x*x*(3-2*x)
def put(layer,tex,cx,cy,w,h,alpha=1):
 v=tex.resize((max(1,round(w)),max(1,round(h))),Image.Resampling.LANCZOS)
 if alpha<1:v.putalpha(v.getchannel('A').point(lambda a:round(a*alpha)))
 layer.alpha_composite(v,(round(cx-w/2),round(cy-h/2)))
def background(label):
 im=Image.new('RGBA',(1280,720),'#393039');d=ImageDraw.Draw(im);d.rectangle((0,575,1280,720),fill='#54453e');d.text((20,20),label,fill='white');return im
def frame(ms,rise,ultimate=False,size=(1040,560)):
 impact=1100 if ultimate else 350;age=ms-impact;key='K5' if ultimate and ms>=300 else 'K1' if ms<270 else 'K2' if ms<560 else 'K0'
 im=background(f'Clover selected art | {"ultimate" if ultimate else "basic"} | rise{rise}px | {ms}ms');rear=Image.new('RGBA',im.size);front=Image.new('RGBA',im.size)
 if ultimate and 800<=ms<2100:
  q=smooth((ms-800)/300);w,h=size;put(rear,canopy,540,650-h*(.2+.8*q)/2,w*(.3+.7*q),h*(.2+.8*q),1-smooth((ms-1400)/700))
 if age>=0:
  q=smooth(age/350);alpha=(.55+.45*smooth(age/70))*(1-smooth((age-160)/420))
  for i,dx in enumerate([-54,8,59]):put(front,sprig,recipient[0]+dx,recipient[1]-35-rise*q,54+12*i,86+16*i,alpha)
 # Face region is explicitly protected, matching the production shader.
 face=np.array(ma['poses']['K0']['face']);face=np.array([recipient[0]+(face[0]-ma['baseline'][0])*ascale,recipient[1]+(face[1]-ma['baseline'][1])*ascale,face[2]*ascale,face[3]*ascale]);draw=ImageDraw.Draw(front);draw.rectangle(tuple([face[0]-6,face[1]-6,face[0]+face[2]+6,face[1]+face[3]+6]),fill=(0,0,0,0))
 im.alpha_composite(rear);im.alpha_composite(poses[key],tuple(np.rint(home-baseline).astype(int)));target=ally
 if 0<=age<180:
  target=ImageEnhance.Brightness(ally).enhance(1.10);target.putalpha(ally.getchannel('A'))
 im.alpha_composite(target,tuple(np.rint(recipient-abase).astype(int)));im.alpha_composite(front)
 return im,float((np.maximum(np.array(rear)[:,:,3],np.array(front)[:,:,3])>=128).mean())
for rise in [60,120]:
 sheet=Image.new('RGB',(1024,576))
 for i,ms in enumerate([150,350,500,700]):
  im,cov=frame(ms,rise);sheet.paste(im.resize((512,288),Image.Resampling.LANCZOS),(i%2*512,i//2*288))
 sheet.save(P/f'basic-rise-{rise}.jpg',quality=94);rows.append({'variant':'basic','risePx':rise,'startMs':350,'recipient':'actual allied heal event','enemyShapes':0,'hitPoses':0,'shake':0,'casterFeetDisplacement':0})
for name,size in [('compact',(780,430)),('broad',(1040,560))]:
 sheet=Image.new('RGB',(1024,576));peak=0
 for i,ms in enumerate([800,1100,1500,2000]):
  im,cov=frame(ms,60,True,size);peak=max(peak,cov);sheet.paste(im.resize((512,288),Image.Resampling.LANCZOS),(i%2*512,i//2*288))
 sheet.save(P/f'ultimate-{name}.jpg',quality=94);rows.append({'variant':name,'size':size,'peakAlpha128Coverage':peak,'foregroundFaceCoverage':0,'note':'static original-art concept, runtime/film proof still required'})
(P/'drill.json').write_text(json.dumps({'rows':rows,'source':'own accepted pose drawings and original textures only'},indent=2)+'\n');print(json.dumps(rows))
# Same-scale new private comparison, no reference frames are generation inputs.
video=next(Path('/Users/bao/Downloads').glob('*kiXkwkoUuY*mp4'));data=subprocess.check_output(['ffmpeg','-v','error','-ss','49.8','-i',str(video),'-frames:v','1','-f','image2pipe','-vcodec','png','-threads','1','-']);ref=Image.open(io.BytesIO(data));native=ref.width/640;factor=225/(76*native);cx=250*native;cy=212*native;w=512/factor;h=300/factor;ref=ref.crop((round(cx-w/2),round(cy-h/2),round(cx+w/2),round(cy+h/2))).resize((512,300),Image.Resampling.LANCZOS)
own,_=frame(500,60);own=own.crop((420,280,932,580));sheet=Image.new('RGB',(1024,340),'#292631');sheet.paste(ref,(0,40));sheet.paste(own,(512,40));ImageDraw.Draw(sheet).text((10,10),'PRIVATE healer reference49.8s left / original ally leaf lift right | both body225px',fill='white');priv=Path('reports/v4-art/ref/A5');priv.mkdir(parents=True,exist_ok=True);sheet.save(priv/'selected-healer-comparison.jpg',quality=92)
