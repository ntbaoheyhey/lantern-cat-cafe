from pathlib import Path
import subprocess, json, datetime, os, fcntl
card=Path(__file__).parent
assignment=json.loads((card/'assignment.json').read_text())
root=Path(assignment['worktree'])
helper=card.parent/'BASE0-VERIFY-R2/run-gates.py'
rows=[]
def state(status):
 (card/'runtime.json').write_text(json.dumps({'owner':'coordinator','pid':os.getpid(),'status':status,'head':assignment['candidate'],'worktree':str(root),'ports':assignment['ports'],'updated_at':datetime.datetime.now().astimezone().isoformat(),'checks':rows},indent=2)+'\n')
def run(name,cmd,cwd):
 if not (card/'CONTROL.md').read_text().startswith('ACTIVE:'): raise RuntimeError('Control paused')
 state('RUNNING '+name)
 with (card/'logs'/(name+'-orchestrator.log')).open('w') as out:
  code=subprocess.call(['python3',str(helper),str(cwd),str(card/'checks'),'command','--name',name,'--command',cmd,'--port','4440','--viewport','1280x720'],stdout=out,stderr=subprocess.STDOUT)
 rows.append({'name':name,'exit':code});state('FINISHED '+name)
 if code:raise RuntimeError(name+' failed; preserve first failure')
with open('/tmp/taskbarhero-e2e-4440.lock','w') as lock:
 fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
 try:
  run('install','pnpm install --frozen-lockfile',root)
  run('hero-help-units','pnpm --filter @taskbar-hero/web test src/layout/character src/layout/HelpTab src/ui src/theme.contrast.test.ts src/layout/StageLayout.test.tsx src/layout/notice',root)
  run('web-typecheck','pnpm --filter @taskbar-hero/web typecheck',root)
  run('hero-help-repeat10','pnpm test:e2e e2e/layout/character-bag.spec.ts e2e/ui/u4-character-bag.spec.ts e2e/ui/cxu4-hero-help.spec.ts e2e/server/cxu4-offline.spec.ts --project=stage-layout --project=v2-server --workers=1 --repeat-each=10',root/'apps/web')
  for size in ['1280x720','1600x900']:
   run('effects-'+size,'node tools/.cxu4-preflight-effects.mjs '+str(card/'local-only'/('effects-'+size))+' --viewport='+size,root/'apps/web')
  (root/'apps/web/tools/.cxu4-preflight-effects.mjs').unlink()
  tracked=subprocess.check_output(['git','status','--short','--untracked-files=no'],cwd=root,text=True)
  (card/'tracked-status.txt').write_text(tracked)
  if tracked:raise RuntimeError('Tracked files changed during preflight')
  state('CHECKS_COMPLETE_NEEDS_REVIEW');(card/'DONE').write_text('Focused preflight complete; not a full gate or grade.\n')
 except BaseException as e:
  state('FAILED '+str(e));(card/'DONE').write_text('FAILED: '+str(e)+'\n');raise
 finally:
  (root/'apps/web/tools/.cxu4-preflight-effects.mjs').unlink(missing_ok=True)

