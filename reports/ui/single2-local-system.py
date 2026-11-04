import os,subprocess,json,socket,sys
from pathlib import Path
root=Path('/Users/bao/taskbar-hero-single2-tooling');ledger=Path('/Users/bao/taskbar-hero-ui-ledger');out=ledger/'reports/sys/single2/local-system';out.mkdir(parents=True,exist_ok=True)
receipt={'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'checks':[]}
env=dict(os.environ,NODE_OPTIONS='--import='+str(root/'scripts/release-ports.mjs'),E2E_PORT_CLASSIC='5360',E2E_PORT_V2='5361',E2E_PORT_SERVER='5362',E2E_PORT_API='5363')
def run(label,argv):
 print('START',label,flush=True)
 with (out/(label+'.log')).open('w') as f:
  r=subprocess.run(argv,cwd=root,env=env,stdout=f,stderr=subprocess.STDOUT);f.write('\nexit='+str(r.returncode)+'\n')
 receipt['checks'].append({'label':label,'command':argv,'exit':r.returncode});(out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print('END',label,r.returncode,flush=True)
run('deno-map-generation',['node','scripts/gen-deno-json.mjs'])
run('deno-map-drift',['git','diff','--exit-code','--','supabase/functions'])
run('deno-import-guard',['node','scripts/check-deno-imports.mjs'])
run('local-cutover',['node','scripts/rehearse-cutover.mjs'])
receipt['complete']=True;(out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');sys.exit(int(any(c['exit'] for c in receipt['checks'])))
