from pathlib import Path
from PIL import Image,ImageDraw
import io,subprocess,json
v=next(Path('/Users/bao/Downloads').glob('*kiXkwkoUuY*mp4'));O=Path('reports/v4-art/ref/A1b');records=[]
for label,times in [('out',[41.70,41.766667,41.833333,41.90]),('return-end',[42.90,42.966667,43.033333,43.10])]:
 s=Image.new('RGB',(1280,560),'#242335');d=ImageDraw.Draw(s)
 for i,t in enumerate(times):
  data=subprocess.check_output(['ffmpeg','-v','error','-ss',str(t),'-i',str(v),'-frames:v','1','-vf','scale=640:-1,crop=640:230:0:110','-f','image2pipe','-vcodec','png','-threads','1','-']);im=Image.open(io.BytesIO(data));x=(i%2)*640;y=(i//2)*280;s.paste(im,(x,y+24));d.text((x+8,y+6),f'v1 {t:.6f}s {label} | sample4nativeframes step',fill='white')
 s.save(O/f'dash-{label}.jpg',quality=90);records.append({'label':label,'times':times,'nativeFps':60,'sampleStepNativeFrames':4})
(O/'dash-index.json').write_text(json.dumps(records,indent=2)+'\n')
