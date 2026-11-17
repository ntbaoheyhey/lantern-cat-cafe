#!/usr/bin/env python3
"""Execute only the safe local runbook steps in the disposable clone."""
from pathlib import Path
import datetime,json,os,re,subprocess,time

ROOT=Path('/Users/bao/taskbar-hero-qa');CLONE=Path('/Users/bao/taskbar-hero-qa-clone');OUT=ROOT/'reports/v4-qa/Q2'
steps=[
 ('typecheck',['pnpm','-r','typecheck']),
 ('test',['pnpm','test']),
 ('supabase-test',['pnpm','--filter','@taskbar-hero/supabase-tests','test']),
 ('forge-test',['forge','test','--root','contracts','-q']),
 ('campaign-manifest',['node','tools/chain/campaign-manifest.mjs','--check']),
 ('icons',['node','scripts/ui/check-icons.mjs']),
 ('typography',['node','scripts/ui/check-typography.mjs']),
 ('build',['pnpm','build']),
]
dest=OUT/'local-checks-1.json'
assert not dest.exists(),'Preserve previous run evidence'
report={'started':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sourceSha':subprocess.check_output(['git','rev-parse','HEAD'],cwd=CLONE,text=True).strip(),'steps':[],'scope':'Local safe commands only; no Vercel/Supabase auth or deployment; diagnostic secret-like tokens redacted.'}
def save():dest.write_text(json.dumps(report,indent=2)+'\n')
save()
env={k:v for k,v in os.environ.items() if k in {'PATH','HOME','USER','LOGNAME','SHELL','TMPDIR','LANG','LC_ALL','PNPM_HOME','XDG_CACHE_HOME'}}
env.update({'CI':'1','NO_COLOR':'1','FORCE_COLOR':'0'})
for name,cmd in steps:
    if (ROOT/'STOP-V4QA').exists():break
    while os.getloadavg()[0]>9:
        print(f'DEFER {name} load1={os.getloadavg()[0]:.2f}',flush=True);time.sleep(300)
    print(f'START {name} load1={os.getloadavg()[0]:.2f}',flush=True)
    started=datetime.datetime.now(datetime.timezone.utc).isoformat();log=ROOT/f'work/v4qa/jobs/q2-{name}.log'
    with log.open('w') as f:\n+        child=subprocess.Popen(cmd,cwd=CLONE,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,errors='replace')
        report['active']={'name':name,'pid':child.pid,'log':str(log)};save()
        for line in child.stdout:
            if re.search(r'(?:private.?key|secret|bearer|authorization)\s*[:=]\s*[\'\"]?[A-Za-z0-9+/_=-]{16,}',line,re.I):line='[sensitive-like diagnostic omitted]\n'
            line=re.sub(r'0x[0-9a-fA-F]{64,}', '[hex payload redacted]',line)
            f.write(line)
        rc=child.wait()
    row={'name':name,'command':cmd,'exitCode':rc,'status':'PASS' if rc==0 else 'FAIL','started':started,'ended':datetime.datetime.now(datetime.timezone.utc).isoformat(),'log':str(log)}
    report['steps'].append(row);report.pop('active',None);save();print(f'END {name} {row["status"]}',flush=True)
report['ended']=datetime.datetime.now(datetime.timezone.utc).isoformat();save()
print('COMPLETE local runbook checks',flush=True)
