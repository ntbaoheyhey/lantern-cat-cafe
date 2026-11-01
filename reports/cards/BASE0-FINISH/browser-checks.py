from pathlib import Path
import subprocess, os, json, datetime
card=Path(__file__).parent
root=Path('/Users/bao/.codex/worktrees/mega-base0-finish-verify/taskbar-hero')
runner=card/'run-gates.py'
rows=[]
def run(name, command, cwd=root, viewport='1280x720'):
    if not (card/'CONTROL.md').read_text().startswith('ACTIVE:'): raise RuntimeError('Card no longer active')
    args=['python3',str(runner),str(cwd),str(card/'checks'),'command','--name',name,'--command',command,'--port','4380','--viewport',viewport]
    code=subprocess.call(args)
    rows.append({'name':name,'exit':code})
    (card/'browser-checks-status.json').write_text(json.dumps(rows,indent=2)+'\n')
for viewport in ['1280x720','1600x900']:
    run('changed-repeat10-'+viewport,'pnpm test:e2e e2e/smoke.spec.ts e2e/ui/baseline-hud.spec.ts e2e/ui/f3-art.spec.ts e2e/ui/g1-perf.spec.ts e2e/ui/g3-combat.spec.ts e2e/v2/errors-notice.spec.ts --repeat-each=10 --workers=1',root/'apps/web',viewport)
for size in ['1280x720','1600x900']:
    run('effects-'+size,f'SCREENSHOTS=1 node tools/.base0-finish-effects.mjs {card}/effects-{size} --viewport={size}',root/'apps/web',size)
for kind,extra in [('guest','bossReadyStrong'),('signed-in','strong --signed-in')]:
    run('audit-'+kind,f'node tools/.base0-finish-audit.mjs {card}/audit-{kind} {extra} --strict',root/'apps/web')
run('keyboard',f'node /Users/bao/.codex/handoffs/taskbar-hero/reliability/keyboard-walk.mjs {root} {card}/accessibility 4380')
run('contrast','pnpm --filter @taskbar-hero/web exec vitest run src/theme.contrast.test.ts')
run('public-config',f'node /Users/bao/.codex/handoffs/taskbar-hero/reliability/public-proof.mjs {root} {card}/public-config 4380')
run('reference-compare',f'node {card}/reference-compare.mjs {root} {card}/reference')
(card/'wrapper-tmp').mkdir(exist_ok=True)
run('verify-pr-246',f'TMPDIR={card}/wrapper-tmp VITE_ALLOW_MOCK_AUTH=0 bash scripts/verify-pr.sh 246')
