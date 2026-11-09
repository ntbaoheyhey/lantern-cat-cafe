"""Bind the measured default route to the baseline and final Vite output."""
import hashlib
import json
from pathlib import Path
import re
import shutil
import sys

root = Path(__file__).resolve().parents[3]
out = root / (sys.argv[1] if len(sys.argv) > 1 else 'reports/cardrpg-look/closure/startup-v3')
build = Path(sys.argv[2] if len(sys.argv) > 2 else '/tmp/cardrpg-look-closure-flag-off-v3')
current = json.loads((out / 'checks.json').read_text())
baseline = json.loads((root / 'reports/cardrpg-look/validation/flag-off/checks.json').read_text())
normalize = lambda s: re.sub(r'-[A-Za-z0-9_-]{8}\.(js|css)', r'-HASH.\1', s)
def entry(data):
    header, body = data.split('\n', 1)
    files = json.loads(re.search(r'm\.f=(\[[^\n]+?\])', header).group(1))
    arguments = re.findall(r'__vite__mapDeps\((\[[0-9,]+\])\)', body)
    return dict(body=re.sub(r'__vite__mapDeps\(\[[0-9,]+\]\)', '__vite__mapDeps(PRELOAD_INDICES)', normalize(body)),
                branches=[sorted(normalize(files[i]) for i in json.loads(arg)) for arg in arguments])
before = root / 'reports/cardrpg-look/validation/l7/flag-off/startup-diagnosis/baseline-entry.txt'
after = build / current['chunks'][0]['path'].lstrip('/')
assert hashlib.sha256(after.read_bytes()).hexdigest() == current['chunks'][0]['sha256']
assert entry(before.read_text()) == entry(after.read_text())
before_chunks = {normalize(r['path']): r for r in baseline['chunks']}
after_chunks = {normalize(r['path']): r for r in current['chunks']}
assert before_chunks.keys() == after_chunks.keys()
for name, chunk in after_chunks.items():
    assert chunk['bytes'] == before_chunks[name]['bytes']
    assert sorted(chunk['modules']) == sorted(before_chunks[name]['modules'])
assert current['prohibitedModules'] == current['modelRequests'] == current['errors'] == []
old_bytes = sum(r['bytes'] for r in baseline['chunks'])
new_bytes = sum(r['bytes'] for r in current['chunks'])
assert new_bytes == old_bytes
shutil.copyfile(after, out / 'entry.txt')
shutil.copyfile(build / 'build-receipt.json', out / 'build-receipt.json')
result = dict(startupBytes=new_bytes, baselineBytes=old_bytes, deltaBytes=new_bytes-old_bytes,
              scripts=len(current['chunks']), byteIdenticalScripts=sum(chunk['sha256'] == before_chunks[name]['sha256'] for name, chunk in after_chunks.items()),
              everyLoadedChunkByteCountAndModuleMembershipEqual=True,
              entryBytes=len(after.read_bytes()), baselineEntryBytes=len(before.read_bytes()),
              normalizedEntryBodyAndAllPreloadBranchesEqual=True, entryByteIdentical=before.read_bytes()==after.read_bytes(),
              threeOrModelModules=0, modelRequests=0,
              note='Hashes can change with referenced chunk filenames and ordering. Every loaded chunk byte count and module membership match; normalized entry program and all five branch dependency memberships match. LOOK resources are only created when selected; its code now shares the existing lazy 3D route. This is not binary parity or a classic 3D-route download-size parity claim.')
(out / 'audit.json').write_text(json.dumps(result, indent=2)+'\n')
print(json.dumps(result))
