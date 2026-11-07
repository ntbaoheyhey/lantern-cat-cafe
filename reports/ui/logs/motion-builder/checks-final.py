import subprocess,os
from pathlib import Path
root=Path.cwd();out=root/'reports/ui/logs/motion-builder'
for label,cmd,cwd in [('type-final',['npx','-y','pnpm@10.28.0','typecheck'],root),('lint-final',['npx','-y','pnpm@10.28.0','lint'],root),('build-final',['npx','-y','pnpm@10.28.0','build'],root)]:
 with (out/(label+'.log')).open('w') as log:
  r=subprocess.run(cmd,cwd=cwd,stdout=log,stderr=subprocess.STDOUT);log.write('\nexit='+str(r.returncode)+'\n')
 print(label,r.returncode,flush=True)
 if r.returncode:raise SystemExit(r.returncode)
