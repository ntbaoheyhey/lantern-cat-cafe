"""Compare palette-independent effect masks and retain every failed pair."""
import json
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

root = Path(sys.argv[1])
receipt = json.loads((root / 'captures.json').read_text())
threshold = .16  # Declared in PLAN.md before any capture.
face_pixel_tolerance = .01
overdraw_limit = 24
features = []
details = []
arrays = {}

def distance(left, right):
    union = np.count_nonzero(left | right)
    return np.count_nonzero(left ^ right) / union if union else 0.0

for row in receipt['rows']:
    silhouettes, edges, face_deltas, panels = [], [], [], []
    for index, frame in enumerate(row['frames']):
        image = Image.open(frame['canonicalImage']).convert('RGB')
        pixels = np.asarray(image.resize((160, 106), Image.Resampling.LANCZOS), dtype=float)
        luma = pixels @ np.array([.2126, .7152, .0722])
        mask = luma > max(2.0, luma.max() * .12)
        silhouette = Image.fromarray((mask * 255).astype('uint8'))
        edge = np.asarray(silhouette.filter(ImageFilter.FIND_EDGES)) > 0
        silhouettes.append(mask)
        edges.append(edge)
        silhouette.save(root / 'frames' / f"{row['id'].replace(':', '-')}-{index}-mask.png")
        Image.fromarray((edge * 255).astype('uint8')).save(root / 'frames' / f"{row['id'].replace(':', '-')}-{index}-edges.png")
        panels.append(image.resize((400, 267), Image.Resampling.LANCZOS))
        effect = np.asarray(Image.open(frame['real']).convert('RGB'), dtype=float)
        baseline = np.asarray(Image.open(frame['without']).convert('RGB'), dtype=float)
        delta = np.abs(effect - baseline).max(axis=2)
        height, width = delta.shape
        yy, xx = np.ogrid[:height, :width]
        for x, y, rx, ry in row['samples'][index]['masks']:
            if rx <= 0 or ry <= 0:
                continue
            face = ((xx / width - x) / rx) ** 2 + ((1 - yy / height - y) / ry) ** 2 < .64
            if np.any(face):
                face_deltas.append({'frame': index, 'meanRgbDelta': float(delta[face].mean()),
                    'fractionAbove8': float(np.mean(delta[face] > 8)), 'maxRgbDelta': float(delta[face].max())})
    silhouette = np.array(silhouettes)
    edge = np.array(edges)
    temporal = silhouette[1:] ^ silhouette[:-1]
    features.append((silhouette, edge, temporal))
    arrays[row['id'] + '/silhouette'] = silhouette
    arrays[row['id'] + '/edge'] = edge
    arrays[row['id'] + '/motion'] = temporal
    composition = sorted(set('/'.join([item['primitive'], item['motion'], item['anchor'],
        'ground' if item['ground'] else 'upright']) for item in row['recipe']['layers']))
    sheet = Image.new('RGB', (1200, 574), '#13111b')
    draw = ImageDraw.Draw(sheet)
    draw.text((12, 8), row['name'], fill='#f2e4cc')
    for index, panel in enumerate(panels):
        sheet.paste(panel, ((index % 3) * 400, 28 + (index // 3) * 273))
        draw.text(((index % 3) * 400 + 6, 29 + (index // 3) * 273),
            f"{receipt['framesAt'][index]:.2f}", fill='#ffffff')
    path = root / 'sheets' / (row['id'].replace(':', '-') + '.webp')
    sheet.save(path, 'WEBP', quality=88, method=6)
    details.append({'id': row['id'], 'name': row['name'], 'signature': '|'.join(composition),
        'sheet': str(path), 'faceDeltas': face_deltas,
        'visiblePixels': [int(np.count_nonzero(mask)) for mask in silhouettes],
        'peakCalls': max(sample['realStats']['calls'] for sample in row['samples']),
        'peakTriangles': max(sample['realStats']['triangles'] for sample in row['samples']),
        'peakInstances': max(sample['realEffects']['instances'] for sample in row['samples']),
        'peakOverdraw': max(sample['peakOverdraw'] for sample in row['samples']),
        'truncated': sum(sample['realEffects']['truncated'] for sample in row['samples'])})

pairs = []
for left in range(len(features)):
    for right in range(left + 1, len(features)):
        parts = [distance(a, b) for a, b in zip(features[left], features[right])]
        score = .5 * parts[0] + .3 * parts[1] + .2 * parts[2]
        distinct = details[left]['signature'] != details[right]['signature']
        pairs.append({'left': details[left]['id'], 'right': details[right]['id'],
            'silhouette': parts[0], 'edge': parts[1], 'motion': parts[2], 'distance': score,
            'signatureDistinct': distinct, 'pass': score >= threshold and distinct})
np.savez_compressed(root / 'features.npz', **arrays)
result = {key: value for key, value in receipt.items() if key != 'rows'}
result.update({'threshold': threshold, 'rows': details, 'pairs': pairs,
    'offenders': [pair for pair in pairs if not pair['pass']],
    'minimumDistance': min(pair['distance'] for pair in pairs),
    'maskRule': '160x106 grayscale luminance, threshold 12% of each frame peak with floor2. Distances are binary XOR/union over six frames, combined 50% silhouette,30% edges,20% temporal XOR. Palette and numeric recipe parameters are excluded from signature.',
    'facePixelTolerance': face_pixel_tolerance,
    'overdrawLimit': overdraw_limit,
    'overdrawOffenders': [row['id'] for row in details if row['peakOverdraw'] > overdraw_limit],
    'faceOffenders': [{'id': row['id'], **sample} for row in details for sample in row['faceDeltas']
        if sample['fractionAbove8'] > face_pixel_tolerance],
    'emptyEffects': [row['id'] for row in details if not any(row['visiblePixels'])]})
(root / 'uniqueness.json').write_text(json.dumps(result, indent=2))
print(json.dumps({'effects': len(details), 'pairs': len(pairs), 'offenders': len(result['offenders']),
    'minimumDistance': result['minimumDistance'], 'faceOffenders': len(result['faceOffenders']),
    'peakOverdraw': max(row['peakOverdraw'] for row in details), 'overdrawOffenders': result['overdrawOffenders'],
    'emptyEffects': result['emptyEffects'], 'errors': receipt['errors']}))
if (result['offenders'] or result['emptyEffects'] or result['overdrawOffenders']
        or result['faceOffenders'] or receipt['errors']):
    sys.exit(1)
