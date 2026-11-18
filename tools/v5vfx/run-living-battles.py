"""Sequential production encounters; keep all output under ignored evidence."""
from pathlib import Path
import os,subprocess,datetime,json,sys
root=Path(__file__).resolve().parents[2]
base=root/'work/v5/CXV/films/M-native-nine-full-battle-R1'
assert not base.exists(),'Preserve earlier evidence'
base.mkdir(parents=True)
for group in range(3):
    for name in ['STOP-ALL','STOP-CXV']:
        assert not Path('/Users/bao/taskbar-hero-mailbox',name).exists(),name
    env=os.environ.copy();env.update(CXV_M_GROUP=str(group),CXV_FULL_FIXTURE=str(root/'tools/v5vfx/living-production-fixture.mjs'),CXV_SERVED_SOURCE='85cb62233d016faf5c5235ffe178408df1682af3',CXV_EXPECTED_INDEX='d75197ff94529a92091902510795dd1ec3000e516e8ef02ec13108b6a4d4ef84',CXV_FULL_CPU_RATE='1',CXV_CAPTURE_OUT=str(base/f'group-{group}'))
    print(json.dumps({'group':group,'startUTC':datetime.datetime.now(datetime.timezone.utc).isoformat()}),flush=True)
    code=subprocess.call(['node','tools/v5vfx/capture-full-battle-production.mjs'],cwd=root,env=env)
    if code:sys.exit(code)
print(json.dumps({'completedUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'groups':3}),flush=True)
