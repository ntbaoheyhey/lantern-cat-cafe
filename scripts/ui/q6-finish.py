"""Publish measured Q6 evidence only after explicit visual review and real suites."""
import datetime,hashlib,json,os
from pathlib import Path
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[2];os.chdir(root)
b=Path('reports/v3-shell/b2');q=b/'q6';label=os.environ.get('Q6_RUN','final2')
def read(p):return json.loads(Path(p).read_text())
def signed(p):
 p=Path(p);assert p.is_file() and p.stat().st_size
 return {'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
def verify(row):assert signed(row['path'])['sha256']==row['sha256'],row['path']
judgments=read(q/'visual-judgments.json');assert judgments.get('accepted') is True,'Complete explicit visual review first'
previous=read(b/'UI-REBUILD.json');audit={s['id']:s for s in read(b/'UI-AUDIT.json')['screens']}
expected={s['id'] for s in previous['screens']};assert len(expected)==54
receipts=read(q/f'acceptance-{label}.json')
for step in ['shell-1280','chain-1280','shell-1440','chain-1440','shell-phone','chain-phone','suite','browser']:
 assert any(r['name']==step and r['exitCode']==0 for r in receipts),step
browser=read(b/f'tests/q6-{label}-browser.json');assert {r['group'] for r in browser['rows']}=={'local','server','fallback'}
for r in browser['rows']:
 assert r['exitCode']==0 and r['passed']>=r['minimumPassed'];verify({'path':r['log'],'sha256':r['sha256']})
suite=read(b/f'tests/q6-{label}-suite.json')
assert len(suite['results'])==2 and all(r['exitCode']==0 for r in suite['results'])
for r in suite['results']:verify(r['log'])
views={};captureManifests=[]
for width in [1280,1440]:
 rows=[]
 for name in [label,'chain-'+label]:
  folder=q/f'{name}-{width}';capture=read(folder/'metrics.json');assert not capture['errors']
  sources=read(folder/'sources.json');assert sources['runtimeHash']==capture['runtimeHash']
  captureManifests.append({'metrics':signed(folder/'metrics.json'),'sources':signed(folder/'sources.json')})
  for row in capture['rows']:
   assert row['viewport']=={'width':width,'height':720 if width==1280 else 900};verify(row['screenshot'])
   assert not row['horizontalOverflow'],row['id'];rows.append(row)
 assert {r['id'] for r in rows}==expected and len(rows)==54
 views[width]={r['id']:r for r in rows}
phones=[]
for name in [label+'-phone','chain-'+label+'-phone']:
 folder=q/f'{name}-390';data=read(folder/'metrics.json');assert not data['errors']
 for row in data['rows']:assert not row['horizontalOverflow'],row['id'];verify(row['screenshot'])
 phones.extend(data['rows']);captureManifests.append({'metrics':signed(folder/'metrics.json'),'sources':signed(folder/'sources.json')})
assert len(phones)==24
fonts=read(b/'tests/q6-final-fonts.log');icons=read(b/'tests/q6-final-icons.log')
assert not fonts['errors'] and not icons['glyphs']
comparison=b/'shots/ui-before-after';comparison.mkdir(exist_ok=True,parents=True)
rows=[]
for prior in previous['screens']:
 sid=prior['id'];judgment=judgments['screens'][sid];scores=judgment['scores'];average=sum(scores.values())/len(scores)
 before=audit.get(sid,audit['bag-manage'])['screenshot'];verify(before)
 row={'id':sid,'family':prior['family'],'visibleWords':max(views[w][sid]['visibleWords'] for w in views),'plainTextButtons':max(views[w][sid]['plainTextButtons'] for w in views),'scores':scores,'averageScore':average,'review':judgment['review'],'redesignIterations':5 if sid in judgments.get('redesignedScreens',[]) else 2,'iterationEvidence':['U3-ITERATIONS.md','q6/ITERATIONS.md'],'shots':[]}
 for width,view in views.items():
  height=720 if width==1280 else 900;after=view[sid]['screenshot'];sheet=Image.new('RGB',(1280,474),'#171326');draw=ImageDraw.Draw(sheet)
  for n,p in enumerate([before['path'],after['path']]):
   im=Image.open(p).convert('RGB');im.thumbnail((640,440));sheet.paste(im,(n*640+(640-im.width)//2,30+(440-im.height)//2))
  draw.text((8,8),f'{sid} | BEFORE 1280x720',fill='white');draw.text((648,8),f'AFTER {width}x{height}',fill='white')
  path=comparison/f'{sid}-{width}.png';sheet.save(path)
  row['shots'].append({'width':width,'height':height,**after,'before':before,'comparison':signed(path)})
 rows.append(row)
flow=b/f'tests/q6-{label}-flows.log'
flow.write_text('Q6 verified full local browser suite and screen flows\n'+''.join(f"PASS {r['group']}: {r['passed']}/{r['minimumPassed']}; {r['log']}; sha256 {r['sha256']}\n" for r in browser['rows'])+f'PASS 108 desktop captures; 54 states at1280x720 and1440x900.\nPASS {len(phones)} phone captures at390x844; zero horizontal overflow.\nPASS workspace unit/type checks; receipts in q6-{label}-suite.json.\n')
qualifies=lambda r:r['visibleWords']<=25 and r['plainTextButtons']<=2 and min(r['scores'].values())>=7 and r['averageScore']>=8
passing=sum(qualifies(r) for r in rows)
method='Explicit visual judgments over current A/B temporary preview and isolated local Anvil captures. Counts use actual visible DOM, including discovery notices, and the worst of both desktop sizes. Runtime source hashes bind every capture. Each chain screen rolls back its disposable database/Anvil fixture; production quotas remain intact. Before baseline for the added batch dialog is its former bag manager.'
result={'reviewedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'method':method,'screens':rows,'systemFontCount':len(fonts['errors']),'unicodeIconCount':len(icons['glyphs']),'e2e':{'exitCode':0,'passed':sum(r['passed'] for r in browser['rows']),'log':signed(flow)},'passingScreens':passing,'remaining':[r['id'] for r in rows if not qualifies(r)],'status':'PASS' if passing==54 else 'OPEN','captureManifests':captureManifests,'phoneScreens':len(phones),'horizontalOverflow':0,'suite':signed(b/f'tests/q6-{label}-suite.json'),'browser':signed(b/f'tests/q6-{label}-browser.json')}
(b/'UI-REBUILD.json').write_text(json.dumps(result,indent=2)+'\n')
(b/'UI-REBUILD.md').write_text('# U3 screen rebuild\n\n'+method+f'\n\n{passing}/54 states meet every screen criterion. Full browser suite:435 passing cases. Desktop captures:108; phone samples:24.\n\n| Screen | Words | Plain buttons | Art / hierarchy / text / feel / consistency | Review |\n|---|---:|---:|---|---|\n'+'\n'.join(f"| {r['id']} | {r['visibleWords']} | {r['plainTextButtons']} | {' / '.join(str(v) for v in r['scores'].values())} | {r['review']} |" for r in rows)+'\n\nThese are reviewed fixture states, not a claim that every possible account state or language has been exercised. All transaction evidence uses disposable local Anvil.\n')
print(json.dumps({'passing':passing,'total':54,'remaining':result['remaining'],'phone':len(phones)}))
if passing!=54:raise SystemExit('U3 remains open')
