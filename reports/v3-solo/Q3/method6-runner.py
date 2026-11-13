from pathlib import Path
import subprocess,json,datetime
root=Path(__file__).resolve().parents[3]
q=root/'reports/v3-solo/Q3'
for fixture in ['wave1','wave3','boss']:
 command=['node','scripts/v3a2/battle-capture.mjs','--fixture',fixture,'--out','reports/v3-solo/Q3/method6','--complete-actions']
 print(json.dumps({'time':datetime.datetime.now(datetime.timezone.utc).isoformat(),'command':command}),flush=True)
 subprocess.run(command,cwd=root,check=True)
 subprocess.run(['tools/.venv/bin/python','scripts/v3a2/motion-metrics.py','--capture','reports/v3-solo/Q3/method6','--out','reports/v3-solo/Q3/method6-metrics.json'],cwd=root,check=True)
 result=subprocess.run(['tools/.venv/bin/python','scripts/v3a2/pilot-metrics.py',str(q/'method6'/fixture)],cwd=root,capture_output=True,text=True,check=True)
 (q/f'method6-{fixture}-framing.json').write_text(result.stdout)
 print(result.stdout,flush=True)
 for p in (q/'method6'/fixture).glob('frame-*.png'):p.unlink()
 data=json.loads((q/'method6-metrics.json').read_text())['fixtures'][fixture]
 if data['motionEnergy']<15.80 or data['hitKnockbackFraction']<1 or not data['parity'] or data['browserErrors']:
  raise SystemExit('FAIL '+fixture+'; retain evidence and change method')
print('All three full motion captures clear energy/recoil/parity. Performance and final checks still required.',flush=True)
