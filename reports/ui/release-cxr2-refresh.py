import json,os,socket,subprocess,datetime
from pathlib import Path
root=Path.cwd(); out=root/'reports/ui/logs/cxr2-release-refresh'; out.mkdir(parents=True,exist_ok=True)
env=dict(os.environ); env.update({key:str(5360+i) for i,key in enumerate(['E2E_PORT_CLASSIC','E2E_PORT_V2','E2E_PORT_SERVER','E2E_PORT_API'])}); env['CXR2_SCREENSHOTS']=str(root/'screenshots/ui/cxr2-release-refresh')
receipt={'head':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'pid':os.getpid(),'checks':[]}
for size in ['1280x720','1600x900']:
 env['E2E_VIEWPORT']=size
 for name,specs,repeats in [('return-focus',['e2e/ui/cxr2-returning-guest.spec.ts','e2e/ui/cxr2-dialogs.spec.ts','e2e/server/cxr2-class-states.spec.ts'],3),('resize-five',['e2e/layout/resize-burst.spec.ts'],5)]:
  for port in range(5360,5364):
   with socket.socket() as s: s.bind(('127.0.0.1',port))
  label=name+'-'+size; command=['npx','-y','pnpm@10.28.0','exec','playwright','test',*specs,'--repeat-each='+str(repeats),'--workers=2','--retries=0','--reporter=line']; print('START',label,flush=True)
  with (out/(label+'.log')).open('w') as log:
   result=subprocess.run(command,cwd=root/'apps/web',env=env,stdout=log,stderr=subprocess.STDOUT);log.write('\nexit='+str(result.returncode)+'\n')
  receipt['checks'].append({'label':label,'exit':result.returncode,'command':command});(out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print('END',label,'exit='+str(result.returncode),flush=True)
  if result.returncode: raise SystemExit(result.returncode)
print('PASS',flush=True)
