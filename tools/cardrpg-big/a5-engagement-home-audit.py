# REFERENCE: PROMPT-A5 E2. Audit original receipts and compose existing screenshots; no gameplay rerun.
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps
import hashlib, json, math
root=Path('reports/cardrpg-big/a5/engagement/home-02')
read=lambda path:json.loads(Path(path).read_text())
sha=lambda path:hashlib.sha256(Path(path).read_bytes()).hexdigest()
report=read(root/'metrics.json'); session=read(root/'session/timeline.json'); reg=read(root/'REGISTERED-METHOD.json')
assert session['complete'] and session['activeMs']>=3600000
assert not session['errors'] and not session['remote']
assert sha(reg['artifact'])==reg['artifactSha256']==session['artifactSha256']
assert sha(reg['script'])==reg['scriptSha256']
for receipt in report['files']: assert sha(receipt['path'])==receipt['sha256'],receipt['path']
for metric in report['metrics']:
    limit=metric['minutes']*60000
    events=[row for row in session['timeline'] if row['atMs']<=limit]
    assert len([r for r in events if r['kind']=='choice-offered' and r['meaningful']])==metric['meaningfulOffers']
    for kind,field in [('reward','rewardEvents'),('celebration','celebrations')]: assert sum(r['kind']==kind for r in events)==metric[field]
    boundaries=sorted([0,limit]+[r['atMs'] for r in events if r['kind'] in ['reward','celebration']])
    gap=max(b-a for a,b in zip(boundaries,boundaries[1:]))/1000
    assert math.isclose(gap,metric['rewardCadence']['maxGapSeconds'])
    dead=sum(max(0,min(r['endMs'],limit)-max(0,r['startMs']))/1000 for r in session['encounters'])
    assert math.isclose(dead,metric['deadSeconds'])
last=next(row for row in report['metrics'] if row['minutes']==30)
assert report['gates']['rewardCadence']==('PASS' if last['rewardCadence']['maxGapSeconds']<=300 else 'MISS')
assert report['gates']['deadTimeReduction']==('PASS' if last['deadReductionPercent']>=40 else 'MISS')
shots=session['captures']; w,h=384,242
sheet=Image.new('RGB',(w*3,h*((len(shots)+2)//3)),'#f5efdf');draw=ImageDraw.Draw(sheet); captures=[]
for i,row in enumerate(shots):
    source=Image.open(row['path']);assert source.size==(1280,720)
    x,y=(i%3)*w+8,(i//3)*h+8
    sheet.paste(ImageOps.contain(source,(w-16,207)),(x,y))
    draw.text((x,y+210),f"{row['atMs']/60000:.1f}m {row['label']}"[:58],fill='#203334')
    captures.append(dict(path=row['path'],sha256=sha(row['path']),atMs=row['atMs']))
sheet.save(root/'contact.png')
audit=dict(status='PASS: receipt consistency only; see individual measured gates',gates=report['gates'],captures=captures,contactSha256=sha(root/'contact.png'),samplesRepeated=0)
(root/'audit.json').write_text(json.dumps(audit,indent=2)+'\n')
print(json.dumps(dict(status=audit['status'],gates=audit['gates'],captures=len(shots))))
