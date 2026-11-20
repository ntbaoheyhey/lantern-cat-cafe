"""Preserve raw generated alpha; remove isolated export dust, then resize."""
from pathlib import Path
from PIL import Image
from scipy.ndimage import label, binary_dilation
import hashlib
import json
import shutil
import sys
import numpy as np

lab = Path('tools/v3craft-lab/v4-teacup-healer')
records = []
for key, size in [('tea-blossom', 512), ('tea-canopy', 1024)]:
    source = lab / 'raw' / (key + '.png')
    pixels = np.array(Image.open(source).convert('RGBA'))
    components, _ = label(pixels[:, :, 3] >= 8)
    counts = np.bincount(components.ravel())
    counts[0] = 0
    keep = binary_dilation(counts[components] >= 64, iterations=2)
    pixels[:, :, 3] = np.where(keep, pixels[:, :, 3], 0)
    im = Image.fromarray(pixels)
    bounds = im.getchannel('A').getbbox()
    im = im.crop(bounds)
    im.thumbnail((size, size), Image.Resampling.LANCZOS)
    path = lab / 'exported' / (key + '.webp')
    im.save(path, quality=96, method=6, exact=True)
    if '--publish' in sys.argv:
        dest = Path('apps/web/public/vfx/teacup-healer')
        dest.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, dest / path.name)
    records.append({'key': key, 'raw': str(source), 'rawSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
        'exportBounds': bounds, 'size': im.size, 'bytes': path.stat().st_size,
        'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'minimumComponentPixels': 64,
        'retainedEdgePadding': 2, 'production': '--publish' in sys.argv})
(lab / 'export-fx.json').write_text(json.dumps(records, indent=2) + '\n')
print(json.dumps([{'key': r['key'], 'size': r['size'], 'bytes': r['bytes']} for r in records]))
