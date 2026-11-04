import subprocess,os,socket,json,datetime,pathlib,sys
root=pathlib.Path('/Users/bao/taskbar-hero-single');ledger=pathlib.Path('/Users/bao/taskbar-hero-ui-ledger');out=ledger/'reports/ui/cards/SINGLE-POLISH/logs';out.mkdir(parents=True,exist_ok=True)
receipt={'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'cwd':str(root),'pid':os.getpid(),'checks':[]};assert receipt['head']=='127e3f87c678be5909c4b420c46fd55d75fb5d72';assert not (out/'receipt.json').exists()
env=dict(os.environ,NODE_OPTIONS='--import=/Users/bao/taskbar-hero-ui-ledger/reports/ui/ports-aux-loader.mjs',E2E_PORT_CLASSIC='5300',E2E_PORT_V2='5301',E2E_PORT_SERVER='5302',E2E_PORT_API='5303',UI_AUDIT_PORT='5340',SCREENSHOTS='1');pnpm=['pnpm','exec']
def run(label,command,cwd=root/'apps/web'):
 for port in [5300,5301,5302,5303,5304,5340]:
  with socket.socket() as sock:sock.bind(('127.0.0.1',port))
 print('START',label,flush=True)
 with (out/(label+'.log')).open('w') as f:
  p=subprocess.run(command,cwd=cwd,env=env,stdout=f,stderr=subprocess.STDOUT);f.write('\nexit='+str(p.returncode)+'\n')
 receipt['checks'].append({'label':label,'command':command,'exit':p.returncode,'finished':datetime.datetime.now(datetime.timezone.utc).isoformat()});(out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print('END',label,'exit='+str(p.returncode),flush=True)
for size in ['1280x720','1600x900']:
 env['E2E_VIEWPORT']=size
 run('state-matrix-repeat3-'+size,pnpm+['playwright','test','e2e/ui/cxr2-state-matrix.spec.ts','--repeat-each=3','--workers=2','--retries=0','--reporter=line'])
for size in ['1280x720','1600x900']:
 run('effects-'+size,['node','--import','/Users/bao/taskbar-hero-ui/reports/ui/ports-loader.mjs','tools/effects-test.mjs',str(out.parent/('effects-'+size)),'--viewport='+size])
run('keyboard-performance',['node',str(ledger/'reports/ui/single-keyboard-performance.mjs')],root)
receipt['complete']=True;(out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');sys.exit(1 if any(c['exit'] for c in receipt['checks']) else 0)
