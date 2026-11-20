#!/usr/bin/env python3
"""Diagnostic postmix trials only; never publish these as runtime evidence."""
import datetime
import hashlib
import json
from pathlib import Path
import subprocess

from analyse import analyse_file

ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / 'reports/v3-shell/b2'
SOURCE = BASE / 'renders/25-balanced-transients-battle.opus'
DEST = ROOT / 'tmp/q5-processing'
DEST.mkdir(parents=True, exist_ok=True)
rows = []
options = [
    ('deess-light', 'deesser=i=0.35:m=0.5:f=0.5'),
    ('deess-medium', 'deesser=i=0.6:m=0.7:f=0.5'),
    ('deess-strong', 'deesser=i=0.9:m=0.8:f=0.5'),
    ('deess-low', 'deesser=i=0.6:m=0.7:f=0.3'),
]
report = BASE / 'q5/processing-probes.json'
for name, filters in options:
    target = DEST / (name + '.flac')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(SOURCE), '-af', filters,
                    '-c:a', 'flac', str(target)], check=True)
    metrics = analyse_file(target, duration=45.2)
    rows.append({'name': name, 'filters': filters, 'metrics': metrics,
                 'path': str(target.relative_to(ROOT)),
                 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()})
    report.write_text(json.dumps({
        'at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'diagnostic': True,
        'method': 'Postmix de-essing diagnosis. These files cannot satisfy any runtime capture gate. '
                  'A promising method must be implemented in production and measured again.',
        'source': {'path': str(SOURCE.relative_to(ROOT)),
                   'sha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest()},
        'rows': rows,
    }, indent=2) + '\n')
    print(json.dumps({'name': name, **{k: metrics[k] for k in [
        'tickTransientsPerSecond', 'voiceContoursPerMinute', 'integratedLufs',
        'onsetsPerSecond', 'layersPerOnset']}}), flush=True)
