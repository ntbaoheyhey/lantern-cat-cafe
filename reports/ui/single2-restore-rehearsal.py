import json,subprocess,sys,hashlib
from pathlib import Path
root=Path('/Users/bao/taskbar-hero-single2-tooling');head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
out=Path('/Users/bao/taskbar-hero-ui-ledger/reports/sys/single2/repo-restore')/head[:7];out.mkdir(parents=True,exist_ok=False)
a=out/'repo-source-a.tgz';b=out/'repo-source-b.tgz';dest=Path('/private/tmp/taskbar-hero-repo-restore-'+head[:7]);r={'head':head,'label':'repo-source rehearsal only, not deployed backup','checks':[]}
commands=[['python3','-B','scripts/repo-functions-rehearsal.py','export',str(a)],['python3','-B','scripts/repo-functions-rehearsal.py','export',str(b)],['cmp',str(a),str(b)],['python3','-B','scripts/repo-functions-rehearsal.py','restore',str(a),str(dest),'--test']]
for index,argv in enumerate(commands):
 print('START',index,flush=True)
 with (out/(str(index)+'.log')).open('w') as f:
  result=subprocess.run(argv,cwd=root,stdout=f,stderr=subprocess.STDOUT);f.write('\nexit='+str(result.returncode)+'\n')
 r['checks'].append({'command':argv,'exit':result.returncode});(out/'receipt.json').write_text(json.dumps(r,indent=2)+'\n');print('END',index,result.returncode,flush=True)
 if result.returncode:sys.exit(result.returncode)
r['archiveSha256']=hashlib.sha256(a.read_bytes()).hexdigest();r['archiveBytes']=a.stat().st_size;r['complete']=True;(out/'receipt.json').write_text(json.dumps(r,indent=2)+'\n')
