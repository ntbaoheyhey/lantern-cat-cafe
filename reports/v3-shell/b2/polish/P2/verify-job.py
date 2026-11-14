from pathlib import Path
import subprocess,os,json,datetime,time
root=Path.cwd();out=root/'reports/v3-shell/b2/polish/P2';env=os.environ.copy();env.update(AUDIO_URL='http://127.0.0.1:5996',AUDIO_RUNTIME_ROOT=str(root/'work/v3solo-integration'),AUDIO_PYTHON=str(root/'tools/.venv/bin/python'),MIX_TRIAL='38-element-kits')
commands=[('playback',['node','scripts/audio/review-element-kits.mjs']),('mix',['node','scripts/audio/render-runtime.mjs']),('suite',['node','scripts/v3b2/run-solo-unit-suite.mjs','q9-p2']),('browser',['python3','scripts/v3b2/run-solo-browser-suite.py','q9-p2'])]
rows=[];children=[]
for name,cmd in commands:
 log=(out/(name+'.log')).open('w');child=subprocess.Popen(cmd,stdout=log,stderr=subprocess.STDOUT,env=env);children.append((child,log));rows.append({'name':name,'command':cmd,'pid':child.pid,'log':str(out/(name+'.log')),'started':datetime.datetime.now(datetime.timezone.utc).isoformat()})
(out/'jobs.json').write_text(json.dumps(rows,indent=2)+'\n')
while children:
 for child,log in list(children):
  code=child.poll()
  if code is None:continue
  log.close();row=next(r for r in rows if r['pid']==child.pid);row.update(exitCode=code,ended=datetime.datetime.now(datetime.timezone.utc).isoformat());children.remove((child,log));(out/'jobs.json').write_text(json.dumps(rows,indent=2)+'\n');print(row,flush=True)
 if children:time.sleep(2)
