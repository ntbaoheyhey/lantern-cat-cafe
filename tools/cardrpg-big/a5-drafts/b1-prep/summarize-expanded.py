# REFERENCE: PROMPT-A5 B1/B2. Read-only TRAIN diagnostic; never consumes acceptance.
import json, math, hashlib
from pathlib import Path
from statistics import mean
base=Path('reports/cardrpg-big/a5/b1/expanded-01')
old=json.loads(Path('reports/cardrpg-big/a4/p6/train/results.json').read_text())
assert old['sample']=='train' and old['offset']==0
oldrows={r['key']:r for r in old['rows']}
def rate(r): return sum(int(v)%2 for v in r['outcomes'])/len(r['outcomes'])
def gain(r): return 100*sum(int(v)%2-int(v)>=2 for v in []) if False else 100*sum((int(v)%2)-(int(v)>=2) for v in r['outcomes'])/len(r['outcomes'])
def ranks(xs):
 out=[]
 for x in xs: out.append(sum(v<x for v in xs)+(sum(v==x for v in xs)+1)/2)
 return out
def spearman(xs,ys):
 x,y=ranks(xs),ranks(ys);a,b=mean(x),mean(y)
 den=math.sqrt(sum((v-a)**2 for v in x)*sum((v-b)**2 for v in y))
 return sum((u-a)*(v-b) for u,v in zip(x,y))/den if den else None
def summarize(rows):
 tiers=['none','common','rare','epic','legendary']; out={}
 ts=[r for r in rows if r['kind']=='tiers']
 if ts:
  steps=[]
  for level in [1,6]:
   for ch in [1,2,3]:
    rr=[next(r for r in ts if r['level']==level and r['chapter']==ch and r['rarity']==t) for t in tiers]
    steps.extend(dict(level=level,chapter=ch,before=a['rarity'],after=b['rarity'],gainPp=100*(rate(b)-rate(a))) for a,b in zip(rr,rr[1:]))
  out['tiers']={'positive':sum(x['gainPp']>=2-1e-8 for x in steps),'reversals':sum(x['gainPp'] < -1e-8 for x in steps),'steps':steps,'note':'24 TRAIN steps only; original gate totals 48 across TRAIN and acceptance.'}
 bs=[r for r in rows if r['kind']=='bands']
 if bs:
  bands=[]
  for level in [1,2,3,4,5,6,7,8,9,10,50]:
   for ch in [1,2,3]:
    rr=[next(r for r in bs if r['level']==level and r['chapter']==ch and r['rarity']==t) for t in tiers]
    spread=100*(rate(rr[-1])-rate(rr[0]));sat=all(rate(r)>=.95 for r in rr)
    bands.append(dict(level=level,chapter=ch,spreadPp=spread,saturated=sat,meets=spread>=15 and not sat))
  out['bands']={'meets':sum(r['meets'] for r in bands),'total':len(bands),'rows':bands}
 ps=[r for r in rows if r['kind']=='pieces-equipped']
 if ps:
  worst=max(ps,key=gain)
  out['piecesEquipped']={'cells':len(ps),'worst':{**json.loads(worst['key']),'gainPp':gain(worst),'beforeRate':sum(int(v)>=2 for v in worst['outcomes'])/len(worst['outcomes']),'afterRate':rate(worst)},'above12pp':sum(gain(r)>12 for r in ps),'negative':sum(gain(r)<0 for r in ps),'maxDisplayShare':max(max(r['maxShare'],r['maxEnhancedShare']) for r in ps),'correlationByChapter':[{ 'chapter':ch,'spearman':spearman([r['shareSum']/len(r['outcomes']) for r in ps if r['chapter']==ch],[gain(r) for r in ps if r['chapter']==ch])} for ch in [1,2,3]],'correlationLabel':'Existing mean displayed team share vs paired win delta, tied average ranks; NOT recalibrated display score.'}
 ss=[r for r in rows if r['kind']=='sets']
 if ss:
  out['sets']=[dict(id=sid,rate=mean(rate(r) for r in ss if r['setId']==sid),scenes=[dict(scene=r['scene'],rate=rate(r),leads=rate(r)>=max(rate(x) for x in ss if x['scene']==r['scene'])) for r in ss if r['setId']==sid]) for sid in sorted({r['setId'] for r in ss})]
 ts=[r for r in rows if r['kind']=='teams']
 if ts:
  cats=[]
  for id in sorted({id for r in ts for id in r['team']}):
   rr=[r for r in ts if id in r['team']];best=max(rr,key=rate)
   cats.append(dict(id=id,rate=mean(rate(r) for r in rr),bestTeam=best['team'],bestChapter=best['chapter'],bestRate=rate(best),topPickCells=sum(rate(r)>=max(rate(x) for x in ts if x['chapter']==r['chapter'] and set(r['team'])-{id}<=set(x['team'])) for r in rr)))
  out['cats']=cats
  out['bossDiversity']=[dict(chapter=ch,best=max(rate(r) for r in ts if r['chapter']==ch),within5pp=sum(rate(r)>=max(rate(x) for x in ts if x['chapter']==ch)-.05-1e-8 for r in ts if r['chapter']==ch)) for ch in [1,2,3]]
 cs=[r for r in rows if r['kind']=='crew']
 if cs: out['crew']={'team':cs[0]['team'],'gainPp':mean(gain(r) for r in cs)}
 return out
report={'method':'TRAIN1–50 read-only expanded diagnostics. Original A4 outcomes truncated to the SAME first50 seeds/cell. No production, gate or acceptance-seed change. Bare2304 cells and elite diversity NOT VERIFIED. Correlation is existing displayed share, not a fitted outcome model.','variants':{}}
for variant in ['aware-latched','aware-distributed']:
 rows=[];receipts=[];pending=[]
 for scope in ['tiers','equipped','sets','teams']:
  f=base/variant/scope/'results.json'
  if not f.exists():pending.append(scope);continue
  raw=f.read_bytes();d=json.loads(raw);assert d['sample']=='pilot' and d['count']==50 and d['offset']==0 and d['variant']==variant
  assert len(d['rows'])=={'tiers':210,'equipped':384,'sets':64,'teams':663}[scope]
  for r in d['rows']:assert r['complete'] and len(r['outcomes'])==50
  rows.extend(d['rows']);receipts.append({'path':str(f),'sha256':hashlib.sha256(raw).hexdigest()})
 oldpairs=[]
 for r in rows:
  if r['kind']=='crew':continue # candidate chooses its own train-best crew; not a like-for-like original cell.
  assert r['key'] in oldrows
  oldpairs.append({**oldrows[r['key']],'outcomes':oldrows[r['key']]['outcomes'][:50],'shareSum':oldrows[r['key']]['shareSum']/10})
 report['variants'][variant]={'pending':pending,'receipts':receipts,'candidate':summarize(rows),'originalSameCells':summarize(oldpairs)}
(base/'summary.json').write_text(json.dumps(report,indent=2)+'\n')
for name,r in report['variants'].items():
 c=r['candidate'];print(name,'pending',r['pending'],'tier',c.get('tiers',{}).get('positive'),'band',c.get('bands',{}).get('meets'),'piece',c.get('piecesEquipped',{}).get('worst'))
