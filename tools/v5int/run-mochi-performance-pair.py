"""Frozen Mochi/native-squad timing diagnostic; no application or registry edits."""
from pathlib import Path
from datetime import datetime, timezone
import argparse
import hashlib
import json
import os
import subprocess
import sys
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
LANE = Path('/Users/bao/taskbar-hero-cardrpg-a6')
parser = argparse.ArgumentParser()
parser.add_argument('preregistration', type=Path)
args = parser.parse_args()
pre_path = args.preregistration.resolve()
pre_bytes = pre_path.read_bytes()
pre = json.loads(pre_bytes)
out = Path(pre['output'])
assert out.is_relative_to(ROOT / 'work/v5/CXI') and not out.exists()
sha = lambda value: hashlib.sha256(value).hexdigest()


def load(ref):
    data = Path(ref['path']).read_bytes()
    assert sha(data) == ref['sha256'], ref['path']
    return data


def stop():
    for name in ['STOP-ALL', 'STOP-CXI']:
        assert not Path('/Users/bao/taskbar-hero-mailbox', name).exists(), name


def served(url):
    with urllib.request.urlopen(url, timeout=15) as response:
        return response.read()


stop()
build_bytes = load(pre['build'])
build = json.loads(build_bytes)
assert pre['rates'] == [1, 4] and pre['mediaCat'] == 'mochi'
assert pre['roster'] == ['mochi', 'panko', 'mallow', 'sorrel']
assert pre['sourceCommit'] == build['sourceCommit']
assert pre['indexSha256'] == build['indexSha256']
assert pre['url'] == 'http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3'
dist = Path(build['dist'])
assert sha(served(pre['url'])) == sha((dist / 'index.html').read_bytes()) == pre['indexSha256']
verified = []
for item in build['runtimeSources']:
    relative = Path(item['path']).relative_to(ROOT).as_posix()
    data = subprocess.check_output(['git', 'show', build['sourceCommit'] + ':' + relative], cwd=ROOT)
    assert sha(data) == item['sha256'], relative
    verified.append({'kind': 'source', 'path': relative, 'sha256': sha(data)})
for item in build['files']:
    data = Path(item['path']).read_bytes()
    assert sha(data) == item['sha256'] and len(data) == item['bytes']
    assert served('http://127.0.0.1:6301' + item['url']) == data
    verified.append({'kind': 'media', 'path': item['url'], 'sha256': sha(data)})
for path in sorted((dist / 'assets').rglob('*')):
    if path.is_file() and path.suffix in ['.js', '.css']:
        relative = path.relative_to(dist).as_posix()
        data = path.read_bytes()
        assert served('http://127.0.0.1:6301/' + relative) == data
        verified.append({'kind': 'servedAsset', 'path': relative, 'sha256': sha(data)})
out.mkdir(parents=True)
frozen = []
for item in pre['helpers']:
    original = load(item)
    name = Path(item['path']).name
    text = original.decode()
    if name == 'capture-full-battle-production.mjs':
        old = "const root=resolve(import.meta.dirname,'../..');"
        assert text.count(old) == 1
        text = text.replace(old, 'const root=' + json.dumps(str(ROOT)) + ';')
        text = text.replace('work/v5/CXV', 'work/v5/CXI')
    text = text.replace("'STOP-CXV'", "'STOP-CXI'")
    path = out / name
    path.write_text(text)
    frozen.append({'path': str(path), 'sha256': sha(path.read_bytes()), 'original': item})
subprocess.run(['node', '--check', str(out / 'capture-full-battle-production.mjs')], check=True)
record = {'utc': datetime.now(timezone.utc).isoformat(), 'preregistration': {'path': str(pre_path), 'sha256': sha(pre_bytes)},
          'build': pre['build'], 'sourceCommit': build['sourceCommit'], 'indexSha256': build['indexSha256'],
          'verified': verified, 'helpers': frozen, 'runs': [], 'productionAcceptance': False,
          'limits': pre['limits']}
(out / 'verification.json').write_text(json.dumps(record, indent=2) + '\n')
(out / 'host-load-before.txt').write_bytes(subprocess.check_output(['ps', '-axo', 'pid,pcpu,etime,comm']))
print(json.dumps({'verified': len(verified), 'output': str(out), 'rates': pre['rates']}), flush=True)
for rate in pre['rates']:
    stop()
    capture = out / ('cpu' + str(rate))
    env = dict(os.environ, CXV_MEDIA_BUILD=pre['build']['path'], CXV_MEDIA_CAT='mochi',
               CXV_FULL_FIXTURE=str(out / 'media-production-fixture.mjs'), CXV_CAPTURE_OUT=str(capture),
               CXV_SERVED_SOURCE=build['sourceCommit'], CXV_EXPECTED_INDEX=build['indexSha256'], CXV_FULL_CPU_RATE=str(rate))
    started = datetime.now(timezone.utc).isoformat()
    process = subprocess.run(['node', str(out / 'capture-full-battle-production.mjs')], cwd=ROOT, env=env)
    raw_path = capture / 'report.json'
    raw = json.loads(raw_path.read_text()) if raw_path.exists() else {}
    row = {'rate': rate, 'startedUTC': started, 'finishedUTC': datetime.now(timezone.utc).isoformat(),
           'exitCode': process.returncode, 'raw': {'path': str(raw_path), 'sha256': sha(raw_path.read_bytes()) if raw_path.exists() else None}}
    record['runs'].append(row)
    (out / 'run.json').write_text(json.dumps(record, indent=2) + '\n')
    print(json.dumps(row), flush=True)
    if process.returncode:
        sys.exit(process.returncode)
    assert raw['pass'] and raw['cpuRate'] == rate
    assert raw['artifactIdentity']['mediaCats'] == ['mochi']
    assert raw['artifactIdentity']['roster'] == pre['roster']
(out / 'host-load-after.txt').write_bytes(subprocess.check_output(['ps', '-axo', 'pid,pcpu,etime,comm']))
record['finishedUTC'] = datetime.now(timezone.utc).isoformat()
(out / 'run.json').write_text(json.dumps(record, indent=2) + '\n')
print(json.dumps({'finishedUTC': record['finishedUTC'], 'completedRuns': len(record['runs'])}), flush=True)
