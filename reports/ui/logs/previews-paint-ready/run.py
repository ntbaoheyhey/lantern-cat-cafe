import subprocess
from pathlib import Path
for label,cmd,cwd in [('typecheck',['npx','-y','pnpm@10.28.0','typecheck'],'.'),('visual',['npx','-y','pnpm@10.28.0','exec','playwright','test','e2e/ui/art2-flag-off.spec.ts','--repeat-each=3','--workers=2','--retries=0','--reporter=line'],'apps/web')]:
 with Path('reports/ui/logs/previews-paint-ready/'+label+'.log').open('w') as log:
  r=subprocess.run(cmd,cwd=cwd,stdout=log,stderr=subprocess.STDOUT);log.write('\nexit='+str(r.returncode)+'\n')
 print(label,r.returncode,flush=True)
 if r.returncode:raise SystemExit(r.returncode)
