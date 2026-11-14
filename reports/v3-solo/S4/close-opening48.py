"""Record accepted opening48 results only after both validation stages pass."""
from pathlib import Path
import datetime
import hashlib
import json
import subprocess

A = Path(__file__).resolve().parents[3]
B = Path('/Users/bao/taskbar-hero-chain')
OUT = A / 'reports/v3-solo/S4/opening48'
TRIAL = '48-opening'


def read(path):
    return json.loads(path.read_text())


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def append(path, heading, text):
    existing = path.read_text()
    assert heading not in existing, 'Already recorded: ' + str(path)
    path.write_text(existing.rstrip() + '\n\n' + heading + '\n\n' + text.rstrip() + '\n')


validation = read(OUT / 'progress.json')
finish = read(OUT / 'finish-progress.json')
assert validation.get('complete') and finish.get('complete'), 'Acceptance is not complete'
for path, expected in validation['sourceHashes'].items():
    assert sha(Path(path)) == expected, 'Changed source: ' + path
for state in [validation, finish]:
    latest = {row['name']: row for row in state['steps']}
    for row in latest.values():
        assert row.get('exitCode') == 0, row['name']
        assert sha(Path(row['log'])) == row.get('sha256', row.get('logSha256')), row['name']

gate_names = ['a-gates', 'b-S1', 'b-S3', 'b-S4', 'b-S5', 'b-S7', 'b-V',
              'p3-gates', 'solo-gates', 'speech-audit', 'mix-preaccept']
gates = {}
for name in gate_names:
    lines = (OUT / (name + '.log')).read_text().splitlines()
    assert not any(line.startswith('FAIL') for line in lines), name
    selected = [line for line in lines if line.startswith(('PASS ', 'TOTAL '))]
    assert selected, name
    gates[name] = selected
assert sum(line.startswith('PASS ') for line in gates['mix-preaccept']) == 54
assert sum(line.startswith('PASS ') for line in gates['p3-gates']) == 7

a_browser = read(A / 'reports/v3-solo/tests/q9-s4-opening48-browser.json')
b_browser = read(B / 'reports/v3-shell/b2/tests/q9-p3-opening48-browser.json')
for root, browser in [(A, a_browser), (B, b_browser)]:
    assert sum(row['passed'] for row in browser['rows']) == 435
    for row in browser['rows']:
        assert row['exitCode'] == 0 and sha(root / row['log']) == row['sha256']

matrix = read(OUT / 'matrix-summary.json')
cadence = read(B / 'reports/v3-shell/b2/polish/S4/48-opening/current-cadence.json')
speech = read(B / 'reports/v3-shell/b2/polish/S4/48-opening/speech-audit.json')
scene = read(B / 'reports/v3-shell/b2/polish/P3/playback.json')
mixes = [read(B / f'reports/v3-shell/b2/mix/{TRIAL}-{scene_name}.json')
         for scene_name in ['battle', 'boss', 'home', 'bag', 'gacha', 'forge']]
head = lambda root: subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
now = datetime.datetime.now(datetime.timezone.utc).isoformat()
summary = {
    'acceptedAt': now, 'trial': TRIAL, 'sourceCommits': {'A': head(A), 'B': head(B)},
    'validation': {'path': str((OUT / 'progress.json').relative_to(A)), 'sha256': sha(OUT / 'progress.json')},
    'matrix': matrix, 'cadenceSeconds': cadence['medianVoiceIntervalSeconds'],
    'speech': {name: {key: value for key, value in row.items() if key not in ['intervalsSeconds', 'runtime']}
               for name, row in speech['scenes'].items()},
    'mixes': [{key: row[key] for key in ['name', 'durationSeconds', 'voiceContoursPerMinute',
                                        'tickTransientsPerSecond', 'integratedLufs', 'truePeakDbTP', 'errors']}
              for row in mixes],
    'browserPassed': {'A': 435, 'B': 435},
    'shippedAudioBytes': sum(p.stat().st_size for p in (B / 'apps/web/public/audio').rglob('*')
                             if p.suffix.lower() in ['.webm', '.mp3', '.opus', '.ogg', '.flac', '.wav']),
    'sceneReel': scene['reel'], 'gates': gates,
    'limitations': ['Two optional barks are interrupted in the nine-case matrix; required callouts are not.',
                   'No new mixed-output ASR recognition claim; prior limitations remain disclosed.',
                   'Raw voice-source cadence counts charge and release separately.']}
(OUT / 'acceptance-summary.json').write_text(json.dumps(summary, indent=2) + '\n')

heading = '## Opening48 accepted — ' + now
def block(names):
    return '```text\n' + '\n'.join(line for name in names for line in gates[name]) + '\n```'

append(A / 'reports/v3-battle/a2/GATES.md', heading, block(['a-gates', 'solo-gates']))
append(B / 'reports/v3-shell/b2/GATES.md', heading,
       block(['b-S1', 'b-S3', 'b-S4', 'b-S5', 'b-S7', 'b-V', 'p3-gates', 'speech-audit']))
append(B / 'reports/v3-shell/b2/QUEUE.md', heading, block(['b-S4', 'p3-gates']))
append(A / 'reports/v3-solo/QUEUE-SOLO.md', heading, block(['a-gates', 'solo-gates', 'b-S4', 'b-S5', 'p3-gates']))

p = B / 'reports/v3-shell/b2/QUEUE.md'
lines = p.read_text().splitlines()
lines = [f'- [x] S4 — done;opening48 raw median {cadence["medianVoiceIntervalSeconds"]:.3f}s;9/9 speed cases;0 required cuts;self-score8/10;ENDED {now}'
         if line.startswith('- [ ] S4 ') else
         f'- [x] P3 — done;three chapter beds,boss dawn and cleanup;7/7 gates;54/54 full-mix gates;435/435 both browser suites;self-score8/10;ENDED {now};STARTED 2026-11-14T00:32:12.449560+00:00'
         if line.startswith('- [ ] P3 ') else line for line in lines]
p.write_text('\n'.join(lines) + '\n')
p = A / 'reports/v3-solo/QUEUE-SOLO.md'
s = p.read_text().replace('S4 cadence reopened |', f'S4/P3 accepted48;ENDED {now} |')
p.write_text(s)

decision = (f'Opening48 accepted on A {head(A)} and B {head(B)}. Nine live fixture/speed cases: '
            f'{matrix["ultimatePlayed"]}/{matrix["ultimateRequired"]} ultimate phases and {matrix["skillPlayed"]} admitted skills, '
            f'zero required interruptions; {matrix["totalInterrupted"]} optional bark interruptions remain disclosed. '
            f'Original 180-second raw cadence median {cadence["medianVoiceIntervalSeconds"]:.3f}s; '
            f'full battle median {speech["scenes"]["battle"]["medianSeconds"]:.3f}s. '
            'All six current full mixes pass 54 unchanged gates; both branches pass 435 browser cases. '
            'P3 chapter/dawn/cleanup and the decimal audio budget pass. No threshold changes. '
            'Historical rejected captures remain unchanged. Renderer reuse is hash-proven in render-reuse-proof.json. '
            'These results do not claim new mixed-ASR accuracy. Next: P4 adaptive music.')
for path in [A / 'reports/v3-solo/DECISIONS-SOLO.md', A / 'reports/v3-battle/a2/DECISIONS.md',
             B / 'reports/v3-shell/b2/DECISIONS.md']:
    append(path, heading, decision)

for path in [OUT / 'CRITIQUE.md', B / 'reports/v3-shell/b2/polish/P3/CRITIQUE.md']:
    append(path, '## Current acceptance',
           'Self-score: 8/10 after current-source full validation. ' + decision)
print(json.dumps({'acceptedAt': now, 'matrix': matrix, 'stage1MedianSeconds': summary['cadenceSeconds'],
                  'mixGateCount': 54, 'browserPassed': summary['browserPassed'],
                  'shippedAudioBytes': summary['shippedAudioBytes']}))
