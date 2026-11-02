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
  run('rules-all','pnpm --filter @taskbar-hero/game-rules test',root)
  run('pets-isolation','pnpm --filter @taskbar-hero/web test src/pets/isolation.test.ts',root)
  run('web-typecheck','pnpm --filter @taskbar-hero/web typecheck',root)
  run('deno-resolution','pnpm gen:deno && git diff --exit-code -- supabase/functions && node scripts/check-deno-imports.mjs',root)
  run('v2-build','VITE_GAME_V2=1 pnpm --filter @taskbar-hero/web build',root)
  tracked=subprocess.check_output(['git','status','--short','--untracked-files=no'],cwd=root,text=True)
  (card/'tracked-status.txt').write_text(tracked)
  if tracked:raise RuntimeError('Tracked files changed during preflight')
  state('CHECKS_COMPLETE_NEEDS_REVIEW');(card/'DONE').write_text('Focused preflight complete; not a full gate or grade.\n')
 except BaseException as e:
  state('FAILED '+str(e));(card/'DONE').write_text('FAILED: '+str(e)+'\n');raise
