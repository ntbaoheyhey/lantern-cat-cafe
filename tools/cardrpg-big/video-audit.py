"""Audit the completed F7 recording set without opening another browser."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys

root = Path(sys.argv[1] if len(sys.argv) > 1 else 'reports/cardrpg-big/video/delivery')
digest = lambda path: hashlib.sha256(Path(path).read_bytes()).hexdigest()
series = json.loads((root / 'series.json').read_text())
captures = json.loads((root / 'captures.json').read_text())
sampling = json.loads((root / 'review/sampling.json').read_text())
observations = json.loads((root / 'review/observations.json').read_text())
expected = ['mochi', 'soot', 'clover', 'panko', 'mallow', 'sorrel', 'biscuit',
            'inkcap', 'cinnamon', 'brioche', 'velvet', 'marigold', 'clover-ultimate', 'boss']
assert series['complete'] and series['expected'] == expected
assert series['completed'] == expected
assert captures['sha256'] == sampling['artifactSha256'] == observations['artifactSha256']
assert captures['sha256'] == series['sha256'] == digest(series['artifact'])
assert sorted(r['name'] for r in captures['rows']) == sorted(expected)
assert sorted(r['name'] for r in sampling['rows']) == sorted(expected)
assert sorted(r['name'] for r in observations['rows']) == sorted(expected)
rows = []
for name in expected:
    clip = next(r for r in captures['rows'] if r['name'] == name)
    sample = next(r for r in sampling['rows'] if r['name'] == name)
    review = next(r for r in observations['rows'] if r['name'] == name)
    assert digest(clip['path']) == clip['sha256'] == sample['clipSha256'] == review['clipSha256']
    assert clip['errors'] == []
    assert review['samplesViewed'] == sample['frames']
    assert review['sheetsViewed'] == sample['sheets']
    assert len(review['observations']) > 0
    probe = json.loads(subprocess.check_output([
        'ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height,nb_read_frames:format=duration',
        '-of', 'json', clip['path']], text=True))
    stream = probe['streams'][0]
    duration = float(probe['format']['duration'])
    assert (stream['width'], stream['height']) == (1280, 720)
    assert abs(duration - clip['duration']) < .5
    assert int(stream['nb_read_frames']) > 0
    if name != 'boss':
        assert 20 <= duration <= 30 and clip['speed'] == 1 and clip['accountRestored']
        expected_actions = {'clover-4'} if name == 'clover-ultimate' else {f'{name}-{i}' for i in range(1, 5)}
        assert {p['id'] for p in clip['played']} == expected_actions
    else:
        assert clip['kind'] == 'automatic-route-boss' and clip['battle']['speed'] == 1
        assert clip['battle']['result'] == 'party', 'The saved route fixture completed in a party victory'
    rows.append({'name': name, 'clipSha256': clip['sha256'], 'durationSeconds': duration,
                 'decodedFrames': int(stream['nb_read_frames']), 'samplesViewed': sample['frames'],
                 'sheetHashes': {p: digest(p) for p in sample['sheets']}})
result = {'artifactSha256': captures['sha256'], 'complete': True, 'recordings': len(rows),
          'decodedFrames': sum(r['decodedFrames'] for r in rows),
          'samplesViewed': sum(r['samplesViewed'] for r in rows),
          'method': 'Independent file hashes, full video decode count, dimensions/duration/action coverage, '
                    'and matched chronological review records. Recordings are silent; sampled visual '
                    'review does not establish continuous motion, audio quality or frame-time performance.',
          'rows': rows}
(root / 'audit.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({k: v for k, v in result.items() if k != 'rows'}))
