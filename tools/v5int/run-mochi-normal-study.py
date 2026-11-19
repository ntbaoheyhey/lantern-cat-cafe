"""Two unthrottled counter-only baselines on the pinned Mochi-only artifact."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import os
import signal
import subprocess
import sys
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
pre_path = Path(sys.argv[1]).resolve()
pre = json.loads(pre_path.read_text())
base = Path(pre['output'])
assert base.is_relative_to(ROOT / 'work/v5/CXI/batch-m')
assert not (base / 'run.json').exists()
sha = lambda b: hashlib.sha256(b).hexdigest()
now = lambda: datetime.now(timezone.utc)
deadline = datetime.fromisoformat(pre['leaseDeadline'])
record = dict(utc=now().isoformat(), preregistration=dict(path=str(pre_path), sha256=sha(pre_path.read_bytes())),
              sourceCommit=pre['sourceCommit'], indexSha256=pre['indexSha256'], url=pre['url'],
              runs=[], verified=[], pass_=False, productionAcceptance=False)


def save():
    (base / 'run.json').write_text(json.dumps(record, indent=2) + '\n')


def stop():
    for name in ['STOP-ALL', 'STOP-CXI']:
        assert not Path('/Users/bao/taskbar-hero-mailbox', name).exists(), name
    assert now() < deadline, 'Timing lease expired'


def load(ref):
    data = Path(ref['path']).read_bytes()
    assert sha(data) == ref['sha256'], ref['path']
    return data


def served(path=''):
    url = pre['url'] if not path else 'http://127.0.0.1:6301/' + path.lstrip('/')
    with urllib.request.urlopen(url, timeout=15) as response:
        return response.read()


child = None
try:
    stop()
    assert [r['sampling'] for r in pre['trials']] == ['off', 'off']
    build = json.loads(load(pre['build']))
    assert build['sourceCommit'] == pre['sourceCommit'] and build['indexSha256'] == pre['indexSha256']
    assert sha(served()) == pre['indexSha256']
    assert subprocess.run(['git', 'diff', '--quiet', pre['sourceCommit'], '--', *build['equivalencePaths']], cwd=ROOT).returncode == 0
    for ref in pre['helpers']:
        load(ref)
    assert sha(Path(__file__).read_bytes()) == pre['runnerSha256']
    for ref in build['runtimeSources']:
        relative = str(Path(ref['path']).relative_to(ROOT))
        data = subprocess.check_output(['git', 'show', pre['sourceCommit'] + ':' + relative], cwd=ROOT)
        assert sha(data) == ref['sha256'] == sha(Path(ref['path']).read_bytes())
        record['verified'].append(dict(kind='source', path=relative, sha256=ref['sha256']))
    artifact = json.loads(load(pre['artifact']))
    assert artifact['indexSha256'] == pre['indexSha256']
    for item in artifact['artifacts'] + artifact['mediaFiles']:
        path = item.get('path', item.get('url')).lstrip('/')
        target = (Path(build['dist']) / path).resolve()
        assert target.is_relative_to(Path(build['dist']))
        data = target.read_bytes()
        assert len(data) == item['bytes'] and sha(data) == item['sha256'] and served(path) == data
        record['verified'].append(dict(kind='served', path=path, sha256=item['sha256']))
    save()
    for trial in pre['trials']:
        stop()
        assert sha(served()) == pre['indexSha256']
        folder = base / trial['name']
        assert not folder.exists()
        (base / (trial['name'] + '-host-before.txt')).write_bytes(subprocess.check_output(['ps', '-axo', 'pid,pcpu,etime,comm']))
        env = dict(os.environ, CXV_MEDIA_BUILD=pre['build']['path'], CXV_MEDIA_CAT='mochi',
                   CXV_FULL_FIXTURE=pre['helpers'][0]['path'], CXV_CAPTURE_OUT=str(folder),
                   CXV_SERVED_SOURCE=pre['sourceCommit'], CXV_EXPECTED_INDEX=pre['indexSha256'],
                   CXV_FULL_CPU_RATE=str(pre['cpuRate']), CXI_OBSERVER_MODE='counters', CXI_CPU_SAMPLE=trial['sampling'])
        row = dict(trial, startedUTC=now().isoformat())
        record['runs'].append(row)
        child = subprocess.Popen(['node', pre['helpers'][1]['path']], cwd=ROOT, env=env,
                                 stdin=subprocess.DEVNULL, start_new_session=True)
        row['pid'] = row['pgid'] = child.pid
        save()
        try:
            code = child.wait(timeout=max(1, min(240, (deadline - now()).total_seconds() - 2)))
        except subprocess.TimeoutExpired:
            os.killpg(child.pid, signal.SIGTERM)
            try:
                child.wait(timeout=3)
            except subprocess.TimeoutExpired:
                os.killpg(child.pid, signal.SIGKILL)
                child.wait()
            raise RuntimeError('Preserved timed-out trial; owned process group terminated')
        child = None
        path = folder / 'report.json'
        data = path.read_bytes() if path.exists() else b''
        raw = json.loads(data) if data else {}
        row.update(finishedUTC=now().isoformat(), exitCode=code, raw=dict(path=str(path), sha256=sha(data)))
        save()
        (base / (trial['name'] + '-host-after.txt')).write_bytes(subprocess.check_output(['ps', '-axo', 'pid,pcpu,etime,comm']))
        print(json.dumps(row), flush=True)
        assert code == 0 and raw['pass'] and raw['cpuRate'] == pre['cpuRate'] == 1
        assert raw['artifactIdentity']['roster'] == ['mochi', 'clover', 'panko', 'mallow']
        assert raw['artifactIdentity']['mediaCats'] == ['mochi']
        assert raw['artifactIdentity']['observerMode'] == 'counters'
        assert raw['cpuSampling']['mode'] == trial['sampling']
    record['pass_'] = True
except Exception as error:
    record['failure'] = repr(error)
    raise
finally:
    if child is not None and child.poll() is None:
        os.killpg(child.pid, signal.SIGTERM)
        child.wait(timeout=5)
    record['finishedUTC'] = now().isoformat()
    save()
    print(json.dumps(dict(finishedUTC=record['finishedUTC'], pass_=record['pass_'], trials=len(record['runs']))), flush=True)
