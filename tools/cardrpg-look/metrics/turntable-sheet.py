"""Verify completed studio frames and assemble six actual rotation samples."""
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw

p = argparse.ArgumentParser()
p.add_argument('directory', type=Path)
a = p.parse_args()
root = a.directory
receipt = json.loads((root/'receipt.json').read_text())
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
assert sha(Path(receipt['source'])) == receipt['modelHash']
assert sha(root/'turntable.mp4') == receipt['videoSha256']
frames = []
for path in sorted((root/'frames').glob('capture-*.json')):
    capture = json.loads(path.read_text())
    assert capture['sourceSha256'] == receipt['modelHash']
    assert capture['scriptSha256'] == receipt['sourceHash']
    for row in capture['rows']:
        assert sha(root/'frames'/row['file']) == row['sha256']
        frames.append(row)
assert sorted(row['index'] for row in frames) == list(range(48))
sheet = Image.new('RGB', (1152, 1020), '#1d3039')
draw = ImageDraw.Draw(sheet)
samples = [0, 8, 16, 24, 32, 40]
for i, index in enumerate(samples):
    im = Image.open(root/'frames'/f'{index:03}.png').convert('RGBA')
    assert im.size == (384, 480)
    bg = Image.new('RGBA', im.size, '#1d3039')
    bg.alpha_composite(im)
    x, y = (i % 3)*384, (i // 3)*510
    sheet.paste(bg.convert('RGB'), (x, y+30))
    draw.text((x+10, y+9), f"{receipt['owner']} / {index*7.5:.0f} degrees", fill='#fff0d2')
sheet.save(root/'six-angle-sheet.png')
result = dict(owner=receipt['owner'], modelHash=receipt['modelHash'], frames=48,
              framingFailures=[row for row in frames if not row['framingPass']],
              samples=samples, sheetSha256=sha(root/'six-angle-sheet.png'),
              scope='Frame hashes and bounds verified; six-angle sheet still requires personal visual review.')
(root/'frame-audit.json').write_text(json.dumps(result, indent=2)+'\n')
print(json.dumps(dict(owner=result['owner'], frames=48, framingFailures=len(result['framingFailures']))))
