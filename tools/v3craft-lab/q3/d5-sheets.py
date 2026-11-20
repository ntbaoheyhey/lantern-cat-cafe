"""Existing raw-frame and fixed-body-scale comparison method, Q3 T21/X16."""
from pathlib import Path
from PIL import Image,ImageDraw
import subprocess,json,sys,io
r=int(sys.argv[1]);p=Path(f'tools/v3craft-lab/q3/raw/D5-r{r}');video=p/'film.webm';raw=p/'capture-vfr.webm'
if not raw.exists():raw=video
suffix=' / CFR view' if raw!=video else ' / raw'
def decode(path,vf,w,h):
 b=subprocess.run(['ffmpeg','-v','error','-i',str(path),'-vf',vf,'-fps_mode','passthrough','-f','rawvideo','-pix_fmt','rgb24','-'],check=True,capture_output=True).stdout;n=w*h*3
 return [Image.frombytes('RGB',(w,h),b[i:i+n]) for i in range(0,len(b),n)]
for label,vf,w,h,cols in [('sheet','fps=10,scale=320:180',320,180,4),('detail','fps=10,crop=560:400:100:240,scale=280:200',280,200,4)]:
 frames=decode(video,vf,w,h);s=Image.new('RGB',(cols*w,((len(frames)+cols-1)//cols)*(h+22)),'#171526');d=ImageDraw.Draw(s)
 for i,im in enumerate(frames):
  x,y=i%cols*w,i//cols*(h+22);s.paste(im,(x,y));d.text((x+3,y+h+3),f'D5 r{r} {i/10:.1f}s{suffix}',fill='white')
 s.save(p/f'{label}.jpg',quality=93)
frames=decode(raw,'crop=560:400:100:240,scale=256:183',256,183);s=Image.new('RGB',(1280,820),'#171526');d=ImageDraw.Draw(s)
for j,i in enumerate(list(range(4,14))+list(range(38,48) if r>=1 else range(32,42))):
 if i>=len(frames):continue
 x,y=j%5*256,j//5*205;s.paste(frames[i],(x,y));d.text((x+3,y+186),f'raw frame{i}, passthrough',fill='white')
s.save(p/'boundaries.jpg',quality=93)
private=Path('reports/v3-feel/ref/Q3.A');ref=json.loads((private/'D2-r2-matched.json').read_text());print('reference method',ref.get('method',''))
# Same fixed caster scale as D2, around the left moving blade and caster in B06.
rows=[dict(label='B06 private',video=json.loads(Path('reports/v3-feel/ref/QR/B06/index.json').read_text())['source'],times=[29.,29.1,29.2,29.3,29.4],crop=[250,100,996,633]),
      dict(label=f'D5 r{r}{suffix}',video=str(video),times=[.3,.5,.8,1.1,1.4],crop=[100,240,660,640])]
s=Image.new('RGB',(1280,398),'#171526');d=ImageDraw.Draw(s)
for row,data in enumerate(rows):
 for col,t in enumerate(data['times']):
  b=subprocess.run(['ffmpeg','-v','error','-ss',str(t),'-i',data['video'],'-frames:v','1','-vf','scale=1280:-1','-f','image2pipe','-vcodec','png','-'],check=True,capture_output=True).stdout
  im=Image.open(io.BytesIO(b)).crop(data['crop']).resize((256,184),Image.Resampling.LANCZOS);s.paste(im,(col*256,row*198));d.text((col*256+3,row*198+186),f'{data["label"]} {t:.2f}s',fill='white')
s.save(private/f'D5-r{r}-matched.jpg',quality=93);(private/f'D5-r{r}-matched.json').write_text(json.dumps({'rows':rows,'method':'Fixed caster-body scale inherited from reviewed D2: reference~260px/746px crop, Soot194px/560px crop; both~89px in256px cells. Uniform aspect-preserving crop, x3 reference not timing equivalence.'},indent=2)+'\n')
meta=json.loads(subprocess.run(['ffprobe','-v','error','-count_frames','-select_streams','v:0','-show_entries','stream=width,height,avg_frame_rate,nb_read_frames:format=duration,size','-of','json',str(video)],check=True,capture_output=True).stdout);(p/'film-metadata.json').write_text(json.dumps(meta,indent=2)+'\n');print(json.dumps({'revision':r,'rawFrames':len(frames),'metadata':meta}))

# Durable strip contains only original art; one JPG for the whole drill.
s=Image.new('RGB',(1280,(r+1)*206),'#171526');d=ImageDraw.Draw(s)
for rr in range(r+1):
 source=Path(f'tools/v3craft-lab/q3/raw/D5-r{rr}/film.webm')
 for col,t in enumerate([.3,.5,.8,1.1,1.4]):
  b=subprocess.run(['ffmpeg','-v','error','-ss',str(t),'-i',str(source),'-frames:v','1','-vf','crop=560:400:100:240,scale=256:183','-f','image2pipe','-vcodec','png','-'],check=True,capture_output=True).stdout
  s.paste(Image.open(io.BytesIO(b)),(col*256,rr*206));d.text((col*256+3,rr*206+186),f'D5 r{rr} {t:.2f}s'+(' / CFR view' if (source.parent/'capture-vfr.webm').exists() else ' / raw'),fill='white')
s.save('reports/v3-feel/REVIEW/Q3.A/D5.jpg',quality=92)
