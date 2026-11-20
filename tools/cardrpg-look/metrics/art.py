"""Measure delivered art at its real display size. No aesthetic pass is inferred."""
import argparse
import hashlib
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from skimage.metrics import structural_similarity

parser = argparse.ArgumentParser()
parser.add_argument('packed', type=Path)
parser.add_argument('--before', type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parents[3]
receipt = json.loads((args.packed / 'packing.json').read_text())
previous = json.loads((args.before / 'packing.json').read_text()) if args.before else None
old = {row['id']: row for row in previous['images']} if previous else {}


def rgba(row):
    return np.asarray(Image.open(root / row['outputs']['1x']['file']).convert('RGBA'))


def measures(image):
    rgb, alpha = image[:, :, :3], image[:, :, 3]
    mask = alpha > 32
    assert mask.any()
    y, x = np.where(mask)
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    interior = cv2.erode(mask.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    laplace = cv2.Laplacian(gray, cv2.CV_64F)
    edge = cv2.Canny(gray, 60, 140) > 0
    h, w = mask.shape
    return {'alphaBounds': [int(x.min()), int(y.min()), int(x.max()) + 1, int(y.max()) + 1],
            'occupiedHeightFraction': float((y.max() - y.min() + 1) / h),
            'occupiedWidthFraction': float((x.max() - x.min() + 1) / w),
            'alphaCoverage': float(mask.mean()),
            'borderAlphaMax': int(max(alpha[0].max(), alpha[-1].max(), alpha[:, 0].max(), alpha[:, -1].max())),
            'subjectLumaPercentiles': [float(v) for v in np.percentile(gray[mask], [10, 50, 90])],
            'subjectSaturationMean': float(hsv[:, :, 1][mask].mean() / 255),
            'interiorLaplacianVariance': float(laplace[interior].var()) if interior.any() else None,
            'interiorEdgeFraction': float(edge[interior].mean()) if interior.any() else None,
            'threeValueFractions': [float(((gray[mask] // 86) == value).mean()) for value in range(3)]}


rows = []
for row in receipt['images']:
    image = rgba(row)
    after = measures(image)
    comparison = None
    if row['id'] in old:
        before_image = rgba(old[row['id']])
        assert before_image.shape == image.shape
        # Transparent images are compared on the same ink backdrop.
        def composite(im):
            alpha = im[:, :, 3:4] / 255
            return np.round(im[:, :, :3] * alpha + np.array([35, 62, 70]) * (1 - alpha)).astype(np.uint8)
        a, b = composite(before_image), composite(image)
        comparison = {'before': measures(before_image),
                      'ssimOnInk': float(structural_similarity(a, b, channel_axis=2, data_range=255)),
                      'meanAbsoluteDifference': float(np.abs(a.astype(float) - b).mean())}
    rows.append({'id': row['id'], 'file': row['outputs']['1x']['file'],
                 'fileSha256': row['outputs']['1x']['sha256'], 'after': after, 'comparison': comparison})
result = {'kind': receipt['kind'], 'round': receipt['round'], 'displayMetricsOnly': True,
          'note': 'Framing and lighting changes intentionally change SSIM. Sharpness is not a beauty score.',
          'scriptSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(), 'rows': rows}
(args.packed / 'metrics.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'kind': receipt['kind'], 'round': receipt['round'], 'measured': len(rows),
                  'borderOffenders': [r['id'] for r in rows if r['after']['borderAlphaMax']]}))
