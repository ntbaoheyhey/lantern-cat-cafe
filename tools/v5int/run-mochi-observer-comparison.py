"""Run a frozen ABBA observer comparison; never change application sources."""
from pathlib import Path
from datetime import datetime, timezone
import argparse
import hashlib
import json
import os
import subprocess
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
p = argparse.ArgumentParser()
p.add_argument('preregistration', type=Path)
a = p.parse_args()
pre_path = a.preregistration.resolve()
sha = lambda data: hashlib.sha256(data).hexdigest()
pre = json.loads(pre_path.read_text())
base = Path(pre['output'])
assert base.is_relative_to(ROOT / 'work/v5/CXI/batch-m')
assert not (base / 'run.json').exists()
assert [x['observer'] for x in pre['trials']] == ['full', 'counters', 'counters', 'full']
assert pre['cpuRate'] == 4


def stop():
    for name in ['STOP-ALL', 'STOP-CXI']:
        assert not Path('/Users/bao/taskbar-hero-mailbox', name).exists(), name
    assert datetime.now(timezone.utc) < datetime.fromisoformat(pre['leaseDeadline']), 'Lease expired; do not start another run'


def load(ref):
    data = Path(ref['path']).read_bytes()
    assert sha(data) == ref['sha256'], ref['path']
    return data


def served(url):
    with urllib.request.urlopen(url, timeout=15) as response:
        return response.read()


stop()
build = json.loads(load(pre['build']))
old = json.loads(load(pre['priorCapture']))
assert pre['sourceCommit'] == old['sourceCommit'] == build['sourceCommit']
assert pre['indexSha256'] == old['indexSha256'] == build['indexSha256']
dist = Path(build['dist'])
assert sha(served(pre['url'])) == pre['indexSha256']
for item in old['verified']:
    if item['kind'] == 'source':
        data = subprocess.check_output(['git', 'show', pre['sourceCommit'] + ':' + item['path']], cwd=ROOT)
    else:
        relative = item['path'].lstrip('/')
        data = (dist / relative).read_bytes()
        assert served('http://127.0.0.1:6301/' + relative) == data
    assert sha(data) == item['sha256'], item['path']
for item in pre['helpers']:
    load(item)
assert sha(Path(__file__).read_bytes()) == pre['runnerSha256']
record = {'utc': datetime.now(timezone.utc).isoformat(), 'preregistration': {
    'path': str(pre_path), 'sha256': sha(pre_path.read_bytes())}, 'sourceCommit': pre['sourceCommit'],
    'indexSha256': pre['indexSha256'], 'verifiedItems': len(old['verified']), 'runs': [], 'productionAcceptance': False}


def save():
    (base / 'run.json').write_text(json.dumps(record, indent=2) + '\n')


save()
for trial in pre['trials']:
    stop()
    folder = base / trial['name']
    assert not folder.exists()
    (base / (trial['name'] + '-host-before.txt')).write_bytes(subprocess.check_output(['ps', '-axo', 'pid,pcpu,etime,comm']))
    env = dict(os.environ, CXV_MEDIA_BUILD=pre['build']['path'], CXV_MEDIA_CAT='mochi',
               CXV_FULL_FIXTURE=pre['helpers'][0]['path'], CXV_CAPTURE_OUT=str(folder),
               CXV_SERVED_SOURCE=pre['sourceCommit'], CXV_EXPECTED_INDEX=pre['indexSha256'],
               CXV_FULL_CPU_RATE='4', CXI_OBSERVER_MODE=trial['observer'])
    started = datetime.now(timezone.utc).isoformat()
    result = subprocess.run(['node', pre['helpers'][1]['path']], cwd=ROOT, env=env)
    raw_path = folder / 'report.json'
    raw = json.loads(raw_path.read_text()) if raw_path.exists() else {}
    row = dict(trial, startedUTC=started, finishedUTC=datetime.now(timezone.utc).isoformat(), exitCode=result.returncode,
               raw={'path': str(raw_path), 'sha256': sha(raw_path.read_bytes()) if raw_path.exists() else None})
    record['runs'].append(row)
    save()
    print(json.dumps(row), flush=True)
    (base / (trial['name'] + '-host-after.txt')).write_bytes(subprocess.check_output(['ps', '-axo', 'pid,pcpu,etime,comm']))
    assert result.returncode == 0 and raw['pass'] and raw['cpuRate'] == 4
    assert [x['mode'] for x in raw['runs']] == ['normal']
    assert raw['artifactIdentity']['observerMode'] == trial['observer']
record['finishedUTC'] = datetime.now(timezone.utc).isoformat()
save()
print(json.dumps({'finishedUTC': record['finishedUTC'], 'trials': len(record['runs'])}), flush=True)
