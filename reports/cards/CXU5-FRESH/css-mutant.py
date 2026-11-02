from pathlib import Path
import datetime
import hashlib
import json
import shlex
import subprocess
import sys

role = sys.argv[1]
assert role in ['a', 'b']
root = Path('/private/tmp/tbh-cxu5-hud-repair')
card = Path('/private/tmp/tbh-t001-ledger/reports/cards/CXU5-FRESH')
out = card / ('css-mutant-' + role)
out.mkdir(exist_ok=True)
target = root / 'apps/web/src/shell/shell.css'
head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
assert head == 'f846b49eb5921d05c6ddc39060889b05ac4c5e3f'
assert subprocess.check_output(['git', 'status', '--porcelain'], cwd=root, text=True).strip() == ''
original = target.read_text()
start = original.index('@media (min-width: 1200px) and (max-width: 1399px)')
end = original.index('/* Intermediate windows retain every status item by allowing another line. */', start)
block = original[start:end]
mutated = original[:start] + ('' if role == 'a' else block.replace('auto 160px', 'auto 120px')) + original[end:]
base = 4780 if role == 'a' else 4790
command = f'E2E_PORT_CLASSIC={base} E2E_PORT_V2={base+1} E2E_PORT_SERVER={base+2} E2E_PORT_API={base+3} npx -y pnpm@10.28.0 --filter @taskbar-hero/web exec playwright test e2e/ui/baseline-hud.spec.ts --grep "late chapter HUD" --workers=1 --retries=0 --reporter=line'

def run(name):
    log = out / (name + '.log')
    result = subprocess.run(['/bin/zsh', '-c', command + ' > ' + shlex.quote(str(log)) + ' 2>&1; task_rc=$?; echo exit=$task_rc; exit $task_rc'], cwd=root, capture_output=True, text=True)
    (out / (name + '.exit')).write_text(str(result.returncode) + '\n')
    print(name, result.stdout.strip(), flush=True)
    return result.returncode

assert run('control') == 0
try:
    target.write_text(mutated)
    (out / 'mutant.patch').write_text(subprocess.check_output(['git', 'diff', '--', str(target)], cwd=root, text=True))
    code = run('mutant')
    log = (out / 'mutant.log').read_text()
    killed = code != 0 and '2 failed' in log and '2 passed' in log and ('inside' in log if role == 'a' else '150' in log)
    result = dict(head=head, role=role, label='remove compact-desktop XP layout' if role == 'a' else 'shrink protected XP width', command=command, controlExit=0, mutantExit=code, killed=killed, originalSha256=hashlib.sha256(original.encode()).hexdigest(), mutatedSha256=hashlib.sha256(mutated.encode()).hexdigest(), at=datetime.datetime.now(datetime.timezone.utc).isoformat())
    (out / 'result.json').write_text(json.dumps(result, indent=2) + '\n')
    assert killed
finally:
    target.write_text(original)
    assert subprocess.check_output(['git', 'status', '--porcelain'], cwd=root, text=True).strip() == ''
