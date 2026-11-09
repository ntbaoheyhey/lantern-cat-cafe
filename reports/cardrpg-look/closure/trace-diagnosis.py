"""Streaming extraction of the observed cold-run stalls; no new browser run."""
import gzip
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parents[3]
out = root / 'reports/cardrpg-look/closure'
raw_path = root / 'reports/cardrpg-look/validation/closure/cold-batch-1/1280x720-dpr1-cpu1.json'
trace_path = raw_path.with_name(raw_path.stem + '-trace.json.gz')
raw = json.loads(raw_path.read_text())
peaks = {'page': max(raw['frames'], key=lambda f: f['ms']),
         'postReady': max((f for f in raw['frames'] if f['at'] - f['ms'] >= raw['battleReadyMs']), key=lambda f: f['ms'])}
threads, origin, overlap = {}, None, {k: [] for k in peaks}
with gzip.open(trace_path, 'rt') as handle:
    for line in handle:
        line = line.strip().removesuffix(',')
        if not line.startswith('{"args"'): continue
        # Chromium appends the enclosing trace footer to its last event line.
        # Decode that event only; preserve the original failed parser receipt.
        e, _ = json.JSONDecoder().raw_decode(line)
        if e['name'] == 'thread_name': threads[(e['pid'], e['tid'])] = e['args']['name']
        if origin is None and e['name'] == 'navigationStart' and e.get('args', {}).get('data', {}).get('documentLoaderURL', '').startswith('file:'):
            origin = e['ts']
        if origin is None or e['ph'] != 'X' or not e.get('dur'): continue
        for key, peak in peaks.items():
            start, end = origin + (peak['at'] - peak['ms']) * 1000, origin + peak['at'] * 1000
            if e['ts'] < end and e['ts'] + e['dur'] > start and e['dur'] >= 1000:
                overlap[key].append(dict(name=e['name'], ms=e['dur']/1000, startMs=(e['ts']-origin)/1000,
                                         pid=e['pid'], tid=e['tid'], args=e['args']))
assert origin is not None
for key, events in overlap.items():
    for e in events: e['thread'] = threads.get((e['pid'], e['tid']), 'unknown')
    overlap[key] = sorted(events, key=lambda e: -e['ms'])[:60]
result = dict(inputs={str(p.relative_to(root)): hashlib.sha256(p.read_bytes()).hexdigest() for p in [raw_path, trace_path]},
              origin=origin, peaks=peaks, overlaps=overlap,
              method='Original trace streamed by event line. Complete duration events >=1ms overlapping each retained RAF gap; top60 inclusive durations. Thread names are preserved. These are correlated events, not exclusive costs or a causal source attribution.')
(out / 'trace-diagnosis.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({k: v[:12] for k, v in overlap.items()}))
