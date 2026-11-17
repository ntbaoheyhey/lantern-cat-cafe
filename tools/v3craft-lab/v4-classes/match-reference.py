from pathlib import Path
from PIL import Image,ImageDraw
import io,subprocess,json
O=Path('reports/v4-art/ref/A1b');rows=[]
# Manual source landmarks expressed on640px-wide source frames, uncertainty3px.
for role,source,t,cx,top,bottom,ownfile,box in [
 ('melee','v1',41.833333,326,174,250,'melee-200',(570,588,1082,882)),
 ('ranged','v2',32.9,219,145,244,'ranged-150',(100,294,612,588)),
 ('healer','v1',49.8,250,174,250,'healer-leaves',(454,588,966,882))]:
 video=next(Path('/Users/bao/Downloads').glob('*'+('kiXkwkoUuY' if source=='v1' else 'ua_e236yxNM')+'*mp4'));data=subprocess.check_output(['ffmpeg','-v','error','-ss',str(t),'-i',str(video),'-frames:v','1','-f','image2pipe','-vcodec','png','-threads','1','-']);im=Image.open(io.BytesIO(data));native=im.width/640;factor=216/((bottom-top)*native);w=512/factor;h=264/factor;center=((cx*native),((top+bottom)*native/2));crop=im.crop((round(center[0]-w/2),round(center[1]-h/2),round(center[0]+w/2),round(center[1]+h/2))).resize((512,264),Image.Resampling.LANCZOS)
 own=Image.open('reports/v4-art/REVIEW/A1b/'+ownfile+'.jpg').crop(box);s=Image.new('RGB',(1024,320),'#242335');s.paste(crop,(0,40));s.paste(own,(512,24));d=ImageDraw.Draw(s);d.text((8,8),f'PRIVATE {source} {t}s {role} | ref body~216px; own216px right',fill='white');s.save(O/f'{role}-matched.jpg',quality=90);rows.append({'role':role,'source':source,'time':t,'landmarks640':[cx,top,bottom],'bodyPx':216,'uncertaintyLandmarkPx':3})
(O/'matched-index.json').write_text(json.dumps(rows,indent=2)+'\n')
