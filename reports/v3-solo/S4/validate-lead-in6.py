"""Continue the accepted pilot through serial, checkpointed current-build checks."""
from pathlib import Path
import datetime
import hashlib
import json
import os
import subprocess
import time

root = Path(__file__).resolve().parents[3]
b = Path('/Users/bao/taskbar-hero-chain')
out = root / 'reports/v3-solo/S4/lead-in6'
progress = out / 'validation-progress.json'
trial = '44-s4-lead-in6'
sources = [
    root / ('apps/web/src/game/cardrpg/' + name)
    for name in ['depth/model.ts', 'battle-v3/voice-windows.ts',
                 'battle-v3/battle-audio.ts', 'battle-v3/motion.ts',
                 'battle-v3/sequence.ts', 'battle-v3/final-hit.ts']
]
sources += [b / ('apps/web/' + name) for name in
            ['src/audio/engine.ts', 'src/audio/cues.ts', 'public/audio/manifest.json']]

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

signature = {str(path): digest(path) for path in sources}
state = json.loads(progress.read_text()) if progress.exists() else {
    'sourceHashes': signature, 'trial': trial, 'steps': []}
if state['sourceHashes'] != signature:
    raise SystemExit('Source changed; preserve this validation and choose a new label.')

def save():
    state['updated'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    progress.write_text(json.dumps(state, indent=2) + '\n')

def run(name, command, cwd=root, env=None):
    if any(row['name'] == name and row.get('exitCode') == 0
           and digest(Path(row['log'])) == row['logSha256'] for row in state['steps']):
        print('Checkpoint retained:', name, flush=True)
        return
    if any(digest(Path(path)) != value for path, value in signature.items()):
        raise SystemExit('Source changed before ' + name)
    log = out / (name + '.log')
    with log.open('w') as output:
        child = subprocess.Popen(command, cwd=cwd, env={**os.environ, **(env or {})},
                                 stdout=output, stderr=subprocess.STDOUT)
        row = {'name': name, 'pid': child.pid, 'command': command, 'cwd': str(cwd),
               'log': str(log), 'started': datetime.datetime.now(datetime.timezone.utc).isoformat()}
        state['steps'].append(row)
        save()
        print('START', name, child.pid, flush=True)
        row['exitCode'] = child.wait()
    row['logSha256'] = digest(log)
    row['ended'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    save()
    print('END', name, row['exitCode'], flush=True)
    if row['exitCode']:
        raise SystemExit('Failed ' + name + '; inspect its retained log.')

deadline = time.monotonic() + 1800
while True:
    summary = json.loads((out / 'summary.json').read_text())
    if summary.get('allMotionPass'):
        break
    if summary.get('pilotPass') is False or summary.get('allMotionPass') is False:
        raise SystemExit('Pilot rejected; no full validation or canonical promotion.')
    if time.monotonic() > deadline:
        raise SystemExit('Pilot did not finish; inspect its process and checkpoint.')
    time.sleep(10)

run('voice-matrix', ['node', 'scripts/audio/voice-matrix.mjs'], b,
    {'VOICE_MATRIX_TRIAL': trial})
matrix = json.loads((b / 'reports/v3-shell/b2/q2/voice-matrix.json').read_text())
failures = []
for row in matrix['rows']:
    if not (row['ultimateRequired'] > 0 and row['ultimatePlayed'] == row['ultimateRequired']
            and row['ultimateInterrupted'] == 0 and row['skillPlayed'] > 0
            and row['skillInterrupted'] / row['skillPlayed'] <= .05
            and 7 <= row['meanBarkIntervalSeconds'] <= 8
            and row['parity'] and not row['errors']):
        failures.append(row)
if len(matrix['rows']) != 9 or failures:
    (out / 'matrix-failures.json').write_text(json.dumps(failures, indent=2) + '\n')
    raise SystemExit('Voice matrix failed; preserve captures and repair timing first.')

# No simulations or other browser jobs run during these performance captures.
run('motion-review', ['node', 'scripts/v3a2/motion-review.mjs'])
run('field-skill-review', ['node', 'scripts/v3a2/field-skill-review.mjs'])
run('audio-review', ['node', 'scripts/v3a2/audio-review.mjs'])
run('mix-current', ['node', 'scripts/audio/render-runtime.mjs'], b, {
    'MIX_TRIAL': trial, 'AUDIO_RUNTIME_ROOT': str(b / 'work/v3solo-integration'),
    'AUDIO_URL': 'http://127.0.0.1:5996', 'AUDIO_PYTHON': str(b / 'tools/.venv/bin/python')})
run('mix-gates', ['node', 'scripts/audio/check-mix-candidate.mjs', trial], b)
run('suite', ['node', 'scripts/v3a2/run-suite.mjs', 'M1'])
run('browser', ['python3', 'scripts/v3solo/run-browser-suite.py', 'q9-s4-lead-in6'])
state['collectionComplete'] = True
state['canonicalPromotion'] = False
save()
print('Collection complete. Read all numeric gates before canonical promotion.', flush=True)
