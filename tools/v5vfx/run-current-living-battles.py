"""Verify a pinned native build, then capture scoped ordinary battle pairs."""
from pathlib import Path
import argparse
import datetime
import hashlib
import json
import os
import subprocess
import sys
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
INTEGRATION = Path('/Users/bao/taskbar-hero-chain')
p = argparse.ArgumentParser(description=__doc__)
p.add_argument('--build', type=Path, required=True)
p.add_argument('--out', type=Path, required=True)
p.add_argument('--groups', default='0,1,2')
args = p.parse_args()
out = args.out.resolve()
assert out.is_relative_to(ROOT/'work/v5/CXV') and not out.exists()
groups = [int(x) for x in args.groups.split(',')]
assert groups and len(set(groups)) == len(groups) and all(x in [0,1,2] for x in groups)
for name in ['STOP-ALL','STOP-CXV']:
    assert not Path('/Users/bao/taskbar-hero-mailbox',name).exists(), name
build = args.build.resolve()
d = json.loads(build.read_text())
assert d['registryOverride'] is None and not d['productionRegistryChanged']
out.mkdir(parents=True)
sha = lambda data: hashlib.sha256(data).hexdigest()
url = 'http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3'
def served(url):
    with urllib.request.urlopen(url, timeout=15) as response:
        return response.read()
dist = Path(d['dist'])
assert sha(served(url)) == d['indexSha256'] == sha((dist/'index.html').read_bytes())
verified = dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(), url=url,
                sourceCommit=d['sourceCommit'], indexSha256=d['indexSha256'], runtimePatchSha256=sha(b''),
                build=dict(path=str(build),sha256=sha(build.read_bytes())), sourceFiles=[], artifacts=[])
paths = subprocess.check_output(['git','ls-tree','-r','--name-only',d['sourceCommit'],'--',
                                'apps/web/src/game/rig','apps/web/src/game/cardrpg/spine',
                                'packages/game-rules/src/cardrpg'],cwd=INTEGRATION,text=True).splitlines()
for path in paths:
    data = subprocess.check_output(['git','show',d['sourceCommit']+':'+path],cwd=INTEGRATION)
    verified['sourceFiles'].append(dict(path=path,sha256=sha(data),basis='Pinned Git source snapshot'))
for path in sorted((dist/'assets').rglob('*')):
    if not path.is_file() or path.suffix not in ['.js','.css']:
        continue
    relative = path.relative_to(dist).as_posix()
    data = path.read_bytes()
    assert data == served('http://127.0.0.1:6301/'+relative), relative
    verified['artifacts'].append(dict(path=relative,bytes=len(data),sha256=sha(data)))
assert verified['sourceFiles'] and verified['artifacts']
(out/'artifact-verification.json').write_text(json.dumps(verified,indent=2)+'\n')
provenance=[]
for name in ['run-current-living-battles.py','living-production-fixture.mjs','capture-full-battle-production.mjs']:
    data=(ROOT/'tools/v5vfx'/name).read_bytes()
    (out/name).write_bytes(data)
    provenance.append(dict(name=name,sha256=sha(data)))
(out/'harness-provenance.json').write_text(json.dumps(provenance,indent=2)+'\n')
(out/'host-load-before.txt').write_bytes(subprocess.check_output(['ps','-axo','pid,pcpu,etime,comm']))
print(json.dumps(dict(verifiedSourceFiles=len(paths),verifiedArtifacts=len(verified['artifacts']),groups=groups)),flush=True)
for group in groups:
    for name in ['STOP-ALL','STOP-CXV']:
        assert not Path('/Users/bao/taskbar-hero-mailbox',name).exists(),name
    assert sha(served(url)) == d['indexSha256']
    env=os.environ.copy()
    env.update(CXV_M_GROUP=str(group),CXV_FULL_FIXTURE=str(ROOT/'tools/v5vfx/living-production-fixture.mjs'),
               CXV_SERVED_SOURCE=d['sourceCommit'],CXV_EXPECTED_INDEX=d['indexSha256'],
               CXV_FULL_CPU_RATE='1',CXV_CAPTURE_OUT=str(out/f'group-{group}'))
    print(json.dumps(dict(group=group,startedUTC=datetime.datetime.now(datetime.timezone.utc).isoformat())),flush=True)
    code=subprocess.call(['node','tools/v5vfx/capture-full-battle-production.mjs'],cwd=ROOT,env=env)
    if code:
        sys.exit(code)
assert sha(served(url)) == d['indexSha256']
(out/'host-load-after.txt').write_bytes(subprocess.check_output(['ps','-axo','pid,pcpu,etime,comm']))
receipt=dict(completedUTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),groups=groups,exitCode=0)
(out/'exit.json').write_text(json.dumps(receipt)+'\n')
print(json.dumps(receipt),flush=True)
