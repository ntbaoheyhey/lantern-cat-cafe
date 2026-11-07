import subprocess,os
from pathlib import Path
with Path('/Users/bao/taskbar-hero-ui-motion/reports/ui/logs/motion-builder/browser-bounded.log').open("w") as log:
 r=subprocess.run(['npx', '-y', 'pnpm@10.28.0', 'exec', 'playwright', 'test', 'e2e/ui/motion.spec.ts', 'e2e/ui/cxu3-forge.spec.ts', '--workers=2', '--retries=0', '--reporter=line'],cwd="apps/web",stdout=log,stderr=subprocess.STDOUT)
 log.write("\nexit="+str(r.returncode)+"\n")
