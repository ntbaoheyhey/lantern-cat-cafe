"""Private reference inspection; no reference input is used in art generation."""
from pathlib import Path
from PIL import Image,ImageDraw
import io,subprocess,json
O=Path('reports/v4-art/ref/A1b');O.mkdir(parents=True,exist_ok=True)
sets={'heals':[('v1',48.9),('v1',49.8),('v2',58.4),('v2',58.6)],'melee':[('v1',41.7),('v1',41.9),('v1',42.6),('v2',39.0)],'ranged':[('v2',32.7),('v2',32.9),('v2',60.5),('v2',60.7)]}
for label,spec in sets.items():
 s=Image.new('RGB',(1280,940),'#242335');d=ImageDraw.Draw(s)
 for i,(source,at) in enumerate(spec):
  video=next(Path('/Users/bao/Downloads').glob('*'+('kiXkwkoUuY' if source=='v1' else 'ua_e236yxNM')+'*mp4'))
  data=subprocess.check_output(['ffmpeg','-v','error','-ss',str(at),'-i',str(video),'-frames:v','1','-vf','scale=640:-1','-f','image2pipe','-vcodec','png','-threads','1','-'])
  im=Image.open(io.BytesIO(data));x=(i%2)*640;y=(i//2)*470;s.paste(im,(x,y+24));d.text((x+8,y+6),f'PRIVATE {source} {at:.3f}s | {label}',fill='white')
 s.save(O/(label+'-survey.jpg'),quality=89)
print('3 private surveys generated,4frames each; originals decoded only in memory.')
