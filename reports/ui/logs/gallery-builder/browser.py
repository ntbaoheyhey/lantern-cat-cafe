from pathlib import Path
import os,subprocess
root=Path.cwd();out=root/'reports/ui/logs/gallery-builder'
for size in ['1280x720','1600x900']:
 env=dict(os.environ,E2E_VIEWPORT=size,GALLERY_SCREENSHOTS=str(root/'screenshots/ui/gallery-builder'))
 with (out/('browser-'+size+'.log')).open('w') as log:
  r=subprocess.run(['npx','-y','pnpm@10.28.0','exec','playwright','test','--config',str(root/'reports/ui/gallery.config.mjs'),'--reporter=line'],cwd=root/'apps/web',env=env,stdout=log,stderr=subprocess.STDOUT);log.write('\nexit='+str(r.returncode)+'\n')
 print(size,r.returncode,flush=True)
 if r.returncode:raise SystemExit(r.returncode)
