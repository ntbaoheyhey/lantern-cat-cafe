from pathlib import Path
import subprocess,json,datetime
root=Path(__file__).resolve().parents[3];q=root/'reports/v3-solo/Q3'
commands=[('clarity',['node','scripts/v3a2/clarity-audit.mjs']),('audio',['node','scripts/v3a2/audio-review.mjs']),('plate-browser',['node','scripts/v3a2/plate-browser-audit.mjs']),('plate-metrics',['tools/.venv/bin/python','scripts/v3a2/plate-metrics.py']),('plate-compare',['node','scripts/v3a2/plate-compare.mjs']),('joint-overlap',['tools/.venv/bin/python','scripts/v3a2/rig-joint-overlap.py']),('rig-metrics',['node','scripts/v3a2/collect-rigs.mjs'])]
status=q/'independent-refresh.json';results=json.loads(status.read_text()) if status.exists() else {}
for name,cmd in commands:
 if results.get(name,{}).get('exit')==0:continue
 log=q/('refresh-'+name+'.log');started=datetime.datetime.now(datetime.timezone.utc).isoformat()
 with log.open('w') as f:
  child=subprocess.Popen(cmd,cwd=root,stdout=f,stderr=subprocess.STDOUT)
  jobs=json.loads((q/'jobs.json').read_text());jobs.append(dict(name='refresh-'+name,pid=child.pid,command=cmd,log=str(log),started=started));(q/'jobs.json').write_text(json.dumps(jobs,indent=2)+'\n')
  code=child.wait()
 results[name]=dict(command=cmd,exit=code,log=str(log),started=started,ended=datetime.datetime.now(datetime.timezone.utc).isoformat(),sourceCommit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip())
 status.write_text(json.dumps(results,indent=2)+'\n');print(name,code,flush=True)
 if code:raise SystemExit(code)
