"""Run a preregistered R7 offset pair and synthetic status cases under a lease."""
from pathlib import Path
import argparse
import datetime
import hashlib
import json
import os
import subprocess
import sys

ROOT=Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--build',required=True);p.add_argument('--out',required=True);p.add_argument('--report',required=True);args=p.parse_args()
out=Path(args.out).resolve();report=Path(args.report).resolve();build_path=Path(args.build).resolve()
assert out.is_relative_to(ROOT/'work/v5/CXV') and not out.exists()
assert report.is_relative_to(ROOT/'reports/v5/CXV') and not report.exists()
prereg_path=ROOT/'reports/v5/CXV/M-label-envelope-pair-R1-preregistration.json'
prereg=json.loads(prereg_path.read_text());build=json.loads(build_path.read_text())
assert build['sourceCommit']==prereg['sourceCommit'] and build['indexSha256']==prereg['indexSha256']
out.mkdir(parents=True)
sha=lambda x:hashlib.sha256(Path(x).read_bytes()).hexdigest()
now=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
receipt=dict(utc=now(),sourceCommit=build['sourceCommit'],indexSha256=build['indexSha256'],
             preregistration=dict(path=str(prereg_path),sha256=sha(prereg_path)),build=dict(path=str(build_path),sha256=sha(build_path)),
             runnerSha256=sha(__file__),stages=[],complete=False,productionAcceptance=False)


def save():report.write_text(json.dumps(receipt,indent=2)+'\n')


def run(name,command,env):
    for stop in ('STOP-ALL','STOP-CXV'):assert not Path('/Users/bao/taskbar-hero-mailbox',stop).exists()
    started=now();log=out/(name+'.log')
    with log.open('w') as f:
        result=subprocess.run(command,cwd=ROOT,env=env,stdin=subprocess.DEVNULL,stdout=f,stderr=subprocess.STDOUT)
    stage=dict(name=name,startedUTC=started,completedUTC=now(),exit=result.returncode,log=dict(path=str(log),sha256=sha(log)))
    receipt['stages'].append(stage);save();print(json.dumps(stage),flush=True)
    assert result.returncode==0,name


try:
    analyses=[]
    for name,dx,dy,status,frames in [('baseline',0,0,'none',prereg['pairFrames']),('candidate',-12,19,'none',prereg['pairFrames']),('expanded-status',-12,19,'expanded',prereg['expandedFrames'])]:
        env=os.environ.copy();env.pop('CXV_LABEL_PILOT',None)
        env.update(CXV_LABEL_TARGET_DX=str(dx),CXV_LABEL_TARGET_DY=str(dy),CXV_LABEL_STATUS_FIXTURE=status,CXV_LABEL_FRAMES=','.join(map(str,frames)))
        folder=out/name
        run(name+'-capture',[sys.executable,'tools/v5vfx/run-media-natural.py','--cat','both','--capture','labels','--build',str(build_path),'--out',str(folder)],env)
        analysis=folder/'analysis.json'
        run(name+'-measure',[sys.executable,'tools/v5vfx/measure-dual-media-labels.py',str(folder),str(analysis)],env)
        analyses.append(analysis)
    pair=report.with_name(report.stem+'-comparison.json')
    run('pair-compare',[sys.executable,'tools/v5vfx/compare-label-target-pair.py',str(analyses[0]),str(analyses[1]),str(pair)],os.environ.copy())
    receipt['analyses']=[dict(path=str(x),sha256=sha(x)) for x in analyses]
    receipt['comparison']=dict(path=str(pair),sha256=sha(pair))
    receipt['complete']=True
except Exception as error:
    receipt['failure']=repr(error)
    raise
finally:
    receipt['completedUTC']=now();save()
