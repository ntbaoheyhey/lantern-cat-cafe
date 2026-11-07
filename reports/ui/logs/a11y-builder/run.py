import subprocess,os,json
from pathlib import Path
root=Path('/Users/bao/taskbar-hero-ui-motion');out=root/'reports/ui/logs/a11y-builder';env=dict(os.environ);env.update({k:str(5300+i) for i,k in enumerate(['E2E_PORT_CLASSIC','E2E_PORT_V2','E2E_PORT_SERVER','E2E_PORT_API'])});env['NODE_OPTIONS']='--import=/Users/bao/taskbar-hero-ui-ledger/reports/ui/ports-aux-loader.mjs';r=[]
for label,cmd,cwd in [('typecheck',['npx','-y','pnpm@10.28.0','typecheck'],root),('browser',['npx','-y','pnpm@10.28.0','exec','playwright','test','e2e/ui/keyboard-regions.spec.ts','e2e/ui/original-preview.spec.ts','e2e/ui/motion.spec.ts','e2e/ui/art2-flag-off.spec.ts','--repeat-each=3','--workers=2','--retries=0','--reporter=line'],root/'apps/web')]:
 with (out/(label+'.log')).open('w') as log:
  result=subprocess.run(cmd,cwd=cwd,env=env,stdout=log,stderr=subprocess.STDOUT);log.write('\nexit='+str(result.returncode)+'\n')
 r.append({'label':label,'exit':result.returncode});(out/'receipt.json').write_text(json.dumps(r,indent=2)+'\n');print(label,result.returncode,flush=True)
 if result.returncode:raise SystemExit(result.returncode)
