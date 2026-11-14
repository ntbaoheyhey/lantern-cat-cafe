"""Refresh dependent evidence only after cadence8's full validation succeeds."""
from pathlib import Path
import datetime
import hashlib
import json
import os
import shutil
import subprocess

root = Path(__file__).resolve().parents[3]
b = Path('/Users/bao/taskbar-hero-chain')
out = Path(os.environ.get('ACCEPT_OUTPUT_DIR', str(root / 'reports/v3-solo/S4/bark-cadence8')))
trial = os.environ.get('MIX_ACCEPT_TRIAL', '46-bark-cadence8')
cadence_path = os.environ.get('CADENCE_ACCEPT_PATH',
    'reports/v3-shell/b2/polish/S4/bark-cadence8/current-cadence.json')
validation = json.loads(Path(os.environ.get('ACCEPT_VALIDATION_PATH', str(out / 'validation-progress.json'))).read_text())
assert validation.get('collectionComplete'), 'Complete the retained validation first'
latest_steps = {row['name']: row for row in validation['steps'] if row['name'] != 'finish'}
assert all(row.get('exitCode') == 0 for row in latest_steps.values())

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

for path, expected in validation['sourceHashes'].items():
    assert digest(Path(path)) == expected, 'Source changed: ' + path
for row in latest_steps.values():
    assert digest(Path(row['log'])) == row.get('logSha256', row.get('sha256')), row['name']

progress = out / 'finish-progress.json'
state = json.loads(progress.read_text()) if progress.exists() else {'steps': []}

def save():
    state['updated'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    progress.write_text(json.dumps(state, indent=2) + '\n')

def run(name, command, cwd=root, env=None):
    if any(r['name'] == name and r.get('exitCode') == 0 and
           digest(Path(r['log'])) == r['logSha256'] for r in state['steps']):
        print('Retained', name, flush=True)
        return
    log = out / (name + '.log')
    with log.open('w') as stream:
        child = subprocess.Popen(command, cwd=cwd, env={**os.environ, **(env or {})},
                                 stdout=stream, stderr=subprocess.STDOUT)
        row = {'name': name, 'pid': child.pid, 'log': str(log), 'command': command,
               'cwd': str(cwd), 'started': datetime.datetime.now(datetime.timezone.utc).isoformat()}
        state['steps'].append(row)
        save()
        print('START', name, child.pid, flush=True)
        row['exitCode'] = child.wait()
    row['logSha256'] = digest(log)
    row['ended'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    save()
    print('END', name, row['exitCode'], flush=True)
    if row['exitCode']:
        raise SystemExit('Failed ' + name + '; inspect evidence, never bypass')

run('speech-audit', ['node', 'scripts/audio/audit-speech-cadence.mjs', trial,
    cadence_path], b)
run('mix-preaccept', ['node', 'scripts/audio/check-mix-candidate.mjs', trial], b)

# The retained render differs only in the bark scheduler and its unit test.
# Confirm that every rendered production path is otherwise byte-identical.
old = '003505e95960422417f57c1da59e80f272fdc04b'
diff = subprocess.check_output(['git', 'diff', '--name-only', old, 'HEAD', '--', 'apps', 'packages'],
                               cwd=root, text=True).splitlines()
assert set(diff) <= {'apps/web/src/game/cardrpg/battle-v3/battle-audio.ts',
                     'apps/web/src/game/cardrpg/battle-v3/audio-timeline.test.ts',
                     'apps/web/src/game/cardrpg/ui-v3/IntroductionA6.tsx'}, diff
# The authorized shell cherry-pick changes one banner label only; it cannot
# invalidate the retained battle renderer captures.
intro = 'apps/web/src/game/cardrpg/ui-v3/IntroductionA6.tsx'
old_intro = subprocess.check_output(['git', 'show', old + ':' + intro], cwd=root, text=True)
assert (root / intro).read_text() == old_intro.replace('<small>NOW OPEN</small>', '<small>Unlocked</small>')
suite = json.loads((root / 'reports/v3-battle/a2/M1/suite.json').read_text())
assert all(suite.get(key) == 0 for key in ['typecheckExit', 'unitExit', 'e2eExit', 'parityExit'])
browser_path = root / os.environ.get('A_BROWSER_RESULT',
    'reports/v3-solo/tests/q9-s4-bark-cadence8-browser.json')
browser = json.loads(browser_path.read_text())
assert len(browser['rows']) == 3 and sum(r['passed'] for r in browser['rows']) == 435
for row in browser['rows']:
    assert row['exitCode'] == 0 and digest(root / row['log']) == row['sha256']
suite['verification'] = {'browser': {'path': str(browser_path.relative_to(root)),
                                   'sha256': digest(browser_path), 'passed': 435},
                         'commandLogs': {name: {'path': f'reports/v3-battle/a2/M1/suite-{name}.log',
                             'sha256': digest(root / f'reports/v3-battle/a2/M1/suite-{name}.log')}
                             for name in ['typecheck', 'unit', 'e2e', 'parity']}}
for card in ['F1', 'F2', 'M1', 'V2', 'V3']:
    path = root / f'reports/v3-battle/a2/{card}/suite.json'
    path.write_text(json.dumps(suite, indent=2) + '\n')

copies = []
for fixture in ['wave1', 'wave3', 'boss']:
    source = root / 'reports/v3-solo/S4/lead-in6' / fixture
    for card in ['M1', 'V2']:
        destination = root / f'reports/v3-battle/a2/{card}/capture' / fixture
        destination.mkdir(parents=True, exist_ok=True)
        for name in ['capture.json', 'battle.webm']:
            shutil.copy2(source / name, destination / name)
            assert digest(source / name) == digest(destination / name)
            copies.append({'from': str((source / name).relative_to(root)),
                           'to': str((destination / name).relative_to(root)),
                           'sha256': digest(source / name)})
(out / 'render-reuse-proof.json').write_text(json.dumps({'captureRevision': old,
    'currentRevision': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip(),
    'productionDiff': diff, 'copies': copies,
    'reason': 'Only optional bark timing changed after these complete motion/field captures. The renderer, model, voice windows, sequence, rigs, effects and rules are unchanged; raw metadata is preserved.'}, indent=2) + '\n')

run('field-audit', ['node', 'scripts/v3a2/field-audit.mjs'])
run('field-collect', ['node', 'scripts/v3a2/collect-field.mjs'])
run('clarity-audit', ['node', 'scripts/v3a2/clarity-audit.mjs'])
run('motion-metrics', ['tools/.venv/bin/python', 'scripts/v3a2/motion-metrics.py'])
run('field-skill-metrics', ['tools/.venv/bin/python', 'scripts/v3a2/field-skill-metrics.py'])
v3path = root / 'reports/v3-battle/a2/V3/metrics.json'
v3 = json.loads(v3path.read_text())
v3['suite'] = suite
v3path.write_text(json.dumps(v3, indent=2) + '\n')
run('enemy-gates', ['node', 'scripts/v3solo/collect-q3.mjs'])
run('a-gates', ['node', 'scripts/v3a2/check-gates.mjs',
    'G0', 'R', 'F1', 'F2', 'M1', 'M2', 'V1', 'V2', 'V3', 'T1', 'P'])

run('interruptions', ['node', 'scripts/audio/voice-interruptions.mjs'], b, {'MIX_TRIAL': trial})
run('callout-coverage', ['node', 'scripts/audio/verify-render-callouts.mjs', trial], b)
run('runtime-layers', ['node', 'scripts/audio/summarize-runtime-layers.mjs', trial], b)
run('mix-publish', ['node', 'scripts/audio/summarize-mix.mjs'], b, {'ACCEPT_TRIAL': trial})
run('mix-chart', [str(b / 'tools/.venv/bin/python'), 'scripts/audio/plot-mix.py'], b)
for card in ['S1', 'S3', 'S4', 'S5', 'S7', 'V']:
    run('b-' + card, ['node', 'scripts/v3b2/check-gates.mjs', '--card', card], b)
run('p3-gates', ['node', 'scripts/audio/check-scene-layers.mjs'], b)
run('q2-collect', ['node', 'scripts/v3solo/collect-q2.mjs', trial])
run('solo-gates', ['node', 'scripts/v3solo/check-solo.mjs'])
state['complete'] = True
save()
print('All acceptance checks passed; review sheets, update state and commit.', flush=True)
