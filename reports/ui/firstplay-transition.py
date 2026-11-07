import os,subprocess,socket
from pathlib import Path
root=Path.cwd();out=root/'reports/ui/logs/firstplay-transition';out.mkdir(parents=True,exist_ok=True)
env=dict(os.environ,E2E_PORT_CLASSIC='5355',E2E_PORT_V2='5356',E2E_PORT_SERVER='5357',E2E_PORT_API='5358',NODE_OPTIONS='--import=/Users/bao/taskbar-hero-ui-ledger/reports/ui/ports-aux-loader.mjs',FIRSTPLAY_SCREENSHOTS=str(root/'screenshots/ui/firstplay-transition'),CXR2_SCREENSHOTS=str(root/'screenshots/ui/firstplay-transition'))
for port in range(5355,5360):
 with socket.socket() as s:s.bind(('127.0.0.1',port))
for label,cmd,cwd in [('typecheck',['npx','-y','pnpm@10.28.0','typecheck'],root),('browser',['npx','-y','pnpm@10.28.0','exec','playwright','test','e2e/ui/firstplay.spec.ts','e2e/ui/art2-flag-off.spec.ts','e2e/server/cxr2-class-states.spec.ts','--workers=2','--retries=0','--reporter=line'],root/'apps/web')]:
 with (out/(label+'.log')).open('w') as log:
  r=subprocess.run(cmd,cwd=cwd,env=env,stdout=log,stderr=subprocess.STDOUT);log.write('\nexit='+str(r.returncode)+'\n')
 print(label,r.returncode,flush=True)
 if r.returncode:raise SystemExit(r.returncode)
