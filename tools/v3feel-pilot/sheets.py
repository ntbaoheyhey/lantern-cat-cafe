"""Every action in the isolated pilot; actual film frames, never reconstructed stills."""
from pathlib import Path
from PIL import Image,ImageDraw
import subprocess,json,sys
base=Path('reports/v3-feel/REVIEW')/(sys.argv[1] if len(sys.argv)>1 else 'QR-P1')
raw=base/'raw'/'review';raw.mkdir(parents=True,exist_ok=True)
subprocess.run(['ffmpeg','-v','error','-y','-i',str(base/'pilot.webm'),'-vf','fps=30','-frames:v','900',str(raw/'%04d.jpg')],check=True)
windows=[('idle',0,60,6),('basic',51,99,3),('ultimate',126,216,3),('hit',246,294,3),('death',315,384,3),('basic-contact',69,75,1),('ultimate-contact',165,173,1)]
if base.name=='QR-P3':windows.extend([('basic-windup',60,68,1),('focus-boundary',150,156,1)])
index=[]
for name,first,last,step in windows:
 frames=list(range(first,last+1,step))
 for part in range(0,len(frames),20):
  group=frames[part:part+20];cols=4;rows=(len(group)+3)//4
  sheet=Image.new('RGB',(1280,rows*202+30),'#181722');d=ImageDraw.Draw(sheet);d.text((12,8),f'{name} / actual recorded frames / 30 fps',fill='white')
  for k,frame in enumerate(group):
   img=Image.open(raw/f'{frame+1:04d}.jpg');img.thumbnail((320,180));x=k%4*320;y=k//4*202+30;sheet.paste(img,(x,y+20));d.text((x+8,y+3),f'f{frame:03d} {frame/30:.3f}s',fill='white')
  path=base/f'{name}-{part//20+1:02d}.jpg';sheet.save(path,quality=91);index.append({'path':str(path),'frames':group,'first':group[0]/30,'last':group[-1]/30})
(base/'sheets.json').write_text(json.dumps(index,indent=2)+'\n')
if base.name=='QR-P3':
 clocks=[]
 for frame in range(900):
  img=Image.open(raw/f'{frame+1:04d}.jpg').convert('RGB')
  bits=[sum(img.getpixel((1152+bit*4,712)))/3>128 for bit in range(16)]
  clocks.append({'frame':frame,'videoSeconds':frame/30,'sceneMs':sum(int(bit)<<i for i,bit in enumerate(bits))})
 (base/'frame-clocks.json').write_text(json.dumps(clocks,indent=2)+'\n')
for p in raw.iterdir():p.unlink()
raw.rmdir()
print(f'{len(index)} sheets; {sum(len(x["frames"]) for x in index)} observed frames to inspect')
