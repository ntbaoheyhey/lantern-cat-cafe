"""Keep tool originals and exact prompts outside runtime; no destructive edits."""
import json,sys,shutil,hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[2]
spec=next(s for s in json.loads((root/'tools/vfx/paint-specs.json').read_text()) if s['id']==sys.argv[1])
revision=sys.argv[3] if len(sys.argv)>3 else 'production-original'
if not revision.replace('-','').isalnum(): raise SystemExit('Invalid revision')
original=Path(sys.argv[2]);dest=Path('/Users/bao/art/vfx-2026-11-12')/spec['id'].replace(':','-')/(revision+'.png')
dest.parent.mkdir(parents=True,exist_ok=True)
if dest.exists() and dest.read_bytes()!=original.read_bytes(): raise SystemExit('Preserve existing painting; choose a versioned sibling')
if not dest.exists():shutil.copy2(original,dest)
prompt=Path(sys.argv[4]).read_text().strip() if len(sys.argv)>4 else spec['prompt']
with (root/'reports/cardrpg-c2/vfx/ASSET-LOG.md').open('a') as f:
 f.write('\n## '+spec['id']+' / '+revision+'\n\n- Method: built-in imagegen; original assembled key and eight independently painted parts.\n- Source: `'+str(dest)+'`\n- Tool original: `'+str(original)+'`\n- SHA-256: `'+hashlib.sha256(dest.read_bytes()).hexdigest()+'`\n- Exact prompt: '+prompt+'\n')
print(json.dumps({'id':spec['id'],'source':str(dest)}))
