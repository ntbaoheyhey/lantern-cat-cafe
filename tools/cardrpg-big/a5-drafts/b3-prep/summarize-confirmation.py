# REFERENCE: PROMPT-A5 B3. Candidate economy only; original A4 combat, no acceptance claim.
import json, hashlib
from pathlib import Path
from statistics import median, mean
out=Path('reports/cardrpg-big/a5/b3/reward-confirmation-01')
f=out/'progression.json'
assert f.exists(),'Wait for the ORIGINAL coordinator; never summarize an incomplete cohort as90accounts.'
d=json.loads(f.read_text());pilot=json.loads(Path('reports/cardrpg-big/a5/b3/reward-pilot-01/progression.json').read_text())
assert d['count']==30 and d['days']==45 and len(d['accounts'])==90
assert d['source']==pilot['source']
for p in pilot['accounts']:
 a=next(a for a in d['accounts'] if a['style']==p['style'] and a['index']==p['index']);assert a==p,'Reused first5 cohort changed'
rows=[]
for style in ['casual','regular','heavy']:
 aa=[a for a in d['accounts'] if a['style']==style];assert len(aa)==30 and len({a['index'] for a in aa})==30
 for a in aa:assert [x['day'] for x in a['days']]==list(range(1,46))
 t=next(t for t in d['totals'] if t['style']==style)
 lg=[x['day'] for x in t['firstLegendary']];chosen=[x['day'] for x in t['firstChosen']]
 assert len(lg)+t['legendaryCensored']==30 and len(chosen)+t['chosenCensored']==30
 def milestone(xs,censored):
  values=sorted(xs+[46]*censored); med=median(values)
  return {'medianDay':med if med<=45 else None,'censored':censored,'byDay7':sum(x<=7 for x in xs)/30,'byDay14':sum(x<=14 for x in xs)/30,'observations':xs}
 earned={currency:mean(sum(day['earned'][currency] for day in a['days']) for a in aa) for currency in ['fish','threads','stamps','essence']}
 for key,value in earned.items():assert abs(value-t['earned'][key])<1e-8
 rows.append({'style':style,'legendary':milestone(lg,t['legendaryCensored']),'chosen':milestone(chosen,t['chosenCensored']),'earned':earned,'paidPulls':t['paidPulls']})
casual,regular,heavy=rows
ratios={key:heavy['earned'][key]/casual['earned'][key] for key in heavy['earned']};ratios['paidPulls']=heavy['paidPulls']/casual['paidPulls']
assert all(abs(ratios[k]-v)<1e-10 for k,v in d['ratios'].items())
gates={'regularLegendaryDay7':regular['legendary']['byDay7']>=.35,'regularLegendaryDay14':regular['legendary']['byDay14']>=.70,'heavyEarlierThanCasual':heavy['legendary']['medianDay'] is not None and casual['legendary']['medianDay'] is not None and heavy['legendary']['medianDay']<casual['legendary']['medianDay'],'regularChosenMedian21':regular['chosen']['medianDay'] is not None and regular['chosen']['medianDay']<=21,'casualChosenMedian35':casual['chosen']['medianDay'] is not None and casual['chosen']['medianDay']<=35,'noHeavyChosenCensored':heavy['chosen']['censored']==0,'allEarnedRatiosAtMost3':all(v<=3 for v in ratios.values())}
report={'method':'Original30accounts/style,45days, actual public commands with synthetic increasing clock. First5/style reused exactly. Candidate360stamps/24marks/13soft/24hard/+700bp, ORIGINAL A4 combat. Does not measure day7 first-two-attempt or post-B1 combat progression. No human playtest, production adoption, fresh combat acceptance or final B3 claim.','sourceReceipt':str(f),'sourceSha256':hashlib.sha256(f.read_bytes()).hexdigest(),'rows':rows,'ratios':ratios,'candidateRewardGates':gates}
(out/'summary.json').write_text(json.dumps(report,indent=2)+'\n')
text='# B3 candidate01 expanded TRAIN reward cohort\n\n'+report['method']+'\n\n|Style|First Legendary median|By day7|By day14|Chosen reward median|Chosen censored|\n|---|---:|---:|---:|---:|---:|\n'
for r in rows:text+=f"|{r['style']}|{r['legendary']['medianDay']}|{r['legendary']['byDay7']:.1%}|{r['legendary']['byDay14']:.1%}|{r['chosen']['medianDay']}|{r['chosen']['censored']} /30|\n"
text+='\nHeavy/casual ratios: '+', '.join(f'{k} {v:.6f}×' for k,v in ratios.items())+'.\n\n'
text+='\n'.join(f'- {k}: {"PASS" if v else "MISS"} (candidate reward cohort only)' for k,v in gates.items())+'\n'
text+='\nThe cap-toggle preservation correction is checked separately in ../validation-01. The measured candidate sources remain immutable. Re-run required economy on selected combat rules before B3 acceptance.\n'
(out/'RESULTS.md').write_text(text)
print(json.dumps({'rows':[{k:v for k,v in r.items() if k in ['style','paidPulls']} for r in rows],'gates':gates,'ratios':ratios}))
