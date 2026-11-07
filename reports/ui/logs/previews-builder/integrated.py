import os,subprocess,socket
from pathlib import Path
root=Path.cwd();out=root/'reports/ui/logs/previews-builder'
env=dict(os.environ,E2E_PORT_CLASSIC='5370',E2E_PORT_V2='5371',E2E_PORT_SERVER='5372',E2E_PORT_API='5373',PREVIEWS_SCREENSHOTS=str(root/'screenshots/ui/previews-integrated'),NODE_OPTIONS='--import=/Users/bao/taskbar-hero-ui-ledger/reports/ui/ports-aux-loader.mjs')
for port in range(5370,5375):
 with socket.socket() as s:s.bind(('127.0.0.1',port))
for label,cmd,cwd in [('lint-integrated',['npx','-y','pnpm@10.28.0','lint'],root),('build-integrated',['npx','-y','pnpm@10.28.0','build'],root),('browser-integrated',['npx','-y','pnpm@10.28.0','exec','playwright','test','e2e/ui/feature-samples.spec.ts','e2e/ui/art2-flag-off.spec.ts','e2e/ui/motion.spec.ts','--workers=2','--retries=0','--reporter=line'],root/'apps/web')]:
 with (out/(label+'.log')).open('w') as log:
  r=subprocess.run(cmd,cwd=cwd,env=env,stdout=log,stderr=subprocess.STDOUT);log.write('\nexit='+str(r.returncode)+'\n')
 print(label,r.returncode,flush=True)
 if r.returncode:raise SystemExit(r.returncode)
