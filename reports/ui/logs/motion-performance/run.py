import os,socket,subprocess,json
from pathlib import Path
root=Path.cwd();out=root/'reports/ui/logs/motion-performance';receipt=[]
jobs=[('ui-60fps',['node','tools/effects-test.mjs','reports/ui/cards/MOTION/performance','--port=5350','--dist=dist-v2/e2e-5361'],root,5350)]
for size in ['1280x720','1600x900']:
 jobs.append(('effects-'+size,['node','--import','/Users/bao/taskbar-hero-ui/reports/ui/ports-loader.mjs','tools/effects-test.mjs',str(root/'screenshots/ui'/('motion-effects-'+size)),'--viewport='+size],root/'apps/web',5351))
for label,cmd,cwd,port in jobs:
 with socket.socket() as s:s.bind(('127.0.0.1',port))
 env=dict(os.environ,UI_AUDIT_PORT=str(port),SCREENSHOTS='1')
 with (out/(label+'.log')).open('w') as log:
  r=subprocess.run(cmd,cwd=cwd,env=env,stdout=log,stderr=subprocess.STDOUT);log.write('\nexit='+str(r.returncode)+'\n')
 receipt.append({'label':label,'exit':r.returncode});(out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(label,r.returncode,flush=True)
 if r.returncode:raise SystemExit(r.returncode)
