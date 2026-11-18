"""Run a fresh native media battle pair with source, harness and host-load receipts."""
from pathlib import Path
import argparse,datetime,hashlib,json,os,subprocess,sys,urllib.request
p=argparse.ArgumentParser();p.add_argument('--build',required=True);p.add_argument('--out',required=True);p.add_argument('--cat',choices=['mochi','clover','both'],default=os.environ.get('CXV_MEDIA_CAT','mochi'));p.add_argument('--capture',choices=['canvas'],default='canvas');args=p.parse_args()
r=Path(__file__).resolve().parents[2];build=Path(args.build).resolve();out=Path(args.out).resolve()
assert out.is_relative_to(r/'work/v5/CXV') and not out.exists(),'Preserve earlier evidence'
assert datetime.datetime.now(datetime.timezone.utc)>=datetime.datetime.fromisoformat('2026-11-18T17:45:44+00:00')
assert os.environ.get('CXV_CAPTURE_LEASE_UNTIL')
for name in ['STOP-ALL','STOP-CXV']:assert not Path('/Users/bao/taskbar-hero-mailbox',name).exists(),name
assert args.cat=='mochi'
out.mkdir(parents=True);d=json.loads(build.read_text());env=os.environ.copy()
env.update(CXV_MEDIA_BUILD=str(build),CXV_MEDIA_CAT=args.cat,CXV_FULL_FIXTURE=str(r/'tools/v5vfx/media-production-fixture.mjs'),CXV_CAPTURE_OUT=str(out),CXV_SERVED_SOURCE=d['sourceCommit'],CXV_EXPECTED_INDEX=d['indexSha256'],CXV_FULL_CPU_RATE='1')
sha=lambda data:hashlib.sha256(data).hexdigest()
integration=Path('/Users/bao/taskbar-hero-chain');dist=Path(d['dist'])
origin='http://127.0.0.1:6301';url=origin+'/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3'
def served(path):
 with urllib.request.urlopen(path,timeout=15) as response:return response.read()
assert sha(served(url))==d['indexSha256']==sha((dist/'index.html').read_bytes())
verified=dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),url=url,sourceCommit=d['sourceCommit'],indexSha256=d['indexSha256'],build=dict(path=str(build),sha256=sha(build.read_bytes())),runtimePatchSha256=sha(b''),sourceFiles=[],mediaFiles=[],artifacts=[])
for item in d['runtimeSources']:
 relative=Path(item['path']).relative_to(integration).as_posix()
 data=subprocess.check_output(['git','show',d['sourceCommit']+':'+relative],cwd=integration)
 assert sha(data)==item['sha256'],relative
 verified['sourceFiles'].append(dict(path=relative,sha256=sha(data),basis='Pinned Git source; unrelated live checkout edits are not the capture source'))
for item in d['files']:
 data=Path(item['path']).read_bytes();remote=served(origin+item['url'])
 assert len(data)==len(remote)==item['bytes'] and sha(data)==sha(remote)==item['sha256'],item['url']
 verified['mediaFiles'].append(dict(url=item['url'],bytes=len(data),sha256=sha(data)))
for path in sorted((dist/'assets').rglob('*')):
 if not path.is_file() or path.suffix not in ('.js','.css'):continue
 relative=path.relative_to(dist).as_posix();data=path.read_bytes();remote=served(origin+'/'+relative)
 assert data==remote,relative
 verified['artifacts'].append(dict(path=relative,bytes=len(data),sha256=sha(data)))
assert verified['sourceFiles'] and verified['mediaFiles'] and verified['artifacts']
(out/'artifact-verification.json').write_text(json.dumps(verified,indent=2)+'\n')
print(json.dumps(dict(verifiedSourceFiles=len(verified['sourceFiles']),verifiedMediaFiles=len(verified['mediaFiles']),verifiedArtifacts=len(verified['artifacts']),cat=args.cat)),flush=True)
provenance=[]
names=['verify-fixed-label-layout.mjs','probe-label-staging-idle.mjs','hud-meter-observation.mjs','verify-label-fullpaint.py','verify-lower-label-native.mjs','probe-action-labels.mjs','action-label-observation.mjs','measure-action-labels.py','run-mochi-label-controls.py','mochi-label-production-fixture.mjs','capture-full-battle-production.mjs','measure-media-battle.py','run-media-natural.py','measure-dual-media-battle.py','verify-media-battle-rules.mjs','probe-dual-media-labels.mjs','measure-dual-media-labels.py']
names+=['run-footer-trajectory-r1.py','footer-identity-stable-prototype.mjs','probe-footer-trajectory-r1.mjs','measure-footer-trajectory-r1.py','mochi-label-observation.mjs']
for name in names:
 data=(r/'tools/v5vfx'/name).read_bytes();(out/name).write_bytes(data);provenance.append(dict(name=name,sha256=hashlib.sha256(data).hexdigest()))
(out/'harness-provenance.json').write_text(json.dumps(provenance,indent=2)+'\n')
(out/'host-load.txt').write_bytes(subprocess.check_output(['ps','-axo','pid,pcpu,etime,comm']))
print(json.dumps(dict(startedUTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),source=d['sourceCommit'],index=d['indexSha256'],out=str(out))),flush=True)
capture_script='probe-footer-trajectory-r1.mjs'
assert args.cat=='mochi'
result=subprocess.run(['node','tools/v5vfx/'+capture_script],cwd=r,env=env)
(out/'host-load-after.txt').write_bytes(subprocess.check_output(['ps','-axo','pid,pcpu,etime,comm']))
receipt=dict(exit=result.returncode,completedUTC=datetime.datetime.now(datetime.timezone.utc).isoformat())
(out/'exit.json').write_text(json.dumps(receipt)+'\n');print(json.dumps(receipt),flush=True);sys.exit(result.returncode)
