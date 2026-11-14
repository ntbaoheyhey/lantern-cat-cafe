#!/usr/bin/env python3
"""Diagnostic timing attribution; acceptance still uses unchanged analyse.py."""
import argparse, datetime, gzip, hashlib, json, subprocess
from pathlib import Path
import numpy as np
from analyse import RATE, rolling_median, runs

ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / 'reports/v3-shell/b2'

def signed(path):
    return {'path': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}

def samples(value):
    if isinstance(value, dict):
        if 'duration' in value and 'variantId' in value:
            yield value
        for child in value.values():
            yield from samples(child)
    elif isinstance(value, list):
        for child in value:
            yield from samples(child)

def inspect(trial, name):
    path = BASE / 'mix' / f'{trial}-{name}.json'
    metric = json.loads(path.read_text())
    runtime_path = ROOT / metric['runtime']['path']
    runtime = json.loads(gzip.decompress(runtime_path.read_bytes()))
    manifest = json.loads((ROOT / 'apps/web/public/audio/manifest.json').read_text())
    variants = {s['variantId']: s for s in samples(manifest)}
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(ROOT / metric['path']), '-t', str(metric['durationSeconds']), '-ac', '1', '-ar', str(RATE), '-f', 'f32le', 'pipe:1'])
    x = np.frombuffer(raw, dtype='<f4').astype(np.float64)
    spectrum = np.fft.rfft(x)
    frequency = np.fft.rfftfreq(len(x), 1/RATE)
    spectrum[(frequency < 2000) | (frequency > 8000)] = 0
    high = np.fft.irfft(spectrum, n=len(x))
    hop = round(RATE*.005)
    env = np.mean(high[:len(high)//hop*hop].reshape(-1, hop)**2, axis=1)
    background = rolling_median(env, 101)
    events = [(a*hop/RATE, (b-a)*hop/RATE) for a, b in runs(env > np.maximum(background*4, 1e-8)) if 0 < (b-a)*hop/RATE < .04]
    assert len(events) == metric['tickCount'], 'Diagnostic differs from the unchanged acceptance count'
    intervals = []
    for hit in runtime['hits']:
        if hit['result'] != 'played' or hit['id'].startswith(('music.', 'ambience.')):
            continue
        layers = hit.get('layers', [])
        durations = [variants[l['variantId']]['duration']/l.get('pitch', 1) + l.get('offsetMs', 0)/1000 for l in layers if l.get('variantId') in variants]
        if not durations:
            continue
        start = hit['at']/1000-runtime['started']
        intervals.append({'id': hit['id'], 'start': start, 'end': start+max(durations), 'variants': [l.get('variantId') for l in layers]})
    counts = {'voice': 0, 'effects': 0, 'both': 0, 'neither': 0}
    cue_counts = {}
    rows = []
    for start, duration in events:
        active = [r for r in intervals if r['start']-.02 <= start <= r['end']+.02]
        voice = any(r['id'].startswith('voice.') for r in active)
        effects = any(not r['id'].startswith('voice.') for r in active)
        kind = 'both' if voice and effects else 'voice' if voice else 'effects' if effects else 'neither'
        counts[kind] += 1
        for cue in set(r['id'] for r in active):
            cue_counts[cue] = cue_counts.get(cue, 0)+1
        rows.append({'at': round(start, 4), 'duration': round(duration, 4), 'kind': kind, 'active': [r['id'] for r in active]})
    return {'metric': signed(path), 'runtime': signed(runtime_path), 'tickRate': metric['tickTransientsPerSecond'], 'counts': counts, 'coincidentCues': sorted(cue_counts.items(), key=lambda r: -r[1]), 'events': rows, 'intervals': intervals}

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--trials', required=True)
    parser.add_argument('--scene', default='battle')
    parser.add_argument('--label', required=True)
    args = parser.parse_args()
    result = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'method': 'Exact unchanged 2–8 kHz/5ms burst events joined to logged source windows. Coincidence is diagnostic, not source separation or causal proof; acceptance thresholds and recordings unchanged.', 'rows': []}
    for trial in args.trials.split(','):
        row = inspect(trial, args.scene)
        result['rows'].append(row)
        print(json.dumps({'trial': trial, 'ticks': row['tickRate'], 'counts': row['counts'], 'coincidentCues': row['coincidentCues'][:8]}), flush=True)
    (BASE / 'q5' / (args.label+'.json')).write_text(json.dumps(result, indent=2)+'\n')
