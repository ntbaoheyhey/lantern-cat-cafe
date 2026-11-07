# REFERENCE: GAMEPLAY-V4 section9; preserve history and report every measured miss.
from pathlib import Path
import hashlib,json,math
root=Path(__file__).resolve().parents[2];base=root/'reports/cardrpg-big/a4/p6'
def read(p):return json.loads((root/p).read_text())
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def verify_source(data):
 for path,expected in data['source'].items():assert digest(root/path)==expected,path
balance=read('reports/cardrpg-big/a4/p6/balance-gates.json')
economy=read('reports/cardrpg-big/a4/p6/economy/progression.json')
gacha=read('reports/cardrpg-big/a4/p6/gacha/gacha.json')
editions=read('reports/cardrpg-big/a4/p6/editions/checks.json')
off=read('reports/cardrpg-big/a4/p6/off/checks.json')
gates=read('reports/cardrpg-big/validation/a4-p6-accepted.json')
for data in [balance,economy,gacha,editions]:verify_source(data)
assert economy['count']==30 and economy['days']==45 and len(economy['accounts'])==90
assert all(len(row['days'])==45 for row in economy['accounts'])
assert len(gates)==5 and all(g['exit']==0 for g in gates)
assert off['routes']==8250 and off['sha256']=='47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3'
assert len(gacha['summaries'])==3 and all(r['accounts']==10000 for r in gacha['summaries'])
assert len(editions['races'])==500 and len(editions['pairs'])==1500
checks={c['id']:c for c in balance['checks']};rows=[]
def row(title,before,after,status):rows.append([title,before,after,status])
x=checks['tiers'];m=x['measured'];row('Adjacent tiers ≥44/48, zero reversals','26 positive / 22 ties / 0 reversals (50 seeds/cell)',f"{m['positive']}/48 gain≥2pp; {m['reversals']} reversals",x['status'])
x=checks['bands'];m=x['measured'];row('Intended bands: ≥15pp spread; no saturation','Level6 saturation; max50 dominated',f"{sum(r['spreadPp']>=15 and not r['saturated'] for r in m)}/{len(m)} bands; minimum spread {min(r['spreadPp'] for r in m):.2f}pp",x['status'])
x=checks['single-piece'];m=x['measured'];w=m['worst'];row('One piece ≤12pp; utility-aware share ≤10%','+34pp heldout; old displayed score omitted utility',f"Worst {w['gainPp']:.2f}pp ({w['templateId']}, {w['cardId']}, chapter{w['chapter']}); share≤{m['maxShare']*100:.2f}%",x['status'])
for key,title,before in [('sets','Every set 35–75% and leads a common situation','8–92% heldout'),('cats','Every cat 55–75% and a top pick','49.15–83.76% heldout')]:
 x=checks[key];rates=[r['rate']*100 for r in x['measured']];row(title,before,f'{min(rates):.2f}–{max(rates):.2f}%',x['status'])
x=checks['crew'];row('Coherent crew +10–25pp at matched power','Not measured under v4 protocol',f"{x['measured']['gainPp']:.2f}pp",x['status'])
x=checks['matched-power'];row('Matched-power tolerance ±2%','Not measured under v4 protocol',f"{x['measured']['min']:.5f}–{x['measured']['max']:.5f} ratio",x['status'])
artifact=root/'docs/cardrpg3/index.html';sha=digest(artifact);size=artifact.stat().st_size
timings=[]
for chapter,kind,width in [(1,'ordinary',1280),(2,'elite',1440),(1,'boss',1280),(2,'boss',1440),(3,'boss',1024)]:
 path=base/f'timing/browser-{chapter}-{kind}-{width}/checks.json'
 if path.exists():
  d=json.loads(path.read_text());assert d['sha256']==sha;assert not d['errors'];t=d.get('timing')
 else:t=None
 if t:
  entry={'chapter':chapter,'kind':kind,'seconds':t['result']/1000,'result':t['outcome'],'status':t['pacing'],'bossDeathMs':t['bossDeath'],'postBossMs':None if t['bossDeath'] is None else t['result']-t['bossDeath']}
 else:entry={'chapter':chapter,'kind':kind,'status':'NOT VERIFIED','reason':'Timing attempt did not complete; original log retained.'}
 timings.append(entry)
 prior='52.477–63.705s' if kind=='ordinary' else '177.346s (different earned day7 fixture)' if kind=='boss' and chapter==1 else 'Not measured at G0'
 row(f'Wall time {kind}, chapter{chapter}',prior,f"{entry['seconds']:.3f}s / {entry['result']}" if t else entry['reason'],entry['status'])
ratios=economy['ratios'];economy_status='PASS' if all(math.isfinite(v) and v<=3 for v in ratios.values()) else 'MISS'
row('45day heavy/casual ≤3×: every currency and paid draws','Max2.1948×; 90 accounts', '; '.join(f'{k} {v:.4f}×' for k,v in ratios.items()),economy_status)
max_cdf=max(r['maxDeviationPp'] for r in gacha['summaries']);row('Invitations: conditional CDF deviation ≤1pp','P4 max0.640337pp',f'30,000accounts /1.8Mdraws; max{max_cdf:.6f}pp','PASS' if max_cdf<=1 else 'MISS')
row('Collectible paired win gain ≤3pp','Local counters; no enforcement layer',f"500 races; {editions['encounters']} encounters; {editions['maxPairedGainPp']}pp",editions['gate'])
row('OFF behavior exact','Frozen G0 digest47477251','8,250 routes exact47477251',off['offBehavior'])
row('Source gates','G0 passed','Type/lint/build, rules/web/E2E pass; numeric tests reported separately','PASS')
row('Offline artifact and startup','G0 A3 26,120,329 bytes',f'{size:,}bytes; {size-26120329:+,} vs G0; current-main cold comparison belongs to P7','MISS' if size>26120329 else 'NOT VERIFIED')
summary={'method':balance['method'],'artifactSha256':sha,'bytes':size,'rows':rows,'source':balance['source'],'counts':balance['counts'],'timings':timings,'checks':balance['checks'],'utility':balance['utility'],'economy':{'ratios':ratios,'totals':economy['totals'],'status':economy_status},'gacha':[{k:v for k,v in r.items() if k!='cdf'} for r in gacha['summaries']],'editions':{k:v for k,v in editions.items() if k not in ['source','pairs','races']},'off':off}
(base/'acceptance.json').write_text(json.dumps(summary,indent=2))
def table(rows):return '| Target | Before | After | Status |\n|---|---|---|---|\n'+'\n'.join('| '+' | '.join(str(x).replace('|',' / ').replace('\n',' ') for x in r)+' |' for r in rows)
reward_table='| Style | First Legendary observed / censored | Chosen observed / censored | Mean paid draws |\n|---|---|---|---|\n'
for r in economy['totals']:
 observed=lambda key:', '.join(str(v['day']) for v in r[key] if v) or 'none'
 reward_table+=f"|{r['style']}|{observed('firstLegendary')} / {r['legendaryCensored']}|{observed('firstChosen')} / {r['chosenCensored']}|{r['paidPulls']:.2f}|\n"
text=f'''# A4 P6 — measured gameplay balance
REFERENCE: GAMEPLAY-V4 section9; registration p6/REGISTERED-METHOD.md.

{table(rows)}

## Method and limits
Train1–500 and heldout10001–10500 each cover3,625 cells (1,812,500 outcomes/sample). Every cell retains per-seed outcomes and Wilson95% intervals. Cases, weights, source and coherent-kit carrier map were registered before heldout; the coherent crew was selected only on train. No heldout-driven retuning or seed reroll. G0 before measurements used50seeds/cell and earlier fixed enemies; they are historical comparisons, not paired evidence of the causal effect of v4.

Full-route tiers are distinct from single-boss band fixtures and easy fixed-band farming. All128templates are checked on three starter carriers, two levels and three bosses. Another384cells add each template as the fourth slot of an existing epic kit. This prevents all-loss bare-party cases from hiding a set-threshold spike. Combat pairs use+0; the+12extension checks displayed contribution only, not max-enhancement combat balance. Source: p6/train/results.json and p6/heldout/results.json.

Set and cat fixtures normalize party HP/attack/defense to a common utility-aware budget within2%; no gear-dependent enemy scaling. All8sets face the same8situations and all220legal triples face each boss. Tied leaders count and remain disclosed in balance-gates.json. Crew comparison uses a train-selected role-balanced crew and frozen uniform sampling of legal equal-power teams.

The displayed score remains an approximate build estimate, not a win probability. A training-only linear fit and heldout residual/order diagnostics are in balance-gates.json; they do not alter combat or erase single-piece misses. Single-piece all-loss floor cells and informative baselines are explicit. Remaining misses must be addressed before promotion rather than hidden by passing functional tests.

## Earned progression
{reward_table}
The new-save bot uses public commands for90accounts×45synthetic days: actual elapsed service, routes, quests, journal, invitations, gear, recipes, loadouts and chosen rewards. No levels/currency/unlocks injected. Missing rewards are censored at45days. Observed day lists above are not estimates for censored accounts. Heavy/casual ratios compare total earned resources and paid draws separately; different G0 and v4 policies are not a paired trial. Gacha distribution checks instead use controlled bankrolls and10,000accounts/banner; those draw-count distributions are not earned-day predictions.

## Verification and retained failures
Five source gates: validation/a4-p6-accepted.json. The first type/lint checks failed because Node-only receipt imports were placed in the browser-typed rules package; the same numeric assertions moved to native node:test tooling with no runtime dependency change. Original logs remain. Numeric assertions are in p6/numeric-tests.log, independently of the source gates. Timing attempts use public-command route setup, explicit imported level/unlock benchmarks and real x1 playback; no nominal speed adjustment or skip. The outcome in every timing row is explicit: an enemy victory measures time to crew defeat, not a successful boss finish. A null boss-death timestamp does not establish victorious finishing/cleanup timing on this build. P3 finishing evidence remains historical; P7 additionally observes the earned day7 route. Any incomplete measurement above is NOT VERIFIED.

No B-owned/protected changes; no B checkpoint adopted. P1/P3/P4 presentation requests remain open. Native/headless and short shared-lock windows. Historic13sim files and baseline-v1 remain exact. Artifact SHA-256 {sha}, {size:,}bytes; startup bytes MISS and cold CPU pending P7. No merge, deployment, wallet action or on-chain issuance.
'''
(root/'reports/cardrpg-big/a4/P6-BALANCE.md').write_text(text)
for name in ['ITEM-TIERS.md','BALANCE.md']:
 p=root/'docs/design/cardrpg'/name;s=p.read_text();marker='\n<!-- A4_P6_MEASURED -->\n'
 if marker in s:s=s.split(marker)[0]
 p.write_text(s+marker+'## Gameplay v4 — registered balance results\n\n'+table(rows)+'\n\nFull source-bound protocol, sample limitations, floor cells and utility diagnostics: [P6 balance report](../../../reports/cardrpg-big/a4/P6-BALANCE.md). Prior sections above remain historical. Local editions add no combat stats. +12 contribution checks are display-only; combat balance at max enhancement is not established. No independent human playtest is claimed.\n')
print(json.dumps({'rows':len(rows),'statusCounts':{s:sum(r[3]==s for r in rows) for s in ['PASS','MISS','NOT VERIFIED']},'sha256':sha}))
