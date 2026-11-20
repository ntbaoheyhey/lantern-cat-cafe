"""Matched runtime model crops; fidelity diagnostics, not beauty scoring."""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageOps
from skimage.metrics import structural_similarity

p = argparse.ArgumentParser()
p.add_argument('directory', type=Path)
a = p.parse_args()
before = json.loads((a.directory/'baseline/captures.json').read_text())
after = json.loads((a.directory/'candidate/captures.json').read_text())
variants = json.loads((a.directory/'variants.json').read_text())
assert before['sha256'] == variants['baselineSha256']
assert after['sha256'] == variants['candidateSha256']
assert len(before['rows']) == len(after['rows']) == 6
rows = []
sheet = Image.new('RGB', (1200, 390*6), '#1d3039')
draw = ImageDraw.Draw(sheet)
for i, left in enumerate(before['rows']):
    right = next(r for r in after['rows'] if r['file'] == left['file'])
    assert left['camera'] == right['camera']
    assert not left['errors'] and not right['errors']
    assert left['crops'][0]['asset'] == right['crops'][0]['asset']
    box1, box2 = left['crops'][0]['box'], right['crops'][0]['box']
    # Compare the same union region at native screenshot pixels (DPR2).
    box = [int(np.floor(min(box1[k], box2[k])*2))-8 if k < 2
           else int(np.ceil(max(box1[k], box2[k])*2))+8 for k in range(4)]
    crops = []
    for label, row in [('baseline',left),('candidate',right)]:
        path = a.directory/label/row['file']
        assert hashlib.sha256(path.read_bytes()).hexdigest() == row['sha256']
        crops.append(Image.open(path).convert('RGB').crop(box))
    x, y = [np.array(im) for im in crops]
    delta = np.abs(x.astype(float)-y.astype(float))
    rows.append({'file':left['file'],'owner':left['owner'],'cropPixels':box,
                 'ssim':float(structural_similarity(x,y,channel_axis=2,data_range=255)),
                 'meanAbsoluteChannelError':float(delta.mean()),
                 'p95ChannelError':float(np.percentile(delta,95)),
                 'maxBoundsDeltaCssPx':float(max(abs(x-y) for x,y in zip(box1,box2)))})
    for column, im in enumerate(crops):
        tile = ImageOps.contain(im,(480,340),Image.Resampling.LANCZOS)
        sheet.paste(tile,(column*500+(500-tile.width)//2,i*390+34))
        draw.text((column*500+10,i*390+10),f"{left['owner']} {left['width']} / {['1024px','candidate'][column]}",fill='#fff0d2')
        tiny = ImageOps.contain(im,(170,120),Image.Resampling.LANCZOS)
        sheet.paste(tiny,(1010,i*390+column*180+34))
sheet.save(a.directory/'runtime-comparison.png')
(a.directory/'metrics.json').write_text(json.dumps({'method':'Same camera, time, geometry and crop region. SSIM/error quantify compression fidelity only. Personal image review and independent runtime/size checks remain required.','variants':variants,'rows':rows},indent=2)+'\n')
print(json.dumps({'rows':len(rows),'minimumCropSsim':min(r['ssim'] for r in rows),'output':str(a.directory)}))
