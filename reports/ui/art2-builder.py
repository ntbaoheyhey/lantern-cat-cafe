import os,subprocess,socket,json
from pathlib import Path
root=Path.cwd();out=root/'reports/ui/logs/art2-builder';env=dict(os.environ);env.update({k:str(5300+i) for i,k in enumerate(['E2E_PORT_CLASSIC','E2E_PORT_V2','E2E_PORT_SERVER','E2E_PORT_API'])});env['ART2_SCREENSHOTS']=str(root/'screenshots/ui/art2-builder');env['ORIGINAL_SCREENSHOTS']=env['ART2_SCREENSHOTS']
commands=[('art-tests',['python3','-B','-m','unittest','discover','-s','tools/art','-v'],root),('lint',['npx','-y','pnpm@10.28.0','lint'],root),('art-units',['npx','-y','pnpm@10.28.0','exec','vitest','run','src/art/Art2.test.tsx','src/theme.contrast.test.ts','--maxWorkers=2'],root/'apps/web'),('build',['npx','-y','pnpm@10.28.0','build'],root),('browser',['npx','-y','pnpm@10.28.0','exec','playwright','test','e2e/ui/art2.spec.ts','e2e/ui/original-preview.spec.ts','--workers=2','--retries=0','--reporter=line'],root/'apps/web')]
receipt=[]
for label,command,cwd in commands:
 if label=='browser':
  for port in range(5300,5304):
   with socket.socket() as sock:sock.bind(('127.0.0.1',port))
 print('START',label,flush=True)
 with (out/(label+'.log')).open('w') as log:
  r=subprocess.run(command,cwd=cwd,env=env,stdout=log,stderr=subprocess.STDOUT);log.write('\nexit='+str(r.returncode)+'\n')
 receipt.append({'label':label,'exit':r.returncode});(out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print('END',label,'exit='+str(r.returncode),flush=True)
 if r.returncode:raise SystemExit(r.returncode)
