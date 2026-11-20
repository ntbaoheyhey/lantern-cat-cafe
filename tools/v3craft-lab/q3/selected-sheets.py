"""Existing ffmpeg/Pillow review method; raw decoding uses passthrough timestamps.
Learning: LEARN/Q3.md D2 recording audit and Q3-T21. No recorder changes.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import subprocess, io, json

root = Path.cwd()
out = root / 'tools/v3craft-lab/q3/raw/D2-r2'

def decode(video, vf, width, height):
    data = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(video), '-vf', vf,
        '-fps_mode', 'passthrough', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
        check=True, capture_output=True).stdout
    size = width * height * 3
    return [Image.frombytes('RGB', (width, height), data[i:i+size]) for i in range(0, len(data), size)]

def frame(video, time, crop, size):
    data = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(time), '-i', str(video),
        '-frames:v', '1', '-vf', 'scale=1280:-1', '-f', 'image2pipe', '-vcodec', 'png', '-'],
        check=True, capture_output=True).stdout
    return Image.open(io.BytesIO(data)).crop(crop).resize(size, Image.Resampling.LANCZOS)

images = decode(out / 'film.webm', 'fps=10,scale=320:180', 320, 180)
sheet = Image.new('RGB', (1280, 1000), '#171526'); draw = ImageDraw.Draw(sheet)
for i, im in enumerate(images):
    x, y = i % 4 * 320, i // 4 * 200
    sheet.paste(im, (x, y)); draw.text((x+4, y+183), f'D2 r2 / 30fps viewing copy / {i/10:.1f}s', fill='white')
sheet.save(out / 'sheet.jpg', quality=92)
raw = decode(out / 'capture-vfr.webm', 'crop=960:440:200:150,scale=256:117', 256, 117)
sheet = Image.new('RGB', (1280, 560), '#171526'); draw = ImageDraw.Draw(sheet)
for j, i in enumerate(list(range(10)) + list(range(len(raw)-10, len(raw)))):
    x, y = j % 5 * 256, j // 5 * 140
    sheet.paste(raw[i], (x, y)); draw.text((x+4, y+119), f'D2 raw frame {i} / passthrough', fill='white')
sheet.save(out / 'boundaries.jpg', quality=92)

refdir = root / 'reports/v3-feel/ref/Q3.A'
receipt = json.loads((refdir / 'D2-r2-matched.json').read_text())
reference = json.loads((root / 'reports/v3-feel/ref/QR/B06/index.json').read_text())['source']
sheet = Image.new('RGB', (1280, 292), '#171526'); draw = ImageDraw.Draw(sheet)
for row, data in enumerate(receipt['rows']):
    video = reference if row == 0 else out / 'film.webm'
    for col, time in enumerate(data['times']):
        sheet.paste(frame(video, time, data['crop'], (256, 117)), (col*256, row*140))
        draw.text((col*256+4, row*140+119), f'{data["label"]}: {time:.2f}', fill='white')
draw.text((4, 281), 'PRIVATE / ~52px body heights / D2 viewing copy; raw VFR retained / no timing equivalence', fill='white')
sheet.save(refdir / 'D2-r2-matched.jpg', quality=92)
receipt['ownVideo'] = '30fps viewing derivative from capture-vfr.webm; not independent timing evidence'
(refdir / 'D2-r2-matched.json').write_text(json.dumps(receipt, indent=2)+'\n')

selected = root / 'reports/v3-feel/REVIEW/Q3.A'; selected.mkdir(exist_ok=True)
for drill, crop, times in [('D1', (568,182,1034,511), [.1,.4,.8,1.2,1.7]),
                           ('D2', (200,150,1160,590), [.3,.6,.8,1.1,1.5])]:
    height = 181 if drill == 'D1' else 117
    sheet = Image.new('RGB', (1280, (height+23)*3), '#171526'); draw = ImageDraw.Draw(sheet)
    for revision in [0, 1, 2]:
        video = root / f'tools/v3craft-lab/q3/raw/{drill}-r{revision}/film.webm'
        for col, time in enumerate(times):
            sheet.paste(frame(video, time, crop, (256,height)), (col*256, revision*(height+23)))
            label = f'{drill} r{revision} {time:.2f}s'
            if drill == 'D2' and revision == 2: label += ' / CFR view'
            draw.text((col*256+4, revision*(height+23)+height+2), label, fill='white')
    sheet.save(selected / f'{drill}.jpg', quality=92)
print(json.dumps({'phaseCells': len(images), 'rawBoundarySourceFrames': len(raw), 'selectedSheets': 2}))
