import subprocess,os,json,socket,sys,datetime
from pathlib import Path
root=Path('/Users/bao/taskbar-hero-single2');ledger=Path('/Users/bao/taskbar-hero-ui-ledger');out=ledger/'reports/ui/cards/SINGLE2-POLISH';out.mkdir(parents=True,exist_ok=True)
receipt={'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'checks':[]}
def run(label,argv,cwd=root,env=None):
 print('START',label,flush=True)
 with (out/(label+'.log')).open('w') as f:
  r=subprocess.run(argv,cwd=cwd,env=env,stdout=f,stderr=subprocess.STDOUT);f.write('\nexit='+str(r.returncode)+'\n')
 receipt['checks'].append({'label':label,'command':argv,'exit':r.returncode});(out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print('END',label,r.returncode,flush=True)
 if r.returncode:sys.exit(r.returncode)
run('motion-fps',['node','tools/effects-test.mjs','reports/ui/cards/SINGLE2-POLISH/motion','--port=5350','--dist=dist-v2/e2e-5301'])
for size in ['1280x720','1600x900']:
 env=dict(os.environ,UI_AUDIT_PORT='5350',SCREENSHOTS='1')
 run('stage-effects-'+size,['node','--import','/Users/bao/taskbar-hero-ui/reports/ui/ports-loader.mjs','tools/effects-test.mjs',str(out/('effects-'+size)),'--viewport='+size],root/'apps/web',env)
run('keyboard-performance',['node',str(ledger/'reports/ui/single2-keyboard-performance.mjs'),str(root),str(out)])
run('bundle-guard',['node','scripts/check-bundle.mjs'])
receipt['complete']=True;(out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
