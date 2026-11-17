#!/usr/bin/env python3
"""One detached job: load-guarded lockfile installs and a fresh SHIP clone."""
from pathlib import Path
import datetime, json, os, subprocess, time

ROOT=Path('/Users/bao/taskbar-hero-qa')
CLONE=Path('/Users/bao/taskbar-hero-qa-clone')
OUT=ROOT/'reports/v4-qa/Q2'
OUT.mkdir(parents=True,exist_ok=True)
report={'started':datetime.datetime.now(datetime.timezone.utc).isoformat(),'steps':[],'secretsRead':False}
def save(): (OUT/'fresh-clone.json').write_text(json.dumps(report,indent=2)+'\n')
def guarded(label):
    while os.getloadavg()[0]>9:
        print(f'{datetime.datetime.now(datetime.timezone.utc).isoformat()} DEFER {label} load1={os.getloadavg()[0]:.2f}',flush=True)
        if (ROOT/'STOP-V4QA').exists(): raise SystemExit('STOP-V4QA')
        time.sleep(300)
    print(f'START {label} load1={os.getloadavg()[0]:.2f}',flush=True)
def run(label,cmd,cwd):
    guarded(label)
    log=ROOT/f'work/v4qa/jobs/{label}.log'
    with log.open('w') as f:
        rc=subprocess.run(cmd,cwd=cwd,stdout=f,stderr=subprocess.STDOUT,env={**os.environ,'CI':'1'}).returncode
    report['steps'].append({'label':label,'command':cmd,'cwd':str(cwd),'exitCode':rc,'log':str(log)})
    save();print(f'END {label} exit={rc}',flush=True)
    if rc: raise SystemExit(rc)
save()
run('qa-lockfile-install',['pnpm','install','--frozen-lockfile','--reporter=append-only'],ROOT)
assert not CLONE.exists(), 'Fresh clone must not overwrite existing evidence'
run('fresh-ship-clone',['git','clone','--branch','codex/v4-ship-2026-11-16','/Users/bao/taskbar-hero',str(CLONE)],ROOT)
report['clonedSha']=subprocess.check_output(['git','rev-parse','HEAD'],cwd=CLONE,text=True).strip()
report['sourceTargetSha']=subprocess.check_output(['git','rev-parse','origin/codex/v4-ship-2026-11-16'],cwd=ROOT,text=True).strip()
subprocess.run(['git','checkout','--detach',report['sourceTargetSha']],cwd=CLONE,check=True,stdout=subprocess.DEVNULL)
run('clone-lockfile-install',['pnpm','install','--frozen-lockfile','--reporter=append-only'],CLONE)
report['ended']=datetime.datetime.now(datetime.timezone.utc).isoformat();save()
print('READY fresh scratch clone and frozen installs',flush=True)
