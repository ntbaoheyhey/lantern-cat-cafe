from pathlib import Path
import subprocess,json
root=Path('/Users/bao/taskbar-hero-ui-ledger'); runner=root/'reports/ui/axe-review.mjs'; items=[('motion-a','taskbar-hero-ui-motion','5301','motion'),('motion-b','taskbar-hero-ui-motion-b','5321','motion'),('previews-a','taskbar-hero-ui-previews','5341','samples'),('previews-b','taskbar-hero-ui-previews-b','5361','samples')]; receipts=[]
for label,folder,distport,mode in items:
 out=root/'reports/ui/logs/axe-final-checks'/label;out.mkdir()
 with (out/'runner.log').open('w') as log:
  result=subprocess.run(['node',str(runner),'/Users/bao/'+folder,'dist-v2/e2e-'+distport,'5330',str(out),mode],cwd=root,stdout=log,stderr=subprocess.STDOUT)
  log.write('\nexit='+str(result.returncode)+'\n')
 receipts.append({'label':label,'exit':result.returncode});(root/'reports/ui/logs/axe-final-checks/receipt.json').write_text(json.dumps(receipts,indent=2)+'\n'); print(label,result.returncode,flush=True)
 if result.returncode:raise SystemExit(result.returncode)
