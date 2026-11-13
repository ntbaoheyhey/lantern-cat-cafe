"""Diagnostic ASR of real mixed playback; no isolated replacement or text prompt."""
import argparse, datetime, gzip, json, subprocess
from pathlib import Path
from callout_dsp import ROOT, recognizer, recognize
from publish_callouts import signed

parser = argparse.ArgumentParser()
parser.add_argument('trial')
parser.add_argument('--scenes', default='battle,boss')
args = parser.parse_args()
assert args.trial.replace('-', '').isalnum()
base = ROOT / 'reports/v3-shell/b2'
integration = json.loads((base / 'q2/integration.json').read_text())
runtime_root = Path(integration['out'])
manifest_path = runtime_root / 'apps/web/public/audio/manifest.json'
metadata_path = runtime_root / 'apps/web/src/audio/voice-callouts.json'
manifest = json.loads(manifest_path.read_text())
metadata = {r['cueId']: r for r in json.loads(metadata_path.read_text())}
folder = ROOT / 'work/audio' / (args.trial + '-mixed-speech')
folder.mkdir(parents=True, exist_ok=True)
report_path = base / 'q5' / (args.trial + '-mixed-speech.json')
report = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'trial': args.trial,
          'diagnostic': True, 'metadata': signed(metadata_path), 'manifest': signed(manifest_path),
          'method': 'First complete actual occurrence per callout cue per scene, cropped from full unnormalized browser mix with150ms pre-roll and200ms tail. Local unprompted ASR; background music/effects retained. This supplements isolated V recognition, not a substitute for its full-roster gate.',
          'scenes': [], 'rows': []}
model = recognizer(threads=2)
for scene in args.scenes.split(','):
    metric_path = base / 'mix' / f'{args.trial}-{scene}.json'
    metric = json.loads(metric_path.read_text())
    audio = ROOT / metric['path']
    runtime_path = ROOT / metric['runtime']['path']
    assert signed(audio) == {k: metric[k] for k in ['path', 'sha256']}
    assert signed(runtime_path) == metric['runtime']
    for path in [manifest_path, metadata_path]:
        expected = next(r for r in metric['runtimeSources'] if r['path'] == str(path.relative_to(runtime_root)))
        assert expected['sha256'] == signed(path)['sha256']
    runtime = json.loads(gzip.decompress(runtime_path.read_bytes()))
    report['scenes'].append({'name': scene, 'metric': signed(metric_path), 'audio': signed(audio)})
    seen = set()
    for hit in runtime['hits']:
        cue = hit['id']
        if hit['result'] != 'played' or cue not in metadata or cue in seen:
            continue
        layer = hit['layers'][0]
        sample = next(s for s in manifest['cues'][cue] if s['variantId'] == layer['variantId'])
        at = hit['at'] / 1000 - runtime['started']
        duration = sample['duration'] / layer.get('pitch', 1)
        if at < .15 or at + duration + .2 > metric['durationSeconds']:
            continue
        seen.add(cue)
        target = folder / f'{scene}-{len(seen):03d}.flac'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(at - .15), '-i', str(audio),
                        '-t', str(duration + .35), '-ac', '1', '-ar', '24000', '-c:a', 'flac', str(target)], check=True)
        expected = metadata[cue]
        result = recognize(model, target, expected['text'])
        threshold = .7 if expected['kind'] == 'ultimate' else .5
        report['rows'].append({'scene': scene, 'cueId': cue, 'kind': expected['kind'],
                               'atSeconds': at, 'durationSeconds': duration, 'variantId': layer['variantId'],
                               'crop': signed(target), **result, 'passes': result['wordAccuracy'] >= threshold})
        report_path.write_text(json.dumps(report, indent=2) + '\n')
        print(scene, cue, result['wordAccuracy'], result['recognized'], flush=True)
report['summary'] = {scene: {'passed': sum(r['passes'] for r in report['rows'] if r['scene'] == scene),
                              'measured': sum(r['scene'] == scene for r in report['rows'])}
                     for scene in args.scenes.split(',')}
report_path.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report['summary']), flush=True)
