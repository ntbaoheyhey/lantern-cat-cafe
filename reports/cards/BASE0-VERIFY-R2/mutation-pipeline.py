from pathlib import Path
import subprocess,os,json,datetime
card=Path(__file__).parent
root=Path('/Users/bao/.codex/worktrees/mega-base0-mutants-280ff4b/taskbar-hero')
rows=[]
try:
 for name,args in [('install',['pnpm','install','--frozen-lockfile']),('mutations',['node',str(card/'run-mutations.mjs')])]:
  if not (card/'CONTROL.md').read_text().startswith('ACTIVE:'):raise RuntimeError('Paused')
  with (card/(name+'-mutation-pipeline.log')).open('w') as stream:code=subprocess.call(args,cwd=root,stdout=stream,stderr=subprocess.STDOUT)
  rows.append({'step':name,'exit':code});(card/'mutation-pipeline-results.json').write_text(json.dumps(rows,indent=2)+'\n')
  if code:break
finally:
 (card/'MUTATION-PIPELINE-DONE').write_text('Inspect results/completed.json; completion does not imply all controls/mutants passed.\n')
 Path('/tmp/taskbar-hero-coordinator-4400.lock').unlink(missing_ok=True)
