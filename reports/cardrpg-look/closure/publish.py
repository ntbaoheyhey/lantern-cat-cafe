"""Explicit closure evidence only; bounded fast-forward publication after review."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

p=argparse.ArgumentParser();p.add_argument('--prepare',action='store_true');p.add_argument('--resume-batch',type=int,default=1);args=p.parse_args()
root=Path(__file__).resolve().parents[3]
out=root/'reports/cardrpg-look/closure'
branch='codex/cardrpg-look-closure-2026-11-08'
load=lambda p:json.loads(p.read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def git(*args):return subprocess.check_output(['git',*args],cwd=root,text=True).strip()
def verify():
    b=load(root/'docs/cardrpg-look/build.json')
    assert sha(root/'docs/cardrpg-look/index.html')==b['sha256']
    assert not b['runtimeDirty']
    for path,want in b['sourceHashes'].items():assert sha(root/path)==want,path
    assert load(out/'validation-complete.json')['sha256']==b['sha256']
    gates=load(root/'reports/cardrpg-look/validation/closure/source-gates.json')
    assert len(gates)==5 and all(r['code']==0 for r in gates)
    assert load(out/'acceptance.json')['personallyViewed']
    assert load(out/'audit.json')['artifact']==b['sha256']
    return b
b=verify();assert git('branch','--show-current')==branch
inventory=out/'publication-inventory.json'
if args.prepare:
    assert not inventory.exists()
    paths=[]
    for folder in [out,root/'reports/cardrpg-look/validation/closure']:
        paths.extend(p for p in folder.rglob('*') if p.is_file() and '__pycache__' not in p.parts)
    paths.extend(root/p for p in ['docs/cardrpg-look/index.html','docs/cardrpg-look/build.json',
       'reports/cardrpg-look/CARDRPG-LOOK-REPORT.md','reports/cardrpg-look/PROGRESS.md',
       'reports/cardrpg-look/memory/STATE.md','reports/cardrpg-look/memory/HANDOFF.md'])
    rows=[dict(path=str(p.relative_to(root)),bytes=p.stat().st_size,sha256=sha(p)) for p in sorted(set(paths))]
    assert all(r['bytes']<48_000_000 for r in rows)
    data=dict(artifact=b['sha256'],source=b['head'],files=rows,count=len(rows),bytes=sum(r['bytes'] for r in rows))
    inventory.write_text(json.dumps(data,indent=2)+'\n');print(json.dumps({k:v for k,v in data.items() if k!='files'}));raise SystemExit()
data=load(inventory);assert data['artifact']==b['sha256']
rows=data['files']+[dict(path=str(inventory.relative_to(root)),bytes=inventory.stat().st_size,sha256=sha(inventory))]
for r in rows:assert sha(root/r['path'])==r['sha256'],r['path']
batches=[];batch=[];size=0
for r in rows:
    if batch and size+r['bytes']>48_000_000:batches.append(batch);batch=[];size=0
    batch.append(r);size+=r['bytes']
if batch:batches.append(batch)
assert 1<=args.resume_batch<=len(batches)
receipt=Path('/tmp/cardrpg-look-closure-publication.json')
history=load(receipt) if args.resume_batch>1 else []
if args.resume_batch==1:
    assert not git('diff','--cached','--name-only')
    subprocess.run(['git','push','-u','origin',branch],cwd=root,check=True)
for n,batch in enumerate(batches,1):
    if n<args.resume_batch:continue
    verify()
    for r in batch:assert sha(root/r['path'])==r['sha256'],r['path']
    spec=Path(f'/tmp/cardrpg-look-closure-batch-{n}.txt');spec.write_text('\n'.join(r['path'] for r in batch)+'\n')
    git('add','-f','--pathspec-from-file='+str(spec))
    assert set(git('diff','--cached','--name-only').splitlines())<={r['path'] for r in batch}
    if not git('diff','--cached','--name-only'):continue
    git('commit','-m',f'docs(look): publish closure evidence {n}/{len(batches)}')
    commit=git('rev-parse','HEAD')
    subprocess.run(['git','push','origin',commit+':refs/heads/'+branch],cwd=root,check=True)
    assert git('ls-remote','--heads','origin','refs/heads/'+branch).split()[0]==commit
    history.append(dict(batch=n,commit=commit,files=len(batch),bytes=sum(r['bytes'] for r in batch)))
    receipt.write_text(json.dumps(history,indent=2)+'\n');print(json.dumps(history[-1]),flush=True)
(out/'publication-receipt.json').write_text(json.dumps(dict(source=b['head'],artifact=b['sha256'],batches=history),indent=2)+'\n')
