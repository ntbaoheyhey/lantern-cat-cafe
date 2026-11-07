"""Extract review frames from measured x1 videos; no timing or listening verdict.

REFERENCE: record-gallery.mjs; record-boss-battles.mjs. Run with nice -n 10.
Usage: python video-contact-sheets.py captures.json output-directory
"""
import hashlib
import json
import math
from pathlib import Path
import subprocess
import sys
import tempfile

from PIL import Image, ImageDraw


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


capture_path, output = Path(sys.argv[1]), Path(sys.argv[2])
capture = json.loads(capture_path.read_text())
output.mkdir(parents=True, exist_ok=True)
rows = []
for row in capture['rows']:
    video = Path(row.get('file', row.get('video', '')))
    assert video.is_file(), video
    sha = digest(video)
    points = []
    if 'clips' in row:
        assert sha == row['sha256'], 'Recorded video bytes changed'
        seen = set()
        for index, clip in enumerate(row['clips']):
            if clip['id'] in seen:
                continue
            seen.add(clip['id'])
            end = row['clips'][index + 1]['at'] if index + 1 < len(row['clips']) else row['elapsed']
            points.append({'label': clip['id'], 'seconds': (clip['at'] + (end - clip['at']) * .5) / 1000})
        owner = row['owner']
    else:
        detail = json.loads((capture_path.parent / ('chapter-%s.json' % row['chapter'])).read_text())
        assert sha == detail['videoSha256'], 'Recorded boss video bytes changed'
        owner = 'chapter-%s-boss' % row['chapter']
        points = [{'label': 'Automatic boss fight', 'seconds': (i + .5) * row['seconds'] / 8} for i in range(8)]
    assert points
    probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'stream=width,height', '-of', 'json', str(video)], text=True))
    native = probe['streams'][0]
    width = 640
    height = round(width * native['height'] / native['width'])
    sheet = Image.new('RGB', (width * 2, (height + 30) * math.ceil(len(points) / 2)), '#211d2a')
    draw = ImageDraw.Draw(sheet)
    with tempfile.TemporaryDirectory(prefix='cardrpg-big2-video-frames-') as temporary:
        for index, point in enumerate(points):
            frame = Path(temporary) / ('%02d.png' % index)
            subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(point['seconds']), '-i', str(video), '-frames:v', '1', str(frame)], check=True)
            image = Image.open(frame).convert('RGB')
            assert image.size == (native['width'], native['height'])
            x, y = (index % 2) * width, (index // 2) * (height + 30)
            sheet.paste(image.resize((width, height), Image.Resampling.LANCZOS), (x, y + 30))
            draw.text((x + 10, y + 8), '%s / %.3fs' % (point['label'], point['seconds']), fill='#f5e3bf')
    target = output / (owner + '.webp')
    sheet.save(target, 'WEBP', quality=90, method=6)
    rows.append({'owner': owner, 'video': str(video), 'videoSha256': sha, 'native': native,
                 'sheet': str(target), 'sheetSha256': digest(target), 'points': points})
    print(json.dumps({'owner': owner, 'frames': len(points), 'sheet': str(target)}), flush=True)
(output / 'captures.json').write_text(json.dumps({'source': str(capture_path), 'sourceSha256': digest(capture_path),
    'artifactSha256': capture['sha256'], 'method': 'FFmpeg frames from original x1 video. Gallery: midpoint of first occurrence of each recorded action. Natural bosses: eight evenly spaced moments. Contact sheets resize to 640px wide tiles and WebP quality90; original videos retain native pixels. Still samples cannot establish pacing, audio quality or performance.', 'rows': rows}, indent=2))
