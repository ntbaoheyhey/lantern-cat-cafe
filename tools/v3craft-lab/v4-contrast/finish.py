"""Retain the failed first-frame binding; retry only wave1 with the same recorder."""
from pathlib import Path
from datetime import datetime, timezone
import gzip, hashlib, json, os, subprocess
root = Path(__file__).resolve().parents[3]
out = root / 'reports/v4-art/REVIEW/A10/contrast'
validation = json.loads((out / 'validation.json').read_text())
assert validation['pass']
hashes = validation['runtimeSourceHashes']
old = 'reports/v3-feel/REVIEW/V4-A10-CONTRAST-R1'
retry = 'reports/v3-feel/REVIEW/V4-A10-CONTRAST-R2'
assert not (root / retry).exists()
d = json.loads(gzip.decompress((root / old / 'wave1/capture.json.gz').read_bytes()))
nulls = [i for i, s in enumerate(d['resampled']) if s.get('renderFrame') is None]
assert nulls == [0]
(out / 'attempt-r1-retained.json').write_text(json.dumps({'sourceCommit': d['sourceCommit'], 'video': old + '/wave1.webm', 'videoSha256': d['videoSha256'], 'nullRenderFrameIndices': nulls, 'failedGate': 'Every encoded frame needs a valid source marker; frame0 has no renderFrame.', 'markerToolExit': 1, 'markerToolError': 'TypeError while converting None to int', 'log': 'reports/v4-art/jobs/a10-contrast-markers-r1.log', 'resolution': 'Preserve the original film and metadata unchanged. Retry wave1 only; no recorder code change.'}, indent=2) + '\n')
sources = {'wave1': retry, 'wave3': old, 'boss': old}
(out / 'capture-sources.json').write_text(json.dumps(sources, indent=2) + '\n')
python = str(root / 'tools/.venv/bin/python')
env = {**os.environ, 'ART_A9_REVIEW': str(out)}
steps = [
    ('markers-r1-good', [python, 'tools/v3craft-lab/v4-yarn-giant/verify-markers.py', '--capture-root', old, '--out', str(out / 'encoded-markers-r1-good.json'), '--fixtures', 'wave3', 'boss']),
    ('capture-wave1-r2', ['node', 'scripts/v3feel/capture.mjs', '--item', Path(retry).name, '--fixture', 'wave1', '--seconds', '30', '--video-seconds', '30', '--frame-marker']),
    ('markers-wave1-r2', [python, 'tools/v3craft-lab/v4-yarn-giant/verify-markers.py', '--capture-root', retry, '--out', str(out / 'encoded-markers-wave1-r2.json'), '--fixtures', 'wave1']),
]
for fixture in ['wave1', 'wave3', 'boss']:
    steps.append(('layout900-' + fixture, ['node', 'scripts/v3a2/battle-capture.mjs', '--fixture', fixture, '--width', '1440', '--height', '900', '--seconds', '30', '--complete-actions', '--out', str(out / 'raw' / (fixture + '-900'))]))
steps += [('review900', [python, 'tools/v3craft-lab/v4-clarity/review-900.py']), ('review-films', [python, 'tools/v3craft-lab/v4-contrast/review-films.py'])]
report = {'started': datetime.now(timezone.utc).isoformat(), 'validatedSourceCommit': validation['sourceCommit'], 'runtimeSourceHashes': hashes, 'steps': []}
for name, command in steps:
    assert all(hashlib.sha256((root / p).read_bytes()).hexdigest() == h for p, h in hashes.items())
    log = root / 'reports/v4-art/jobs' / ('a10-contrast-' + name + '.log')
    with log.open('wb') as stream:
        child = subprocess.Popen(command, cwd=root, env=env, stdin=subprocess.DEVNULL, stdout=stream, stderr=subprocess.STDOUT)
        step = {'name': name, 'pid': child.pid, 'log': str(log), 'started': datetime.now(timezone.utc).isoformat()}
        report['steps'].append(step)
        (out / 'finish-jobs.json').write_text(json.dumps(report, indent=2) + '\n')
        step['exitCode'] = child.wait()
    step['finished'] = datetime.now(timezone.utc).isoformat()
    (out / 'finish-jobs.json').write_text(json.dumps(report, indent=2) + '\n')
    print(name + '_exit=' + str(step['exitCode']), flush=True)
    if step['exitCode']:
        raise SystemExit(step['exitCode'])
    if name == 'markers-wave1-r2':
        markers = json.loads((out / 'encoded-markers-wave1-r2.json').read_text()) + json.loads((out / 'encoded-markers-r1-good.json').read_text())
        assert sum(m['frames'] for m in markers) == 2700 and all(m['pass'] for m in markers)
        (out / 'encoded-markers.json').write_text(json.dumps(markers, indent=2) + '\n')
report['finished'] = datetime.now(timezone.utc).isoformat()
report['pass'] = True
(out / 'finish-jobs.json').write_text(json.dumps(report, indent=2) + '\n')
