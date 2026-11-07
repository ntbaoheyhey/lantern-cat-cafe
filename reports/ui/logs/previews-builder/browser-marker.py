import subprocess,os
from pathlib import Path
with Path('/Users/bao/taskbar-hero-ui-previews/reports/ui/logs/previews-builder/browser-marker.log').open("w") as log:
 r=subprocess.run(['npx', '-y', 'pnpm@10.28.0', 'exec', 'playwright', 'test', 'e2e/ui/feature-samples.spec.ts', 'e2e/ui/art2-flag-off.spec.ts', '--workers=2', '--retries=0', '--reporter=line'],cwd="apps/web",stdout=log,stderr=subprocess.STDOUT)
 log.write("\nexit="+str(r.returncode)+"\n")
