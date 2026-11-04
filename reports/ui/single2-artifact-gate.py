#!/usr/bin/env python3
import argparse,subprocess,os,json,datetime,sys,hashlib
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--name',required=True);p.add_argument('--gallery',action='store_true');a=p.parse_args();r=Path.cwd();out=r/'reports/ui/logs'/a.name;out.mkdir(parents=True,exist_ok=False)
d={'head':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'checks':[]}
def run(label,argv,cwd=r,env=None):
 print('START',label,flush=True)
 with (out/(label+'.log')).open('w') as f:
  c=subprocess.run(argv,cwd=cwd,env=env,stdout=f,stderr=subprocess.STDOUT);f.write('\nexit='+str(c.returncode)+'\n')
 d['checks'].append({'label':label,'command':argv,'exit':c.returncode});(out/'receipt.json').write_text(json.dumps(d,indent=2)+'\n');print('END',label,c.returncode,flush=True)
 if c.returncode:sys.exit(c.returncode)
if a.gallery:
 run('regenerate',['python3','reports/ui/build-gallery.py'])
 run('generated-clean',['git','diff','--exit-code','--','reports/ui/gallery.html','docs/ui/demo/index.html','docs/ui/gallery/index.html','reports/ui/cards/index.html','reports/ui/FINAL-REPORT.md','reports/ui/gallery-manifest.json'])
 run('links',['node','scripts/check-links.mjs','docs/ui/demo-script.md','reports/ui/cards/SINGLE2-STACK/REPORT.md'])
 for size in ['1280x720','1600x900']:
  env=dict(os.environ,E2E_VIEWPORT=size,GALLERY_SCREENSHOTS=str(out/'screenshots'),UI_AXE_SOURCE='/private/tmp/taskbar-hero-ui-axe-4.10.3.min.js')
  run('standalone-'+size,['npx','-y','pnpm@10.28.0','exec','playwright','test','--config',str(r/'reports/ui/gallery.config.mjs'),'--repeat-each=3','--retries=0','--reporter=line'],r/'apps/web',env)
else:
 docs=['docs/submission.md','docs/security-overview.md','docs/video-script.md','docs/release-status.md','docs/judge-walkthrough.md','docs/pitch-slides.md',*[str(p) for p in sorted((r/'docs/submission').glob('*.md'))]]
 run('links',['node','scripts/check-links.mjs',*docs])
run('scope-clean',['git','diff','--exit-code','1eefc3e','HEAD','--','apps','packages','supabase','contracts','tools'])
d['complete']=True;(out/'receipt.json').write_text(json.dumps(d,indent=2)+'\n')
