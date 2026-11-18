"""Compare frozen CXI endpoint masks with independently reviewed sparse CXV labels.

This is a diagnostic control check, never full-mask ground truth or alpha acceptance.
No images or replacement media are generated.
"""
from pathlib import Path
import datetime
import hashlib
import json
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'work/v5/CXV/python'))
import cv2
import numpy as np

cv2.setNumThreads(1)
LOCAL = ROOT / 'work/v5/CXV/batch-m/clover-boundary-study-R1'
CXI = Path('/Users/bao/taskbar-hero-chain')
OUT = ROOT / 'work/v5/CXV/batch-m/clover-endpoint-controls-R1'
RECEIPT = ROOT / 'reports/v5/CXV/M-clover-endpoint-controls-R1.json'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def ref(path):
    return dict(path=str(path), sha256=sha(path))


def verify(item):
    assert sha(item['path']) == item['sha256'], item['path']
    return item


def counts(mask, labels, rgba):
    selected = int(mask.sum())
    result = dict(selectedPixels=selected, byClass={})
    for value, name in enumerate(['unknownVisible', 'annotatedTail', 'annotatedCloth', 'alphaAtMost4']):
        total = int((labels == value).sum())
        included = int((mask & (labels == value)).sum())
        result['byClass'][name] = dict(availablePixels=total, selectedPixels=included,
            excludedPixels=total-included, includedFraction=included/total if total else None,
            fractionOfSelection=included/selected if selected else None)
    assert sum(v['selectedPixels'] for v in result['byClass'].values()) == selected
    alpha = rgba[:, :, 3]
    result['alpha'] = dict(zero=int((mask & (alpha == 0)).sum()),
        oneToFour=int((mask & (alpha > 0) & (alpha <= 4)).sum()),
        fiveTo249=int((mask & (alpha >= 5) & (alpha < 250)).sum()),
        atLeast250=int((mask & (alpha >= 250)).sum()))
    assert sum(result['alpha'].values()) == selected
    return result


def main():
    assert not OUT.exists() and not RECEIPT.exists(), 'Preserve the frozen R1 outputs'
    independent_path = ROOT / 'reports/v5/CXV/M-clover-boundary-observations-R1.json'
    independent = json.loads(independent_path.read_text())
    annotation = json.loads(Path(verify(independent['annotations'])['path']).read_text())
    assert annotation == independent['annotationPayload']
    verify(annotation['source'])
    source = np.memmap(annotation['source']['path'], np.uint8, 'r', shape=tuple(annotation['source']['shape']))
    review_path = CXI / 'reports/v5/CXI/evidence/v8-clover-endpoint-label-review.json'
    review = json.loads(review_path.read_text())
    raw = json.loads(Path(verify(review['raw'])['path']).read_text())
    verify(raw['source'])
    assert raw['source']['sha256'] == annotation['source']['sha256']
    rows = []
    masks = []
    for entry in annotation['frames']:
        frame = entry['frame']
        rgba = source[frame]
        labels_path = LOCAL / f'sparse-labels-F{frame}.npy'
        labels = np.load(labels_path, allow_pickle=False)
        assert labels.dtype == np.uint8 and labels.shape == rgba.shape[:2]
        regenerated = np.zeros(labels.shape, np.uint8)
        regions = []
        for group, value in [('certainTail', 1), ('certainCloth', 2)]:
            for region in entry[group]:
                region_mask = np.zeros(labels.shape, np.uint8)
                cv2.fillPoly(region_mask, [np.array(region['polygon'], np.int32)], 1)
                region_mask = region_mask.astype(bool)
                assert not regenerated[region_mask].any()
                assert np.all(rgba[:, :, 3][region_mask] == 255)
                regenerated[region_mask] = value
                regions.append((region['name'], region_mask))
        regenerated[(regenerated == 0) & (rgba[:, :, 3] <= 4)] = 3
        assert np.array_equal(labels, regenerated), 'Independent label reproduction failed'
        frozen = next(r for r in raw['rows'] if r['endpointFrame'] == frame)
        verify(frozen['output'])
        data = np.load(frozen['output']['path'], allow_pickle=False)
        trials, consensus, uncertain = (data[k] for k in ['trials', 'consensus', 'uncertain'])
        assert trials.dtype == consensus.dtype == uncertain.dtype == bool
        assert trials.shape == (3, *labels.shape)
        assert consensus.shape == uncertain.shape == labels.shape
        assert np.array_equal(consensus, trials.all(axis=0))
        assert np.array_equal(uncertain, trials.any(axis=0) & ~trials.all(axis=0))
        controls = {}
        for name, mask in [('selectNothing', np.zeros_like(consensus)),
                           ('selectEverything', np.ones_like(consensus)),
                           ('selectOnlyKnownTail', labels == 1),
                           ('selectOnlyKnownCloth', labels == 2)]:
            controls[name] = counts(mask, labels, rgba)
        assert controls['selectNothing']['selectedPixels'] == 0
        assert controls['selectEverything']['selectedPixels'] == labels.size
        assert controls['selectOnlyKnownTail']['byClass']['annotatedCloth']['selectedPixels'] == 0
        assert controls['selectOnlyKnownCloth']['byClass']['annotatedCloth']['includedFraction'] == 1
        frame_rows = []
        for name, mask in [(f'trial{i}', m) for i, m in enumerate(trials)] + [('consensus', consensus)]:
            row = dict(frame=frame, mask=name, **counts(mask, labels, rgba))
            row['regions'] = [dict(name=n, totalPixels=int(m.sum()), selectedPixels=int((m & mask).sum())) for n, m in regions]
            frame_rows.append(row)
        rows.extend(frame_rows)
        masks.append(dict(frame=frame, masks=frozen['output'], independentLabels=ref(labels_path),
                          uncertainPixels=int(uncertain.sum()), exactRegeneration=True,
                          allTrialsIdentical=bool(np.all(trials == trials[0])), diagnosticControls=controls))
    result = dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        source=annotation['source'], independentReceipt=ref(independent_path),
        annotation=ref(LOCAL / 'annotations.json'), cxiReview=ref(review_path),
        cxiRaw=review['raw'], harness=ref(__file__), rows=rows, inputs=masks,
        diagnosticControlsPassed=True, imagesCreated=0, imagesViewed=0,
        runtimeChanged=False, sequenceChanged=False, fullMaskAccepted=False,
        limits=[
            'Annotations were authored before CXV read CXI seeded trials; only sparse visible interiors were reviewed.',
            'Unknown selected pixels are unassessed, not positive or negative ground truth.',
            'alphaAtMost4 preserves the prior label convention; exact zero is reported separately.',
            'Narrow seed invariance does not establish semantic correctness or boundary certainty.',
            'No full-mask precision, IoU, recovered matte, hidden layer, correspondence or seam acceptance follows.'
        ])
    result['sparseControlsPass'] = all(r['byClass']['annotatedTail']['excludedPixels'] == 0
        and r['byClass']['annotatedCloth']['selectedPixels'] == 0
        and r['byClass']['alphaAtMost4']['selectedPixels'] == 0 for r in rows)
    OUT.mkdir(parents=True)
    raw_output = OUT / 'comparison.json'
    raw_output.write_text(json.dumps(result, indent=2) + '\n')
    receipt = {k: v for k, v in result.items() if k != 'inputs'}
    receipt['inputs'] = [{k: v for k, v in m.items() if k != 'diagnosticControls'} for m in masks]
    receipt['raw'] = ref(raw_output)
    RECEIPT.write_text(json.dumps(receipt, indent=2) + '\n')
    for r in rows:
        if r['mask'] == 'consensus':
            print(json.dumps(r))
    print(json.dumps(dict(receipt=ref(RECEIPT), sparseControlsPass=result['sparseControlsPass'], diagnosticControlsPassed=True)))


if __name__ == '__main__':
    main()
