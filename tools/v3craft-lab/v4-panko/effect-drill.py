"""A6 own-art motion/coverage choices before production integration."""
from pathlib import Path
from PIL import Image,ImageDraw
import json,math,numpy as np
P=Path('tools/v3craft-lab/v4-panko');m=json.loads((P/'exported/manifest.json').read_text());s=225/m['opaqueHeight'];base=np.array(m['baseline'])*s
poses={k:Image.open(P/'exported'/f'{k}.webp').convert('RGBA').resize((round(896*s),round(896*s)),Image.Resampling.LANCZOS) for k in ['K0','K1','K2','K5']}
cut=Image.open(P/'textures/crust-cut.webp').convert('RGBA');door=Image.open(P/'textures/oven-bastion.webp').convert('RGBA')
smooth=lambda x:(lambda q:q*q*(3-2*q))(max(0,min(1,x)))
def put(layer,tex,x,y,w,h,a=1):
 im=tex.resize((max(1,round(w)),max(1,round(h))),Image.Resampling.LANCZOS)
 if a<1:im.putalpha(im.getchannel('A').point(lambda v:round(v*a)))
 layer.alpha_composite(im,(round(x-w/2),round(y-h/2)))
def frame(ms,ultimate,size,cutwidth):
 im=Image.new('RGBA',(1280,720),'#393039');rear=Image.new('RGBA',im.size);front=Image.new('RGBA',im.size)
 ImageDraw.Draw(im).rectangle((0,620,1280,720),fill='#59463b')
 home=np.array([370.,620.]);pos=home.copy();key='K5' if ultimate else ('K1' if ms<270 else 'K2' if ms<560 else 'K0')
 if not ultimate:
  a=smooth((ms-100)/200) if ms<=440 else 1-smooth((ms-440)/360);pos[0]+=230*a;pos[1]-=math.sin(math.pi*a)*24
  socket=np.array(m['poses'][key]['sockets']['vfxOrigin'])*s+pos-base
  alpha=smooth((ms-250)/45)*(1-smooth((ms-440)/220))
  put(front,cut,socket[0]+cutwidth*(.5-7/768),socket[1]+cutwidth*424/768*(.5-376/424),cutwidth,cutwidth*424/768,alpha)
 if ultimate and ms>=600:
  grow=smooth((ms-600)/500);opened=smooth((ms-720)/380);w,h=size;h*=.35+.65*grow;decay=smooth((ms-1490)/610)
  cx=max(w/2+16,min(1280-w/2-16,home[0]));bottom=660
  # Three independent panels hinge from a narrow stack into the painted triptych.
  for a,b in [(0,.30),(.30,.70),(.70,1)]:
   tex=door.crop((round(a*door.width),0,round(b*door.width),door.height));q=(a+b)/2-.5
   span=(b-a)*w*(.12+.88*opened) if a!=.30 else (b-a)*w
   put(rear,tex,cx+q*w*(.3+.7*opened),bottom-h/2,span,h,1-decay)
 im.alpha_composite(rear);im.alpha_composite(poses[key],(round(pos[0]-base[0]),round(pos[1]-base[1])));im.alpha_composite(front)
 ImageDraw.Draw(im).text((20,20),f'Panko {"Oven door" if ultimate else "Pan reply"} {ms}ms | {size[0]}x{size[1]} / cut{cutwidth}',fill='white')
 alpha=np.asarray(rear)[:,:,3]>=128
 return im,float(alpha.mean())
rows=[]
for name,size,cw in [('compact',(760,460),130),('broad',(980,600),170)]:
 sheet=Image.new('RGB',(1024,900),'#24212c');d=ImageDraw.Draw(sheet);d.text((10,8),f'A6 {name}: own raster poses/effects; internal1280x720/225pxbody; no film claim',fill='white')
 cells=[(250,False),(350,False),(650,False),(800,True),(1100,True),(1700,True)]
 values=[]
 for i,(ms,ult) in enumerate(cells):
  im,area=frame(ms,ult,size,cw);sheet.paste(im.resize((512,288),Image.Resampling.LANCZOS),(i%2*512,30+i//2*290));values.append({'ms':ms,'ultimate':ult,'area':area})
 sheet.save(P/f'effect-{name}.jpg',quality=92);rows.append({'variant':name,'size':size,'cutWidth':cw,'frames':values})
(P/'effect-drill.json').write_text(json.dumps({'method':'Own-art RGBA composition;opaque alpha>=128;engine clipping/face/order checked separately after integration.','variants':rows},indent=2)+'\n')
print(json.dumps(rows,separators=(',',':')))
