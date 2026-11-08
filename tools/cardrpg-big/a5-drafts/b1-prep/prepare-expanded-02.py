from pathlib import Path
import json,hashlib,datetime
root=Path('/Users/bao/taskbar-hero-cardrpg-a4');prep=Path('/tmp/cardrpg-a5-b1-prep');out=prep/'expanded-02';out.mkdir(exist_ok=True)
policy='packages/game-rules/src/cardrpg/depth/policies.ts';battle='packages/game-rules/src/cardrpg/depth/battle.ts';contract='packages/game-rules/src/cardrpg/depth/contract.ts'
original=(root/policy).read_text();smooth=(prep/'candidates-01/smooth'/policy).read_text();aware=(prep/'candidates-04/reply-030'/policy).read_text()
helper=aware[aware.index('/** Diagnostic: next scheduled enemy response'):aware.index('/** Isolated bounded reply pilot;')]
combined=smooth.replace('/** One-action lookahead keeps playback cheap and makes every decision reproducible. */',helper+'\n/** Smooth valuation plus bounded reply; isolated TRAIN candidate. */')
needle='    let score = value(preview) + planPreference(b,choice);';assert combined.count(needle)==1
combined=combined.replace(needle,needle+'\n    if(b.v4)score+=0.3*(nextEnemyValueV4(preview)-value(preview));')
sha=lambda s:hashlib.sha256(s).hexdigest()
variants={}
for name,base in [('smooth-aware-latched','candidates-02/latched'),('smooth-aware-distributed','candidates-05/aware-distributed')]:
 files={policy:combined,battle:(prep/base/battle).read_text(),contract:(prep/base/contract).read_text()};variants[name]={}
 for path,body in files.items():
  target=out/name/path;target.parent.mkdir(parents=True,exist_ok=True);target.write_text(body);variants[name][path]={'file':str(target),'sha256':sha(target.read_bytes())}
manifest={'registeredAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'seeds':[1,50],'scopes':['tiers','equipped','sets','teams'],'fixtureSource':'tools/cardrpg-big/a4-p6-balance.mjs','fixtureSourceSha256':sha((root/'tools/cardrpg-big/a4-p6-balance.mjs').read_bytes()),'variants':variants}
(out/'manifest.json').write_text(json.dumps(manifest,indent=2))
for name in ['matrix.mjs','loader.mjs']:(out/name).write_text((prep/'expanded-01'/name).read_text().replace('expanded-01','expanded-02'))
runner=(prep/'run-expanded.mjs').read_text().replace('expanded-01','expanded-02').replace("['aware-latched','aware-distributed']","['smooth-aware-latched','smooth-aware-distributed']").replace('A5 expanded TRAIN','A5 expanded02 TRAIN')
(prep/'run-expanded-02.mjs').write_text(runner)
report=root/'reports/cardrpg-big/a5/b1/expanded-02';report.mkdir(exist_ok=True)
(report/'manifest.json').write_bytes((out/'manifest.json').read_bytes())
(report/'REGISTERED-METHOD.md').write_text('''# Expanded TRAIN02: continuous rescue with advertised enemy response

Registered before sampling TRAIN1–50, original tiers30/bands165/farming15/fourth-slot384/sets64/team663 fixtures and normalizations. Both complete expanded01 results remain visible:48/38pp fourth-slot cliffs,21/14of24 positive tier steps, cats53.2–87.5/67.5–95.5%, crew31.33/20pp. Neither candidate is adopted.

The new worst-cell component trace (expanded01/worst-trace) isolates +24pp main stats, +14pp affixes,0pp set4, +48pp all. Its first divergent choice is Mochi round4: shield at340HP versus attack at420HP. The before arm dies at295HP against386 requested damage in round6. Thus the original50% healing-priority discontinuity remains relevant even after response valuation. The smooth evaluator and response-aware evaluator were previously tested separately, never together. This interaction is the hypothesis, not an assumed fix.

Apply the exact pilot01 continuous30% HP penalty and continuous rescue weight from75% HP, plus the exact response0.30 helper and phase latching. Second candidate also applies previously tested120/135 boss basic/signature distribution. No new randomness, seed/fixture/gate changes, gear reductions or cat changes. OFF retains the original evaluator. Every outcome is reported; no early rejection hides remaining fixture results. Bare2304cells, elite diversity, calibrated utility and500seed acceptance remain NOT VERIFIED.

Source hashes and cases are fixed in manifest.json. No production mutation; no sampling20001–20500. Native lock windows110seconds and120second handoffs. Reconstructed historical transforms are SHA-identical after host restart; new candidate sources are archived durably before execution.
''')
print('Registered expanded02; no sampling yet.')
