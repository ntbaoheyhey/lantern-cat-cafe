import subprocess
from pathlib import Path
r=Path.cwd()
with (r/"reports/ui/logs/gallery-bootstrap/install.log").open("w") as log:
 p=subprocess.run(["npx","-y","pnpm@10.28.0","install","--offline","--frozen-lockfile","--ignore-scripts"],stdout=log,stderr=subprocess.STDOUT);log.write("\nexit="+str(p.returncode)+"\n")
print("install",p.returncode,flush=True)
raise SystemExit(p.returncode)
