"""Verify completed supporting evidence without rerunning any browser work.

The final matrix is audited separately by the frozen l7-audit.mjs. This check
binds the original review receipts to their files and examines every retained
lifecycle snapshot, including intermediate GPU counts and battle boundaries.
"""
import hashlib
import json
import math
from datetime import datetime, timezone
from pathlib import Path

root = Path(__file__).resolve().parents[3]
out = root / 'reports/cardrpg-look/validation/l7'
read = lambda path: json.loads(path.read_text())
digest = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
freeze = read(out / 'freeze.json')
verified = {}


def check_file(relative, expected):
    path = Path(relative)
    if not path.is_absolute():
        path = root / path
    assert path.is_file(), str(path)
    actual = digest(path)
    assert actual == expected, str(path)
    verified[str(path.relative_to(root))] = actual


check_file(freeze['artifact'], freeze['sha256'])
for relative, expected in freeze['evidenceHashes'].items():
    check_file(relative, expected)

review = read(out / 'review-acceptance.json')
assert review['artifact'] == freeze['sha256'] and review['personallyViewed']
for row in review['reviewSheets']:
    check_file(row['path'], row['sha256'])
for relative, expected in review['supplementalEvidence'].items():
    check_file(relative, expected)

video = read(out / 'video-review.json')
assert video['artifact'] == freeze['sha256'] and video['personallyViewed']
assert video['samples'] == 30 and not video['continuousViewing'] and not video['audioReview']
assert {row['target'] for row in video['rows']} == {'mochi', 'soot', 'clover', 'yarn-giant', 'ultimate'}
check_file(video['notes'], video['notesSha256'])
for row in video['rows']:
    for field in ['sampleSheet', 'receipt', 'video']:
        check_file(row[field], row[field + 'Sha256'])
    assert row['samplesPersonallyViewed'] == 6 and row['decodedFrames'] == 750
    capture = read(root / row['receipt'])
    assert capture['sha256'] == freeze['sha256'] and capture['errors'] == []
    assert len(capture['rows']) == 1
    captured = capture['rows'][0]
    assert captured['owner'] == row['target']
    assert captured['sha256'] == row['videoSha256']
    assert captured['sampleSheet']['sha256'] == row['sampleSheetSha256']
    assert captured['elapsed'] == row['elapsedMs']
    assert int(captured['probe']['streams'][0]['nb_read_frames']) == row['decodedFrames']

lifecycle = read(out / 'lifecycle20/summary.json')
check_file(out / 'lifecycle20/summary.json', digest(out / 'lifecycle20/summary.json'))
assert lifecycle['sha256'] == freeze['sha256'] and lifecycle['completed']
assert lifecycle['errors'] == []
assert len(lifecycle['rows']) == len(lifecycle['rawWindows']) == 21
baseline = lifecycle['rows'][0]
durations, frame_counts, heap_values, leading_offsets = [], [], [], []
for index, (row, raw) in enumerate(zip(lifecycle['rows'], lifecycle['rawWindows'])):
    assert row['index'] == raw['index'] == index and row['retained']
    assert row['gpu'] == baseline['gpu'] and row['programs'] == baseline['programs']
    assert row['result'] == baseline['result'] and row['choices'] == baseline['choices']
    assert row['heap']['usedSize'] > 0
    heap_values.append(row['heap']['usedSize'])
    frames = raw['frames']
    assert frames and all(math.isfinite(f['ms']) and f['ms'] > 0 for f in frames)
    assert all(a['at'] < b['at'] for a, b in zip(frames, frames[1:]))
    frame_counts.append(len(frames))
    if index:
        marks = {mark['label']: mark['at'] for mark in raw['marks']}
        start, end = marks[f'battle-{index}-start'], marks[f'battle-{index}-end']
        # RAF timestamps identify the frame start, not callback execution.
        # The first recorded frame may start just before performance.now().
        assert end > start and all(start <= f['at'] <= end for f in frames[1:])
        assert start - frames[0]['ms'] <= frames[0]['at'] <= end
        leading_offsets.append(frames[0]['at'] - start)
        assert marks[f'gc-{index-1}-end'] < start
        durations.append(end - start)
        assert row['at'] > end

growth = heap_values[-1] - heap_values[0]
assert growth == lifecycle['growth']['heap']
assert lifecycle['growth'] == {'heap': growth, 'geometries': 0, 'textures': 0, 'programs': 0}
within_tolerance = growth <= lifecycle['tolerance']['retainedHeapGrowthBytes']
assert lifecycle['passed'] == within_tolerance
result = {
    'at': datetime.now(timezone.utc).isoformat(),
    'artifact': freeze['sha256'],
    'method': 'Read existing evidence only; no browser, video decode, resampling or model call.',
    'verifiedHashes': verified,
    'visualReview': {'recordedUnitAngles': review['unitAngles'], 'recordedStageViews': review['stages'],
                     'recordedDesktopConfigurations': review['desktopConfigurations'],
                     'recordedVideoSamples': 30, 'newPersonalReview': False},
    'lifecycle': {'baselineAndReplaySnapshots': 21, 'replays': 20,
                  'gpuCountsConstantAtEverySnapshot': baseline['gpu'],
                  'programCountConstantAtEverySnapshot': baseline['programs'],
                  'heapFirstBytes': heap_values[0], 'heapLastBytes': heap_values[-1],
                  'heapGrowthBytes': growth, 'peakHeapGrowthBytes': max(heap_values) - heap_values[0],
                  'lastTenHeapRangeBytes': [min(heap_values[-10:]), max(heap_values[-10:])],
                  'replayDurationRangeMs': [min(durations), max(durations)],
                  'rawFrameCounts': frame_counts, 'firstRafOffsetFromStartMs': leading_offsets,
                  'withinRecorded2MiBTolerance': within_tolerance,
                  'exactlyFlatHeap': growth == 0,
                  'scope': 'One retained encounter, real clicks, natural animation at4x. Not20different encounters; finite samples cannot prove absence of leaks.'},
}
(out / 'support-audit.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({key: value for key, value in result.items() if key != 'verifiedHashes'}))
