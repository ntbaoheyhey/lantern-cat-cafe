"""Publish audited L5 source and selected evidence in bounded fast-forward pushes.

Requires explicit extra-file list and the generated evidence inventory. No
untracked-tree glob, force push, reset, checkout, or changes outside this lane.
An interrupted run can resume from its local manifest after remote inspection.
"""
import hashlib,json,subprocess
from pathlib import Path

root=Path(__file__).resolve().parents[3]
out=root/'reports/cardrpg-look/validation/l5'
def git(*args):
    return subprocess.check_output(['git',*args],cwd=root,text=True).strip()
def verify():
    audit=json.loads((out/'audit.json').read_text())
    build=json.loads((out/'phase-source.json').read_text())['build']
    assert all(row['code']==0 for row in audit['gates'])
    assert hashlib.sha256((root/'docs/cardrpg-look/index.html').read_bytes()).hexdigest()==audit['artifact']
    for path,want in build['sourceHashes'].items():
        assert hashlib.sha256((root/path).read_bytes()).hexdigest()==want,path
    return audit

audit=verify()
branch='ai/codex-cardrpg-look-l5-2026-11-07'
assert git('branch','--show-current')==branch
assert not git('diff','--cached','--name-only'),'Inspect preexisting staged changes first'
inventory=json.loads((out/'evidence-inventory.json').read_text())
paths=[row['path'] for row in inventory['portable']]
paths+=Path('/tmp/cardrpg-look-l5-publication-extra.txt').read_text().splitlines()
paths=list(dict.fromkeys(paths))
for path in paths:
    assert path.startswith(('reports/cardrpg-look/','docs/cardrpg-look/')),path
    assert '/l7-prep/' not in path,path
    assert (root/path).is_file(),path
for row in inventory['portable']:
    assert hashlib.sha256((root/row['path']).read_bytes()).hexdigest()==row['sha256'],row['path']
remote=git('ls-remote','--heads','origin','refs/heads/'+branch).split()
head=git('rev-parse','HEAD')
if not remote:
    assert head==audit['source'],'Publish source from the exact accepted commit first'
    subprocess.run(['git','push','-u','origin',head+':refs/heads/'+branch],cwd=root,check=True)
elif remote[0]!=head:
    # This covers a commit whose upload was interrupted. Never overwrite a
    # different remote history: ordinary push must be fast-forward.
    subprocess.run(['git','push','origin',head+':refs/heads/'+branch],cwd=root,check=True)

batches=[];batch=[];total=0
for path in paths:
    size=(root/path).stat().st_size
    if batch and total+size>48_000_000:
        batches.append(batch);batch=[];total=0
    batch.append(path);total+=size
if batch:batches.append(batch)
receipt=[]
for index,batch in enumerate(batches,1):
    verify()
    pathspec=Path(f'/tmp/cardrpg-look-l5-publish-batch-{index}.txt')
    pathspec.write_text('\n'.join(batch)+'\n')
    git('add','--pathspec-from-file='+str(pathspec))
    staged=git('diff','--cached','--name-only').splitlines()
    assert set(staged)<=set(batch),staged
    if not staged:continue
    git('commit','-m',f'docs(look): publish audited L5 evidence {index}/{len(batches)}')
    sha=git('rev-parse','HEAD')
    subprocess.run(['git','push','origin',sha+':refs/heads/'+branch],cwd=root,check=True)
    assert git('ls-remote','--heads','origin','refs/heads/'+branch).split()[0]==sha
    receipt.append({'batch':index,'commit':sha,'changedFiles':len(staged),'inputBytes':sum((root/p).stat().st_size for p in batch)})
    Path('/tmp/cardrpg-look-l5-publication-batches.json').write_text(json.dumps(receipt,indent=2)+'\n')
    print(json.dumps(receipt[-1]),flush=True)
verify()
print('L5 selected source/evidence published: '+git('rev-parse','HEAD'),flush=True)
