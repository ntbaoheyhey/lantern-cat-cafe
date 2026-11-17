"""A1b own-content motion/effect concepts, not production film evidence."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter,ImageEnhance
import numpy as np,json,math,datetime
P=Path('tools/v3craft-lab/v4-classes');O=Path('reports/v4-art/REVIEW/A1b');O.mkdir(parents=True,exist_ok=True)
def sprite(u,h=216):
 im=Image.open(f'apps/web/public/units/{u}/runtime.webp').convert('RGBA');a=np.array(im);ys,xs=np.where(a[:,:,3]>=128);im=im.crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1));return im.resize((round(im.width*h/im.height),h),Image.Resampling.LANCZOS)
arts={u:sprite(u) for u in ['mochi','soot','clover','needle-moth']};floor=259;home=270;target=925;gap=8;contact=target-arts['needle-moth'].width/2-arts['mochi'].width/2-gap;distance=contact-home
flame=Image.open('apps/web/public/units/soot/poses/lantern-flame.webp').convert('RGBA');flame=flame.crop(flame.getbbox());flame=flame.resize((150,54),Image.Resampling.LANCZOS)
def canvas(label):
 c=Image.new('RGBA',(1280,294),'#242335');d=ImageDraw.Draw(c);d.line((30,floor,1250,floor),fill='#65565d');d.text((18,10),label,fill='white');return c
def place(c,u,x,bright=1):
 im=arts[u]
 if bright!=1:
  alpha=im.getchannel('A');im=ImageEnhance.Brightness(im).enhance(bright);im.putalpha(alpha)
 c.alpha_composite(im,(round(x-im.width/2),floor-im.height))
def sm(t):t=np.clip(t,0,1);return t*t*(3-2*t)
def dash(t,travel):
 # Latest departure preserving250ms max out-window and300ms arrival.
 start=300-travel
 if t<start:return home
 if t<300:return home+distance*float(sm((t-start)/travel))
 if t<440:return contact
 return contact-distance*float(sm((t-440)/360))
def sheet(rows,path):
 im=Image.new('RGB',(1280,len(rows)*294),'#242335')
 for i,r in enumerate(rows):im.paste(r,(0,i*294))
 im.save(path,quality=88)
records=[]
for travel in [150,200,250]:
 rows=[]
 for t in [150,250,350,800]:
  c=canvas(f'Mochi MELEE concept | out{travel}ms | {t}ms | existingK0, pose authoring inA4');place(c,'needle-moth',target);place(c,'mochi',dash(t,travel));rows.append(c)
 sheet(rows,O/f'melee-{travel}.jpg');samples=[{'ms':t,'x':dash(t,travel)} for t in range(0,801,10)]
 records.append({'class':'melee','variant':travel,'distancePx':distance,'travelMs':travel,'peakSpeedPxPerSecond':distance*1.5/(travel/1000),'impactGapPx':gap,'impactOverlap':0,'homeAt800':dash(800,travel),'samples':samples})
for travel in [150,250]:
 start=350-travel;rows=[]
 for t in [start,start+travel/3,start+2*travel/3,350]:
  c=canvas(f'Soot RANGED concept | projectile{travel}ms | {t:.1f}ms');place(c,'soot',home);place(c,'needle-moth',target)
  p=np.clip((t-start)/travel,0,1);sx=home+72;tx=target-55;x=sx+(tx-sx)*p
  length=round(min(flame.width,max(12,x-sx+12)));packet=flame.crop((flame.width-length,0,flame.width,flame.height))
  c.alpha_composite(packet,(round(x-length),floor-132));rows.append(c)
 sheet(rows,O/f'ranged-{travel}.jpg')
 records.append({'class':'ranged','variant':travel,'launchMs':start,'impactMs':350,'feetDisplacement':0,'visibleTravelFrames30fps':int(sum(start<=t<350 for t in np.arange(0,800,1000/30))),'distancePx':target-55-(home+72)})
# Authored concept forms only: leaf silhouettes vs winding steam bands; no circles
# or orbs as main shape, no enemy emitter, no hit pose or recoil on healed ally.
def healing(c,style,age):
 if age<0:return
 fx=Image.new('RGBA',c.size);d=ImageDraw.Draw(fx)
 for i in range(9):
  x=710+math.sin(i*2.1+age*3)*85;y=floor-20-(age*170+i*15)%195;alpha=round(180*(1-min(1,age/0.55)))
  if style=='leaves':
   d.polygon([(x-13,y+4),(x-3,y-8),(x+15,y-6),(x+5,y+6)],fill=(155,222,167,alpha));d.line([(x-9,y+3),(x+10,y-5)],fill=(244,239,202,alpha),width=1)
  else:
   points=[(x+math.sin(k*.35+i)*8,y-k*3) for k in range(15)];d.line(points,fill=(225,246,209,alpha),width=5)
 c.alpha_composite(fx)
for style in ['leaves','steam']:
 rows=[]
 for t in [250,350,450,650]:
  c=canvas(f'Clover HEALER concept | {style} | {t}ms');place(c,'clover',300);place(c,'mochi',710,1.10 if 350<=t<500 else 1);healing(c,style,(t-350)/1000)
  if t>=350:ImageDraw.Draw(c).text((700,28),'+N',fill='#9feaa4')
  rows.append(c)
 sheet(rows,O/f'healer-{style}.jpg');records.append({'class':'healer','variant':style,'recipient':'mochi','startMs':350,'enemyShapes':0,'hitPoses':0,'shakePx':0,'feetDisplacement':0})
result={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Offline concept drill only; existing idle art for Mochi/Clover; final drawn poses and painted effect textures remain A4/A5','opaqueHeight':216,'viewportWidth':1280,'sourceArt':[f'apps/web/public/units/{u}/runtime.webp' for u in arts]+['apps/web/public/units/soot/poses/lantern-flame.webp'],'variants':records}
(P/'results.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps([{k:v for k,v in r.items() if k!='samples'} for r in records]));(P/'.gitignore').write_text('raw/\n')
