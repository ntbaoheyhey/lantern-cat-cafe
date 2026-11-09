"""Publish explicit audited L7 evidence in <=48 MB fast-forward batches.

Run --prepare after the report/state are complete; inspect the manifest before
publishing. Interrupted uploads require --resume-batch after remote inspection.
No old raw L4/L5 trees, shared worktrees or other lane paths are staged.
"""
import argparse,hashlib,json,re,subprocess
from pathlib import Path
from urllib.parse import unquote,urlparse

parser=argparse.ArgumentParser()
parser.add_argument('--prepare',action='store_true')
parser.add_argument('--resume-batch',type=int,default=1)
args=parser.parse_args()
root=Path(__file__).resolve().parents[3]
out=root/'reports/cardrpg-look/validation/l7'
branch='ai/codex-cardrpg-look-l7-2026-11-07'
manifest_path=out/'publication-inventory.json'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
load=lambda p:json.loads(p.read_text())
def git(*args):
    return subprocess.check_output(['git',*args],cwd=root,text=True).strip()
def verify_report_links(portable_paths):
    tracked=set(git('ls-files').splitlines())
    prefix=f'https://github.com/ntbaoheyhey/taskbar-hero/blob/{branch}/'
    for report in ['reports/cardrpg-look/CARDRPG-LOOK-REPORT.md','reports/cardrpg-look/L7-CHECKPOINT.md']:
        for target in re.findall(r'\]\(([^)]+)\)',(root/report).read_text()):
            if target.startswith(prefix):
                path=Path(unquote(urlparse(target[len(prefix):]).path))
            elif '://' not in target and not target.startswith('#'):
                path=Path(report).parent/unquote(urlparse(target).path)
            else:
                continue
            absolute=(root/path).resolve()
            relative=str(absolute.relative_to(root))
            assert absolute.is_file(),f'{report}: missing linked file {relative}'
            assert relative in portable_paths or relative in tracked,f'{report}: linked file will not be published: {relative}'
            if relative not in portable_paths:
                assert not git('diff','HEAD','--',relative),f'{report}: linked historical file changed outside manifest: {relative}'
def verify():
    freeze=load(out/'freeze.json');audit=load(out/'audit.json')
    assert freeze['sourceAccepted'] and audit['artifact']==freeze['sha256']
    assert sha(root/freeze['artifact'])==freeze['sha256']
    for path,want in {**freeze['sourceHashes'],**freeze['evidenceHashes']}.items():
        assert sha(root/path)==want,path
    assert all(row['code']==0 for row in load(out/'source-gates.json'))
    assert load(out/'video-review.json')['personallyViewed']
    support=load(out/'support-audit.json')
    assert support['artifact']==freeze['sha256']
    for path,want in support['verifiedHashes'].items():
        assert sha(root/path)==want,path
    intervals=load(out/'matrix-interval-audit.json')
    assert intervals['artifact']==freeze['sha256'] and intervals['cases']==860
    assert sha(out/'matrix/summary.json')==intervals['matrixSummarySha256']
    context=load(out/'timing-context.json')
    assert context['artifact']==freeze['sha256'] and context['isolationVerified'] is False
    for path,want in context['verifiedHashes'].items():
        assert sha(root/path)==want,path
    diagnosis=load(out/'flag-off/startup-diagnosis.json')
    assert diagnosis['artifact']==freeze['sha256'] and diagnosis['entryDeltaBytes']==audit['startup']['byteDelta']
    for path,want in diagnosis['verifiedHashes'].items():
        assert sha(root/path)==want,path
    cast_diagnosis=load(out/'cast-diagnosis.json')
    assert cast_diagnosis['artifact']==freeze['sha256']
    for key in ['raw','batchSummary']:
        assert sha(root/cast_diagnosis[key])==cast_diagnosis[key+'Sha256']
    cast_profiles=load(out/'cast-profile-audit.json')
    assert cast_profiles['complete'] and cast_profiles['cases']==860
    assert cast_profiles['artifact']==freeze['sha256']
    assert cast_profiles['budgetMisses']==audit['matrix']['misses']
    assert cast_profiles['matrixSummarySha256']==sha(out/'matrix/summary.json')
    for path,want in cast_profiles['verifiedHashes'].items():
        assert sha(root/path)==want,path
    assert load(out/'final-measure-complete.json')['artifact']==freeze['sha256']
    return freeze

freeze=verify()
assert git('branch','--show-current')==branch
if args.prepare:
    assert not manifest_path.exists(),'Inspect existing manifest rather than silently replacing it'
    paths=[];local=[]
    for folder in [out,root/'reports/cardrpg-look/video']:
        for path in sorted(folder.rglob('*')):
            if not path.is_file():continue
            row={'path':str(path.relative_to(root)),'bytes':path.stat().st_size,'sha256':sha(path)}
            # Duplicate intermediate HTML remains local. The current exact
            # HTML is published explicitly from docs/cardrpg-look below.
            (local if path.suffix=='.html' else paths).append(row)
    extras=[
      'docs/cardrpg-look/index.html','docs/cardrpg-look/build.json','docs/cardrpg-look/art.html',
      'reports/cardrpg-look/rounds/art/gallery-build.json',
      'reports/cardrpg-look/CARDRPG-LOOK-REPORT.md','reports/cardrpg-look/L7-CHECKPOINT.md',
      'reports/cardrpg-look/PROGRESS.md','reports/cardrpg-look/memory/STATE.md',
      'reports/cardrpg-look/memory/HANDOFF.md','reports/cardrpg-look/memory/l7-review-sheets.py',
      'reports/cardrpg-look/memory/l7-write-report.py','reports/cardrpg-look/memory/l7-publish.py',
      'reports/cardrpg-look/memory/l7-resume-ui.mjs',
      'reports/cardrpg-look/memory/l7-scroll-review.mjs',
      'reports/cardrpg-look/memory/l7-support-audit.py',
      'reports/cardrpg-look/memory/l7-interval-audit.py',
      'reports/cardrpg-look/memory/l7-await-audit.py',
      'reports/cardrpg-look/memory/l7-startup-audit.py',
      'reports/cardrpg-look/memory/l7-cast-diagnosis.mjs',
      'reports/cardrpg-look/memory/l7-cast-profile-audit.mjs',
    ]
    for rel in extras:
        path=root/rel;assert path.is_file(),rel
        paths.append({'path':rel,'bytes':path.stat().st_size,'sha256':sha(path)})
    assert len({r['path'] for r in paths})==len(paths)
    assert all(r['bytes']<48_000_000 for r in paths)
    verify_report_links({r['path'] for r in paths})
    manifest={'artifact':freeze['sha256'],'portable':paths,'localOnly':local,
       'portableFiles':len(paths),'portableBytes':sum(r['bytes'] for r in paths),
       'localOnlyFiles':len(local),'localOnlyBytes':sum(r['bytes'] for r in local)}
    manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
    print(json.dumps({k:v for k,v in manifest.items() if k not in ['portable','localOnly']}))
    raise SystemExit()

manifest=load(manifest_path);assert manifest['artifact']==freeze['sha256']
verify_report_links({r['path'] for r in manifest['portable']})
paths=manifest['portable']+[{'path':str(manifest_path.relative_to(root)),
    'bytes':manifest_path.stat().st_size,'sha256':sha(manifest_path)}]
for row in paths:
    assert row['path'].startswith(('docs/cardrpg-look/','reports/cardrpg-look/'))
    assert sha(root/row['path'])==row['sha256'],row['path']
batches=[];batch=[];total=0
for row in paths:
    if batch and total+row['bytes']>48_000_000:
        batches.append(batch);batch=[];total=0
    batch.append(row);total+=row['bytes']
if batch:batches.append(batch)
assert 1<=args.resume_batch<=len(batches)
pending=git('diff','--cached','--name-only').splitlines()
assert not pending or args.resume_batch>1
assert set(pending)<={r['path'] for r in batches[args.resume_batch-1]}
remote=git('ls-remote','--heads','origin','refs/heads/'+branch).split()
head=git('rev-parse','HEAD')
if not remote:
    assert head==freeze['source'],'Initial publication must begin at accepted source'
if not remote or remote[0]!=head:
    subprocess.run(['git','push','-u','origin',head+':refs/heads/'+branch],cwd=root,check=True)
receipt_path=Path('/tmp/cardrpg-look-l7-publication-batches.json')
receipts=load(receipt_path) if args.resume_batch>1 else []
for i,batch in enumerate(batches,1):
    if i<args.resume_batch:continue
    verify()
    for row in batch:assert sha(root/row['path'])==row['sha256'],row['path']
    spec=Path(f'/tmp/cardrpg-look-l7-publish-batch-{i}.txt')
    spec.write_text('\n'.join(r['path'] for r in batch)+'\n')
    git('add','-f','--pathspec-from-file='+str(spec))
    staged=git('diff','--cached','--name-only').splitlines()
    assert set(staged)<={r['path'] for r in batch}
    if not staged:continue
    git('commit','-m',f'docs(look): publish audited L7 evidence {i}/{len(batches)}')
    commit=git('rev-parse','HEAD')
    subprocess.run(['git','push','origin',commit+':refs/heads/'+branch],cwd=root,check=True)
    assert git('ls-remote','--heads','origin','refs/heads/'+branch).split()[0]==commit
    receipts.append({'batch':i,'commit':commit,'files':len(staged),'inputBytes':sum(r['bytes'] for r in batch)})
    receipt_path.write_text(json.dumps(receipts,indent=2)+'\n')
    print(json.dumps(receipts[-1]),flush=True)
verify()
print('L7 explicit evidence published at '+git('rev-parse','HEAD'),flush=True)
