"""Measure new native-cat proof images before one visual review; never display them."""
from pathlib import Path
import sys,json,hashlib,datetime
sys.path.insert(0,str(Path('work/v5/CXV/python').resolve()))
import cv2
cat=sys.argv[1];root=Path(f'work/v5/CXV/films/M-V2-{cat}-native-R1')
review_path=root/'review-measure.json'
if review_path.exists():
 previous=json.loads(review_path.read_text())
 if any(im.get('reviewed') for im in previous.get('images',[])):
  raise SystemExit(f'{cat}: refusing to reset completed image reviews; use the recorded hashes without reopening.')
report=json.loads((root/'report.json').read_text());comparison=json.loads((root/'comparison.json').read_text())
assert report['pass'] and comparison['cat']==cat
mode=next(m for m in report['modes'] if m['mode']=='candidate');measure=json.loads(Path(mode['measure']).read_text())
head=measure['pointNames'].index('head');height=measure['height']
ranges={name:[(max(s['points'][i][axis] for s in measure['samples'])-min(s['points'][i][axis] for s in measure['samples']))/height*100 for axis in ['x','y']] for i,name in enumerate(measure['pointNames'])}
h=2166136261
for c in cat:h=((h^ord(c))*16777619)&0xffffffff
phase=(h%6283)/1000
choices=sorted([15,75,165,255],key=lambda n:measure['samples'][round(((20+n/30+phase)%10)*30)]['points'][head]['x'])
files=[root/f'comparison-{n}.jpg' for n in [choices[0],choices[-1]]]+[root/'candidate/blink-sheet.jpg',root/'cast/cast-sheet.jpg']
images=[]
for p in files:
 im=cv2.imread(str(p));assert im is not None
 assert max(im.shape[:2])<=1024
 images.append({'path':str(p.resolve()),'dimensions':[im.shape[1],im.shape[0]],'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'reviewed':False})
result={'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'cat':cat,'captureReport':str((root/'report.json').resolve()),'captureReportSha256':hashlib.sha256((root/'report.json').read_bytes()).hexdigest(),'comparison':comparison,'rangesPercentH':ranges,'images':images,'scope':'Fresh candidate body/style/blink/cast review at desktop1280x720; no integrated judge or performance claim.'}
review_path.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'cat':cat,'capturePass':report['pass'],'headRangePercentH':ranges['head'],'tailRangePercentH':ranges['tail_3'],'castHit':report['cast']['exactHit'],'handoffs':report['cast']['handoffs'],'images':images}))
