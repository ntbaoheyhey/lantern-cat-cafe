from pathlib import Path
import subprocess,json,datetime,hashlib,re
root=Path(__file__).resolve().parents[2];out=root/'reports/cardrpg/validation'
def git(*args):return subprocess.check_output(['git',*args],cwd=root)
head=git('rev-parse','HEAD').decode().strip();base='3bf2cfa3bd32d8355c5c967e979240330a595682';a='9ccf88e7eeac6814229e2b8d919b608bb4cee478'
paths=git('diff','--name-only',base,a).decode().splitlines();diff=[p for p in paths if (root/p).read_bytes()!=git('show',a+':'+p)]
changed=git('diff','--name-only',base,'HEAD').decode().splitlines();forbidden=[p for p in changed if p.startswith(('supabase/','contracts/')) or p in ['vercel.json','pnpm-lock.yaml','pnpm-workspace.yaml']]
deps=[]
for p in ['package.json','apps/web/package.json','packages/game-rules/package.json']:
 before=json.loads(git('show',base+':'+p));after=json.loads((root/p).read_text())
 for k in ['dependencies','peerDependencies','optionalDependencies']:
  if before.get(k)!=after.get(k):deps.append({'file':p,'field':k})
safe=dict(date=datetime.datetime.now(datetime.timezone.utc).isoformat(),source=head,base=base,consumedA=a,contract='0.4.0',aFilesCompared=len(paths),aSourceDifferences=diff,forbiddenSourceChanges=forbidden,changedFiles=len(changed),localMain=git('rev-parse','main').decode().strip(),noNewRuntimeDependencies=not deps,runtimeDependencyChanges=deps)
(out/'safety-delivery.json').write_text(json.dumps(safe,indent=2)+'\n');assert not diff and not forbidden and not deps,safe
roots=['packages/game-rules/src/squad/turn','apps/web/src/game/squad/turn3d','apps/web/src/game/cardrpg'];pattern=r'\b(speed|interval|clock)\b|\bat:'
files=[p for r in roots for p in (root/r).rglob('*') if p.suffix in ['.ts','.tsx','.css']];matches=[]
for p in files:
 for n,line in enumerate(p.read_text().splitlines(),1):
  if re.search(pattern,line):matches.append(dict(file=str(p.relative_to(root)),line=n,text=line))
(out/'round-audit.json').write_text(json.dumps(dict(source=head,pattern=pattern,roots=roots,files=len(files),matches=matches),indent=2)+'\n');assert not matches,matches
print(json.dumps(safe))
