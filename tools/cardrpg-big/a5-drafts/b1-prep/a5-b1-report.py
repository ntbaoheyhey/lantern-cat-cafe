# REFERENCE: A5 B1. Aggregate registered TRAIN ablation receipts; never sample acceptance seeds.
import json, hashlib, math
from pathlib import Path
from collections import Counter
root=Path('reports/cardrpg-big/a5')
p=root/'b1/ablation/results.json'
data=json.loads(p.read_text())
assert data['count']==500 and len(data['rows'])==31
assert all(row['complete'] and all(len(values)==500 for values in row['outcomes'].values()) for row in data['rows'])
assert all(not replay['tracePending'] for replay in data['replays'])
variants=['main','affixes','unique','set4','all']
rows=[]
for row in data['rows']:
    base=list(map(int,row['outcomes']['none']))
    pairs={}
    for mode in variants:
        other=list(map(int,row['outcomes'][mode]))
        delta=[b-a for a,b in zip(base,other)]
        n=len(delta); mean=sum(delta)/n; variance=sum((d-mean)**2 for d in delta)/(n-1)
        half=1.96*math.sqrt(variance/n)
        pairs[mode]={'gainPp':100*mean,'improved':sum(d==1 for d in delta),'worsened':sum(d==-1 for d in delta),
            'pairedNormal95Pp':[100*max(-1,mean-half),100*min(1,mean+half)],
            'intervalMethod':'Normal 95% paired difference across fixed seed pairs; marginal win-rate Wilson95 intervals in results.json.'}
    rows.append({'key':row['key'],'baseWins':sum(base),'components':pairs})
examples=[]
for record in data['replays']:
    trace=json.loads(Path(record['tracePath']).read_text())
    examples.append({'key':record['key'],'seed':record['seed'],'tracePath':record['tracePath'],'divergence':trace['divergence'],
        'losingFirstDeath':trace.get('losingFirstDeath'),'winningAtSameActorRound':trace.get('winningAtSameActorRound')})
summary={'method':'31 preselected residual twins, train1–500; none/full verified seed-by-seed against A4; no acceptance samples.',
    'source':data['source'],'receiptSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'paired':rows,'examples':examples,
    'dominantPureComponentCount':dict(Counter(max(variants[:-1],key=lambda mode:abs(row['components'][mode]['gainPp'])) for row in rows))}
(root/'b1/root-cause.json').write_text(json.dumps(summary,indent=2))
lines=['# A5 B1 root-cause ablation','','TRAIN seeds1–500 only. The 31 case keys were selected from the already-contaminated A4 residual map. The new acceptance block remains unused.',
    'Each before/full result matches the original A4 training receipt for that exact seed. Main-stat plus marginal-affix reconstruction matches the full production stats; set/unique reconstruction matches production effects.',
    '', '|Piece / carrier / chapter|Before wins /500|Main only pp|Affixes only pp|Unique only pp|Set4 only pp|All pp|', '|---|---:|---:|---:|---:|---:|---:|']
for row in rows:
    case=json.loads(row['key']);pairs=row['components']
    lines.append('|'+f"{case['templateId']} / {case['cardId']} / {case['chapter']}|{row['baseWins']}|"+'|'.join(f"{pairs[mode]['gainPp']:.2f}" for mode in variants)+'|')
lines+=['','Pure component gains are not additive: automatic decisions, RNG consumption and survival interact. The table isolates components at BattleSetup; it does not claim which one caused every observed victory.',
    'Marginal win-rate Wilson95 intervals and all outcome strings are in ablation/results.json. Paired improved/worsened counts and explicitly labelled paired normal intervals are in root-cause.json.',
    '', '## Paired replay observations','']
for example in examples:
    case=json.loads(example['key']);d=example['divergence'];death=example.get('losingFirstDeath')
    lines.append(f"### {case['templateId']}, {case['cardId']}, chapter {case['chapter']}, train seed {example['seed']}")
    if d:\n        before=d['before'];after=d.get('after')
        lines.append(f"First divergent automatic party choice #{d['partyIndex']+1}: {before['actorId']} round {before['round']}, {before['choice']} → {after['choice'] if after else 'no aligned next party action'}. Actor/round aligned: {d['aligned']}.")
    else:
        lines.append('No different party choice in the aligned prefix; inspect damage and survival trajectories in the full trace.')
    if death:
        lines.append(f"First losing party death: {death['targetId']} round {death['round']}; {death['hpBefore']} HP before {death['requestedHpLoss']} raw HP loss, residual shield {death['shieldAfterDirectAbsorption']}. HP margin {death['hpMargin']}; {death['extraHpNeededToSurvive']} extra HP would survive that particular request.")
    else:
        lines.append('First party death was not identified by the raw-HP observer. NOT VERIFIED; inspect the saved log.')
    lines.append('Read-only observer parity passed for the complete battle JSON, including logs and choices. Matching-round snapshots after divergence are descriptive, not a controlled causal estimate.')
    lines.append(f"Evidence: [{Path(example['tracePath']).name}]({Path(example['tracePath']).relative_to(root)}).\n")
lines+=['## Interpretation and next experiment','','Do not choose a gameplay patch from this generator alone. Review the six paired traces and component table, then append the specific causal hypothesis and training-only candidate registration before editing production rules.',
    'The repeated fourth-slot correlation is not by itself proof of an unbounded set4 loop. Null unique components and failed candidates must remain visible.',
    '', 'No human playtest claim. No production rule or acceptance seed was changed by this diagnostic.']
(root/'B1-ROOT-CAUSE.md').write_text('\n'.join(lines)+'\n')
print(json.dumps({'rows':len(rows),'examples':len(examples),'dominantPureComponentCount':summary['dominantPureComponentCount']}))
