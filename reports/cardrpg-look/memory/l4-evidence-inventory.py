"""Select portable L4 evidence without deleting local raw captures."""
import hashlib
import json
from pathlib import Path
roots = [Path('reports/cardrpg-look/rounds/effects'), Path('reports/cardrpg-look/rounds/flipbooks'), Path('reports/cardrpg-look/validation/l4')]
portable, local = [], []
for root in roots:
    for path in sorted(root.rglob('*')):
        if not path.is_file() or path.name == 'evidence-inventory.json':
            continue
        relative = path.relative_to(root)
        reason = None
        if 'frames' in relative.parts:
            reason = 'raw per-frame pixels retained locally; compact contact sheets and original metrics are portable'
        elif path.suffix == '.pixelpack':
            reason = 'codec pilot pack retained locally; exact-pixel probe receipt is portable'
        elif path.suffix not in {'.json', '.md', '.png', '.webp', '.py', '.npz', '.log', '.gz'}:
            reason = 'not part of selected phase evidence'
        row = {'path':path.as_posix(), 'bytes':path.stat().st_size, 'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
        if reason:
            row['reason'] = reason
            local.append(row)
        else:
            portable.append(row)
out = roots[-1]
receipt = {'policy':'Selected publication, not a complete raw screenshot archive. No originals deleted. Raw file hashes describe local evidence; they do not replace available pixels.', 'portableFiles':len(portable), 'portableBytes':sum(r['bytes'] for r in portable), 'localOnlyFiles':len(local), 'localOnlyBytes':sum(r['bytes'] for r in local), 'portable':portable, 'localOnly':local}
(out/'evidence-inventory.json').write_text(json.dumps(receipt,indent=2)+'\n')
Path('/tmp/cardrpg-look-l4-stage-files.txt').write_text('\n'.join(r['path'] for r in portable)+'\n')
print(json.dumps({k:v for k,v in receipt.items() if k not in {'portable','localOnly'}}))
