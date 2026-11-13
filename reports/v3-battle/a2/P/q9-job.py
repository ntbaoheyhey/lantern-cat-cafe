import subprocess,json,datetime
from pathlib import Path
out=Path('reports/v3-battle/a2/P');rows=[]
for name,cmd in [('performance',['node','scripts/v3a2/performance-review.mjs']),('suite',['node','scripts/v3a2/run-suite.mjs','P'])]:
 with (out/(name+'.log')).open('w') as log:
  child=subprocess.Popen(cmd,stdout=log,stderr=subprocess.STDOUT);code=child.wait()
 rows.append({'name':name,'command':cmd,'pid':child.pid,'exitCode':code,'at':datetime.datetime.now(datetime.timezone.utc).isoformat()})
 (out/'job.json').write_text(json.dumps(rows,indent=2)+'\n')
 if code:break
