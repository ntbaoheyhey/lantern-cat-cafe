"""Recompute existing natural-play counters; never launch a browser or alter media."""
import bisect
import hashlib
import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BASE = Path('/Users/bao/taskbar-hero-cardrpg-a6/work/v5/CXV/batch-m/dual-media-natural-r1-125906')
PRIOR = ROOT / 'reports/v5/CXI/evidence/v8-cxv-dual-r5-natural-review.json'
OUTPUT = ROOT / 'reports/v5/CXI/evidence/v8-dual-r5-playback-review.json'
assert not OUTPUT.exists(), 'Evidence is immutable; choose a new output for a new study.'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
prior = json.loads(PRIOR.read_text())


def verified(path):
    digest = sha(path)
    assert prior['artifactHashes'][str(path)] == digest, str(path)
    return {'path': str(path), 'sha256': digest, 'bytes': path.stat().st_size}


def stats(values):
    values = sorted(x for x in values if math.isfinite(x))
    if not values:
        return {'count': 0}
    return {'count': len(values), 'min': values[0], 'median': values[len(values) // 2],
            'p95': values[min(len(values)-1, math.floor(len(values)*.95))],
            'p99': values[min(len(values)-1, math.floor(len(values)*.99))],
            'max': values[-1]}


def delta(a, b):
    return ((a-b+5) % 10)-5


def point(track, seconds):
    frame = (seconds % 10)*30
    i = math.floor(frame)
    t = frame-i
    return [track[i][j] + (track[(i+1) % 300][j]-track[i][j])*t for j in (0, 1)]


assert abs(delta(.01, 9.99)-.02) < 1e-9
assert abs(delta(9.99, .01)+.02) < 1e-9
assert point([[2, 3]]*300, 9.999) == [2, 3]
raw = json.loads((BASE/'report.json').read_text())
receipt = {'utc': datetime.now(timezone.utc).isoformat(), 'sourceCommit': raw['servedSource'],
           'indexSha256': raw['indexSha256'], 'url': raw['url'], 'viewport': raw['viewport'],
           'browser': raw['browser'], 'hardware': raw['hardware'], 'cpuRate': raw['cpuRate'],
           'priorAudit': {'path': str(PRIOR), 'sha256': sha(PRIOR)},
           'inputs': [verified(BASE/'report.json')], 'harnessSha256': sha(Path(__file__)), 'runs': []}
assert receipt['sourceCommit'] == prior['sourceCommit']
assert receipt['indexSha256'] == prior['indexSha256']
for run in raw['runs']:
    path = BASE/run['mode']/'timeline.json'
    receipt['inputs'].append(verified(path))
    timeline = json.loads(path.read_text())
    end = run['final']['wallMs']
    windows = [(c['before']['wallMs'], c['after']['wallMs']) for c in run['captures']]
    overlaps = lambda a, b: any(y > a and x < b for x, y in windows)
    clean_frames = [b for a, b in zip(timeline['frames'], timeline['frames'][1:])
                    if 0 < b['wallMs'] <= end and b['frameMs'] > 0 and not overlaps(a['wallMs'], b['wallMs'])]
    row = {'mode': run['mode'], 'naturalResultMs': end,
           'frameMsWithoutCapture': stats([x['frameMs'] for x in clean_frames]),
           'renderCpuMsWithoutCapture': stats([x['cpuMs'] for x in clean_frames]), 'media': {}}
    for cat, audit in timeline['mediaAudits'].items():
        samples = [s for s in audit['samples'] if s['fullAt'] is not None and 0 <= s['fullAt'] <= end]
        assert samples and all(not s.get('missing') for s in samples)
        qualities = [s for s in samples if s.get('quality')]
        callbacks = [d for d in audit['decoded'] if d['fullAt'] is not None and 0 <= d['fullAt'] <= end]
        events = [e for e in audit['events'] if e['fullAt'] is not None and 0 <= e['fullAt'] <= end]
        first, last = qualities[0]['quality'], qualities[-1]['quality']
        increments = []
        for a, b in zip(qualities, qualities[1:]):
            added = b['quality']['droppedVideoFrames']-a['quality']['droppedVideoFrames']
            assert added >= 0 and b['quality']['totalVideoFrames'] >= a['quality']['totalVideoFrames']
            if added:
                event_names = sorted({e['event'] for e in events if a['fullAt'] <= e['fullAt'] <= b['fullAt']})
                increments.append({'fromMs': a['fullAt'], 'toMs': b['fullAt'], 'dropped': added,
                                   'captureOverlap': overlaps(a['fullAt'], b['fullAt']), 'eventsInInterval': event_names})
        total = last['totalVideoFrames']-first['totalVideoFrames']
        dropped = last['droppedVideoFrames']-first['droppedVideoFrames']
        assert sum(x['dropped'] for x in increments) == dropped
        wraps = [{'fromMs': a['fullAt'], 'toMs': b['fullAt'], 'callbackGapMs': b['at']-a['at'],
                  'beforeMediaTime': a['mediaTime'], 'afterMediaTime': b['mediaTime'],
                  'captureOverlap': overlaps(a['fullAt'], b['fullAt'])}
                 for a, b in zip(callbacks, callbacks[1:]) if a['mediaTime'] > 9.5 and b['mediaTime'] < .5]
        waiting = []
        for i, e in enumerate(events):
            if e['event'] != 'waiting':
                continue
            after = next((p for p in events[i+1:] if p['event'] in ('playing', 'waiting', 'error')), None)
            waiting.append({'atMs': e['fullAt'], 'currentTime': e['currentTime'],
                            'nextEvent': after['event'] if after else None,
                            'toNextEventMs': after['at']-e['at'] if after else None,
                            'captureOverlap': overlaps(e['fullAt'], after['fullAt']) if after else None})
        callback_times = [x['at'] for x in callbacks]
        phase_pairs = []
        for s in samples:
            if s['state']['paused'] or s['state']['seeking']:
                continue
            i = bisect.bisect_right(callback_times, s['at'])-1
            if i < 0:
                continue
            d = callbacks[i]
            if overlaps(d['fullAt'], s['fullAt']) or any(d['fullAt'] <= e['fullAt'] <= s['fullAt']
                    and e['event'] in ('waiting', 'seeking', 'pause') for e in events):
                continue
            phase_pairs.append((s, d))
        build = json.loads(Path(run['identity']['buildPath']).read_text())
        manifest_path = Path(build['dist'])/build['registryOverride'][cat].lstrip('/')
        manifest = json.loads(manifest_path.read_text())
        receipt['inputs'].append(verified(manifest_path))
        track_errors = {}
        for channel, track in manifest.get('socketTracks', {}).items():
            assert len(track) == 300
            errors = []
            for s, d in phase_pairs:
                a = point(track, s['state']['currentTime'])
                b = point(track, d['mediaTime'])
                errors.append(math.hypot(a[0]-b[0], a[1]-b[1])*512/manifest['opaqueHeight'])
            track_errors[channel] = stats(errors)
        presented = [b['presentedFrames']-a['presentedFrames'] for a, b in zip(callbacks, callbacks[1:])]
        assert all(x > 0 for x in presented)
        row['media'][cat] = {'qualityFirst': first, 'qualityLast': last, 'totalFrameDelta': total,
                            'droppedFrameDelta': dropped, 'dropFraction': dropped/total if total else None,
                            'dropCounterIntervals': increments, 'callbacks': len(callbacks),
                            'unobservedPresentedCallbacks': sum(max(0, x-1) for x in presented),
                            'wraps': wraps, 'waitingEvents': waiting,
                            'processingDurationSeconds': stats([d['processingDuration'] for d in callbacks
                                                               if d.get('processingDuration') is not None]),
                            'sampleClockMinusLatestCallbackAbsMs': stats([abs(delta(s['state']['currentTime'], d['mediaTime']))*1000 for s, d in phase_pairs]),
                            'potentialTrackDifferenceCanonicalPixels': track_errors,
                            'runtimeErrors': sum(e['event'] == 'error' for e in events)}
    receipt['runs'].append(row)
receipt['limits'] = [
    'Re-analysis of existing lane records, not a new capture or ordinary-laptop certification.',
    'Capture/DOM sampling overhead remains. Counter intervals identify temporal coincidence, not causality.',
    'Dropped video frames differ from missed JavaScript callbacks; processingDuration is not CPU decode time.',
    'Latest callback is a recorded presentation, not proof of the exact texture read at a later scene draw.',
    'Track mismatch is a sampled potential difference before cast/world projection, not a measured painted-pixel error.',
    'Decoder loop timing cannot repair the spatial source seam or waive HP/body and matte failures.']
receipt['imagesViewed'] = 0
receipt['runtimeChanged'] = False
receipt['artAccepted'] = False
OUTPUT.write_text(json.dumps(receipt, indent=2)+'\n')
for row in receipt['runs']:
    print(json.dumps({'mode': row['mode'], 'raf': row['frameMsWithoutCapture'], 'media': {
        cat: {k: d[k] for k in ('totalFrameDelta', 'droppedFrameDelta', 'dropFraction',
                                'unobservedPresentedCallbacks', 'sampleClockMinusLatestCallbackAbsMs',
                                'potentialTrackDifferenceCanonicalPixels')} for cat, d in row['media'].items()}}))
print(str(OUTPUT))
