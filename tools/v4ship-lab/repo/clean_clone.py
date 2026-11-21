"""Test an exact remote checkout without copying the developer's local config."""
from pathlib import Path
import datetime, gzip, hashlib, json, os, socket, subprocess, sys, tempfile, time
import urllib.request

root = Path(__file__).resolve().parents[3]
out = (root / sys.argv[1]).resolve()
if not out.is_relative_to(root / 'reports/v4-ship/S6') or out.exists():
    raise RuntimeError('Choose a new S6 result directory')
if (root / 'STOP-V4SHIP').exists():
    raise RuntimeError('STOP-V4SHIP')
branch = subprocess.check_output(['git', 'branch', '--show-current'], cwd=root, text=True).strip()
if branch != 'codex/v4-ship-2026-11-16':
    raise RuntimeError('Integration branch required')
head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
method = os.environ.get('V4_CLONE_METHOD', 'remote')
if method not in ['remote', 'published-local']:
    raise RuntimeError('Choose remote or published-local clone transport')
remote = 'https://github.com/ntbaoheyhey/lantern-cat-cafe.git'
out.mkdir(parents=True)
clone = Path(tempfile.mkdtemp(prefix='v4ship-clean-')) / 'repo'
env = {k: v for k, v in os.environ.items() if k in ['PATH', 'HOME', 'TMPDIR', 'PNPM_HOME', 'XDG_CACHE_HOME', 'LANG']}
env.update({'CI': '1', 'NO_COLOR': '1'})
rows, logs = [], []
report = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'sourceCommit': head,
          'branch': branch, 'clone': str(clone), 'cloneMethod': method,
          'scope': 'Fresh Git checkout of an origin-verified commit; no copied node_modules, environment files or local backend',
          'rows': rows, 'officialClassParityGate': False, 'historyScan': 'Separate existing S1 scan; not repeated here',
          'complete': False, 'pass': False}


def save():
    data = gzip.compress(('\n'.join(logs) + '\n').encode(), mtime=0)
    (out / 'log.jsonl.gz').write_bytes(data)
    report['log'] = {'path': str((out / 'log.jsonl.gz').relative_to(root)), 'sha256': hashlib.sha256(data).hexdigest()}
    (out / 'check.json').write_text(json.dumps(report, indent=2) + '\n')


def run(name, command, cwd=clone, timeout=900, extra=None):
    if (root / 'STOP-V4SHIP').exists():
        raise RuntimeError('STOP-V4SHIP')
    print(json.dumps({'name': name, 'status': 'running'}), flush=True)
    started = time.monotonic()
    try:
        result = subprocess.run(command, cwd=cwd, env={**env, **(extra or {})}, capture_output=True, text=True, timeout=timeout)
        code, stdout, stderr = result.returncode, result.stdout, result.stderr
    except subprocess.TimeoutExpired as error:
        code = 124
        stdout = error.stdout or b''
        stderr = error.stderr or b''
        stdout = stdout.decode(errors='replace') if isinstance(stdout, bytes) else stdout
        stderr = stderr.decode(errors='replace') if isinstance(stderr, bytes) else stderr
    logs.append(json.dumps({'name': name, 'stdout': stdout, 'stderr': stderr}))
    row = {'name': name, 'command': command, 'exitCode': code, 'seconds': round(time.monotonic() - started, 3)}
    rows.append(row)
    save()
    print(json.dumps(row), flush=True)
    return code


try:
    save()
    advertised = subprocess.check_output(['git', 'ls-remote', remote, f'refs/heads/{branch}'],
                                        cwd=root, env=env, text=True, timeout=60).strip().split()
    report['originAdvertisedCommit'] = advertised[0] if advertised else None
    if report['originAdvertisedCommit'] != head:
        raise RuntimeError('Origin does not advertise the requested commit')
    source = remote if method == 'remote' else root.as_uri()
    # file:// uses Git's transport to make an independent shallow clone; it
    # does not copy untracked files, .env files or the source node_modules.
    if run('clone', ['git', 'clone', '--depth', '1', '--single-branch', '--branch', branch, '--no-tags',
                     source, str(clone)], cwd=root, timeout=1800):
        raise RuntimeError('Git clone failed; evidence preserved')
    checkout = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=clone, text=True).strip()
    report['checkoutCommit'] = checkout
    report['checkoutTree'] = subprocess.check_output(['git', 'rev-parse', 'HEAD^{tree}'], cwd=clone, text=True).strip()
    report['sourceTree'] = subprocess.check_output(['git', 'rev-parse', f'{head}^{{tree}}'], cwd=root, text=True).strip()
    report['sharedObjectAlternates'] = (clone / '.git/objects/info/alternates').exists()
    if checkout != head:
        raise RuntimeError('Checkout differs from the requested commit')
    if report['checkoutTree'] != report['sourceTree'] or report['sharedObjectAlternates']:
        raise RuntimeError('Checkout tree mismatch or dependent object store')
    report['initialTrackedChanges'] = subprocess.check_output(['git', 'status', '--porcelain'], cwd=clone, text=True).splitlines()
    if report['initialTrackedChanges']:
        raise RuntimeError('Fresh checkout is unexpectedly dirty')
    if run('submodules', ['git', 'submodule', 'update', '--init', '--recursive']):
        raise RuntimeError('Pinned submodule setup failed; evidence preserved')
    report['submodules'] = subprocess.check_output(['git', 'submodule', 'status', '--recursive'], cwd=clone, text=True).splitlines()
    report['versions'] = {name: subprocess.check_output(command, env=env, text=True).splitlines()[0]
                          for name, command in [('node', ['node', '--version']), ('pnpm', ['pnpm', '--version']), ('forge', ['forge', '--version'])]}
    if run('install', ['pnpm', 'install', '--frozen-lockfile']):
        raise RuntimeError('Frozen dependency installation failed; evidence preserved')
    run('typecheck', ['pnpm', 'typecheck'])
    run('workspace-tests', ['pnpm', 'test'])
    run('server', ['pnpm', '--filter', '@taskbar-hero/supabase-tests', 'test'])
    run('receipt-verifier', ['node', '--test', 'tools/v4ship-lab/proof/receipt-check.test.mjs'])
    run('forge', ['forge', 'test', '--root', 'contracts', '-vv'])
    run('build', ['pnpm', 'build'])
    # Reserve only a SHIP port. Never attach to another checkout's Vite server.
    with socket.socket() as reservation:
        reservation.bind(('127.0.0.1', 5996))
    (clone / 'work').mkdir(exist_ok=True)
    vite_log = tempfile.TemporaryFile(mode='w+')
    vite = subprocess.Popen(['node', 'node_modules/vite/bin/vite.js', '--config', '../../tools/v3-demo/vite.config.mts',
                             '--host', '127.0.0.1', '--port', '5996', '--strictPort'],
                            cwd=clone / 'apps/web', env=env, stdout=vite_log, stderr=vite_log)
    try:
        deadline = time.monotonic() + 60
        while True:
            if vite.poll() is not None:
                raise RuntimeError('Clean-clone Vite failed to start')
            try:
                with urllib.request.urlopen('http://127.0.0.1:5996', timeout=1) as response:
                    if response.status == 200:
                        break
            except OSError:
                pass
            if time.monotonic() >= deadline:
                raise RuntimeError('Clean-clone Vite readiness timed out')
            time.sleep(.25)
        run('parity-probe', ['node', 'scripts/v4ship/parity.mjs'], extra={
            'V4_PARITY_MODE': 'probe', 'V4_BASE_URL': 'http://127.0.0.1:5996',
            'V4_PARITY_OUTPUT': str(clone / 'work/parity-probe.json')})
        if (clone / 'work/parity-probe.json').is_file():
            (out / 'parity-probe.json').write_bytes((clone / 'work/parity-probe.json').read_bytes())
    finally:
        if vite.poll() is None:
            vite.terminate()
            try:
                vite.wait(timeout=15)
            except subprocess.TimeoutExpired:
                vite.kill()
                vite.wait()
        vite_log.seek(0)
        logs.append(json.dumps({'name': 'vite', 'text': vite_log.read()}))
        vite_log.close()
    report['finalTrackedChanges'] = subprocess.check_output(['git', 'diff', '--name-only', 'HEAD'], cwd=clone, text=True).splitlines()
    report['complete'] = True
    report['commandsPassed'] = all(row['exitCode'] == 0 for row in rows)
    report['pass'] = report['commandsPassed'] and not report['finalTrackedChanges']
except Exception as error:
    # Messages here are controlled diagnostics, never raw process output.
    report['failure'] = type(error).__name__
    report['complete'] = False
    report['pass'] = False
    print(json.dumps({'status': 'failed', 'kind': type(error).__name__, 'evidence': str(out.relative_to(root))}), flush=True)
finally:
    save()
print(json.dumps({'complete': report['complete'], 'pass': report['pass'], 'commands': len(rows)}), flush=True)
sys.exit(0 if report['pass'] else 1)
