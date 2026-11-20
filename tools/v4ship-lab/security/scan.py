"""Experiment: compare committable current files with all reachable Git history.
Gitleaks output stays in memory; only location/type metadata is persisted.
"""
from pathlib import Path
import subprocess,json,time,sys,tempfile,datetime,os
root=Path(__file__).resolve().parents[3]
mode=sys.argv[1]
assert mode in ['working','history']
out=root/'reports/v4-ship/S1'/f'secrets-{mode}.json'
flags=['--no-banner','--no-color','--redact=100','--log-level=fatal','--report-format=json','--report-path=-','--ignore-gitleaks-allow']
started=time.monotonic()
with tempfile.TemporaryDirectory(prefix='v4ship-scan-') as td:
 if mode=='working':
  files=subprocess.check_output(['git','ls-files','-z','--cached','--others','--exclude-standard'],cwd=root).split(b'\0')
  files=sorted(set(os.fsdecode(p) for p in files if p))
  count=0
  for name in files:
   source=root/name
   if source.is_file() and not source.is_symlink():
    target=Path(td)/name; target.parent.mkdir(parents=True,exist_ok=True); target.symlink_to(source);count+=1
  command=['gitleaks','dir','--follow-symlinks',td,*flags]
 else:
  count=int(subprocess.check_output(['git','rev-list','--all','--count'],cwd=root));command=['gitleaks','git','--log-opts=--all',str(root),*flags]
 process=subprocess.Popen(command,cwd=root,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 print(json.dumps({'mode':mode,'pid':process.pid,'scopeCount':count}),flush=True)
 data,errors=process.communicate()
 if process.returncode not in (0,1): raise RuntimeError(f'Scanner exited {process.returncode}; diagnostic output suppressed')
 try: rows=json.loads(data or b'[]')
 except Exception: raise RuntimeError('Scanner produced invalid JSON; output suppressed')
 safe=[]
 for row in rows:
  name=row.get('File','')
  for prefix in [td+'/',str(root)+'/']:
   if name.startswith(prefix):name=name[len(prefix):]
  safe.append({'file':name,'line':row.get('StartLine'),'commit':row.get('Commit',''),'type':row.get('RuleID','')})
 result={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'mode':mode,'scanner':subprocess.check_output(['gitleaks','version'],text=True).strip(),'scope':'tracked plus untracked nonignored regular files; dependencies/submodule directories excluded' if mode=='working' else 'all reachable commits across every local/remote reference','scopeCount':count,'elapsedSeconds':round(time.monotonic()-started,3),'findings':safe,'rawFindingCount':len(safe),'scannerExitCode':process.returncode}
 out.write_text(json.dumps(result,indent=2)+'\n')
 print(json.dumps({k:v for k,v in result.items() if k!='findings'}),flush=True)
