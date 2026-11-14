"""Serial acceptance after the P3 music encoding change; no old mix is promoted."""
from pathlib import Path
import datetime
import hashlib
import json
import os
import subprocess
import time

a = Path(__file__).resolve().parents[3]
b = Path('/Users/bao/taskbar-hero-chain')
out = a / 'reports/v3-solo/S4/budget47'
out.mkdir(parents=True, exist_ok=True)
progress = out / 'progress.json'
trial = '47-budget'
runtime = b / 'work/v3solo-integration'
env = {'AUDIO_RUNTIME_ROOT': str(runtime), 'AUDIO_URL': 'http://127.0.0.1:5996',
       'AUDIO_PYTHON': str(b / 'tools/.venv/bin/python'), 'MIX_TRIAL': trial}

def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

old_path = a / 'reports/v3-solo/S4/bark-cadence8/validation-progress.json'
old = json.loads(old_path.read_text())
sources = [Path(path) for path in old['sourceHashes']]
sources.append(a / 'apps/web/src/game/cardrpg/ui-v3/IntroductionA6.tsx')
manifest = json.loads((b / 'apps/web/public/audio/manifest.json').read_text())
for pack in manifest['packs'].values():
    for kind in ['webm', 'mp3']:
        sources.append(b / 'apps/web/public' / pack[kind].lstrip('/'))
signature = {str(path): sha(path) for path in sorted(set(sources))}
state = json.loads(progress.read_text()) if progress.exists() else {
    'trial': trial, 'sourceHashes': signature, 'steps': []}
if state['sourceHashes'] != signature:
    raise SystemExit('Sources changed; preserve this result and use a new trial label.')

# The failed historical browser result remains unchanged. Only independent,
# successful A renderer reviews survive the B audio re-encode and banner fix.
for path, expected in old['sourceHashes'].items():
    if Path(path).is_relative_to(a):
        assert sha(path) == expected, 'A battle source changed: ' + path
retained = []
for name in ['motion-review', 'field-skill-review', 'audio-review']:
    row = next(row for row in reversed(old['steps']) if row['name'] == name)
    assert row.get('exitCode') == 0 and sha(row['log']) == row['logSha256'], name
    retained.append(row)
state['retainedAReviews'] = retained
state['priorValidation'] = {'path': str(old_path), 'sha256': sha(old_path),
    'browserResult': 'failed; replaced by a fresh current-source browser run'}

def save():
    state['updated'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    progress.write_text(json.dumps(state, indent=2) + '\n')

def run(name, command, cwd=b, extra=None):
    if any(sha(path) != expected for path, expected in signature.items()):
        raise SystemExit('Source changed before ' + name)
    if any(r['name'] == name and r.get('exitCode') == 0 and sha(r['log']) == r['sha256'] for r in state['steps']):
        print('RETAIN', name, flush=True)
        return
    log = out / (name + '.log')
    with log.open('w') as stream:
        child = subprocess.Popen(command, cwd=cwd, stdout=stream, stderr=subprocess.STDOUT,
                                 env={**os.environ, **env, **(extra or {})})
        row = {'name': name, 'pid': child.pid, 'command': command, 'cwd': str(cwd),
               'log': str(log), 'started': datetime.datetime.now(datetime.timezone.utc).isoformat()}
        state['steps'].append(row)
        save()
        print('START', name, child.pid, flush=True)
        row['exitCode'] = child.wait()
    row['sha256'] = sha(log)
    row['ended'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    save()
    print('END', name, row['exitCode'], flush=True)
    if row['exitCode']:
        raise SystemExit('Failed ' + name + '; retain evidence and diagnose before retry')

save()
run('a-suite', ['node', 'scripts/v3a2/run-suite.mjs', 'M1'], cwd=a)
run('a-browser', ['python3', 'scripts/v3solo/run-browser-suite.py', 'q9-s4-budget47'], cwd=a)
run('integration', ['node', 'scripts/audio/prepare-battle-integration.mjs'])
run('voice-matrix', ['node', 'scripts/audio/voice-matrix.mjs'], extra={'VOICE_MATRIX_TRIAL': trial})
cadence = b / 'reports/v3-shell/b2/polish/S4/47-budget'
cadence.mkdir(parents=True, exist_ok=True)
run('cadence', ['node', 'scripts/audio/measure-current-cadence.mjs'], extra={'CADENCE_OUT': str(cadence)})
run('scene-layers', ['node', 'scripts/audio/review-scene-layers.mjs'])
run('mix', ['node', 'scripts/audio/render-runtime.mjs'])
run('mix-gates', ['node', 'scripts/audio/check-mix-candidate.mjs', trial])
run('speech', ['node', 'scripts/audio/audit-speech-cadence.mjs', trial,
              str((cadence / 'current-cadence.json').relative_to(b))])
run('budget-regression', ['node', '--test', 'scripts/audio/shipped-budget.test.mjs',
                         'scripts/audio/audit-speech-cadence.test.mjs'])
run('b-suite', ['node', 'scripts/v3b2/run-solo-unit-suite.mjs', 'q9-p3-budget47'])
run('b-browser', ['python3', 'scripts/v3b2/run-solo-browser-suite.py', 'q9-p3-budget47'])
state['collectionComplete'] = True
save()
run('finish', ['python3', 'reports/v3-solo/S4/finish-bark-cadence8.py'], cwd=a,
    extra={'MIX_ACCEPT_TRIAL': trial, 'CADENCE_ACCEPT_PATH': str((cadence / 'current-cadence.json').relative_to(b)),
           'ACCEPT_VALIDATION_PATH': str(progress), 'ACCEPT_OUTPUT_DIR': str(out),
           'A_BROWSER_RESULT': 'reports/v3-solo/tests/q9-s4-budget47-browser.json'})
state['complete'] = True
save()
print('Acceptance complete; inspect gates and review media before committing.', flush=True)
