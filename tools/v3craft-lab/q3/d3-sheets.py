"""D3 uses the existing decoded-frame/Pillow method from Q3-T21 and selected-sheets.
Raw files remain ignored. Matching is by measured target body, not viewport size.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import subprocess, json, io, sys, datetime

revision = int(sys.argv[1])
out = Path(f'tools/v3craft-lab/q3/raw/D3-r{revision}')
video = out / 'film.webm'
raw_video = out / 'capture-vfr.webm'
if not raw_video.exists(): raw_video = video
view_label = ' / CFR view' if raw_video != video else ''
private = Path('reports/v3-feel/ref/Q3.A')

def decode(path, vf, width, height):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-vf', vf,
        '-fps_mode', 'passthrough', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
        check=True, capture_output=True).stdout
    size = width * height * 3
    return [Image.frombytes('RGB', (width, height), raw[i:i+size]) for i in range(0, len(raw), size)]

for name, vf, w, h in [('sheet', 'fps=10,scale=320:180', 320, 180),
        ('detail', 'fps=10,crop=500:400:780:250,scale=320:256', 320, 256)]:
    frames = decode(video, vf, w, h)
    sheet = Image.new('RGB', (1280, ((len(frames)+3)//4)*(h+22)), '#171526')
    draw = ImageDraw.Draw(sheet)
    for i, frame in enumerate(frames):
        x, y = i % 4*w, i//4*(h+22)
        sheet.paste(frame, (x, y)); draw.text((x+4, y+h+3), f'D3 r{revision} {i/10:.1f}s{view_label}', fill='white')
    sheet.save(out / f'{name}.jpg', quality=92)

# Adjacent actual frames around contact and the final visible decay; never fps-resample this strip.
raw = decode(raw_video, 'crop=500:400:780:250,scale=256:205', 256, 205)
indices = list(range(8, 18)) + list(range(36, 46))
sheet = Image.new('RGB', (1280, 4*227), '#171526'); draw = ImageDraw.Draw(sheet)
for i, index in enumerate(indices):
    if index >= len(raw): continue
    x, y = i % 5*256, i//5*227
    sheet.paste(raw[index], (x, y)); draw.text((x+3, y+208), f'raw frame {index}, passthrough', fill='white')
sheet.save(out / 'boundaries.jpg', quality=92)

reference = json.loads(Path('reports/v3-feel/ref/QR/B01/index.json').read_text())['source']
rows = [dict(label='B01 private', video=reference, times=[41.9,42.0,42.1,42.2], crop=[740,365,990,525]),
        dict(label=f'D3 r{revision}{view_label}', video=str(video), times=[.4,.5,.6,.8], crop=[780,260,1280,580])]
sheet = Image.new('RGB', (1024, 386), '#171526'); draw = ImageDraw.Draw(sheet)
for row, data in enumerate(rows):
    for column, time in enumerate(data['times']):
        encoded = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(time), '-i', data['video'],
            '-frames:v', '1', '-vf', 'scale=1280:-1', '-f', 'image2pipe', '-vcodec', 'png', '-'],
            check=True, capture_output=True).stdout
        frame = Image.open(io.BytesIO(encoded)).crop(data['crop']).resize((256,164), Image.Resampling.LANCZOS)
        sheet.paste(frame, (column*256, row*188))
        draw.text((column*256+3, row*188+166), f'{data["label"]} {time:.2f}s', fill='white')
draw.text((3,377), 'PRIVATE / target body ~98px both rows / reference96+/-8px, own194px / no timing equivalence', fill='white')
sheet.save(private / f'D3-r{revision}-matched.jpg', quality=92)
(private / f'D3-r{revision}-matched.json').write_text(json.dumps(dict(
    at=datetime.datetime.now(datetime.timezone.utc).isoformat(), rows=rows,
    referenceBodyHeightPx=96, referenceUncertaintyPx=8, ownBodyHeightPx=194,
    outputCell=[256,164], note='Fixed target-body scale. Private reference pixels. No movie timing claim.'), indent=2)+'\n')
probe = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height,avg_frame_rate,nb_read_frames:format=duration,size',
    '-of', 'json', str(video)], check=True, capture_output=True).stdout)
(out / 'film-metadata.json').write_text(json.dumps(probe, indent=2)+'\n')
print(json.dumps(dict(revision=revision, rawFrames=len(raw), probe=probe)))
