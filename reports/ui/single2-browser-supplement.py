#!/usr/bin/env python3
"""Complete the changed-spec matrix on an already-frozen product head; no full-suite rerun."""
import argparse,datetime,json,os,socket,subprocess,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--pass-name',required=True);p.add_argument('--port',type=int,required=True);a=p.parse_args()
root=Path.cwd();out=root/'reports/ui/logs'/a.pass_name;out.mkdir(parents=True,exist_ok=False)
head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
paths=subprocess.check_output(['git','diff','--name-only','340f88b',head,'--','apps/web/e2e'],text=True).splitlines()
covered={'e2e/ui/cxu3-forge.spec.ts','e2e/ui/art2-flag-off.spec.ts','e2e/ui/landing-font-stability.spec.ts'}
specs=[x.removeprefix('apps/web/') for x in paths if x.endswith('.spec.ts') and x.removeprefix('apps/web/') not in covered]
env=dict(os.environ,NODE_OPTIONS='--import=/Users/bao/taskbar-hero-ui-ledger/reports/ui/ports-aux-loader.mjs')
for i,key in enumerate(['E2E_PORT_CLASSIC','E2E_PORT_V2','E2E_PORT_SERVER','E2E_PORT_API']):env[key]=str(a.port+i)
cap=root/'screenshots/ui'/a.pass_name
for key in ['CXU3','CXR2','ART2','ORIGINAL','MOTION','FIRSTPLAY']:env[key+'_SCREENSHOTS']=str(cap)
env['PREVIEWS_SCREENSHOTS']=str(cap/'feature-samples')
r={'head':head,'coveredByEarlierPass':sorted(covered),'specs':specs,'checks':[]}
for size in ['1280x720','1600x900']:
 for port in range(a.port,a.port+5):
  with socket.socket() as sock:sock.bind(('127.0.0.1',port))
 env['E2E_VIEWPORT']=size
 argv=['npx','-y','pnpm@10.28.0','exec','playwright','test',*specs,'--repeat-each=3','--workers=2','--retries=0','--reporter=line']
 print('START',size,flush=True)
 with (out/(size+'.log')).open('w') as f:
  result=subprocess.run(argv,cwd=root/'apps/web',env=env,stdout=f,stderr=subprocess.STDOUT);f.write('\nexit='+str(result.returncode)+'\n')
 r['checks'].append({'size':size,'command':argv,'exit':result.returncode,'finished':datetime.datetime.now(datetime.timezone.utc).isoformat()});(out/'receipt.json').write_text(json.dumps(r,indent=2)+'\n')
 print('END',size,'exit='+str(result.returncode),flush=True)
 if result.returncode:sys.exit(result.returncode)
