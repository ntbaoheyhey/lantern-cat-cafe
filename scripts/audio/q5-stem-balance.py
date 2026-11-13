#!/usr/bin/env python3
"""Compare simultaneous real buses; recombinations are diagnostics, not gates."""
import argparse
import datetime
import hashlib
import json
from pathlib import Path
import subprocess
import numpy as np
from analyse import RATE, analyse_file

ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / 'reports/v3-shell/b2'

def signed(path):
    return {'path': str(path.relative_to(ROOT)),
            'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--scene', choices=['battle', 'boss'], required=True)
    parser.add_argument('--trial', default='diagnostic-26-clocked')
    args = parser.parse_args()
    metric_path = BASE / f'mix/{args.trial}-{args.scene}.json'
    capture = json.loads(metric_path.read_text())
    assert capture['diagnostic'] and len(capture['stems']) == 5
    inputs = {}
    silent = []
    for stem in capture['stems']:
        path = ROOT / stem['path']
        assert signed(path)['sha256'] == stem['sha256']
        if path.stat().st_size == 0:
            # A disconnected, never-used browser bus produces no recorder
            # packets. It contributes silence; never conceal a corrupt file.
            silent.append(stem['bus'])
            continue
        raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(path),
                                       '-t', '45.2', '-ac', '1', '-ar', str(RATE),
                                       '-f', 'f32le', 'pipe:1'])
        inputs[stem['bus']] = np.frombuffer(raw, dtype='<f4').copy()
    lengths = [len(x) for x in inputs.values()]
    assert max(lengths)-min(lengths) < RATE*.1, 'Incompatible stem timelines'
    length = min(lengths)
    assert length/RATE > 45, 'Stem omitted inactive periods'
    inputs = {k: x[:length] for k, x in inputs.items()}
    dest = ROOT / 'tmp/q5-stem-balance'
    dest.mkdir(parents=True, exist_ok=True)
    rows = []
    for voice_db, sfx_db in [(0, 0), (0, -6), (-3, -6), (-6, -9)]:
        name = f'{args.scene}-voice{voice_db}-sfx{sfx_db}'
        pcm = sum(x * 10 ** ((voice_db if bus == 'voice' else sfx_db if bus == 'sfx' else 0) / 20)
                  for bus, x in inputs.items())
        # This is an approximation of WebAudio's master dynamics. Compare its
        # baseline to the real output, and require new browser captures later.
        pcm *= .7 * 10 ** (6 / 20)
        path = dest / (name + '.flac')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(RATE),
                        '-ac', '1', '-i', 'pipe:0', '-af',
                        'acompressor=threshold=0.631:ratio=20:attack=2:release=150:knee=2,volume=-2.25dB',
                        str(path)], input=pcm.astype('<f4').tobytes(), check=True)
        metrics = analyse_file(path, duration=length/RATE)
        rows.append({'voiceDb': voice_db, 'sfxDb': sfx_db, **signed(path), 'metrics': metrics})
        (BASE / f'q5/{args.trial}-balance-{args.scene}.json').write_text(json.dumps({
            'at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'diagnostic': True, 'source': signed(metric_path),
            'silentBuses': silent,
            'method': 'Five simultaneous real browser buses, unchanged cue timing and source choices. '
                      'Recombined for gain diagnosis with approximate master dynamics. '
                      'Separate Opus recorders may have small alignment differences. '
                      'Never acceptance evidence; fresh browser output is required.',
            'rows': rows,
        }, indent=2) + '\n')
        print(json.dumps({'name': name, **{k: metrics[k] for k in [
            'tickTransientsPerSecond', 'voiceContoursPerMinute', 'integratedLufs',
            'onsetsPerSecond', 'layersPerOnset']}}), flush=True)

if __name__ == '__main__':
    main()
