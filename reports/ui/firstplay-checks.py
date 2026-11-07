import subprocess
from pathlib import Path
root=Path.cwd();out=root/'reports/ui/logs/firstplay-transition'
for label,cmd,cwd in [('focused',['npx','-y','pnpm@10.28.0','exec','vitest','run','src/layout/StageLayout.test.tsx','src/layout/classpicker','src/onboarding','src/theme.contrast.test.ts','--maxWorkers=2'],root/'apps/web'),('lint',['npx','-y','pnpm@10.28.0','lint'],root),('build',['npx','-y','pnpm@10.28.0','build'],root)]:
 with (out/(label+'.log')).open('w') as log:
  r=subprocess.run(cmd,cwd=cwd,stdout=log,stderr=subprocess.STDOUT);log.write('\nexit='+str(r.returncode)+'\n')
 print(label,r.returncode,flush=True)
 if r.returncode:raise SystemExit(r.returncode)
