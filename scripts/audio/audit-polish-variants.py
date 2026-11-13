"""Count real distinct decoded audio per effect layer, not duplicated IDs."""
import json,hashlib,subprocess,datetime
from pathlib import Path
import numpy as np
root=Path(__file__).resolve().parents[2];out=root/'reports/v3-shell/b2/polish/P1'
m=json.loads((root/'apps/web/public/audio/manifest.json').read_text());licenses=json.loads((root/'apps/web/public/audio/LICENSES.json').read_text())['files']
sha=lambda data:hashlib.sha256(data).hexdigest()
cache={};sample_hashes={};packs=[]
for key in sorted({s['pack'] for d in m['designs'].values() for l in d['layers'] for s in l['variants']}):
 p=root/f'apps/web/public/audio/{key}.webm';rel=str(p.relative_to(root));license=next(r for r in licenses if r.get('path')==rel)
 assert license['license']=='CC0-1.0' and license['sha256']==sha(p.read_bytes()),rel
 cache[key]=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-f','f32le','-ar','48000','-ac','1','pipe:1']),dtype='<f4')
 packs.append({'path':rel,'sha256':sha(p.read_bytes()),'license':license['license']})
rows=[]
for cue,d in m['designs'].items():
 for layer in d['layers']:
  variants=[]
  for s in layer['variants']:
   key=(s['pack'],s['start'],s['duration'])
   if key not in sample_hashes:
    x=cache[s['pack']][round(s['start']*48000):round((s['start']+s['duration'])*48000)]
    assert len(x)>0 and float(np.max(np.abs(x)))>1e-5,(cue,s)
    sample_hashes[key]=sha(np.round(x*32767).astype('<i2').tobytes())
   variants.append({'id':s['variantId'],'pcmSha256':sample_hashes[key]})
  rows.append({'cueId':cue,'role':layer['role'],'variants':variants,'count':len(variants),'uniquePcm':len({v['pcmSha256'] for v in variants})})
assert all(r['count']>=6 and r['uniquePcm']>=6 for r in rows)
report={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'before':{'minimumVariants':min(r['count'] for r in rows),'designs':len(m['designs']),'layers':len(rows)},'after':{'minimumDistinctDecodedVariants':min(r['uniquePcm'] for r in rows),'designs':len(m['designs']),'layers':len(rows)},'method':'Existing S3 already authored six real variants. This audit verifies each non-silent Opus-decoded segment and its source licence; no duplicate takes or production changes are added solely to inflate counts. Covers every layered design, a superset of frequent effects. Voice callouts keep their separate V gates.','packs':packs,'rows':rows}
(out/'metrics.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS P1.layers: measured',len(rows),'; required every effect layer >=6 actual variants')
print('PASS P1.distinct: measured',min(r['uniquePcm'] for r in rows),'; required >=6 unique non-silent PCM segments in every layer')
print('PASS P1.licences: measured',len(packs),'; required all referenced packs hashed CC0')
