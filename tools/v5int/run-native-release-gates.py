"""Run sequential browser gates only after CXI explicitly acquires the preview lease."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib, json, os, subprocess, sys
ROOT = Path(__file__).resolve().parents[2]
build_path = Path(sys.argv[1]).resolve()
label = sys.argv[2]
assert label.startswith('v8-native-r') and all(c.isalnum() or c == '-' for c in label)
build = json.loads(build_path.read_text())
assert build['registryOverride'] is None and not build['productionRegistryChanged']
verification = ROOT / 'reports/v5/CXI/evidence/v8-native-r3-source-verification.json'
v = json.loads(verification.read_text())
assert v['candidate']['sourceCommit'] == build['sourceCommit']
assert v['candidate']['indexSha256'] == build['indexSha256']
assert hashlib.sha256(build_path.read_bytes()).hexdigest() == v['candidate']['sha256']
assert v['priorSuite']['exit'] == 0 and not v['protectedDiff']
job_dir = ROOT / 'work/v5/CXI/jobs'
status_path = job_dir / f'{label}-status.json'
assert not status_path.exists()
env = dict(os.environ, CXI_BUILD_DESCRIPTOR=str(build_path))
steps = [
 ('transfer', ['node','tools/v5int/measure-transfer.mjs',f'--label={label}','--scenario=all',f'--build-descriptor={build_path}']),
 ('audio-paths', ['node','tools/v5int/compare-audio-paths.mjs','work/v5/CXI/transfer/v8-native-r2-final/all.json',f'work/v5/CXI/transfer/{label}/all.json']),
 ('first-hit', ['node','tools/v5int/first-hit.mjs',label]),
 ('route', ['node','tools/v5int/route-entry.mjs',label]),
 ('recovery', ['node','tools/v5int/verify-sheet-recovery.mjs',label]),
 ('lifecycle', ['node','tools/v5int/probe-paused-battle-context.mjs',label,'candidate']),
 ('films', ['node','tools/v5int/record-review.mjs',label,'all','30']),
]
status = []
for name, command in steps:
 for flag in ['STOP-ALL','STOP-CXI']:
  assert not (Path('/Users/bao/taskbar-hero-mailbox') / flag).exists(), flag
 assert hashlib.sha256((ROOT/'apps/web/dist/index.html').read_bytes()).hexdigest() == build['indexSha256']
 assert not subprocess.check_output(['git','diff',build['sourceCommit'],'--name-only','--','apps/web','packages','assets'],cwd=ROOT,text=True).strip()
 log = job_dir / f'{label}-{name}.log'
 assert not log.exists()
 print(datetime.now(timezone.utc).isoformat(),'START',name,flush=True)
 with log.open('w') as output:
  code = subprocess.run(command,cwd=ROOT,env=env,stdin=subprocess.DEVNULL,stdout=output,stderr=subprocess.STDOUT).returncode
 status.append(dict(step=name,exit=code,log=str(log),utc=datetime.now(timezone.utc).isoformat()))
 status_path.write_text(json.dumps(status,indent=2)+'\n')
 print(datetime.now(timezone.utc).isoformat(),'EXIT',name,code,flush=True)
 if code: raise SystemExit(code)
