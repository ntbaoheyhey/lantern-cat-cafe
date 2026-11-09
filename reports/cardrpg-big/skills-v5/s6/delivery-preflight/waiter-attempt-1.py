from pathlib import Path
import datetime,json,os,subprocess,time
root=Path('/Users/bao/taskbar-hero-cardrpg-a4')
os.chdir(root)
report=root/'reports/cardrpg-big/skills-v5/s6'
status=report/'delivery-continuation.json'
assert not status.exists(), 'Inspect existing delivery continuation; do not duplicate it.'
state={'startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'pid':os.getpid(),'acceptancePid':33012,'status':'WAITING for the original registered acceptance runner','steps':[]}
def save():
 status.write_text(json.dumps(state,indent=2)+'\n')
def stamp():return datetime.datetime.now(datetime.timezone.utc).isoformat()
save()
while True:
 body=Path('/tmp/cardrpg-v5a-s6-acceptance-1.log').read_text()
 done=any('"block":"20001–20500"' in s and '"complete":true' in s for s in body.splitlines())
 if done:break
 try:os.kill(33012,0)
 except ProcessLookupError:
  state['status']='STOPPED: original acceptance runner exited before its completion marker';save();raise RuntimeError(state['status'])
 time.sleep(30)
reg=json.loads((report.parent/'REGISTERED-METHOD.json').read_text())
assert all((report/mode/scope/'results.json').exists() for mode in ['on','off'] for scope in reg['scopes'])
state['status']='RUNNING delivery after all20 scopes';save()
commands=[('prepare',['node','tools/cardrpg-big/skills-v5/delivery-prepare.mjs']),('report',['node','tools/cardrpg-big/skills-v5/delivery-report.mjs']),('guide-build',['node','tools/cardrpg-big/skills-v5/build-guide.mjs']),('guide-check',['node','tools/cardrpg-big/with-timing-lock.mjs','V5A S6 offline guide three-width check','node','tools/cardrpg-big/skills-v5/guide-check.mjs'])]
for name,cmd in commands:
 log=report/(name+'-continuation-1.log')
 with log.open('x') as f:\n  started=stamp();code=subprocess.run(cmd,stdout=f,stderr=subprocess.STDOUT).returncode
 row={'step':name,'startedAt':started,'endedAt':stamp(),'code':code,'log':str(log.relative_to(root))}
 state['steps'].append(row);save();print(json.dumps(row),flush=True)
 if code:
  state['status']='STOPPED: inspect original failure; no automatic retry';save();raise SystemExit(code)
 time.sleep(7)
state['status']='PREPARED: inspect original Z and guide images, update evidence/report/state, then draft publication';state['endedAt']=stamp();save();print(json.dumps(state),flush=True)
