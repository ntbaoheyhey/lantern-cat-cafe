from pathlib import Path
import os,subprocess
r=Path.cwd();d=r/"reports/ui/logs/gallery-current-builder"
for size in ["1280x720","1600x900"]:
 env=dict(os.environ,E2E_VIEWPORT=size,GALLERY_SCREENSHOTS=str(r/"screenshots/ui/gallery-current-builder"),UI_AXE_SOURCE="/private/tmp/taskbar-hero-ui-axe-4.10.3.min.js")
 with (d/("browser-"+size+".log")).open("w") as log:
  result=subprocess.run(["npx","-y","pnpm@10.28.0","exec","playwright","test","--config",str(r/"reports/ui/gallery.config.mjs"),"--reporter=line"],cwd=r/"apps/web",env=env,stdout=log,stderr=subprocess.STDOUT);log.write("\nexit="+str(result.returncode)+"\n")
 print(size,result.returncode,flush=True)
 if result.returncode:raise SystemExit(result.returncode)
