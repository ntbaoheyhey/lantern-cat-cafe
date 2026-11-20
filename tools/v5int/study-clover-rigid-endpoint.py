#!/usr/bin/env python3
"""Offline Clover correspondence and one rigid MLS endpoint; never enrolls media."""
from pathlib import Path
from datetime import datetime, timezone
import argparse
import hashlib
import heapq
import json
import math
import cv2
import numpy as np

cv2.setNumThreads(2)
ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / 'work/v5/CXI/batch-m'
parser = argparse.ArgumentParser()
parser.add_argument('--trial', action='store_true')
args = parser.parse_args()
OUT = BASE / ('clover-rigid-endpoint-r1' if args.trial else 'clover-correspondence-r1')
OUT.mkdir(exist_ok=False)
mask = np.load(BASE / 'clover-dis-endpoint-r1/mask.npy').astype(float)
h, w = mask.shape
source = BASE / 'matte-r2/clover-premul.rgba'
raw = np.memmap(source, np.uint8, 'r', shape=(300, h, w, 4))
yy, xx = np.mgrid[:h, :w].astype(float)
grid = np.stack((xx, yy), axis=-1)


def thin(binary):
    """Same two-subiteration thinning as the preserved first control diagnostic."""
    a = np.pad(binary.astype(bool), 1)
    for iteration in range(200):
        before = a.copy()
        for stage in (0, 1):
            p = [a[:-2, 1:-1], a[:-2, 2:], a[1:-1, 2:], a[2:, 2:],
                 a[2:, 1:-1], a[2:, :-2], a[1:-1, :-2], a[:-2, :-2]]
            count = sum(x.astype(np.uint8) for x in p)
            transitions = sum((~p[i] & p[(i+1) % 8]).astype(np.uint8) for i in range(8))
            blocked = ((p[0] & p[2] & p[4]) | (p[2] & p[4] & p[6])) if stage == 0 else ((p[0] & p[2] & p[6]) | (p[0] & p[4] & p[6]))
            a[1:-1, 1:-1] &= ~((count >= 2) & (count <= 6) & (transitions == 1) & ~blocked)
        if np.array_equal(a, before):
            return a[1:-1, 1:-1]
    raise AssertionError('Thinning failed')


def neighbors(p, nodes):
    x, y = p
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            q = (x+dx, y+dy)
            if (dx or dy) and q in nodes:
                yield q, math.hypot(dx, dy)


def extract(frame):
    f = raw[frame]
    r, g, b = np.moveaxis(f[:, :, :3].astype(float), -1, 0)
    warm = ((r > g*1.035) & (r > b*1.15) & (f[:, :, 3] > 48) & (mask > 0)).astype(np.uint8)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(warm, 8)
    component = (labels == 1+np.argmax(stats[1:, cv2.CC_STAT_AREA])).astype(np.uint8)
    contours, _ = cv2.findContours(component, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    filled = np.zeros_like(component)
    cv2.drawContours(filled, contours, -1, 1, cv2.FILLED)
    skeleton = thin(filled)
    nodes = set(zip(*np.where(skeleton)[::-1]))
    ends = [p for p in nodes if sum(1 for _ in neighbors(p, nodes)) == 1]
    assert len(ends) >= 2, (frame, ends)
    best = None
    for start in ends:
        distances, previous, queue = {start: 0.}, {}, [(0., start)]
        while queue:
            distance, point = heapq.heappop(queue)
            if distance != distances[point]:
                continue
            for other, length in neighbors(point, nodes):
                candidate = distance+length
                if candidate < distances.get(other, math.inf):
                    distances[other], previous[other] = candidate, point
                    heapq.heappush(queue, (candidate, other))
        for end in ends:
            if end in distances and (best is None or distances[end] > best[0]):
                best = (distances[end], start, end, previous)
    length, start, end, previous = best
    path = [end]
    while path[-1] != start:
        path.append(previous[path[-1]])
    points = np.array(path, dtype=float)
    # Upper free end is the visible curled tip. Lower end is truncated by dress/mask.
    if points[0, 1] > points[-1, 1]:
        points = points[::-1]
    arc = np.r_[0, np.cumsum(np.linalg.norm(np.diff(points, axis=0), axis=1))]
    return points, arc, component


def sample(points, arc, distances):
    return np.stack([np.interp(distances, arc, points[:, axis]) for axis in range(2)], axis=-1)


def rigid_mls(points, controls, targets):
    """Weighted 2D Procrustes, proper rotation only; inverse image mapping."""
    delta = points[..., None, :]-controls
    weights = 1/np.maximum(np.sum(delta*delta, axis=-1), 1e-12)
    weights /= weights.sum(axis=-1, keepdims=True)
    pc = np.einsum('...i,ij->...j', weights, controls)
    qc = np.einsum('...i,ij->...j', weights, targets)
    p = controls-pc[..., None, :]
    q = targets-qc[..., None, :]
    cosine = np.sum(weights*np.sum(p*q, axis=-1), axis=-1)
    sine = np.sum(weights*(p[..., 0]*q[..., 1]-p[..., 1]*q[..., 0]), axis=-1)
    magnitude = np.hypot(cosine, sine)
    assert magnitude.min() > 1e-12
    cosine, sine = cosine/magnitude, sine/magnitude
    v = points-pc
    return np.stack((cosine*v[..., 0]-sine*v[..., 1], sine*v[..., 0]+cosine*v[..., 1]), axis=-1)+qc


def corners(mapping):
    a, b, c, d = mapping[:-1, :-1], mapping[:-1, 1:], mapping[1:, :-1], mapping[1:, 1:]
    def cross(p, q):
        return p[..., 0]*q[..., 1]-p[..., 1]*q[..., 0]
    return np.stack((cross(b-a, c-a), cross(b-a, d-b), cross(d-c, c-a), cross(d-c, d-b)))


report = {'utc': datetime.now(timezone.utc).isoformat(), 'source': str(source),
          'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
          'toolSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
          'runtimeChanged': False, 'sequenceChanged': False}
if not args.trial:
    rows, panels = [], []
    for frame in [25, 150, 275]:
        points, arc, component = extract(frame)
        controls = sample(points, arc, np.linspace(0, 90, 7))
        rows.append({'frame': frame, 'tip': points[0].tolist(), 'occludedEnd': points[-1].tolist(), 'length': float(arc[-1]), 'componentArea': int(component.sum()), 'controls': controls.tolist()})
        panel = raw[frame, :, :, :3].copy()
        for i, point in enumerate(controls):
            at = tuple(np.rint(point).astype(int))
            cv2.circle(panel, at, 2, (255, 0, 180), -1)
            cv2.putText(panel, str(i), at, cv2.FONT_HERSHEY_SIMPLEX, .26, (255, 255, 255), 1)
        cv2.circle(panel, tuple(points[-1].astype(int)), 3, (0, 255, 255), 1)
        cv2.putText(panel, f'frame {frame}: 0=tip', (10, 18), cv2.FONT_HERSHEY_SIMPLEX, .43, (255, 255, 255), 1)
        panels.append(panel)
    sheet = np.concatenate(panels, axis=1)
    image = OUT/'correspondence-midframes.png'
    assert cv2.imwrite(str(image), cv2.cvtColor(sheet, cv2.COLOR_RGB2BGR))
    report.update({'rows': rows, 'image': {'path': str(image), 'dimensions': [sheet.shape[1], sheet.shape[0]], 'sha256': hashlib.sha256(image.read_bytes()).hexdigest(), 'viewed': False}, 'limits': ['Upper-tip/lower-occlusion interpretation needs fresh view.', 'Skeleton is color/shape evidence, not recovered physical rig.']})
else:
    # Absolute arclength from the free tip; exclude the last ~30px occluded segment.
    p, pa, target_component = extract(0)
    q, qa, source_component = extract(299)
    distances = np.linspace(0, 90, 7)
    controls, targets = sample(p, pa, distances), sample(q, qa, distances)
    tests = np.array([[10., 10.], [24., 30.], [46., 18.]])
    rotation = np.array([[0., -1.], [1., 0.]])
    assert np.allclose(rigid_mls(tests, controls, controls), tests, atol=1e-9)
    assert np.allclose(rigid_mls(tests, controls, controls+[3, -4]), tests+[3, -4], atol=1e-9)
    assert np.allclose(rigid_mls(tests, controls, controls@rotation.T+[3, -4]), tests@rotation.T+[3, -4], atol=1e-9)
    assert np.all(corners(grid) == 1)
    reflected = grid.copy(); reflected[..., 0] *= -1
    assert np.all(corners(reflected) == -1)
    mapping = grid+(rigid_mls(grid, controls, targets)-grid)*mask[..., None]
    warped = cv2.remap(raw[299], mapping[..., 0].astype(np.float32), mapping[..., 1].astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
    determinants = corners(mapping)
    active = (mask[:-1, :-1] > .05) | (mask[:-1, 1:] > .05) | (mask[1:, :-1] > .05) | (mask[1:, 1:] > .05)
    region = np.clip((yy-232)/15, 0, 1)*np.clip((358-yy)/16, 0, 1)*np.clip((118-xx)/28, 0, 1)
    roi = (region > .5) & (xx < 100)
    def mae(a, b): return float(np.abs(a[roi, :3].astype(float)-b[roi, :3]).mean())
    def iou(a, b):
        x, y = (a[..., 3] > 100) & roi, (b[..., 3] > 100) & roi
        return float((x & y).sum()/max(1, (x | y).sum()))
    gx = np.gradient(mapping, axis=1); gy = np.gradient(mapping, axis=0)
    jacobian = np.stack((gx, gy), axis=-1)
    stretches = np.linalg.svd(jacobian[target_component > 0], compute_uv=False)
    stats = {'sourceMAE': mae(raw[299], raw[0]), 'candidateMAE': mae(warped, raw[0]), 'sourceIoU': iou(raw[299], raw[0]), 'candidateIoU': iou(warped, raw[0]), 'foldedActiveCells': int(np.any(determinants[:, active] <= 0, axis=0).sum()), 'minimumCorner': float(determinants[:, active].min()), 'maximumDisplacement': float(np.linalg.norm(mapping-grid, axis=-1).max()), 'zeroMaskPixelsChanged': int(np.any(warped[mask == 0] != raw[299][mask == 0], axis=-1).sum()), 'tailMinimumStretch': float(stretches[:, 1].min()), 'tailStretchP01': float(np.percentile(stretches[:, 1], 1)), 'tailMaximumStretch': float(stretches[:, 0].max())}
    report.update({'method': 'Rigid MLS inverse map on seven tip-based absolute arclength controls 0..90px; excludes occluded root; unchanged protection mask. One endpoint only.', 'controls': controls.tolist(), 'targets': targets.tolist(), 'metrics': stats, 'numericPass': stats['candidateMAE'] < 14.3279247284 and stats['candidateIoU'] > .8804168952 and stats['foldedActiveCells'] == 0 and stats['maximumDisplacement'] < 40 and stats['zeroMaskPixelsChanged'] == 0, 'strainAcceptance': 'Separate visual/strain review; no threshold relaxation.'})
    np.save(OUT/'mapping.npy', mapping)
    (OUT/'endpoint.rgba').write_bytes(warped.tobytes())
(OUT/'report.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps(report))
