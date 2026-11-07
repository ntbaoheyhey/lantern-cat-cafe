import os,subprocess,json
from pathlib import Path
root=Path.cwd();out=root/'reports/ui/logs/motion-builder';receipt=[]
for label,cmd,cwd in [('typecheck-fixed',['npx','-y','pnpm@10.28.0','typecheck'],root),('focused',['npx','-y','pnpm@10.28.0','exec','vitest','run','src/motion','src/layout/hud/LevelXpBar.test.tsx','src/shell','src/theme.contrast.test.ts','--maxWorkers=2'],root/'apps/web'),('browser',['npx','-y','pnpm@10.28.0','exec','playwright','test','e2e/ui/motion.spec.ts','e2e/ui/art2-flag-off.spec.ts','e2e/ui/cxu3-forge.spec.ts','e2e/ui/cxr2-returning-guest.spec.ts','--workers=2','--retries=0','--reporter=line'],root/'apps/web')]:
 print('START',label,flush=True)
 with (out/(label+'.log')).open('w') as log:
  r=subprocess.run(cmd,cwd=cwd,stdout=log,stderr=subprocess.STDOUT);log.write('\nexit='+str(r.returncode)+'\n')
 receipt.append({'label':label,'exit':r.returncode});(out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print('END',label,'exit='+str(r.returncode),flush=True)
 if r.returncode:raise SystemExit(r.returncode)
