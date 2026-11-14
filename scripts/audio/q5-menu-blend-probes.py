#!/usr/bin/env python3
"""Diagnose menu speech masking at several positions in the original score.

These offline blends guide production EQ; only full browser recordings count
as acceptance. No reference audio, output normalization or source substitution.
"""
import datetime
import hashlib
import json
from pathlib import Path
import subprocess

import numpy as np
from analyse import RATE, measure

ROOT = Path(__file__).resolve().parents[2]
B = ROOT/'reports/v3-shell/b2'


def decode(path, filters=None):
    command = ['ffmpeg', '-v', 'error', '-i', str(path)]
    if filters:
        command += ['-af', filters]
    return np.frombuffer(subprocess.check_output(command+['-ac', '1', '-ar', str(RATE), '-f', 'f32le', 'pipe:1']), dtype='<f4')


source = B/'MENU-VOICE-LINES.json'
production = json.loads(source.read_text())
beds = {db: decode(ROOT/'apps/web/public/audio/home.webm', f'bass=g={db}:f=1200') for db in [0, -6, -12]}
rows = []
for row in production['lines']:
    voice = decode(ROOT/row['path'])
    trials = []
    for shelf, bed in beds.items():
        for gain in [-2, 0, 3, 6]:
            counts = []
            for position in [3, 11, 21]:
                under = bed[(round(position*RATE)+np.arange(len(voice))) % len(bed)]
                mixed = voice*.7*10**(gain/20) + under*.55*10**(-8/20)
                metrics = measure(mixed)
                counts.append(len(metrics['voiceContourEvents']))
            trials.append({'musicShelfDb': shelf, 'voiceGainDb': gain, 'positionsSeconds': [3, 11, 21], 'contourCounts': counts})
    rows.append({'path': row['path'], 'sha256': hashlib.sha256((ROOT/row['path']).read_bytes()).hexdigest(), 'cueId': row['cueId'], 'text': row['text'], 'trials': trials})
    print(row['text'], [(r['musicShelfDb'], r['voiceGainDb'], r['contourCounts']) for r in trials], flush=True)
(B/'q5/menu-blend-probes.json').write_text(json.dumps({'date': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'diagnosticOnly': True, 'source': {'path': str(source.relative_to(ROOT)), 'sha256': hashlib.sha256(source.read_bytes()).hexdigest()}, 'method': __doc__, 'rows': rows}, indent=2)+'\n')
