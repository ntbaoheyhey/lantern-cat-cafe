#!/usr/bin/env python3
"""Track inspected seeds to loop endpoints and audit old maps; no runtime edits."""
from pathlib import Path
from datetime import datetime, timezone
import ast
import hashlib
import json
import cv2
import numpy as np

cv2.setNumThreads(1)
ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / 'work/v5/CXI/batch-m'
OUT = BASE / 'clover-endpoint-labels-r1'
OUT.mkdir(exist_ok=False)
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
study_path = BASE / 'clover-seeded-boundary-r1/report.json'
study = json.loads(study_path.read_text())
source = Path(study['source']['path'])
assert sha(source) == study['source']['sha256']
raw = np.memmap(source, np.uint8, 'r', shape=(300, 390, 318, 4))
gray = {}


def frame_gray(frame):
    if frame not in gray:
        gray[frame] = cv2.cvtColor(raw[frame, :, :, :3].copy(), cv2.COLOR_RGB2GRAY)
    return gray[frame]


def track(start, end, points):
    positions = np.asarray(points, np.float32).reshape(-1, 1, 2)
    valid = np.ones(len(positions), bool)
    max_fb = np.zeros(len(positions))
    direction = 1 if end > start else -1
    for a in range(start, end, direction):
        b = a + direction
        options = dict(winSize=(15, 15), maxLevel=2,
                       criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 30, .01), minEigThreshold=1e-4)
        forward, fs, _ = cv2.calcOpticalFlowPyrLK(frame_gray(a), frame_gray(b), positions, None, **options)
        backward, bs, _ = cv2.calcOpticalFlowPyrLK(frame_gray(b), frame_gray(a), forward, None, **options)
        error = np.linalg.norm(backward[:, 0] - positions[:, 0], axis=1)
        max_fb = np.maximum(max_fb, error)
        valid &= fs[:, 0].astype(bool) & bs[:, 0].astype(bool) & np.isfinite(forward[:, 0]).all(axis=1) & (error <= .75)
        positions = forward
    return positions[:, 0], valid, max_fb


rows, endpoint_masks = [], {}
sheet = np.full((570, 860, 3), 245, np.uint8)
cv2.putText(sheet, 'Endpoint diagnostic: cyan=selected; yellow=seed-sensitive; green/red=tracked labels',
            (10, 18), cv2.FONT_HERSHEY_SIMPLEX, .42, (30, 30, 30), 1, cv2.LINE_AA)
for column, (prior, endpoint) in enumerate(zip(study['rows'], [0, 299])):
    definition, start = prior['definition'], prior['frame']
    seeds = np.array(definition['tail'] + definition['nonTail'], np.float32)
    positions, valid, step_fb = track(start, endpoint, seeds)
    back, back_valid, reverse_fb = track(endpoint, start, positions)
    roundtrip = np.linalg.norm(back - seeds, axis=1)
    valid &= back_valid & (roundtrip <= 1)
    records = [dict(kind='tail' if i < 5 else 'nonTail', start=seeds[i].tolist(), endpoint=positions[i].tolist(),
                    maxStepFB=float(step_fb[i]), maxReverseStepFB=float(reverse_fb[i]),
                    roundtrip=float(roundtrip[i]), valid=bool(valid[i])) for i in range(len(seeds))]
    assert sum(valid[:5]) >= 3 and sum(valid[5:]) >= 3, records
    rgba = raw[endpoint].astype(np.float32)
    alpha = rgba[:, :, 3]
    rgb = np.clip(rgba[:, :, :3]*255/np.maximum(alpha[:, :, None], 1), 0, 255).astype(np.uint8)
    bgr = rgb[:, :, ::-1].copy()
    masks, trials = [], []
    for offset, radius in [(-1, 2), (0, 3), (1, 4)]:
        labels = np.full(alpha.shape, cv2.GC_BGD, np.uint8)
        labels[225:370, 8:128] = cv2.GC_PR_BGD
        warm = (rgb[:, :, 0] > rgb[:, :, 1].astype(float)*1.035) & (rgb[:, :, 0] > rgb[:, :, 2].astype(float)*1.15)
        labels[(labels == cv2.GC_PR_BGD) & warm] = cv2.GC_PR_FGD
        for i, point in enumerate(positions):
            if not valid[i]:
                continue
            xx, yy = np.rint(point).astype(int)
            cv2.circle(labels, (xx + (offset if i < 5 else 0), yy), radius if i < 5 else 3,
                       cv2.GC_FGD if i < 5 else cv2.GC_BGD, -1)
        labels[alpha <= 4] = cv2.GC_BGD
        hard_fg, hard_bg = labels == cv2.GC_FGD, labels == cv2.GC_BGD
        cv2.setRNGSeed(42)
        cv2.grabCut(bgr, labels, None, np.zeros((1, 65)), np.zeros((1, 65)), 5, cv2.GC_INIT_WITH_MASK)
        selected = (labels == cv2.GC_FGD) | (labels == cv2.GC_PR_FGD)
        assert np.all(selected[hard_fg]) and not np.any(selected[hard_bg])
        count, _, stats, _ = cv2.connectedComponentsWithStats(selected.astype(np.uint8), 8)
        masks.append(selected)
        trials.append(dict(offsetX=offset, radius=radius, pixels=int(selected.sum()), components=count-1,
                           componentAreas=sorted(stats[1:, cv2.CC_STAT_AREA].tolist(), reverse=True)))
    intersection, union = np.logical_and.reduce(masks), np.logical_or.reduce(masks)
    uncertain = union & ~intersection
    endpoint_masks[endpoint] = masks[1]
    archive = OUT / f'frame-{endpoint}-labels.npz'
    np.savez_compressed(archive, trials=np.stack(masks), consensus=intersection, uncertain=uncertain)
    rows.append(dict(fromFrame=start, endpointFrame=endpoint, trackedSeeds=records, trials=trials,
                     uncertainPixels=int(uncertain.sum()), output=dict(path=str(archive), sha256=sha(archive))))
    display = np.clip(rgba[:, :, :3]+230*(1-alpha[:, :, None]/255), 0, 255).astype(np.uint8)[:, :, ::-1].copy()
    display[masks[1]] = (display[masks[1]].astype(float)*.6 + np.array([255, 180, 0])*.4).astype(np.uint8)
    display[uncertain] = (0, 230, 255)
    for i, point in enumerate(positions):
        if valid[i]:
            cv2.circle(display, tuple(np.rint(point).astype(int)), 2, (0, 210, 0) if i < 5 else (0, 0, 240), -1)
    left = 15 + column*430
    cv2.putText(sheet, f'F{endpoint}: {trials[1]["pixels"]} selected / {int(uncertain.sum())} uncertain',
                (left, 45), cv2.FONT_HERSHEY_SIMPLEX, .48, (30, 30, 30), 1, cv2.LINE_AA)
    sheet[55:565, left:left+405] = cv2.resize(display[200:370, :135], (405, 510), interpolation=cv2.INTER_NEAREST)

old_path = BASE / 'clover-rigid-endpoint-r1/report.json'
old = json.loads(old_path.read_text())
tool = ROOT / 'tools/v5int/study-clover-rigid-endpoint.py'
namespace = dict(np=np)
module = ast.parse(tool.read_text())
node = next(n for n in module.body if isinstance(n, ast.FunctionDef) and n.name == 'rigid_mls')
exec(compile(ast.Module(body=[node], type_ignores=[]), str(tool), 'exec'), namespace)
yy, xx = np.mgrid[:390, :318].astype(float)
grid = np.stack((xx, yy), axis=-1)
unmasked = namespace['rigid_mls'](grid, np.array(old['controls']), np.array(old['targets']))
protected_path = BASE / 'clover-rigid-endpoint-r1/mapping.npy'
protected = np.load(protected_path)


def support(mapping):
    q = mapping[endpoint_masks[0]]
    floor = np.floor(q).astype(int)
    fraction = q - floor
    totals = np.zeros(4)
    for dx, dy in [(0, 0), (1, 0), (0, 1), (1, 1)]:
        x, y = floor[:, 0] + dx, floor[:, 1] + dy
        weight = (fraction[:, 0] if dx else 1-fraction[:, 0]) * (fraction[:, 1] if dy else 1-fraction[:, 1])
        inside = (x >= 0) & (x < 318) & (y >= 0) & (y < 390)
        label = np.full(len(q), 3)
        xi, yi = x[inside], y[inside]
        label[inside] = np.where(raw[299, yi, xi, 3] <= 4, 0, np.where(endpoint_masks[299][yi, xi], 1, 2))
        for category in range(4):
            totals[category] += weight[label == category].sum()
    assert abs(totals.sum() - len(q)) < 1e-8
    return dict(zip(['emptyAlpha', 'segmentedTail', 'otherVisible', 'outside'], (totals/len(q)).tolist()))

view = OUT / 'endpoint-labels.png'
assert cv2.imwrite(str(view), sheet)
result = dict(utc=datetime.now(timezone.utc).isoformat(), source=study['source'],
              seedStudy=dict(path=str(study_path), sha256=sha(study_path)), toolSha256=sha(__file__), rows=rows,
              oldMapInputs=[dict(path=str(p), sha256=sha(p)) for p in [old_path, tool, protected_path]],
              oldMapSupport=dict(unmasked=support(unmasked), protected=support(protected)),
              image=dict(path=str(view), sha256=sha(view), dimensions=[860, 570], views=0),
              limits=['Tracked labels remain hypotheses, not Cubism ground truth or alpha mattes.',
                      'Zero seed perturbation sensitivity does not prove correctness.',
                      'Old map folding and strain rejects remain; no endpoint raster or sequence generated.'])
(OUT / 'report.json').write_text(json.dumps(result, indent=2)+'\n')
print(json.dumps(dict(rows=rows, oldMapSupport=result['oldMapSupport'], image=result['image']), separators=(',', ':')))
