#!/usr/bin/env python3
"""Run bounded mission checks with exact-head provenance and disk-only logs."""
from pathlib import Path
import argparse, datetime, json, os, re, subprocess, sys, time, gzip

parser = argparse.ArgumentParser()
parser.add_argument('root', type=Path)
parser.add_argument('out', type=Path)
parser.add_argument('mode', choices=['baseline', 'full', 'repeat', 'command'])
parser.add_argument('--name')
parser.add_argument('--command')
parser.add_argument('--viewport', default='1280x720')
parser.add_argument('--port', type=int, default=4600)
args = parser.parse_args()
root = args.root.resolve()
out = args.out.resolve()
out.mkdir(parents=True, exist_ok=True)
env = dict(os.environ, CI='true', VITE_SUPABASE_URL='', VITE_SUPABASE_ANON_KEY='', SCREENSHOTS='0', E2E_VIEWPORT=args.viewport)
for offset, key in enumerate(['E2E_PORT_CLASSIC','E2E_PORT_V2','E2E_PORT_SERVER','E2E_PORT_API']):
    env[key] = str(args.port + offset)
head = subprocess.check_output(['git','rev-parse','HEAD'], cwd=root, text=True).strip()
base = subprocess.check_output(['git','rev-parse','origin/main'], cwd=root, text=True).strip()
patterns = [r'eyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}', r'gh[pousr]_[A-Za-z0-9]{30,}', r'sb_secret_[A-Za-z0-9_-]{10,}', r'postgres(?:ql)?://[^\s\"\']+']

def clean(value):
    for pattern in patterns:
        value = re.sub(pattern, '[MASKED]', value)
    return value

def run(name, command, cwd=root):
    log = out / (name + '.log')
    if log.exists():
        raise RuntimeError('Refusing to overwrite prior evidence: ' + str(log))
    started = datetime.datetime.now().astimezone().isoformat(timespec='seconds')
    before = subprocess.check_output(['git','status','--porcelain'], cwd=root, text=True)
    meta = {'name':name,'head':head,'base':base,'started':started,'cwd':str(cwd),'command':command,'viewport':args.viewport,'ports':{k:v for k,v in env.items() if k.startswith('E2E_PORT_')},'empty_backend_env':True,'screenshots':False,'starting_git_status':before}
    print('START ' + name, flush=True)
    start = time.monotonic()
    with log.open('w') as stream:
        stream.write(json.dumps(meta, sort_keys=True) + '\n')
        process = subprocess.Popen(command, shell=True, executable='/bin/bash', cwd=cwd, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        for line in process.stdout:
            stream.write(clean(line))
            stream.flush()
        code = process.wait()
        stream.write('\nEXIT_CODE=' + str(code) + '\n')
    end_head = subprocess.check_output(['git','rev-parse','HEAD'], cwd=root, text=True).strip()
    result = dict(meta, exit_code=code, head_unchanged=end_head == head, seconds=round(time.monotonic()-start,2), log=str(log))
    with (out/'results.jsonl').open('a') as stream:
        stream.write(json.dumps(result, sort_keys=True) + '\n')
    print('DONE ' + name + ' exit=' + str(code) + ' seconds=' + str(result['seconds']), flush=True)
    if end_head != head:
        raise RuntimeError('HEAD moved during check')
    return code

def bundle_inventory(name, directories=None):
    rows=[]
    for directory in directories or ['apps/web/dist','apps/web/dist-v2']:
        path=root/directory
        if path.exists():
            for file in sorted(path.rglob('*')):
                if file.is_file() and file.suffix in ['.js','.css']:
                    data=file.read_bytes()
                    rows.append({'file':str(file.relative_to(root)),'bytes':len(data),'gzip_bytes':len(gzip.compress(data,mtime=0))})
    (out/(name+'.json')).write_text(json.dumps({'head':head,'files':rows,'total_bytes':sum(r['bytes'] for r in rows),'gzip_total_bytes':sum(r['gzip_bytes'] for r in rows)},indent=2)+'\n')

codes=[]
if args.mode == 'command':
    codes.append(run(args.name, args.command))
elif args.mode == 'repeat':
    specs = 'e2e/smoke.spec.ts e2e/ui/baseline-hud.spec.ts e2e/ui/f3-art.spec.ts e2e/ui/g1-perf.spec.ts e2e/ui/g3-combat.spec.ts e2e/v2/errors-notice.spec.ts e2e/server/fixture-clock.spec.ts e2e/server/journeys.spec.ts e2e/server/n1-relic-recovery.spec.ts e2e/layout/resize-burst.spec.ts e2e/layout/resize.spec.ts e2e/layout/stage-redraw.spec.ts'
    codes.append(run('changed-specs-repeat10-'+args.viewport, 'pnpm test:e2e ' + specs + ' --repeat-each=10 --workers=2', root/'apps/web'))
else:
    if run('install', 'pnpm install --frozen-lockfile') != 0:
        sys.exit(1)
    if args.mode == 'full':
        for name, command in [('deno-drift','pnpm gen:deno && git diff --exit-code -- supabase/functions'),('typecheck','pnpm typecheck'),('lint','pnpm lint'),('test','pnpm test')]:
            codes.append(run(name,command))
    codes.append(run('build','pnpm build'))
    bundle_inventory('bundle-default')
    codes.append(run('bundle-scan','node scripts/check-bundle.mjs'))
    codes.append(run('classic-build','VITE_GAME_V2=0 pnpm --filter @taskbar-hero/web build'))
    bundle_inventory('bundle-classic')
    codes.append(run('v2-budget-build','VITE_GAME_V2=1 pnpm --filter @taskbar-hero/web exec vite build --outDir dist/v2-budget'))
    bundle_inventory('bundle-v2', ['apps/web/dist/v2-budget'])
    codes.append(run('links','node scripts/check-links.mjs'))
    if args.mode == 'full':
        codes.append(run('deno-imports','node scripts/check-deno-imports.mjs'))
        for viewport in ['1280x720','1600x900']:
            args.viewport=viewport
            env['E2E_VIEWPORT']=viewport
            codes.append(run('e2e-'+viewport,'pnpm test:e2e --workers=2',root/'apps/web'))
sys.exit(1 if any(codes) else 0)
