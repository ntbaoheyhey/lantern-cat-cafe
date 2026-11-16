"""Frozen exact-commit history batches with durable redacted-only checkpoints."""
from pathlib import Path
import datetime, fcntl, gzip, hashlib, json, os, signal, subprocess, sys, time

root = Path(__file__).resolve().parents[3]
attempt = sys.argv[1]
assert attempt.isdecimal()
folder = root / 'reports/v4-ship/S11' / ('history-batches-' + attempt)
folder.mkdir(exist_ok=True)
stop_file = root / 'STOP-V4SHIP'
assert not stop_file.exists()
git = lambda *args: subprocess.check_output(['git', *args], cwd=root, text=True).splitlines()
assert git('branch', '--show-current') == ['codex/v4-ship-2026-11-16']
now = lambda: datetime.datetime.now(datetime.timezone.utc).isoformat()
sha = lambda data: hashlib.sha256(data).hexdigest()
def atomic(path, data):
    temporary = path.with_name(path.name + '.tmp')
    temporary.write_bytes(data)
    os.replace(temporary, path)

lock_path = root / 'work/v4ship-prep' / ('history-batches-' + attempt + '.lock')
lock_path.parent.mkdir(parents=True, exist_ok=True)
lock = lock_path.open('a+')
fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
lock.seek(0); lock.truncate(); lock.write(str(os.getpid())); lock.flush()
scope_path = folder / 'scope.json'
if not scope_path.exists():
    tips = sorted(set(git('for-each-ref', '--format=%(objectname)')))
    commits = git('rev-list', '--topo-order', *tips)
    assert set(commits) == set(git('rev-list', '--all'))
    packed = gzip.compress(('\n'.join(commits) + '\n').encode(), mtime=0)
    atomic(folder / 'commits.txt.gz', packed)
    scope = {'at': now(), 'head': git('rev-parse', 'HEAD')[0], 'referenceTips': tips, 'commitCount': len(commits), 'commitListSha256': sha(packed), 'batchSize': 25, 'scanner': subprocess.check_output(['gitleaks', 'version'], text=True).strip(), 'harnessSha256': sha(Path(__file__).read_bytes()), 'logOptions': ['-m', '--root', '--no-walk=unsorted']}
    atomic(scope_path, (json.dumps(scope, indent=2) + '\n').encode())
scope = json.loads(scope_path.read_text())
packed = (folder / 'commits.txt.gz').read_bytes()
assert sha(packed) == scope['commitListSha256']
assert sha(Path(__file__).read_bytes()) == scope['harnessSha256']
assert subprocess.check_output(['gitleaks', 'version'], text=True).strip() == scope['scanner']
commits = gzip.decompress(packed).decode().splitlines()
assert len(commits) == len(set(commits)) == scope['commitCount']
assert set(commits) == set(git('rev-list', *scope['referenceTips']))
batches = [commits[i:i + scope['batchSize']] for i in range(0, len(commits), scope['batchSize'])]
checkpoint = folder / 'check.json.gz'
state = json.loads(gzip.decompress(checkpoint.read_bytes())) if checkpoint.exists() else {'scopeSha256': sha(scope_path.read_bytes()), 'rows': [], 'interruptions': []}
assert state['scopeSha256'] == sha(scope_path.read_bytes())
for index, row in enumerate(state['rows']):
    assert row['index'] == index and row['commits'] == batches[index] and row['complete']
stopping = False
def request_stop(*_):
    global stopping
    stopping = True
signal.signal(signal.SIGTERM, request_stop)
signal.signal(signal.SIGINT, request_stop)

def save():
    state.update(at=now(), complete=len(state['rows']) == len(batches), scannedCommits=sum(len(r['commits']) for r in state['rows']), totalCommits=len(commits), findings=sum(len(r['findings']) for r in state['rows']))
    state['fullHistoryPass'] = False
    state['note'] = 'Textual root/per-parent-merge history patches only. Redacted locations still require triage; historical binary/gzip payloads are not inspected by this mode. Later refs/commits require additional coverage.'
    atomic(checkpoint, gzip.compress(json.dumps(state, separators=(',', ':')).encode(), mtime=0))
    progress = {k: state[k] for k in ['at', 'complete', 'scannedCommits', 'totalCommits', 'findings', 'fullHistoryPass', 'note']}
    progress.update(completedBatches=len(state['rows']), totalBatches=len(batches), supervisorPid=os.getpid(), checkpointSha256=sha(checkpoint.read_bytes()))
    atomic(folder / 'progress.json', (json.dumps(progress, indent=2) + '\n').encode())
    return progress

save()
limit = int(os.environ.get('V4_HISTORY_MAX_BATCHES', str(len(batches))))
completed_this_run = 0
for index in range(len(state['rows']), len(batches)):
    if stopping or stop_file.exists() or completed_this_run >= limit:
        break
    batch = batches[index]
    assert set(git('rev-list', '--no-walk=unsorted', *batch)) == set(batch)
    options = ' '.join([*scope['logOptions'], *batch])
    command = ['gitleaks', 'git', '--log-opts=' + options, str(root), '--no-banner', '--no-color', '--redact=100', '--log-level=fatal', '--report-format=json', '--report-path=-', '--ignore-gitleaks-allow']
    started = time.monotonic()
    process = subprocess.Popen(command, cwd=root, stdout=subprocess.PIPE, stderr=subprocess.PIPE, env={**os.environ, 'GOMAXPROCS': '1'})
    print(json.dumps({'batch': index, 'commits': len(batch), 'scannerPid': process.pid, 'supervisorPid': os.getpid(), 'status': 'running'}), flush=True)
    while True:
        try:
            data, errors = process.communicate(timeout=2)
            break
        except subprocess.TimeoutExpired:
            if stopping or stop_file.exists():
                process.terminate()
                data, errors = process.communicate()
                state['interruptions'].append({'at': now(), 'batch': index, 'reason': 'stop requested; incomplete batch must rerun'})
                save()
                sys.exit(0)
    if process.returncode not in (0, 1):
        state['interruptions'].append({'at': now(), 'batch': index, 'reason': 'scanner error; raw output suppressed', 'exitCode': process.returncode})
        save()
        raise RuntimeError('History scanner failed; raw diagnostics suppressed')
    try:
        findings = json.loads(data or b'[]')
    except Exception:
        raise RuntimeError('Invalid scanner JSON; raw output suppressed') from None
    safe = []
    for row in findings:
        commit = row.get('Commit', '')
        assert commit in batch, 'Unexpected finding scope; raw output suppressed'
        safe.append({'commit': commit, 'file': row.get('File', '').removeprefix(str(root) + '/'), 'line': row.get('StartLine'), 'endLine': row.get('EndLine'), 'type': row.get('RuleID'), 'classification': 'unresolved'})
    state['rows'].append({'index': index, 'commits': batch, 'complete': True, 'elapsedSeconds': round(time.monotonic() - started, 3), 'scannerExitCode': process.returncode, 'findings': safe})
    completed_this_run += 1
    print(json.dumps(save()), flush=True)
print(json.dumps(save()), flush=True)
