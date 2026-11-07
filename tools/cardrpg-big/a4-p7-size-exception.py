# REFERENCE: PROMPT-A4-v2 P7, explicit 32MB preview allowance; no startup PASS implied.
from pathlib import Path
import json,hashlib
root=Path.cwd();out=root/'reports/cardrpg-big/a4/p7';out.mkdir(exist_ok=True)
def read(path):return json.loads((root/path).read_text())
def sha(path):return hashlib.sha256((root/path).read_bytes()).hexdigest()
build=read('docs/cardrpg3/build.json');assert build['sha256']==sha('docs/cardrpg3/index.html')
before=read('reports/cardrpg-big/a4/g0/browser/audit.json');after=read('reports/cardrpg-big/a4/p6/timing/browser-1-ordinary-1280/checks.json')
assert before['sha256']=='32a727afc547520fa65eb8dccf4453d1a78b8d5b3403f5a78d91d265f3c3a06d'
assert after['sha256']==build['sha256']
paths=[('reports/cardrpg-big/a4/g0/browser/new-save-prepare-0-0.png','Before: G0 1280x720 Look Prepare, new-save fixture'),('reports/cardrpg-big/a4/p6/timing/browser-1-ordinary-1280/prepare-look.png','After: same-size Look Prepare, explicit band-1 benchmark; challenge band and formation are readable')]
result={'sha256':build['sha256'],'bytes':build['bytes'],'limitBytes':32000000,'defaultLimitBytes':24000000,'defaultSizeGate':'MISS' if build['bytes']>24000000 else 'PASS','deltaVersusG0':build['bytes']-26120329,'reason':'Retains inherited original 3D assets, portraits and offline comparison evidence. New gameplay adds readable preparation, gear and meta-loop UI. This documented preview allowance preserves offline review; it does not waive the 24MB target, startup-byte regression or cold CPU measurements. No new Lane B artwork is claimed. Screenshots show different controlled fixtures, not a paired performance or balance comparison.','promptReference':'reports/cardrpg-big/memory/PROMPT-A4-v2.md P7: keep the 32MB exception honest','beforeAfter':[{'path':path,'sha256':sha(path),'caption':caption} for path,caption in paths],'visualReview':'Both local 1280x720 images personally inspected; no desktop/browser interaction. New band/formation panels add vertical content; this is UI documentation, not proof of artistic quality.'}
assert result['bytes']<=result['limitBytes']
(out/'size-exception.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
