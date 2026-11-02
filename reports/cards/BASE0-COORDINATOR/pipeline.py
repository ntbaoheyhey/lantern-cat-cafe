from pathlib import Path
import subprocess, os, json, datetime
card=Path(__file__).parent
root=Path('/Users/bao/.codex/worktrees/mega-base0-coordinator-r4/taskbar-hero')
runner=card/'run-gates.py'
head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
rows=[]
def checkpoint(status):
    (card/'runtime.json').write_text(json.dumps({'owner':'coordinator','status':status,'head':head,'worktree':str(root),'pid':os.getpid(),'ports':[4380,4381,4382,4383],'updated_at':datetime.datetime.now().astimezone().isoformat(),'checks':rows},indent=2)+'\n')
def check_control():
    if not (card/'CONTROL.md').read_text().startswith('ACTIVE:'): raise RuntimeError('Coordinator card is not active')
def launch(name,args):
    check_control();checkpoint('RUNNING '+name)
    with (card/(name+'-orchestrator.log')).open('w') as stream:
        code=subprocess.call(args,stdout=stream,stderr=subprocess.STDOUT)
    rows.append({'name':name,'exit':code});checkpoint('FINISHED '+name)
    return code
def command(name,cmd,cwd=root,viewport='1280x720'):
    return launch(name,['python3',str(runner),str(cwd),str(card/'checks'),'command','--name',name,'--command',cmd,'--port','4380','--viewport',viewport])
try:
    full=launch('full',['python3',str(runner),str(root),str(card/'full'),'full','--port','4380'])
    if full: raise RuntimeError('Full gate failed; inspect results.jsonl before more work')
    for size in ['1280x720','1600x900']:
        code=launch('repeat-'+size,['python3',str(runner),str(root),str(card/('repeat-'+size)),'repeat','--viewport',size,'--port','4380'])
        if code: raise RuntimeError('Changed-spec repeat failed at '+size)
    for size in ['1280x720','1600x900']:
        if command('effects-'+size,f'SCREENSHOTS=1 node tools/.base0-r4-effects.mjs {card}/effects-{size} --viewport={size}',root/'apps/web',size): raise RuntimeError('Effects failed')
    for kind,fixture in [('guest','bossReadyStrong'),('signed-in','strong --signed-in')]:
        if command('audit-'+kind,f'node tools/.base0-r4-audit.mjs {card}/audit-{kind} {fixture} --strict',root/'apps/web'): raise RuntimeError('Audit failed')
    if command('keyboard',f'node /Users/bao/.codex/handoffs/taskbar-hero/reliability/keyboard-walk.mjs {root} {card}/accessibility 4380'): raise RuntimeError('Keyboard failed')
    if command('contrast','pnpm --filter @taskbar-hero/web exec vitest run src/theme.contrast.test.ts'): raise RuntimeError('Contrast failed')
    if command('reference-compare',f'node {card}/reference-compare.mjs {root} {card}/reference'): raise RuntimeError('Reference capture failed')
    if command('public-config',f'node /Users/bao/.codex/handoffs/taskbar-hero/reliability/public-proof.mjs {root} {card}/public-config 4380'): raise RuntimeError('Production preview failed')
    (card/'wrapper-tmp').mkdir(exist_ok=True)
    if command('verify-pr-246',f'TMPDIR={card}/wrapper-tmp VITE_ALLOW_MOCK_AUTH=0 bash scripts/verify-pr.sh 246'): raise RuntimeError('PR wrapper failed')
    checkpoint('CHECKS_COMPLETE_NEEDS_REVIEW');(card/'PIPELINE-DONE').write_text('Checks complete; mutations/review/grades remain.\n')
except BaseException as error:
    checkpoint('STOPPED: '+str(error));(card/'PIPELINE-DONE').write_text('FAILED or interrupted: '+str(error)+'\n');raise
