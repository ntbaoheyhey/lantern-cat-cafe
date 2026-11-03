"""Local test process, not an agent or scheduler. Preserve each exact-head result."""
import argparse, datetime, json, os, socket, subprocess
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('root');p.add_argument('name');p.add_argument('port',type=int);p.add_argument('--full',action='store_true');p.add_argument('--main',action='store_true');p.add_argument('--unit-workers',type=int,default=2);a=p.parse_args()
root=Path(a.root); ledger=Path(__file__).resolve().parents[2];out=ledger/'sys'/'logs'/a.name
out.mkdir(parents=True,exist_ok=False)
env=dict(os.environ);env.update({n:str(a.port+i) for i,n in enumerate(['E2E_PORT_CLASSIC','E2E_PORT_V2','E2E_PORT_SERVER','E2E_PORT_API'])});env['OVN_AUX_PORT']=str(a.port+4)
env['NODE_OPTIONS']=env.get('NODE_OPTIONS','')+' --import='+str(Path(__file__).with_name('ports.mjs'))
env['CXR2_SCREENSHOTS']=str(ledger/'sys'/'screenshots'/a.name)
receipt={'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'cwd':str(root),'pid':os.getpid(),'ports':list(range(a.port,a.port+5)),'checks':[]}
def run(label,command,cwd=root,ports=False):
 if ports:
  for port in receipt['ports']:
   with socket.socket() as s:s.bind(('127.0.0.1',port))
 log=out/(label+'.log');print('START '+label,flush=True)
 f=log.open('w');result=subprocess.run(command,cwd=cwd,env=env,stdout=f,stderr=subprocess.STDOUT);f.write('\nexit='+str(result.returncode)+'\n');f.close()
 receipt['checks'].append({'label':label,'exit':result.returncode,'log':str(log.relative_to(ledger.parent)),'command':command,'finished':datetime.datetime.now(datetime.timezone.utc).isoformat()});(out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print('END '+label+' exit='+str(result.returncode),flush=True)
 return result.returncode
# Tests first in every clean checkout. A and B do not share build or test output.
if run('install',['pnpm','install','--frozen-lockfile']):raise SystemExit(1)
run('scripts',['node','--test',*map(str,sorted(root.glob('scripts/*.test.mjs')))])
run('packages',['pnpm','--filter','!@taskbar-hero/web','-r','--workspace-concurrency=1','test'])
run('web-units',['pnpm','exec','vitest','run','--maxWorkers='+str(a.unit_workers)],root/'apps/web')
run('typecheck',['pnpm','typecheck']);run('lint',['pnpm','lint']);run('build',['pnpm','build'])
specs=['e2e/ui/cxr2-returning-guest.spec.ts','e2e/ui/merged-redesign.spec.ts','e2e/polish.spec.ts','e2e/server/cxr2-load-states.spec.ts']
for size in ['1280x720','1600x900']:
 env['E2E_VIEWPORT']=size
 if a.full:run('full-'+size,['pnpm','exec','playwright','test','--workers=2','--retries=0','--reporter=line'],root/'apps/web',True)
 if not a.main:run('changed-'+size,['pnpm','exec','playwright','test',*specs,'--repeat-each=3','--workers=2','--retries=0','--reporter=line'],root/'apps/web',True)
 run('resize-five-'+size,['pnpm','exec','playwright','test','e2e/layout/resize-burst.spec.ts','--repeat-each=5','--workers=2','--retries=0','--reporter=line'],root/'apps/web',True)
if not a.main:run('strict-ui-audit',['node','tools/ui-audit.mjs',str(ledger/'sys'/'screenshots'/(a.name+'-audit')),'bossReadyStrong','--strict'],root/'apps/web',True)
receipt['complete']=True;receipt['pass']=all(c['exit']==0 for c in receipt['checks']);(out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print('COMPLETE pass='+str(receipt['pass']),flush=True)
