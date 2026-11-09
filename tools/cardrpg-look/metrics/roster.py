"""Fixed studio comparisons; alpha masks are measured, aesthetic scores are not."""
import argparse
import hashlib
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageOps
from skimage.metrics import structural_similarity

p = argparse.ArgumentParser()
p.add_argument('owner')
p.add_argument('rounds', nargs='+', type=int)
p.add_argument('--kind', choices=['roster', 'opponents'], default='roster')
a = p.parse_args()
root = Path('reports/cardrpg-look/rounds') / a.kind / a.owner
versions = [('before', root/'before')] + [(f'round-{r}', root/f'round-{r}'/'views') for r in a.rounds]
dest = root/f'round-{a.rounds[-1]}'
dest.mkdir(parents=True, exist_ok=True)
sheet = Image.new('RGB', (960, 430*len(versions)), '#1d3039')
draw = ImageDraw.Draw(sheet)
readable = Image.new('RGB', (660, 160*len(versions)), '#1d3039')
rd = ImageDraw.Draw(readable)
measurements = []
baseline = []
bg = (29, 48, 57, 255)
for row, (label, directory) in enumerate(versions):
    receipt = json.loads((directory/'capture-000.json').read_text())
    for column in range(3):
        path = directory/f'{column:03}.png'
        data = path.read_bytes()
        image = Image.open(path).convert('RGBA')
        rgba = np.array(image)
        mask = rgba[:, :, 3] > 240
        assert mask.any(), f'Empty subject: {path}'
        rgb = rgba[:, :, :3]
        gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
        hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
        interior = cv2.erode(mask.astype('uint8'), np.ones((5, 5), np.uint8)) > 0
        lap = cv2.Laplacian(gray, cv2.CV_64F)
        edges = cv2.Canny(gray, 50, 140)
        edges[~interior] = 0
        _, _, stats, _ = cv2.connectedComponentsWithStats(edges)
        lengths = stats[1:, cv2.CC_STAT_AREA]
        composite = Image.alpha_composite(Image.new('RGBA', image.size, bg), image).convert('RGB')
        pixels = np.array(composite)
        if row == 0:
            baseline.append(pixels)
        entry = {
            'label': label, 'angle': column, 'path': str(path),
            'imageSha256': hashlib.sha256(data).hexdigest(),
            'sourceSha256': receipt['sourceSha256'],
            'framingPass': receipt['rows'][column]['framingPass'],
            'alphaBounds': image.getchannel('A').getbbox(),
            'subjectPixelCount': int(mask.sum()),
            'interiorLaplacianVariance': float(lap[interior].var()),
            'interiorEdgeContinuity': float(lengths[lengths >= 8].sum()/max(1, lengths.sum())),
            'subjectLuminance': float(gray[mask].mean()/255),
            'subjectSaturation': float(hsv[:, :, 1][mask].mean()/255),
            'subjectValueBins': (np.bincount(np.digitize(gray[mask], [85, 170]), minlength=3)/mask.sum()).tolist(),
            'ssimVsBeforeSameCamera': float(structural_similarity(baseline[column], pixels, channel_axis=2, data_range=255)),
            'meanAbsolutePixelDifference': float(np.abs(baseline[column].astype(float)-pixels).mean()),
        }
        measurements.append(entry)
        sheet.paste(composite.resize((320, 400), Image.Resampling.LANCZOS), (320*column, 430*row+30))
        draw.text((320*column+8, 430*row+10), f'{a.owner} / {label} / {column*90} deg', fill='#fff0d2')
        if column == 0:
            subject = image.crop(image.getchannel('A').getbbox())
            tile = ImageOps.contain(subject, (180, 120), Image.Resampling.LANCZOS)
            base = Image.alpha_composite(Image.new('RGBA', tile.size, bg), tile).convert('RGB')
            graytile = ImageOps.grayscale(base)
            squint = graytile.point(lambda x: 40 if x < 85 else 128 if x < 170 else 220)
            for i, (variant, title) in enumerate([(base, 'color'), (graytile, 'gray'), (squint, '3 values')]):
                readable.paste(variant, (i*220+(220-tile.width)//2, row*160+30))
                rd.text((i*220+8, row*160+10), f'{label} / {title}', fill='#fff0d2')
sheet.save(dest/'comparison.png')
readable.save(dest/'readability-120px.png')
(dest/'metrics.json').write_text(json.dumps({
    'method': 'Fixed studio/camera. Alpha>240 subject, eroded5px interior. SSIM records change, not beauty. GLB preview is not browser motion validation.',
    'rows': measurements,
}, indent=2)+'\n')
print(json.dumps({'owner': a.owner, 'images': len(measurements), 'output': str(dest)}))
