"""Private source-video crops only. Never generator inputs or committed assets."""
from pathlib import Path
import subprocess,io,json
from PIL import Image,ImageDraw
out=Path('reports/v3-feel/ref/P1');out.mkdir(parents=True,exist_ok=True)
# Centers/head/feet measured on the existing320px survey sheets. Full source
# pixels are re-extracted before cropping; scale uncertainty is recorded.
specs=[('B01','v1',[(41.8,117,88,124),(42.0,166,92,124),(42.1,161,91,124),(42.5,163,91,124)]),
('B02','v1',[(42.9,115,92,124),(43.0,129,91,124),(43.2,138,90,124),(43.5,140,92,124)]),
('B03','v1',[(44.6,114,92,124),(44.7,163,91,124),(44.9,165,93,124),(45.1,166,91,124)]),
('B04','v1',[(45.8,139,93,124),(45.9,139,92,124),(46.1,139,90,124),(46.4,140,92,124)]),
('B05','v1',[(77.2,117,88,124),(77.3,163,88,124),(77.4,164,88,124),(77.5,116,88,124)]),
('B06','v1',[(76.7,124,59,94),(76.8,124,59,94),(76.9,124,59,94),(77.0,124,59,94)]),
('U01','v1',[(78.2,124,59,94),(78.4,124,59,94),(78.6,124,59,94),(78.9,124,59,94)])]
records=[]
for name,source,frames in specs:
 video=next(Path('/Users/bao/Downloads').glob('*'+('kiXkwkoUuY' if source=='v1' else 'ua_e236yxNM')+'*mp4'))
 sheet=Image.new('RGB',(1280,310),'#292538');draw=ImageDraw.Draw(sheet)
 for i,(at,cx,top,bottom) in enumerate(frames):
  data=subprocess.check_output(['ffmpeg','-v','error','-ss',str(at),'-i',str(video),'-frames:v','1','-f','image2pipe','-vcodec','png','-threads','1','-'])
  im=Image.open(io.BytesIO(data));scale=im.width/320;factor=196/((bottom-top)*scale)
  half=160/factor;vertical=20/factor
  crop=im.crop((round(cx*scale-half),round(top*scale-vertical),round(cx*scale+half),round(bottom*scale+vertical))).resize((320,236),Image.Resampling.LANCZOS)
  sheet.paste(crop,(i*320,35));draw.text((i*320+5,5),f'{name} {at}s | body~196px',fill='white')
 sheet.save(out/(name+'.jpg'),quality=90)
 records.append({'id':name,'source':str(video),'samples':frames,'bodyHeight':196,'uncertainty':'manual320px survey landmarks ±2px; counts are visible-pose minima where effects occlude','sheet':str(out/(name+'.jpg'))})
(out/'index.json').write_text(json.dumps(records,indent=2)+'\n')
print('Private196px pose studies extracted; inspection required.')
