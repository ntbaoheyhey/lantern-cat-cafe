from pathlib import Path
import subprocess,os,json,socket,datetime,sys
root=Path.cwd();out=root/'reports/ui/logs/cxr2-a2';receipt=json.loads((out/'receipt.json').read_text())
assert subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()==receipt['head']=='6ef93c0b6959aa470665613616781211225d15bd'
assert not subprocess.check_output(['git','status','--porcelain','--untracked-files=no'],text=True).strip()
assert any(c['label']=='full-1280x720' and c['exit']==0 for c in receipt['checks'])
prior=out/'full-1600x900.log';saved=out/'full-1600x900.user-paused.log'
if prior.exists() and not saved.exists():prior.rename(saved)
env=dict(os.environ)
for i,name in enumerate(['E2E_PORT_CLASSIC','E2E_PORT_V2','E2E_PORT_SERVER','E2E_PORT_API']):env[name]=str(5310+i)
env['CXU3_SCREENSHOTS']=str(root/'screenshots/ui-2026-11-03/cxr2-a2');env['CXR2_SCREENSHOTS']=env['CXU3_SCREENSHOTS']
steps=[('full-1600x900','1600x900',[])]
steps += [('resize-five-'+size,size,['e2e/layout/resize-burst.spec.ts','--repeat-each=5']) for size in ['1280x720','1600x900']]
for label,size,extra in steps:
 for port in range(5310,5314):
  with socket.socket() as s:s.bind(('127.0.0.1',port))
 env['E2E_VIEWPORT']=size
 cmd=['npx','-y','pnpm@10.28.0','exec','playwright','test',*extra,'--workers=2','--retries=0','--reporter=line']
 print('START',label,flush=True)
 with (out/(label+'.log')).open('w') as f:
  result=subprocess.run(cmd,cwd=root/'apps/web',env=env,stdout=f,stderr=subprocess.STDOUT);f.write('\nexit='+str(result.returncode)+'\n')
 receipt['checks'].append({'label':label,'command':cmd,'exit':result.returncode,'log':str((out/(label+'.log')).relative_to(root)),'resumedAt':datetime.datetime.now(datetime.timezone.utc).isoformat()})
 (out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
 print('END',label,'exit='+str(result.returncode),flush=True)
 if result.returncode:sys.exit(result.returncode)
print('Resumed A checks complete; fresh review/audit still required.',flush=True)
