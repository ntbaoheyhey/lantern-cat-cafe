from pathlib import Path
import subprocess,os,json
card=Path(__file__).parent
root=Path('/Users/bao/.codex/worktrees/mega-base0-repair-r2/taskbar-hero')
env=dict(os.environ,CI='true',SCREENSHOTS='0',VITE_SUPABASE_URL='',VITE_SUPABASE_ANON_KEY='',E2E_VIEWPORT='1280x720',E2E_PORT_CLASSIC='4380',E2E_PORT_V2='4381',E2E_PORT_SERVER='4382',E2E_PORT_API='4383')
rows=[]
def run(name,args,cwd):
 if (card/'logs'/(name+'.log')).exists():raise RuntimeError('Refusing to overwrite evidence '+name)
 with (card/'logs'/(name+'.log')).open('w') as stream:
  stream.write(json.dumps({'base':'5db4949','workingRepair':True,'command':args,'cwd':str(cwd)})+'\n');stream.flush()
  code=subprocess.call(args,cwd=cwd,env=env,stdout=stream,stderr=subprocess.STDOUT)
  stream.write('\nEXIT_CODE='+str(code)+'\n')
 rows.append({'step':name,'exit':code});(card/'targeted-repair-r2-results.json').write_text(json.dumps(rows,indent=2)+'\n')
 return code
try:
 for name,args in [('typecheck-r2',['pnpm','typecheck']),('lint-r2',['pnpm','lint'])]:
  if run(name,args,root):raise RuntimeError(name+' failed')
 fixture=root/'apps/web/e2e/support/server-fixture.ts';fixed=fixture.read_text()
 old=fixed.replace('await page.clock.install({ time: new Date(0) });\n  await page.clock.pauseAt(new Date());','await page.clock.install();\n  await page.clock.pauseAt(await page.evaluate(() => Date.now()));')
 if old==fixed:raise RuntimeError('Clock mutation did not match')
 try:
  fixture.write_text(old)
  code=run('clock-regression-old-origin-r2',['pnpm','test:e2e','e2e/server/fixture-clock.spec.ts','--workers=1','--output',str(card/'clock-old-origin-artifacts-r2')],root/'apps/web')
 finally:fixture.write_text(fixed)
 if code==0 or 'Cannot fast-forward to the past' not in (card/'logs/clock-regression-old-origin-r2.log').read_text():raise RuntimeError('Old-clock regression not established')
 if run('repair-original-repeat100-r2',['pnpm','test:e2e','e2e/v2/errors-notice.spec.ts','--grep','T1-T5','--repeat-each=100','--workers=1','--output',str(card/'repair-original-repeat100-r2-artifacts')],root/'apps/web'):raise RuntimeError('Original repeated case still fails')
 if run('repair-clock-regression-r2',['pnpm','test:e2e','e2e/server/fixture-clock.spec.ts','--workers=1','--output',str(card/'repair-clock-artifacts-r2')],root/'apps/web'):raise RuntimeError('Clock regression fails')
 (card/'TARGETED-REPAIR-R2-DONE').write_text('Targeted checks passed; full exact-head verification still required.\n')
except BaseException as error:
 (card/'TARGETED-REPAIR-R2-DONE').write_text('FAILED: '+str(error)+'\n');raise
finally:Path('/tmp/taskbar-hero-coordinator-4380.lock').unlink(missing_ok=True)
