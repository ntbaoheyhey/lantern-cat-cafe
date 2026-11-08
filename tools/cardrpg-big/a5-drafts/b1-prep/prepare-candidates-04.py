from pathlib import Path
import json,hashlib,datetime
r=Path('/Users/bao/taskbar-hero-cardrpg-a4'); p=Path('/tmp/cardrpg-a5-b1-prep'); out=p/'candidates-04'; out.mkdir(exist_ok=True)
f='packages/game-rules/src/cardrpg/depth/policies.ts'; pressure='packages/game-rules/src/cardrpg/depth/pacing-v4.ts'
reply=(p/'candidates-03/reply-half'/f).read_text(); pace=(r/pressure).read_text()
assert 'score+=0.5*' in reply
variants={'baseline':{},'reply-015':{f:reply.replace('score+=0.5*','score+=0.15*')},'reply-030':{f:reply.replace('score+=0.5*','score+=0.3*')}}
for name,factor in [('reply-half-pressure115',1.15),('reply-half-pressure130',1.30)]:
 needle="Math.round(e.attack*growth*pressure)"; assert pace.count(needle)==1
 variants[name]={f:reply,pressure:pace.replace(needle,f"Math.round(e.attack*growth*pressure*(e.tier==='boss'?{factor}:1))")}
sha=lambda b:hashlib.sha256(b).hexdigest()
manifest={'registeredAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'count':50,'seedStart':1,'seedEnd':50,'source':{file:sha((r/file).read_bytes()) for file in [f,pressure]},'variants':{}}
for name,files in variants.items():
 manifest['variants'][name]={}
 for file,body in files.items():
  path=out/name/file;path.parent.mkdir(parents=True,exist_ok=True);path.write_text(body);manifest['variants'][name][file]=sha(path.read_bytes())
(out/'manifest.json').write_text(json.dumps(manifest,indent=2))
(out/'REGISTERED-CANDIDATES.md').write_text('''# B1 TRAIN pilot04: response valuation and encounter pressure

Registered before any pilot04 outcome. Same31 residual cells, TRAIN1–50, identical pair fixtures and pilot01 baseline reused. Fresh acceptance20001–20500 remains unused. Preserve all pilots and report all variants.

Pilot03 demonstrated that bounded same-round enemy-response valuation eliminated the observed fourth-piece cliff only by saturating25–31before cells and30–31after cells. It cannot be accepted as a balance fix. This pilot separates response weighting (0.15/0.30 of the same response difference) from reference encounter pressure (0.50 response with boss attack×1.15/×1.30). These are explicit gameplay candidates, not changes to evaluation fixtures or thresholds. No candidate is adopted on these31cells alone.

Hypothesis: weakly valued prevention leaves a survival cliff; properly valued prevention changes automatic preparation for an advertised attack, making stronger sustained encounter pressure viable without reliance on one marginal item. This is unproven. Both high win saturation and large item gain remain rejection conditions. Any promising candidate needs all fourth-slot/cat/set/crew/tier/band TRAIN checks, affordable progression and measured CPU costs. Matched-power fixture calibration is a separate question with both old/new results required.

Same bounded response helper and seeds as pilot03, no new randomness. OFF evaluator unchanged. Two-minute CPU slices and120second handoffs under shared lock. Production source/artifact unchanged; registered source digests enforce isolation.
''')
report=r/'reports/cardrpg-big/a5/b1/candidates-04';report.mkdir(parents=True,exist_ok=True)
for name in ['manifest.json','REGISTERED-CANDIDATES.md']:(report/name).write_bytes((out/name).read_bytes())
old=json.loads((r/'reports/cardrpg-big/a5/b1/candidates-01/results.json').read_text())
(report/'partial.json').write_text(json.dumps({'manifest':manifest,'source':old['source'],'rows':[x for x in old['rows'] if x['variant']=='baseline'],'baselineReuse':'pilot01 exact rows; not new samples'}))
(p/'a5-candidate-pilot-04.mjs').write_text((p/'a5-candidate-pilot-03.mjs').read_text().replace('candidates-03','candidates-04'))
(p/'run-candidates-04.mjs').write_text((p/'run-candidates-03.mjs').read_text().replace('candidates-03','candidates-04').replace('pilot 03','pilot 04').replace('pilot-03','pilot-04'))
print('Registered pilot04; no production edits.')
