"""Compare two meters on immutable historical recordings before new capture."""
from pathlib import Path
import datetime
import hashlib
import json
import re
import subprocess
import time

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'reports/v4-ship/S11/palette-coverage-study-1.json'
assert not OUT.exists() and not (ROOT / 'STOP-V4SHIP').exists()
sha = lambda b: hashlib.sha256(b).hexdigest()
reference = lambda p: {'path': str(p.relative_to(ROOT)), 'sha256': sha(p.read_bytes())}
base = ROOT / 'reports/v4-ship/S5/ranged-coverage-1'
check = json.loads((base / 'check.json').read_bytes())
validation = json.loads((base / 'validation.json').read_bytes())
report = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'harness': reference(Path(__file__)), 'inputs': [reference(base / f) for f in ['check.json', 'validation.json']],
          'historicalOnly': True, 'rows': [], 'complete': False, 'pass': False,
          'limits': 'Method comparison only; original scene acceptance thresholds remain unchanged. No current-runtime, physical-onset or listening claim.'}
for row in check['rows']:
    path = ROOT / row['capture']['path']
    assert sha(path.read_bytes()) == row['capture']['sha256']
    measurements = {}
    for method, filt in [('loudnorm', 'loudnorm=I=-18:TP=-1:LRA=5:print_format=json'),
                         ('ebur128', 'ebur128=peak=true:framelog=verbose')]:
        assert not (ROOT / 'STOP-V4SHIP').exists()
        command = ['ffmpeg', '-hide_banner', '-nostats', '-i', str(path), '-af', filt, '-f', 'null', '-']
        started = time.monotonic()
        result = subprocess.run(command, capture_output=True, text=True)
        assert result.returncode == 0, 'Historical analysis failed'
        if method == 'loudnorm':
            raw = json.loads(re.findall(r'\{\s*"input_i"[\s\S]*?\}', result.stderr)[-1])
            values = dict(lufs=float(raw['input_i']), lra=float(raw['input_lra']), truePeakDbTP=float(raw['input_tp']))
        else:
            match = re.findall(r'Integrated loudness:\s*I:\s*(-?[\d.]+)\s*LUFS[\s\S]*?Loudness range:\s*LRA:\s*([\d.]+)\s*LU[\s\S]*?True peak:\s*Peak:\s*(-?[\d.]+)\s*dBFS', result.stderr)[-1]
            values = dict(zip(['lufs', 'lra', 'truePeakDbTP'], map(float, match)))
        measurements[method] = {**values, 'seconds': time.monotonic() - started,
                                'loudnessPass': -20 <= values['lufs'] <= -16,
                                'rangePass': values['lra'] >= 5, 'peakPass': values['truePeakDbTP'] <= -1}
    a, b = measurements['loudnorm'], measurements['ebur128']
    agree = abs(a['lufs']-b['lufs']) <= .11 and abs(a['lra']-b['lra']) <= .11 and abs(a['truePeakDbTP']-b['truePeakDbTP']) <= .2
    original = {'lufs': row['integratedLufs'], 'lra': row['lra'], 'truePeakDbTP': row['truePeakDbTP']}
    report['rows'].append({'name': row['name'], 'capture': row['capture'], 'original': original,
                           **measurements, 'methodsAgree': agree,
                           'originalReproduced': all(a[k] == v for k,v in original.items())})
    OUT.write_text(json.dumps(report, indent=2)+'\n')
report.update({'complete': True, 'pass': all(r['methodsAgree'] and r['originalReproduced'] for r in report['rows']),
               'historicalAggregate': validation['aggregate'],
               'perSceneRangeFailures': [r['name'] for r in report['rows'] if not r['loudnorm']['rangePass']]})
OUT.write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps({'pass': report['pass'], 'rows': [{k:r[k] for k in ['name','loudnorm','ebur128','methodsAgree']} for r in report['rows']],
                  'historicalAggregate': report['historicalAggregate'], 'perSceneRangeFailures': report['perSceneRangeFailures']}))
assert report['pass']
