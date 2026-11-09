"""Audit full-page and readiness intervals from the one completed matrix.

Cast-only gates deliberately exclude page initialization. Preserve and expose
the wider intervals as well, so smooth casts cannot conceal startup stalls.
This reads existing raw frames; it never launches or repeats a measurement.
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
matrix = read(out / 'matrix/summary.json')
freeze = read(out / 'freeze.json')
assert matrix.get('ended') and len(matrix['rows']) == 860
assert matrix['sha256'] == freeze['sha256']
assert digest(root / freeze['artifact']) == freeze['sha256']


def summarize(frames):
    times = sorted(frame['ms'] for frame in frames)
    assert times and all(math.isfinite(t) and t > 0 for t in times)
    return {'frames': len(times), 'max': times[-1],
            'p95': times[math.floor(len(times) * .95)],
            'above25': sum(t > 25 for t in times),
            'above50': sum(t > 50 for t in times),
            'within20': sum(t <= 20 for t in times) / len(times)}


groups, worst = {}, None
raw_frames = 0
for row in matrix['rows']:
    path = root / row['raw']
    assert digest(path) == row['rawSha256'], row['name']
    raw = read(path)
    assert raw['name'] == row['name'] and raw['errors'] == []
    frames = raw['frames']
    raw_frames += len(frames)
    assert all(a['at'] < b['at'] for a, b in zip(frames, frames[1:]))
    assert 0 < raw['firstInteractiveAt'] < raw['sceneReadyAt'] < raw['casts'][0]['before']['at']
    intervals = {'pageOpen': frames,
                 'postInteractive': [f for f in frames if f['at'] - f['ms'] >= raw['firstInteractiveAt']],
                 'postReady': [f for f in frames if f['at'] - f['ms'] >= raw['sceneReadyAt']]}
    for key, selected in intervals.items():
        assert summarize(selected) == raw[key] == row[key], (row['name'], key)
    key = (row['width'], row['height'], row['dpr'], row['cpu'], row['quality'])
    group = groups.setdefault(key, {'configuration': list(key), 'cases': 0,
        'intervals': {name: {'maximumMs': 0, 'casesAbove50Ms': 0} for name in intervals},
        'interactiveTimesMs': [], 'sceneReadyTimesMs': []})
    group['cases'] += 1
    group['interactiveTimesMs'].append(row['firstInteractiveAt'])
    group['sceneReadyTimesMs'].append(row['sceneReadyAt'])
    for name in intervals:
        peak = row[name]['max']
        entry = group['intervals'][name]
        entry['casesAbove50Ms'] += peak > 50
        if peak > entry['maximumMs']:
            entry.update(maximumMs=peak, case=row['name'], raw=row['raw'])
    peak = max(frames, key=lambda f: f['ms'])
    if worst is None or peak['ms'] > worst['frame']['ms']:
        start, end = peak['at'] - peak['ms'], peak['at']
        worst = {'name': row['name'], 'raw': row['raw'], 'rawSha256': row['rawSha256'],
                 'configuration': list(key), 'frame': peak,
                 'firstInteractiveAt': row['firstInteractiveAt'], 'sceneReadyAt': row['sceneReadyAt'],
                 'firstCastAt': raw['casts'][0]['before']['at'],
                 'beforeHubInteractive': end <= row['firstInteractiveAt'],
                 'beforeFirstCast': end <= raw['casts'][0]['before']['at'],
                 'overlappingLongFrames': [f for f in raw['longFrames']
                     if f['startTime'] <= end and f['startTime'] + f['duration'] >= start]}

assert len(groups) == 10 and all(g['cases'] == 86 for g in groups.values())
for group in groups.values():
    for key in ['interactiveTimesMs', 'sceneReadyTimesMs']:
        values = group.pop(key)
        group[key.replace('Times', 'Range')] = [min(values), max(values)]
result = {'at': datetime.now(timezone.utc).isoformat(), 'artifact': freeze['sha256'],
          'matrixSummarySha256': digest(out / 'matrix/summary.json'),
          'cases': 860, 'rawFramesIncludingInitialization': raw_frames,
          'groups': list(groups.values()), 'worstPageFrame': worst,
          'method': 'All full-page/post-Hub/post-ready frame summaries independently recomputed from original raw arrays. Group case counts above50ms are descriptive startup/readiness observations, not extra cast-gate failures.',
          'limitations': ['Gallery-page observations differ from the seven cold-open runs; do not pool their timings or infer a source component from anonymous blob callbacks.',
                         'No new browser measurements or trace collection. Existing source, artifact and cast budgets remain unchanged.']}
(out / 'matrix-interval-audit.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'cases': 860, 'rawFrames': raw_frames, 'worstPageFrame': worst}))
