import os,json,subprocess,time,datetime
from pathlib import Path
root=Path.cwd(); lock=Path('/Users/bao/.taskbar-hero-locks/merge.lock'); out=root/'reports/ui/logs/cxr2-release-locked'; out.mkdir(parents=True,exist_ok=True)
expected='UI session CXR2\n2026-11-03T12:28:54.361260+00:00\nPID 54443 (locked release checks)\nbranch ai/codex-ui-cxr2\n'
assert (lock/'owner').read_text()==expected,'Lock owner changed; do not remove'
try: os.kill(54443,0)
except ProcessLookupError: pass
else: raise RuntimeError('Old PID is alive; do not remove')
# User explicitly approved removing ONLY this orphaned prior UI lock in this chat.
(lock/'owner').unlink();lock.rmdir();lock.mkdir();owner='ui '+datetime.datetime.now(datetime.timezone.utc).isoformat()+' '+str(os.getpid())+'\n';(lock/'owner').write_text(owner)
try:
 for label,cmd in [('fetch',['git','fetch','origin']),('integrate',['git','merge','--no-edit','origin/main'])]:
  with (out/(label+'.log')).open('w') as log:
   r=subprocess.run(cmd,stdout=log,stderr=subprocess.STDOUT);log.write('\nexit='+str(r.returncode)+'\n')
  assert r.returncode==0,label
 assert subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()=='335011f8fd29dfd1034fd63bfaddbbe7f6bc1cb1','Main integration changed head; review required'
 specs=json.loads((root/'reports/ui/cards/CXR2/changed-specs.json').read_text())
 with (out/'checks.log').open('w') as log:
  r=subprocess.run(['python3','reports/ui/run-gate.py','--pass-name','cxr2-release-locked','--port','5370','--release','--specs',*specs],stdout=log,stderr=subprocess.STDOUT);log.write('\nexit='+str(r.returncode)+'\n')
 assert r.returncode==0,'Locked checks failed'
 (out/'ready.json').write_text(json.dumps({'status':'READY','head':'335011f8fd29dfd1034fd63bfaddbbe7f6bc1cb1','pid':os.getpid(),'owner':owner})+'\n');print('READY FOR MERGE',flush=True)
 deadline=time.monotonic()+2700
 while not (out/'release-requested').exists():
  assert time.monotonic()<deadline,'Lock hold exceeded45min after checks'
  time.sleep(1)
finally:
 if (lock/'owner').exists() and (lock/'owner').read_text()==owner:
  (lock/'owner').unlink();lock.rmdir();print('OWN LOCK RELEASED',flush=True)
