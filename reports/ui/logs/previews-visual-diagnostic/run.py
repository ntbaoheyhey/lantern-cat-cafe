import subprocess
from pathlib import Path
with Path('reports/ui/logs/previews-visual-diagnostic/repeats.log').open('w') as log:
 r=subprocess.run(['npx','-y','pnpm@10.28.0','exec','playwright','test','e2e/ui/art2-flag-off.spec.ts','--repeat-each=20','--workers=2','--retries=0','--reporter=line'],cwd='apps/web',stdout=log,stderr=subprocess.STDOUT);log.write('\nexit='+str(r.returncode)+'\n')
