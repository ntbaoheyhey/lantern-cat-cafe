from pathlib import Path
import json,hashlib,datetime
root=Path('/Users/bao/taskbar-hero-cardrpg-a4');out=Path('/tmp/cardrpg-a5-b2-prep')
base=root/'packages/game-rules/src/cardrpg/depth/gameplay-v4.ts';s=base.read_text()
start=s.index('export function crewStats(');stop=s.index('export function planPreference(',start)
transform=s[:start]+'''export function crewStats(stats: Stats, ids: string[]): Stats { void ids; return { ...stats }; }
export function openingCrewBonus(ids: string[], actor: Actor): void { void ids; void actor; }
'''+s[stop:]
(out/'no-crew.ts').write_text(transform)
s=(root/'tools/cardrpg-big/a4-p6-balance.mjs').read_text();a=s.index("const tiers=");b=s.index('let lastSaved=0;',a)
(out/'team-fixtures.mjs').write_text("import assert from 'node:assert/strict';\nexport function fixtures(R,C){\n"+s[a:b]+"return {fixture,matchedCats,battle,teams,situations};\n}\n")
train=root/'reports/cardrpg-big/a4/p6/train/results.json';data=json.loads(train.read_text());rows=[r for r in data['summaries'] if r['kind']=='teams'];teamRates={}
for row in rows:
 key=','.join(row['team']);teamRates[key]=teamRates.get(key,0)+row['rate']/3
ordered=sorted(teamRates,key=lambda k:(teamRates[k],k));selected=sorted(set([ordered[round(i*(len(ordered)-1)/15)] for i in range(16)]+[','.join(data['chosenCrew'])]))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
manifest={'registeredAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'purpose':'TRAIN-only same-cats same-gear crew-stats/opening-bonus ablation; not the coherent-vs-random gate','seeds':[1,50],'teams':[k.split(',') for k in selected],'chapters':[1,2,3],'source':str(base.relative_to(root)),'sourceSha256':sha(base),'candidateSha256':sha(out/'no-crew.ts'),'fixturesSha256':sha(out/'team-fixtures.mjs'),'trainSha256':sha(train),'normalization':'Compute scale on original production fixture; apply that identical scale to both cats arrays. Do not renormalize away removed crew stats. Every baseline outcome must match A4.'}
(out/'REGISTERED-CREW-ABLATION.json').write_text(json.dumps(manifest,indent=2))
print(json.dumps({'teams':len(selected),'pairedBattles':len(selected)*3*50*2,'manifest':str(out/'REGISTERED-CREW-ABLATION.json')}))
