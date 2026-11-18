"""Verify exact compiled artifacts, then run the bounded native media-fault fixture."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import os
import subprocess
import sys
import urllib.request

root = Path('/Users/bao/taskbar-hero-chain')
base = root/'work/v5/CXI/batch-m/dual-media-fault-r1'
revision = os.environ.get('CXI_FAULT_REVISION', 'r1')
assert revision in ['r1', 'r2']
out = base/('native-'+revision)
freeze_path = root/('reports/v5/CXI/evidence/v8-dual-media-fault-'+revision+'-freeze.json')
sha = lambda data: hashlib.sha256(data).hexdigest()
freeze = json.loads(freeze_path.read_bytes())
for name in ['STOP-ALL', 'STOP-CXI']:
    assert not Path('/Users/bao/taskbar-hero-mailbox', name).exists()
assert datetime.now(timezone.utc) < datetime.fromisoformat(freeze['leaseUntil'])
for path, digest in freeze['dependencies'].items():
    assert sha(Path(path).read_bytes()) == digest, path
assert not out.exists(), 'Preserve previous attempts'
out.mkdir()
build_path = base/'build.json'
build = json.loads(build_path.read_bytes())
dist = Path(build['dist'])
origin = 'http://127.0.0.1:6301'
url = origin+'/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3'
def served(url):
    with urllib.request.urlopen(url, timeout=15) as response:
        return response.read()
assert sha(served(url)) == build['indexSha256'] == sha((dist/'index.html').read_bytes())
verified = dict(utc=datetime.now(timezone.utc).isoformat(), url=url, sourceCommit=build['sourceCommit'],
                indexSha256=build['indexSha256'], build=dict(path=str(build_path), sha256=sha(build_path.read_bytes())),
                sourceFiles=[], mediaFiles=[], artifacts=[])
for item in build['runtimeSources']:
    relative = Path(item['path']).relative_to(root).as_posix()
    data = subprocess.check_output(['git','show',build['sourceCommit']+':'+relative], cwd=root)
    assert sha(data) == item['sha256']
    verified['sourceFiles'].append(dict(path=relative, sha256=sha(data)))
for item in build['files']:
    data = served(origin+item['url'])
    assert len(data) == item['bytes'] and sha(data) == item['sha256'] == sha(Path(item['path']).read_bytes())
    verified['mediaFiles'].append(dict(url=item['url'], bytes=len(data), sha256=sha(data)))
for path in sorted((dist/'assets').rglob('*')):
    if not path.is_file() or path.suffix not in ['.js','.css']:
        continue
    relative = path.relative_to(dist).as_posix()
    data = path.read_bytes()
    assert data == served(origin+'/'+relative), relative
    verified['artifacts'].append(dict(path=relative, bytes=len(data), sha256=sha(data)))
(out/'artifact-verification.json').write_text(json.dumps(verified,indent=2)+'\n')
provenance = []
for path, digest in freeze['dependencies'].items():
    source = Path(path)
    target = out/source.name
    assert not target.exists()
    target.write_bytes(source.read_bytes())
    provenance.append(dict(path=path, copy=str(target), sha256=digest))
(out/'harness-provenance.json').write_text(json.dumps(provenance,indent=2)+'\n')
(out/'host-load.txt').write_bytes(subprocess.check_output(['ps','-axo','pid,pcpu,etime,comm']))
print(json.dumps(dict(verifiedSourceFiles=len(verified['sourceFiles']),verifiedMediaFiles=len(verified['mediaFiles']),verifiedArtifacts=len(verified['artifacts']))),flush=True)
env = os.environ.copy()
env.update(CXI_BUILD_DESCRIPTOR=str(build_path), CXI_FAULT_OUT=str(out), CXI_CAPTURE_LEASE_UNTIL=freeze['leaseUntil'])
result = subprocess.run(['node','tools/v5int/probe-designer-media-fault.mjs'],cwd=root,env=env)
(out/'host-load-after.txt').write_bytes(subprocess.check_output(['ps','-axo','pid,pcpu,etime,comm']))
receipt = dict(exit=result.returncode, completedUTC=datetime.now(timezone.utc).isoformat())
(out/'exit.json').write_text(json.dumps(receipt)+'\n')
print(json.dumps(receipt),flush=True)
sys.exit(result.returncode)
