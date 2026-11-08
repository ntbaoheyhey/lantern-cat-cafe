"""Summarize the complete targeted run without waiving budget failures."""
import hashlib
import json
from pathlib import Path
import subprocess

root=Path(__file__).resolve().parents[3]
out=root/'reports/cardrpg-look/closure';validation=root/'reports/cardrpg-look/validation/closure'
load=lambda p:json.loads(p.read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
build=load(root/'docs/cardrpg-look/build.json');done=load(out/'validation-complete.json')
assert sha(root/'docs/cardrpg-look/index.html')==build['sha256']==done['sha256']
for p,want in build['sourceHashes'].items():assert sha(root/p)==want,p
gates=load(validation/'source-gates.json');assert len(gates)==5 and all(r['code']==0 for r in gates)
presentation=load(out/'presentation/reviewed/checks.json')
assert presentation['sha256']==build['sha256'] and len(presentation['rows'])==3
assert all(r['passed'] and not r['errors'] for r in presentation['rows'])
effects=load(out/'effects/reviewed/uniqueness.json');pairs=load(out/'effects/reviewed/incremental-pairs.json')
assert effects['sha256']==build['sha256'] and len(effects['rows'])==6
assert not any(effects[k] for k in ['offenders','faceOffenders','overdrawOffenders','emptyEffects','errors'])
assert pairs['publishedRegressions']==0 and pairs['improvedPairs']==66
phase=load(validation/'measurement-summary.json');assert phase['artifact']==build['sha256'] and not phase['errors']
hero=[]
for cat in ['mochi','soot','clover']:
    summary=load(validation/f'casts-{cat}/summary.json')
    assert summary.get('ended') and summary['sha256']==build['sha256'] and len(summary['rows'])==4
    for row in summary['rows']:
        assert not row['errors']
        for cast in row['casts']:
            hero.append(dict(case=row['name'],use=cast['use'],summary=cast['summary']))
assert len(hero)==24
before=load(out/'perf-before/summary.json');after=load(out/'perf-after/summary.json')
assert after.get('ended') and after['sha256']==build['sha256']
assert len(after['rows'])==4 and all(not r['errors'] for r in after['rows'])
target=[]
for a,b in zip(before['rows'],after['rows']):
    assert a['name']==b['name']
    for first,second in zip(a['casts'],b['casts']):
        assert first['use']==second['use']
        target.append(dict(case=b['name'],use=second['use'],before=first['summary'],after=second['summary']))
life=load(out/'lifecycle20/summary.json')
assert life['completed'] and life['sha256']==build['sha256'] and len(life['rows'])==21 and not life['errors']
assert all(r['gpu']==life['rows'][0]['gpu'] and r['programs']==life['rows'][0]['programs'] and r['retained'] for r in life['rows'])
cold_audit=load(out/'cold-audit.json');assert cold_audit['artifact']==build['sha256']
for path,want in cold_audit['inputs'].items():assert sha(root/path)==want,path
acceptance=load(out/'acceptance.json');assert acceptance['personallyViewed'] and acceptance['artifact']==build['sha256']
for path,want in acceptance['viewed'].items():assert sha(root/path)==want,path
paired=load(out/'paired-cast/comparison.json')
assert paired['plan']['after']==build['sha256'] and paired['plan']['order']==['before','after','after','before']
assert len(paired['observations'])==4
for row in paired['observations']:assert sha(root/row['path'])==row['sha256'],row['path']
paired_current=[cast for row in paired['observations'] if row['variant']=='after' for cast in row['casts']]
assert len(paired_current)==4
startup=load(validation/'flag-off/audit.json')
assert startup['deltaBytes']==0 and startup['threeOrModelModules']==0
cold=[]
for batch in [1,2]:
    r=load(validation/f'cold-batch-{batch}/summary.json');assert r['sha256']==build['sha256'];cold.extend(r['rows'])
assert len(cold)==7
protected=subprocess.check_output(['git','diff','29699ca45','--name-only','--','packages/game-rules','packages/api-contract','supabase','package.json','pnpm-lock.yaml','apps/web/src/game/cardrpg/depth/App.tsx'],cwd=root,text=True).strip()
assert not protected
misses=[]
if build['bytes']>24_000_000:misses.append('Original24MB target exceeded; existing32MB visual allowance applies.')
if phase['coldMaxMs']>117:misses.append(f"Cold7 maximum{phase['coldMaxMs']:.1f}ms exceeds historical117ms ceiling.")
if cold_audit['maxPostReadyMs']>50:misses.append(f"Natural-playback cold samples also have post-ready gaps up to{cold_audit['maxPostReadyMs']:.1f}ms; minimum{cold_audit['minimumPostReadyWithin20']*100:.2f}%of post-ready frames<=20ms. These default-quality samples are separate from fixed-tier gallery casts.")
for r in target:
    if r['after']['max']>50 or r['after']['p95']>33:misses.append(f"{r['case']}/{r['use']}: max{r['after']['max']:.1f}/p95{r['after']['p95']:.1f}ms.")
hero_max_misses=[r for r in hero if r['summary']['max']>50]
hero_coverage_misses=[r for r in hero if r['summary']['within20']<.99]
if hero_max_misses:misses.append(f"Hero first/repeat50ms limit missed in{len(hero_max_misses)}/24windows; maximum{phase['castMaxMs']:.1f}ms.")
if hero_coverage_misses:misses.append(f"Hero High/DPR1 99%frames<=20ms missed in{len(hero_coverage_misses)}/24windows; minimum{phase['castWithin20Min']*100:.2f}%.")
paired_max_misses=[r for r in paired_current if r['max']>50]
paired_coverage_misses=[r for r in paired_current if r['within20']<.99]
if paired_max_misses or paired_coverage_misses:
    misses.append(f"Separate registered ABBA current-artifact windows: {len(paired_max_misses)}/4 exceed 50 ms; {len(paired_coverage_misses)}/4 miss 99% coverage at 20 ms; peak {max(r['max'] for r in paired_current):.1f} ms. These are additional observations, not substitutes for the 24 hero windows.")
all_casts=[r['summary'] for r in hero]+[r['after'] for r in target]+paired_current
peak_calls=max(r['calls'] for r in all_casts);peak_triangles=max(r['triangles'] for r in all_casts)
if peak_calls>250 or peak_triangles>150000:misses.append(f"Draw/triangle limit missed: {peak_calls}calls/{peak_triangles}triangles.")
if life['growth']['heap']!=0:misses.append(f"Literal heap flatness not established: final growth{life['growth']['heap']}bytes; tolerance and GPU results separately reported.")
misses.append(f"Original effect-pair non-regression still missed: {pairs['originalRegressions']}/2211 distances decrease; incremental unchanged-row reuse, not a fresh full-effects run.")
misses.append('Exclusive whole-machine timing isolation not established; shared-lock leases and suspended/closed browser handoffs do not prove that no external load existed.')
result=dict(artifact=build['sha256'],source=build['head'],sourceInputs=len(build['sourceHashes']),bytes=build['bytes'],
            sourceGates=gates,presentationSizes=3,effectPairs=dict(freshEffects=6,freshPairs=15,minimumDistance=effects['minimumDistance'],peakOverdraw=max(r['peakOverdraw'] for r in effects['rows']),incrementalImproved=66,incrementalNewRegressions=0,originalRegressions=pairs['originalRegressions'],worstOriginalDelta=pairs['worstOriginalDelta']),
            startup=startup,phase=phase,targetedCasts=target,
            heroCasts=hero,heroMaxMisses=hero_max_misses,heroCoverageMisses=hero_coverage_misses,
            castGeometry=dict(peakCalls=peak_calls,peakTriangles=peak_triangles),
            coldIntervals={k:cold_audit[k] for k in ['maxPageMs','maxPostReadyMs','minimumPostReadyWithin20']},
            pairedCasts=paired,
            targetedPageMaxBefore=max(r['pageOpen']['max'] for r in before['rows']),targetedPageMaxAfter=max(r['pageOpen']['max'] for r in after['rows']),
            cold=[{k:r[k] for k in ['width','height','dpr','throttle','loadToInteractiveMs','battleReadyMs','max','p95']} for r in cold],
            lifecycle=dict(replays=20,snapshots=21,growth=life['growth'],tolerance=life['tolerance'],passed=life['passed'],budgetMisses=life['budgetMisses'],gpu=life['rows'][0]['gpu'],programs=life['rows'][0]['programs']),
            protectedFilesChanged=[],missedOrUnverified=misses,
            historical='L7 original860cases/1720casts and fourmissed casts remain retained; this targeted run does not replace or clear them.')
(out/'audit.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k in ['artifact','bytes','effectPairs','lifecycle','missedOrUnverified']}))
