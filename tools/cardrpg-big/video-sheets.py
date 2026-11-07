"""Extract chronological half-second review sheets from verified video receipts."""
import argparse
import hashlib
import json
import math
from pathlib import Path
import subprocess
import tempfile

from PIL import Image, ImageDraw

parser = argparse.ArgumentParser()
parser.add_argument('receipt', type=Path)
args = parser.parse_args()
receipt = json.loads(args.receipt.read_text())
output = args.receipt.parent / 'review'
output.mkdir(exist_ok=True)
rows = []
for row in receipt['rows']:
    clip = Path(row['path'])
    assert hashlib.sha256(clip.read_bytes()).hexdigest() == row['sha256'], clip
    duration = float(row['probe']['format']['duration'])
    count = math.ceil(duration * 2)
    sheets = []
    with tempfile.TemporaryDirectory(prefix='cardrpg-big-frames-') as temporary:
        subprocess.run(['ffmpeg', '-v', 'error', '-i', str(clip), '-vf',
                        'fps=2:start_time=0,scale=320:180', '-frames:v', str(count),
                        str(Path(temporary) / '%04d.png')], check=True)
        frames = sorted(Path(temporary).glob('*.png'))
        assert abs(len(frames) - count) <= 1, (clip, len(frames), count)
        for start in range(0, len(frames), 20):
            selected = frames[start:start + 20]
            sheet = Image.new('RGB', (1280, 32 + math.ceil(len(selected) / 4) * 204), '#191725')
            draw = ImageDraw.Draw(sheet)
            draw.text((8, 10), f"{row['name']} | 1x | every 0.5 s | silent capture", fill='white')
            for index, frame in enumerate(selected):
                left, top = (index % 4) * 320, 32 + (index // 4) * 204
                with Image.open(frame) as image:
                    sheet.paste(image, (left, top))
                draw.text((left + 6, top + 185), f'{(start + index) / 2:.1f} s', fill='white')
            path = output / f"{row['name']}-{start // 20 + 1:02}.webp"
            sheet.save(path, lossless=True)
            sheets.append(str(path))
    rows.append({'name': row['name'], 'clip': str(clip), 'clipSha256': row['sha256'],
                 'duration': duration, 'sampleIntervalSeconds': .5,
                 'frames': len(frames), 'sheets': sheets})
    print(json.dumps({'name': row['name'], 'frames': len(frames), 'sheets': len(sheets)}))
(output / 'sampling.json').write_text(json.dumps({
    'artifactSha256': receipt['sha256'],
    'method': 'FFmpeg samples at 2 fps; Pillow arranges all samples chronologically. '
              'These sheets support visual review and do not measure performance.',
    'rows': rows,
}, indent=2) + '\n')
