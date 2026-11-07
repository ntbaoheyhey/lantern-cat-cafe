import subprocess
from pathlib import Path
with Path('reports/ui/logs/motion-builder/opacity.log').open('w') as log:
 r=subprocess.run(['npx','-y','pnpm@10.28.0','exec','playwright','test','e2e/ui/merged-redesign.spec.ts','e2e/ui/motion.spec.ts','--repeat-each=3','--workers=2','--retries=0','--reporter=line'],cwd='apps/web',stdout=log,stderr=subprocess.STDOUT);log.write('\nexit='+str(r.returncode)+'\n')
