from pathlib import Path
import subprocess,json,datetime,os,signal,shutil,sys
root=Path(__file__).resolve().parents[3]
q=root/'reports/v3-solo/Q3'
method=sys.argv[1]
source=q/method
metrics=json.loads((q/(method+'-metrics.json')).read_text())
for fixture in ['wave1','wave3','boss']:
 row=metrics['fixtures'][fixture]
 assert row['motionEnergy']>=15.8 and row['hitKnockbackFraction']==1 and row['parity'] and not row['browserErrors'],fixture
 framing=json.loads((q/(method+'-'+fixture+'-framing.json')).read_text())
 assert framing['clippedFaceSamples']==0,fixture
 for card in ['M1','V2']:
  dest=root/'reports/v3-battle/a2'/card/'capture'/fixture
  dest.mkdir(parents=True,exist_ok=True)
  for name in ['capture.json','battle.webm']:shutil.copy2(source/fixture/name,dest/name)
def run(name,cmd):
 log=q/(name+'.log')
 with log.open('w') as f:
  child=subprocess.Popen(cmd,cwd=root,stdout=f,stderr=subprocess.STDOUT)
  jobs=json.loads((q/'jobs.json').read_text())
  jobs.append(dict(name=name,pid=child.pid,command=cmd,log=str(log),started=datetime.datetime.now(datetime.timezone.utc).isoformat()))
  (q/'jobs.json').write_text(json.dumps(jobs,indent=2)+'\n')
  print(json.dumps(jobs[-1]),flush=True)
  code=child.wait()
 print(name,code,flush=True)
 if code:raise SystemExit(code)
def sim(action):
 process=subprocess.run(['ps','-p','72306','-o','command='],capture_output=True,text=True)
 if 'native-sensitivity.mjs' in process.stdout:
  os.killpg(72306,signal.SIGSTOP if action=='STOP' else signal.SIGCONT)
  h=root/'reports/v3-solo/HANDOFF-SOLO.md'
  lines=h.read_text().splitlines();lines=[line for line in lines if not line.startswith('PERF-SIM:')]
  lines.append('PERF-SIM: native-sensitivity group72306 '+action+' '+datetime.datetime.now(datetime.timezone.utc).isoformat())
  h.write_text('\n'.join(lines)+'\n')
  print('Simulation group72306 '+action,flush=True)
sim('STOP')
try:
 run('final-motion-review',['node','scripts/v3a2/motion-review.mjs'])
 run('final-field-skill-review',['node','scripts/v3a2/field-skill-review.mjs'])
finally:sim('CONT')
run('final-suite',['node','scripts/v3a2/run-suite.mjs','M1'])
suite=root/'reports/v3-battle/a2/M1/suite.json'
shutil.copy2(suite,root/'reports/v3-battle/a2/V2/suite.json')
run('final-motion-metrics',['tools/.venv/bin/python','scripts/v3a2/motion-metrics.py'])
run('final-field-skill-metrics',['tools/.venv/bin/python','scripts/v3a2/field-skill-metrics.py'])
run('final-enemy-metrics',['node','scripts/v3solo/collect-q3.mjs'])
run('final-comparisons',['tools/.venv/bin/python','scripts/v3solo/motion-compare.py'])
run('final-gates',['node','scripts/v3a2/check-gates.mjs','M1','V2'])
