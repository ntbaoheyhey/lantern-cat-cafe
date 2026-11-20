#!/usr/bin/env python3
"""Check articulation after the strongest runtime shelf and shipping codec."""
import argparse
import datetime
import json
import subprocess
from pathlib import Path

from callout_dsp import ROOT, recognizer, recognize
from publish_callouts import signed


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--shelf', type=float, default=-18)
    parser.add_argument('--label', default='scene27')
    parser.add_argument('--cues')
    args = parser.parse_args()
    assert args.label.replace('-', '').isalnum()
    base = ROOT / 'reports/v3-shell/b2'
    source = base / 'VOICE-CALLOUTS-VALIDATION.json'
    engine = ROOT / 'apps/web/src/audio/engine.ts'
    report = base / f'q5/{args.label}-clarity.json'
    production = json.loads(source.read_text())
    evidence = {
        'at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'source': signed(source), 'engine': signed(engine), 'diagnostic': True,
        'shelfDb': args.shelf, 'selectedCues': args.cues,
        'method': f'First take of selected required lines through a 1500Hz, {args.shelf}dB '
                  'high shelf, +2dB voice trim and 64kbps Opus. This is an '
                  'isolated articulation guard for the strongest runtime '
                  'tone, not recognition of a complete mixed battle.',
        'rows': [],
    }
    if report.exists():
        prior = json.loads(report.read_text())
        assert prior['source'] == evidence['source']
        assert prior['engine'] == evidence['engine']
        evidence['rows'] = prior['rows']
    measured = {r['cueId'] for r in evidence['rows']}
    folder = ROOT / f'work/audio/q5-{args.label}-clarity'
    folder.mkdir(parents=True, exist_ok=True)
    model = recognizer(threads=2)
    for row in production['ultimates'] + production['skills']:
        if args.cues and row['cueId'] not in args.cues.split(','):
            continue
        if row['cueId'] in measured:
            continue
        sample = row['variants'][0]
        path = ROOT / sample['path']
        assert signed(path) == sample
        target = folder / (path.stem + '.opus')
        subprocess.run([
            'ffmpeg', '-v', 'error', '-y', '-i', str(path), '-af',
            f'treble=g={args.shelf}:f=1500:t=q:w=0.7071067812,volume=2dB',
            '-c:a', 'libopus', '-b:a', '64k', str(target),
        ], check=True)
        result = recognize(model, target, row['text'])
        threshold = .7 if row['kind'] == 'ultimate' else .5
        evidence['rows'].append({
            'cueId': row['cueId'], 'kind': row['kind'], 'source': sample,
            'processed': signed(target), 'baselineWordAccuracy': row['wordAccuracy'],
            **result, 'passes': bool(result['wordAccuracy'] >= threshold),
        })
        report.write_text(json.dumps(evidence, indent=2) + '\n')
        print(row['cueId'], result['wordAccuracy'], result['recognized'], flush=True)
    for kind in ['ultimate', 'skill']:
        rows = [r for r in evidence['rows'] if r['kind'] == kind]
        print(kind, sum(r['passes'] for r in rows), '/', len(rows), flush=True)


if __name__ == '__main__':
    main()
