"""List portable L6 evidence and retained local failed artifacts without deleting either."""
import hashlib
import json
from pathlib import Path

roots = [Path('reports/cardrpg-look/rounds/art'), Path('reports/cardrpg-look/validation/l6'), Path('reports/cardrpg-look/validation/l6-pilot-1')]
portable, local = [], []
for root in roots:
    for path in sorted(root.rglob('*')):
        if not path.is_file() or path.name == 'evidence-inventory.json':
            continue
        row = {'path': str(path), 'bytes': path.stat().st_size, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
        if root.name == 'l6-pilot-1' and path.suffix == '.html':
            row['reason'] = 'Failed original offline artifact kept locally; source commit and complete error/capture receipts are portable.'
            local.append(row)
        else:
            portable.append(row)
out = roots[1]
receipt = {'policy': 'All original art rounds and all validation receipts/captures portable. Failed HTML binaries retained locally unchanged; no L4 raw frames selected.',
           'portableFiles': len(portable), 'portableBytes': sum(r['bytes'] for r in portable),
           'localOnlyFiles': len(local), 'localOnlyBytes': sum(r['bytes'] for r in local), 'portable': portable, 'localOnly': local}
(out/'evidence-inventory.json').write_text(json.dumps(receipt, indent=2)+'\n')
Path('/tmp/cardrpg-look-l6-stage-files.txt').write_text('\n'.join(r['path'] for r in portable)+'\n')
print(json.dumps({k:v for k,v in receipt.items() if k not in {'portable','localOnly'}}))
