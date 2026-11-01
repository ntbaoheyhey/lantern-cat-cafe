from pathlib import Path
import subprocess,os,json,datetime
card=Path(__file__).parent
root=Path('/Users/bao/.codex/worktrees/mega-base0-repair-r2/taskbar-hero')
env=dict(os.environ,CI='true',SCREENSHOTS='0',VITE_SUPABASE_URL='',VITE_SUPABASE_ANON_KEY='',E2E_VIEWPORT='1280x720',E2E_PORT_CLASSIC='4380',E2E_PORT_V2='4381',E2E_PORT_SERVER='4382',E2E_PORT_API='4383')
rows=[]
commands=[('install',['pnpm','install','--frozen-lockfile'],root),('unmodified-repeat100',['pnpm','test:e2e','e2e/v2/errors-notice.spec.ts','--grep','T1-T5','--repeat-each=100','--workers=1','--trace=retain-on-failure','--output',str(card/'unmodified-repeat100-artifacts')],root/'apps/web')]
try:
 for name,args,cwd in commands:
  with (card/'logs'/(name+'.log')).open('w') as stream:
   stream.write(json.dumps({'head':'5db4949096e93eedeb98dff94ef1ec7019485f96','command':args,'cwd':str(cwd),'viewport':'1280x720','ports':[4380,4381,4382,4383]})+'\n');stream.flush()
   code=subprocess.call(args,cwd=cwd,env=env,stdout=stream,stderr=subprocess.STDOUT)
   stream.write('\nEXIT_CODE='+str(code)+'\n')
  rows.append({'step':name,'exit':code});(card/'reproduction-results.json').write_text(json.dumps(rows,indent=2)+'\n')
  if name=='install' and code:break
finally:
 (card/'REPRODUCTION-DONE').write_text('Read reproduction-results.json; reproduction is not a candidate grade.\n')
 Path('/tmp/taskbar-hero-coordinator-4380.lock').unlink(missing_ok=True)
