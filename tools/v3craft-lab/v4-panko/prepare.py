from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,json,io,subprocess
P=Path('tools/v3craft-lab/v4-panko');raw=P/'raw';raw.mkdir(exist_ok=True)
base=Image.new('RGBA',(896,896));base.alpha_composite(Image.open('apps/web/public/units/panko/runtime.webp').convert('RGBA'),(128,128));base.save(raw/'K0-normal.png')
choices={'K1':'K1-A1','K2':'K2-A1','K4':'K4-A2','K5':'K5-A1'}
s=Path('tools/v3craft-lab/v4-clover/export.py').read_text().replace('A5','A6').replace('clover','panko').replace('dress hem','apron hem')
sources={'K0':'K0-normal.png',**{k:v+'-normal.png' for k,v in choices.items()}}
a=s.index('sources=');b=s.index('\ndef bbox',a)
points={
'K1':([585,555,340,190],[360,711],[880,887],[75,711],[75,711],[760,610],[750,850],[260,910],[650,1070]),
'K2':([550,550,320,150],[888,725],[350,817],[1178,708],[1178,708],[720,590],[612,820],[220,860],[560,1000]),
'K4':([425,573,295,170],[398,975],[650,850],[295,1109],[295,1109],[610,620],[640,820],[276,1010],[630,1030]),
'K5':([440,473,380,166],[350,714],[954,726],[52,707],[52,707],[655,515],[640,777],[350,950],[630,1000])}
landmarks={'K0':([343,392,205,105],[378,544],[575,555],[444,470],[444,470],[450,438],[450,566],[304,620],[456,662])}
for key,ps in points.items():
 m=json.loads((P/(choices[key]+'-metrics.json')).read_text());scale=m['scale'];offset=np.array(m['offset']);face=ps[0];f=list(np.array(face[:2])*scale+offset)+list(np.array(face[2:])*scale);landmarks[key]=[f]+[list(np.array(x)*scale+offset) for x in ps[1:]]
s=s[:a]+'sources='+repr(sources)+'\n# Face and tool landmarks authored on own raw images, transformed by saved normalization.\nlandmarks='+repr(landmarks)+'\n'+s[b:];(P/'export.py').write_text(s)
json.dump({'choices':choices,'scope':'art selection; film not yet'},(P/'selection.json').open('w'),indent=2)
def sprite(key,h=225):
 src=raw/('K0-normal.png' if key=='K0' else choices[key]+'-normal.png');im=Image.open(src);a=np.array(im);y,x=np.where(a[:,:,3]>=128);im=im.crop((x.min(),y.min(),x.max()+1,y.max()+1));return im.resize((round(im.width*h/im.height),h),Image.Resampling.LANCZOS)
for n,keys in enumerate([['K0','K1','K2'],['K0','K4','K5']],1):
 sheet=Image.new('RGB',(1023,290),'#302b38');draw=ImageDraw.Draw(sheet)
 for i,k in enumerate(keys):
  im=sprite(k);sheet.paste(im,(i*341+(341-im.width)//2,45),im);draw.text((i*341+10,10),k+' | own Panko, 225px body',fill='white')
 sheet.save(P/f'selected-keys-{n}.jpg',quality=94)
video=next(Path('/Users/bao/Downloads').glob('*kiXkwkoUuY*mp4'));data=subprocess.check_output(['ffmpeg','-v','error','-ss','41.833333','-i',str(video),'-frames:v','1','-f','image2pipe','-vcodec','png','-threads','1','-'])
ref=Image.open(io.BytesIO(data));native=ref.width/640;factor=225/(76*native);cx=326*native;cy=212*native;w=512/factor;h=300/factor
ref=ref.crop((round(cx-w/2),round(cy-h/2),round(cx+w/2),round(cy+h/2))).resize((512,300),Image.Resampling.LANCZOS)
own=Image.new('RGB',(512,300),'#302b38');im=sprite('K2');own.paste(im,(8,55),im);foe=Image.open('apps/web/public/units/needle-moth/runtime.webp');foe=foe.crop(foe.getbbox());foe=foe.resize((round(foe.width*225/foe.height),225),Image.Resampling.LANCZOS);own.paste(foe,(im.width+16,55),foe)
sheet=Image.new('RGB',(1024,340),'#302b38');sheet.paste(ref,(0,40));sheet.paste(own,(512,40));ImageDraw.Draw(sheet).text((10,10),'PRIVATE melee comparison: reference41.833s left / own Panko K2 right; body225px; no tracing/input',fill='white')
priv=Path('reports/v4-art/ref/A6');priv.mkdir(parents=True,exist_ok=True);sheet.save(priv/'selected-melee-comparison.jpg',quality=92)
print('Lab export prepared; two225px pose sheets and new private comparison.')
