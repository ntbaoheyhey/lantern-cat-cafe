"""Run a fresh native media battle pair with source, harness and host-load receipts."""
from pathlib import Path
import argparse,datetime,hashlib,json,os,subprocess,sys
p=argparse.ArgumentParser();p.add_argument('--build',required=True);p.add_argument('--out',required=True);args=p.parse_args()
r=Path(__file__).resolve().parents[2];build=Path(args.build).resolve();out=Path(args.out).resolve()
assert out.is_relative_to(r/'work/v5/CXV') and not out.exists(),'Preserve earlier evidence'
for name in ['STOP-ALL','STOP-CXV']:assert not Path('/Users/bao/taskbar-hero-mailbox',name).exists(),name
out.mkdir(parents=True);d=json.loads(build.read_text());env=os.environ.copy()
env.update(CXV_MEDIA_BUILD=str(build),CXV_FULL_FIXTURE=str(r/'tools/v5vfx/media-production-fixture.mjs'),CXV_CAPTURE_OUT=str(out),CXV_SERVED_SOURCE=d['sourceCommit'],CXV_EXPECTED_INDEX=d['indexSha256'],CXV_FULL_CPU_RATE='1')
provenance=[]
for name in ['media-production-fixture.mjs','capture-full-battle-production.mjs','measure-media-battle.py','run-media-natural.py']:
 data=(r/'tools/v5vfx'/name).read_bytes();(out/name).write_bytes(data);provenance.append(dict(name=name,sha256=hashlib.sha256(data).hexdigest()))
(out/'harness-provenance.json').write_text(json.dumps(provenance,indent=2)+'\n')
(out/'host-load.txt').write_bytes(subprocess.check_output(['ps','-axo','pid,pcpu,etime,comm']))
print(json.dumps(dict(startedUTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),source=d['sourceCommit'],index=d['indexSha256'],out=str(out))),flush=True)
result=subprocess.run(['node','tools/v5vfx/capture-full-battle-production.mjs'],cwd=r,env=env)
(out/'host-load-after.txt').write_bytes(subprocess.check_output(['ps','-axo','pid,pcpu,etime,comm']))
receipt=dict(exit=result.returncode,completedUTC=datetime.datetime.now(datetime.timezone.utc).isoformat())
(out/'exit.json').write_text(json.dumps(receipt)+'\n');print(json.dumps(receipt),flush=True);sys.exit(result.returncode)
