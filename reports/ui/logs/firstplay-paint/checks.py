import subprocess
from pathlib import Path
for label,cmd in [('lint',['npx','-y','pnpm@10.28.0','lint']),('build',['npx','-y','pnpm@10.28.0','build'])]:
 with Path('reports/ui/logs/firstplay-paint/'+label+'.log').open('w') as log:
  r=subprocess.run(cmd,stdout=log,stderr=subprocess.STDOUT);log.write('\nexit='+str(r.returncode)+'\n')
 print(label,r.returncode,flush=True)
 if r.returncode:raise SystemExit(r.returncode)
