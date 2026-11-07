import os,subprocess,json,socket
from pathlib import Path
root=Path.cwd();out=root/'reports/ui/logs/motion-release-stage';receipt=[]
for size in ['1280x720','1600x900']:
 with socket.socket() as sock:sock.bind(('127.0.0.1',5366))
 env=dict(os.environ,UI_AUDIT_PORT='5366',SCREENSHOTS='1')
 cmd=['node','--import','/Users/bao/taskbar-hero-ui/reports/ui/ports-loader.mjs','tools/effects-test.mjs',str(root/'screenshots/ui'/('motion-effects-release-'+size)),'--viewport='+size]
 with (out/(size+'.log')).open('w') as log:
  r=subprocess.run(cmd,cwd=root/'apps/web',env=env,stdout=log,stderr=subprocess.STDOUT);log.write('\nexit='+str(r.returncode)+'\n')
 receipt.append({'label':size,'exit':r.returncode});(out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(size,r.returncode,flush=True)
 if r.returncode:raise SystemExit(r.returncode)
