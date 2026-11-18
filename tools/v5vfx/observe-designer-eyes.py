"""Render frozen source-eye observations without changing old evidence."""
from pathlib import Path
import datetime
import hashlib
import json
import math
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'work/v5/CXV/python'))
import cv2
import numpy as np

REPORTS = ROOT / 'reports/v5/CXV'
REF = ROOT / 'work/v5/CXV/ref/batch-m'
PRE = REPORTS / 'M-L1-eye-observation-R1-preregistration.json'
OUT = ROOT / 'work/v5/CXV/batch-m/l1-eye-observation-r1'


def sha_file(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def main():
    prereg = json.loads(PRE.read_text())
    assert not OUT.exists(), 'Preserve previous evidence; never overwrite a run.'
    OUT.mkdir(parents=True)
    prior = json.loads((REF / 'blink-measurements-r3.json').read_text())
    old_hashes = {sha_file(p) for p in REF.glob('*.jpg')}
    report = {
        'utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'preregistration': {'path': str(PRE), 'sha256': sha_file(PRE)},
        'tool': {'path': str(Path(__file__).resolve()), 'sha256': sha_file(Path(__file__))},
        'existingIrisMetrics': {'path': str(REF / 'blink-measurements-r3.json'),
                               'sha256': sha_file(REF / 'blink-measurements-r3.json')},
        'clips': {}, 'imagesReviewed': [],
        'limit': 'First-event development observation. No parameter recovery or native acceptance.'
    }
    for cat, indices in prereg['frames'].items():
        source = Path('/Users/bao/Downloads') / ('Scene1.mp4' if cat == 'mochi' else 'clover.mp4')
        source_hash = sha_file(source)
        assert source_hash == prereg['sourceHashes'][cat]
        assert not set(indices).intersection(prereg['excludedPreviouslySampledFrames'][cat])
        cap = cv2.VideoCapture(str(source))
        assert cap.isOpened()
        width, height = (int(cap.get(p)) for p in (cv2.CAP_PROP_FRAME_WIDTH, cv2.CAP_PROP_FRAME_HEIGHT))
        assert cap.get(cv2.CAP_PROP_FRAME_COUNT) == 300
        assert abs(cap.get(cv2.CAP_PROP_FPS) - 30) < 1e-9
        reference = np.load(REF / (cat + '-frames.npy'), mmap_mode='r')
        ref_h, ref_w = reference.shape[1:3]
        x0, y0, x1, y1 = prereg['cropAt640Reference'][cat]
        crop_box = [round(x0 * width / ref_w), round(y0 * height / ref_h),
                    round(x1 * width / ref_w), round(y1 * height / ref_h)]
        tiles, frames = [], []
        selected = set(indices)
        for index in range(max(indices) + 1):
            valid, frame = cap.read()
            assert valid, (cat, index)
            if index not in selected:
                continue
            left, top, right, bottom = crop_box
            crop = frame[top:bottom, left:right]
            crop_path = OUT / f'{cat}-f{index:03d}-crop.png'
            assert cv2.imwrite(str(crop_path), crop)
            small = cv2.resize(crop, (240, 120), interpolation=cv2.INTER_AREA)
            tile = np.full((144, 256, 3), 24, np.uint8)
            tile[22:142, 8:248] = small
            cv2.putText(tile, f'{cat} F{index} {index / 30:.3f}s', (6, 15),
                        cv2.FONT_HERSHEY_SIMPLEX, .42, (230, 230, 230), 1, cv2.LINE_AA)
            tiles.append(tile)
            frames.append({'frame': index, 'ptsSeconds': index / 30,
                           'rawBgrFrameSha256': hashlib.sha256(frame.tobytes()).hexdigest(),
                           'cropPath': str(crop_path), 'cropSha256': sha_file(crop_path),
                           'cropDimensions': [crop.shape[1], crop.shape[0]],
                           'priorIrisMeasurement': prior['clips'][cat]['rows'][index]})
        cap.release()
        assert [f['frame'] for f in frames] == indices
        while len(tiles) % 4:
            tiles.append(np.full((144, 256, 3), 24, np.uint8))
        sheet = np.concatenate([np.concatenate(tiles[n:n + 4], axis=1)
                                for n in range(0, len(tiles), 4)], axis=0)
        assert max(sheet.shape[:2]) <= 1024
        sheet_path = OUT / (cat + '-eye-event1.png')
        assert cv2.imwrite(str(sheet_path), sheet)
        sheet_hash = sha_file(sheet_path)
        assert sheet_hash not in old_hashes
        report['clips'][cat] = {
            'source': str(source), 'sourceSha256': source_hash,
            'originalDimensions': [width, height], 'referenceDimensions': [ref_w, ref_h],
            'originalCropLTRB': crop_box, 'frames': frames,
            'sheet': {'path': str(sheet_path), 'sha256': sheet_hash,
                      'dimensions': [sheet.shape[1], sheet.shape[0]], 'reviewedOnce': False}
        }
        print(cat, len(frames), 'frames;', sheet.shape[1], sheet.shape[0], 'sheet;', sheet_hash, flush=True)
    (OUT / 'measurement.json').write_text(json.dumps(report, indent=2) + '\n')
    print('Recorded source/crop/frame hashes before any visual review.', flush=True)


if __name__ == '__main__':
    main()
