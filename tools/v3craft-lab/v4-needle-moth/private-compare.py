"""Private same-scale study; reference pixels never enter generation or git."""
from pathlib import Path
from PIL import Image,ImageDraw
import io,json,subprocess,sys
lab=Path('tools/v3craft-lab/v4-needle-moth')
round_name=sys.argv[1] if len(sys.argv)>1 else 'runtime'
video=next(Path('/Users/bao/Downloads').glob('*ua_e236yxNM*mp4'))
data=subprocess.check_output(['ffmpeg','-v','error','-ss','32.9','-i',str(video),'-frames:v','1','-f','image2pipe','-vcodec','png','-threads','1','-'])
im=Image.open(io.BytesIO(data));native=im.width/640;factor=225/(99*native)
cx,cy=219*native,194.5*native;w,h=512/factor,310/factor
ref=im.crop((round(cx-w/2),round(cy-h/2),round(cx+w/2),round(cy+h/2))).resize((512,310),Image.Resampling.LANCZOS)
own=Image.open(lab/'raw'/round_name/'150-basic-250.png').crop((600,350,1112,660))
sheet=Image.new('RGB',(1024,350),'#242335');sheet.paste(ref,(0,35));sheet.paste(own,(512,35))
ImageDraw.Draw(sheet).text((8,10),'PRIVATE v2 32.9s | both actors225px body | Needle own150ms flight at250ms; no timing equivalence',fill='white')
out=Path('reports/v4-art/ref/A7/needle-moth');out.mkdir(parents=True,exist_ok=True)
sheet.save(out/'ranged-private-comparison.jpg',quality=92)
(lab/'private-compare.json').write_text(json.dumps({'reference':'A1b v2 at32.9s','referenceLandmarks640':[219,145,244],
 'bodyHeightPx':225,'referenceLandmarkUncertaintyPx':3,'ownImage':'raw/'+round_name+'/150-basic-250.png',
 'scope':'private staging/readability comparison; accelerated source timing is not substituted for800/2200ms schedule',
 'reviewed':False},indent=2)+'\n')
print(str(out/'ranged-private-comparison.jpg'))
