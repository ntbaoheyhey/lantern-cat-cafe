#!/usr/bin/env python3
"""Diagnose visible tail segmentation uncertainty; never creates a runtime asset."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import cv2
import numpy as np

cv2.setNumThreads(1)
ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / 'work/v5/CXI/batch-m'
OUT = BASE / 'clover-seeded-boundary-r1'
OUT.mkdir(exist_ok=False)
SOURCE = BASE / 'matte-r2/clover-premul.rgba'
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
assert sha(SOURCE) == 'c7741308c934b742022fe293dc3419c2d28cb72c3c3d7bc960bb56117e86574f'
raw = np.memmap(SOURCE, np.uint8, 'r', shape=(300, 390, 318, 4))
definitions = {
    15: dict(rect=[10, 225, 108, 115],
             tail=[[31, 260], [29, 281], [48, 298], [68, 298], [62, 248]],
             nonTail=[[95, 283], [104, 310], [105, 325], [115, 350], [58, 226]]),
    285: dict(rect=[15, 268, 107, 97],
              tail=[[43, 301], [42, 321], [61, 340], [83, 343], [64, 287]],
              nonTail=[[96, 294], [85, 315], [105, 328], [113, 355], [55, 235]]),
}
rows = []
sheet = np.full((570, 860, 3), 245, np.uint8)
cv2.putText(sheet, 'Diagnostic only: cyan=selected; yellow=seed-sensitive; green/red=hard tail/non-tail seeds',
            (10, 18), cv2.FONT_HERSHEY_SIMPLEX, .41, (30, 30, 30), 1, cv2.LINE_AA)
for column, (frame, definition) in enumerate(definitions.items()):
    rgba = raw[frame].astype(np.float32)
    alpha = rgba[:, :, 3]
    rgb = np.clip(rgba[:, :, :3] * 255 / np.maximum(alpha[:, :, None], 1), 0, 255).astype(np.uint8)
    bgr = rgb[:, :, ::-1].copy()
    x, y, width, height = definition['rect']
    masks, trials = [], []
    for variant, (offset, radius) in enumerate([(-1, 2), (0, 3), (1, 4)]):
        labels = np.full(alpha.shape, cv2.GC_BGD, np.uint8)
        labels[y:y+height, x:x+width] = cv2.GC_PR_BGD
        warm = (rgb[:, :, 0] > rgb[:, :, 1].astype(float) * 1.035) & (rgb[:, :, 0] > rgb[:, :, 2].astype(float) * 1.15)
        labels[(labels == cv2.GC_PR_BGD) & warm] = cv2.GC_PR_FGD
        for xx, yy in definition['nonTail']:
            cv2.circle(labels, (xx, yy), 3, cv2.GC_BGD, -1)
        for xx, yy in definition['tail']:
            cv2.circle(labels, (xx + offset, yy), radius, cv2.GC_FGD, -1)
        labels[alpha <= 4] = cv2.GC_BGD
        hard_tail = labels == cv2.GC_FGD
        hard_other = labels == cv2.GC_BGD
        assert hard_tail.sum() >= 40
        cv2.setRNGSeed(42)
        cv2.grabCut(bgr, labels, None, np.zeros((1, 65)), np.zeros((1, 65)), 5, cv2.GC_INIT_WITH_MASK)
        selected = (labels == cv2.GC_FGD) | (labels == cv2.GC_PR_FGD)
        assert np.all(selected[hard_tail]) and not np.any(selected[hard_other])
        assert not np.any(selected[alpha <= 4])
        count, components, stats, _ = cv2.connectedComponentsWithStats(selected.astype(np.uint8), 8)
        masks.append(selected)
        trials.append(dict(offsetX=offset, seedRadius=radius, iterations=5,
                           selectedPixels=int(selected.sum()), hardTailPixels=int(hard_tail.sum()),
                           components=count-1, componentAreas=sorted(stats[1:, cv2.CC_STAT_AREA].tolist(), reverse=True),
                           hardLabelViolations=0))
    consensus = np.logical_and.reduce(masks)
    union = np.logical_or.reduce(masks)
    uncertain = union & ~consensus
    archive = OUT / f'frame-{frame}-labels.npz'
    np.savez_compressed(archive, trials=np.stack(masks), consensus=consensus, uncertain=uncertain)
    row = dict(frame=frame, definition=definition, trials=trials,
               consensusPixels=int(consensus.sum()), unionPixels=int(union.sum()),
               uncertainPixels=int(uncertain.sum()), uncertaintyFraction=float(uncertain.sum()/max(union.sum(), 1)),
               output=dict(path=str(archive), sha256=sha(archive)))
    rows.append(row)
    # New diagnostic overlay only; no existing review image is opened or rewritten.
    display = np.clip(rgba[:, :, :3] + 230 * (1 - alpha[:, :, None]/255), 0, 255).astype(np.uint8)[:, :, ::-1].copy()
    display[masks[1]] = (display[masks[1]].astype(float) * .6 + np.array([255, 180, 0]) * .4).astype(np.uint8)
    display[uncertain] = (0, 230, 255)
    for xx, yy in definition['tail']:
        cv2.circle(display, (xx, yy), 2, (0, 210, 0), -1)
    for xx, yy in definition['nonTail']:
        cv2.circle(display, (xx, yy), 2, (0, 0, 240), -1)
    crop = cv2.resize(display[200:370, :135], (405, 510), interpolation=cv2.INTER_NEAREST)
    left = 15 + column * 430
    cv2.putText(sheet, f'F{frame}: {trials[1]["selectedPixels"]} selected / {int(uncertain.sum())} uncertain',
                (left, 45), cv2.FONT_HERSHEY_SIMPLEX, .48, (30, 30, 30), 1, cv2.LINE_AA)
    sheet[55:565, left:left+405] = crop

view = OUT / 'segmentation-sensitivity.png'
assert cv2.imwrite(str(view), sheet)
result = dict(utc=datetime.now(timezone.utc).isoformat(), source=dict(path=str(SOURCE), sha256=sha(SOURCE)),
              toolSha256=sha(__file__), opencvVersion=cv2.__version__, rows=rows,
              image=dict(path=str(view), sha256=sha(view), dimensions=[860, 570], views=0),
              limits=['Manual seeds are hypotheses based on inspected F15/285, not recovered Cubism part masks.',
                      'Agreement under these three perturbations does not prove anatomical correctness.',
                      'No alpha matte, endpoint, full sequence, hidden-texture reconstruction or runtime change.'])
(OUT / 'report.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result, separators=(',', ':')))
