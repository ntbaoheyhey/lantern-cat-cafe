"""D6 views reuse the established decoder, with independent raw-frame boundaries."""
from pathlib import Path
from PIL import Image,ImageDraw
import subprocess,json,sys,io
r=int(sys.argv[1]);p=Path(f'tools/v3craft-lab/q3/raw/D6-r{r}');video=p/'film.webm';raw=p/'capture-vfr.webm'
if not raw.exists():raw=video
suffix='CFR view' if raw!=video else 'raw'
def decode(path,vf,w,h):
 b=subprocess.run(['ffmpeg','-v','error','-i',str(path),'-vf',vf,'-fps_mode','passthrough','-f','rawvideo','-pix_fmt','rgb24','-'],check=True,capture_output=True).stdout;n=w*h*3
 return [Image.frombytes('RGB',(w,h),b[i:i+n]) for i in range(0,len(b),n)]
for name,vf,w,h in [('sheet','fps=10,scale=320:180',320,180),('caster','fps=10,crop=320:300:170:310,scale=280:263',280,263),('target','fps=10,crop=320:300:830:310,scale=280:263',280,263)]:
 frames=decode(video,vf,w,h);s=Image.new('RGB',(4*w,((len(frames)+3)//4)*(h+22)),'#171526');d=ImageDraw.Draw(s)
 for i,im in enumerate(frames):
  x,y=i%4*w,i//4*(h+22);s.paste(im,(x,y));d.text((x+3,y+h+3),f'D6 r{r} {i/10:.1f}s / {suffix}',fill='white')
 s.save(p/f'{name}.jpg',quality=93)
frames=decode(raw,'null',1280,720)
for name,indexes in [('release',range(5,15)),('settle',range(15,25))]:
 s=Image.new('RGB',(1200,1010),'#171526');d=ImageDraw.Draw(s)
 for j,i in enumerate(indexes):
  if i>=len(frames):continue
  x,y=j%2*600,j//2*202
  for side,box in enumerate([(170,310,490,610),(830,310,1150,610)]):s.paste(frames[i].crop(box).resize((192,180),Image.Resampling.LANCZOS),(x+side*210,y))
  d.text((x+3,y+183),f'raw frame{i}, passthrough',fill='white')
 s.save(p/f'{name}.jpg',quality=93)
metadata=json.loads(subprocess.run(['ffprobe','-v','error','-count_frames','-select_streams','v:0','-show_entries','stream=width,height,avg_frame_rate,nb_read_frames:format=duration,size','-of','json',str(video)],check=True,capture_output=True).stdout)
(p/'film-metadata.json').write_text(json.dumps(metadata,indent=2)+'\n')
print(json.dumps({'revision':r,'rawFrames':len(frames),'metadata':metadata}))
cadence=json.loads(subprocess.run(['ffprobe','-v','error','-select_streams','v:0','-show_frames','-show_entries','frame=best_effort_timestamp_time','-of','json',str(raw)],check=True,capture_output=True).stdout)
timestamps=[float(f['best_effort_timestamp_time']) for f in cadence['frames']]
(p/'raw-cadence.json').write_text(json.dumps({'frames':len(timestamps),'timestamps':timestamps,'maxGapMs':1000*max(b-a for a,b in zip(timestamps,timestamps[1:]))},indent=2)+'\n')
reference=json.loads(Path('reports/v3-feel/ref/QR/B08/index.json').read_text())
rows=[dict(label='B08 purple staff caster',video=reference['source'],times=[76.7,76.8,76.9,77.,77.1],crop=[365,160,629,465]),
      dict(label=f'D6 r{r} {suffix}',video=str(video),times=[.1,.2,.3,.4,.7],crop=[100,240,514,718])]
s=Image.new('RGB',(1280,634),'#171526');d=ImageDraw.Draw(s)
for row,data in enumerate(rows):
 for col,t in enumerate(data['times']):
  b=subprocess.run(['ffmpeg','-v','error','-ss',str(t),'-i',data['video'],'-frames:v','1','-vf','scale=1280:-1','-f','image2pipe','-vcodec','png','-'],check=True,capture_output=True).stdout
  im=Image.open(io.BytesIO(b)).crop(data['crop']).resize((256,295),Image.Resampling.LANCZOS);s.paste(im,(col*256,row*317));d.text((col*256+3,row*317+298),f'{data["label"]} {t:.2f}s',fill='white')
private=Path('reports/v3-feel/ref/Q3.A');s.save(private/f'D6-r{r}-matched.jpg',quality=93)
(private/f'D6-r{r}-matched.json').write_text(json.dumps({'rows':rows,'method':'Fixed crops and aspect: reference purple caster body approximately124px at76.8s, own194px; crop widths264/414 yield approximately120 displayed pixels. Reference x2, no timing equivalence. Other actors are excluded from caster-pose claims.'},indent=2)+'\n')
# A complete action needs early preparation, release, contact and final settlement.
s=Image.new('RGB',(1280,(r+1)*263),'#171526');d=ImageDraw.Draw(s)
for rr in range(r+1):
 source=Path(f'tools/v3craft-lab/q3/raw/D6-r{rr}/film.webm')
 for col,t in enumerate([.1,.2,.3,.4,.7]):
  b=subprocess.run(['ffmpeg','-v','error','-ss',str(t),'-i',str(source),'-frames:v','1','-vf','crop=320:300:170:310,scale=256:240','-f','image2pipe','-vcodec','png','-'],check=True,capture_output=True).stdout
  s.paste(Image.open(io.BytesIO(b)),(col*256,rr*263));d.text((col*256+3,rr*263+243),f'D6 r{rr} {t:.2f}s / '+('CFR view' if (source.parent/'capture-vfr.webm').exists() else 'raw'),fill='white')
s.save('reports/v3-feel/REVIEW/Q3.A/D6.jpg',quality=92)
