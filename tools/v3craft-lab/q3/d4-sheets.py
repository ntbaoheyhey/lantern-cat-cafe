"""D4 review uses the unchanged ffmpeg/Pillow method in LEARN/Q3.md T21.
The private U06 crop/scale comes from the already-reviewed D1 comparison.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import subprocess, io, json, sys

revision = int(sys.argv[1]); out = Path(f'tools/v3craft-lab/q3/raw/D4-r{revision}')
video = out / 'film.webm'; raw_video = out / 'capture-vfr.webm'
if not raw_video.exists(): raw_video = video
view_label=' / CFR view' if raw_video!=video else ''

def decode(path, vf, w, h):
    data = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-vf', vf,
        '-fps_mode', 'passthrough', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], check=True, capture_output=True).stdout
    step = w*h*3
    return [Image.frombytes('RGB', (w,h), data[i:i+step]) for i in range(0,len(data),step)]

for label,vf,w,h in [('sheet','fps=10,scale=320:180',320,180),
                     ('detail','fps=10,crop=540:540:530:95,scale=256:256',256,256)]:
    frames=decode(video,vf,w,h); columns=4 if w==320 else 5
    sheet=Image.new('RGB',(1280,((len(frames)+columns-1)//columns)*(h+22)),'#171526'); draw=ImageDraw.Draw(sheet)
    for i,frame in enumerate(frames):
        x,y=i%columns*w,i//columns*(h+22);sheet.paste(frame,(x,y));draw.text((x+3,y+h+3),f'D4 r{revision} {i/10:.1f}s{view_label}',fill='white')
    sheet.save(out/f'{label}.jpg',quality=92)

raw=decode(raw_video,'crop=540:540:530:95,scale=256:256',256,256)
sheet=Image.new('RGB',(1280,1112),'#171526');draw=ImageDraw.Draw(sheet)
for j,i in enumerate(list(range(5,15))+list(range(29,39))):
    if i>=len(raw):continue
    x,y=j%5*256,j//5*278;sheet.paste(raw[i],(x,y));draw.text((x+3,y+259),f'raw frame{i}, passthrough',fill='white')
sheet.save(out/'boundaries.jpg',quality=92)

private=Path('reports/v3-feel/ref/Q3.A');reference=json.loads(Path('reports/v3-feel/ref/QR/U06/index.json').read_text())['source']
rows=[dict(label='U06 private',video=reference,times=[58.3,58.4,58.5,58.7,58.9],crop=[684,-20,1240,372]),
      dict(label=f'D4 r{revision}{view_label}',video=str(video),times=[.25,.4,.6,.85,1.1],crop=[568,182,1034,511])]
sheet=Image.new('RGB',(1280,432),'#171526');draw=ImageDraw.Draw(sheet)
for row,data in enumerate(rows):
    for col,t in enumerate(data['times']):
        encoded=subprocess.run(['ffmpeg','-v','error','-ss',str(t),'-i',data['video'],'-frames:v','1','-vf','scale=1280:-1','-f','image2pipe','-vcodec','png','-'],check=True,capture_output=True).stdout
        im=Image.open(io.BytesIO(encoded)).crop(data['crop']).resize((256,180),Image.Resampling.LANCZOS)
        sheet.paste(im,(col*256,row*216));draw.text((col*256+3,row*216+183),f'{data["label"]} {t:.2f}s',fill='white')
draw.text((3,414),'PRIVATE / fixed main-shape height ~140px / reference x3, no timing equivalence',fill='white')
sheet.save(private/f'D4-r{revision}-matched.jpg',quality=92)
(private/f'D4-r{revision}-matched.json').write_text(json.dumps(dict(rows=rows,method='Fixed uniform source crops; reference304px, own253.9px main silhouette, displayed~140px. No reference pixels in product.'),indent=2)+'\n')
metadata=json.loads(subprocess.run(['ffprobe','-v','error','-count_frames','-select_streams','v:0','-show_entries','stream=width,height,avg_frame_rate,nb_read_frames:format=duration,size','-of','json',str(video)],check=True,capture_output=True).stdout)
(out/'film-metadata.json').write_text(json.dumps(metadata,indent=2)+'\n')
print(json.dumps(dict(revision=revision,rawFrames=len(raw),metadata=metadata)))
