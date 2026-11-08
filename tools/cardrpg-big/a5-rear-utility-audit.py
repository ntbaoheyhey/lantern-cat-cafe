from pathlib import Path
import json,hashlib
root=Path('reports/cardrpg-big/a5/b2/rear-utility-13');data=json.loads((root/'results.json').read_text());m=json.loads((root/'REGISTERED-METHOD.json').read_text());assert data['registration']==m
# JS methodHash is independently bound by raw receipt; each cell digest is checked below.
assert len(data['rows'])==12
for row in data['rows']:
 assert len(row['outcomes'])==50
 assert row['wins']==row['outcomes'].count('1')
 assert hashlib.sha256(row['outcomes'].encode()).hexdigest()==row['digest']
lookup={(r['mode'],r['variant']):r for r in data['rows']}
old=json.loads(Path(m['original']['path']).read_text());assert hashlib.sha256(Path(m['original']['path']).read_bytes()).hexdigest()==m['original']['sha256']
for mode in m['modes']:
 original=next(r for r in old['rows'] if r['context']=='rear-suppression' and r['scene']==5 and r['mode']==mode and r['setId']=='velvetrim')
 assert lookup[mode,'full']['outcomes']==original['outcomes']
 assert lookup[mode,'no-reach']['outcomes']==lookup[mode,'no-spores']['outcomes']
examples=json.loads((root/'seed1-replays.json').read_text());pairs=[]
for mode in m['modes']:
 a=next(x['battle'] for x in examples if x['mode']==mode and x['variant']=='full');b=next(x['battle'] for x in examples if x['mode']==mode and x['variant']=='no-spores')
 i=next(i for i,(x,y) in enumerate(zip(a['choices'],b['choices'])) if x!=y)
 pairs.append({'mode':mode,'firstChoiceIndex':i,'fullChoice':a['choices'][i],'withoutSporeChoice':b['choices'][i], 'round6HealerEvents':{name:[e for e in battle['log'] if e['round']==6 and e['actorId']=='foe-0-teacup-healer'] for name,battle in [('full',a),('no-spores',b)]},'results':[a['result'],b['result']]})
(root/'audit.json').write_text(json.dumps({'source':'unchanged carrier12 archived source + guard','checks':'all12cells/digests/full-arm prefixes exact; first-seed replay equality asserted by runner','pairs':pairs,'rawSha256':hashlib.sha256((root/'results.json').read_bytes()).hexdigest()},indent=2))
print(json.dumps({'cells':12,'pairs':pairs}))
