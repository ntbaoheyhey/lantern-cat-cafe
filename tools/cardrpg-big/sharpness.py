"""Native-pixel Laplacian variance. Compare the same named crop at the same DPR."""
import json
from pathlib import Path
import numpy as np
from PIL import Image

root = Path('reports/cardrpg-big')
rows = []
for phase in ['baseline', 'current']:
    directory = root / phase / 'sharpness'
    if not directory.exists():
        continue
    for file in sorted(directory.glob('dpr*-*.png')):
        if file.stem.endswith('-fixed'):
            continue
        image = np.asarray(Image.open(file).convert('L'), dtype=float)
        laplacian = -4 * image[1:-1, 1:-1] + image[:-2, 1:-1] + image[2:, 1:-1] + image[1:-1, :-2] + image[1:-1, 2:]
        rows.append({'phase': phase, 'crop': file.stem, 'width': image.shape[1], 'height': image.shape[0], 'laplacianVariance': float(laplacian.var()), 'path': str(file)})
for row in rows:
    if row['phase'] == 'current':
        before = next((r for r in rows if r['phase'] == 'baseline' and r['crop'] == row['crop']), None)
        if before:
            row['changePercent'] = 100 * (row['laplacianVariance'] / before['laplacianVariance'] - 1)
(root / 'sharpness.json').write_text(json.dumps({'method': 'Four-neighbour grayscale Laplacian variance in native screenshot pixels, no resize or filtering. Composition and lighting affect this measure, alongside actual sharpness.', 'rows': rows}, indent=2))
print(json.dumps(rows, indent=2))
