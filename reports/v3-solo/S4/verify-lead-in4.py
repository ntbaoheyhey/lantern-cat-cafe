"""Checkpointed full-fixture continuation; preserve a failed pilot without promotion."""
from pathlib import Path
import datetime, hashlib, json, os, subprocess, time
root=Path(__file__).resolve().parents[3]
base=root/'reports/v3-solo/S4/lead-in4'
b=Path('/Users/bao/taskbar-hero-chain/reports/v3-shell/b2/polish/S4/lead-in4')
threshold=json.loads((root/'scripts/v3a2/targets.json').read_text())['motionEnergyMin']
jobs=[]
def run(name,cmd):
    log=base/(name+'.log')
    with log.open('w') as out:
        p=subprocess.Popen(cmd,cwd=root,stdout=out,stderr=subprocess.STDOUT)
        jobs.append(dict(name=name,pid=p.pid,command=cmd,cwd=str(root),log=str(log)))
        (base/'verification-jobs.json').write_text(json.dumps(jobs,indent=2)+'\n')
        code=p.wait()
    print(name,code,flush=True)
    if code:raise SystemExit(code)
def measure():
    run('metrics',['tools/.venv/bin/python','scripts/v3a2/motion-metrics.py','--capture',str(base),'--out',str(base/'motion.json')])
    return json.loads((base/'motion.json').read_text())['fixtures']
def acceptable(row):
    return row['motionEnergy']>=threshold and row['hitKnockbackFraction']==1 and row['minActionDisplacementFraction']>.06 and row['displacementPer10s']>=2 and row['parity'] and not row['browserErrors']
end=time.monotonic()+600
while not ((base/'wave1/capture.json').exists() and (b/'current-cadence.json').exists()):
    if time.monotonic()>end:raise SystemExit('Initial capture still absent; retain its PID and log.')
    time.sleep(2)
cadence=json.loads((b/'current-cadence.json').read_text())
rows=measure();pilot=6<=cadence['medianVoiceIntervalSeconds']<=9 and not cadence['errors'] and acceptable(rows['wave1'])
summary=dict(at=datetime.datetime.now(datetime.timezone.utc).isoformat(),cadenceSeconds=cadence['medianVoiceIntervalSeconds'],voices=cadence['voiceStarts'],motionEnergy={k:v['motionEnergy'] for k,v in rows.items()},pilotPass=pilot,accepted=False)
(base/'summary.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps(summary),flush=True)
if not pilot:raise SystemExit('Initial pilot rejected; change method before another attempt.')
for fixture in ['wave3','boss']:
    if not (base/fixture/'capture.json').exists():run('capture-'+fixture,['node','scripts/v3a2/battle-capture.mjs','--fixture',fixture,'--seconds','30','--complete-actions','--out',str(base)])
rows=measure();summary.update(motionEnergy={k:v['motionEnergy'] for k,v in rows.items()},allMotionPass=len(rows)==3 and all(acceptable(v) for v in rows.values()))
(base/'summary.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps(summary),flush=True)
if not summary['allMotionPass']:raise SystemExit('Full motion gate failed; no canonical captures changed.')
