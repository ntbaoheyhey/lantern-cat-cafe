from pathlib import Path
import hashlib,json,datetime
root=Path('/Users/bao/taskbar-hero-cardrpg-a4');prep=Path('/tmp/cardrpg-a5-b1-prep');out=prep/'expanded-01';out.mkdir(exist_ok=True)
policy='packages/game-rules/src/cardrpg/depth/policies.ts';battle='packages/game-rules/src/cardrpg/depth/battle.ts';contract='packages/game-rules/src/cardrpg/depth/contract.ts'
sha=lambda value:hashlib.sha256(value).hexdigest()
variants={'aware-latched':{policy:prep/'candidates-04/reply-030'/policy,battle:prep/'candidates-02/latched'/battle,contract:prep/'candidates-02/latched'/contract},'aware-distributed':{path:prep/'candidates-05/aware-distributed'/path for path in [policy,battle,contract]}}
manifest={'registeredAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'seeds':[1,50],'scopes':['tiers','equipped','sets','teams'],'fixtureSource':'tools/cardrpg-big/a4-p6-balance.mjs','fixtureSourceSha256':sha((root/'tools/cardrpg-big/a4-p6-balance.mjs').read_bytes()),'variants':{}}
for name,files in variants.items():manifest['variants'][name]={path:{'file':str(file),'sha256':sha(file.read_bytes())} for path,file in files.items()}
(out/'manifest.json').write_text(json.dumps(manifest,indent=2))
source=(root/'tools/cardrpg-big/a4-p6-balance.mjs').read_text().replace("import {loadRules} from './a4-load.mjs';", "import {loadRules} from '/tmp/cardrpg-a5-b1-prep/expanded-01/loader.mjs';")
source=source.replace("assert(['pilot','train','heldout'].includes(sample));", "assert.equal(sample,'pilot','Expanded diagnostics use TRAIN only');")
source=source.replace("const scope=", "assert.equal(count,50);\nconst scope=")
source=source.replace("const cp=JSON.parse", "const transforms=JSON.parse(await readFile('/tmp/cardrpg-a5-b1-prep/expanded-01/manifest.json','utf8')).variants[process.env.A5_VARIANT];\nfor(const [path,row] of Object.entries(transforms))source[path]=row.sha256;\nconst cp=JSON.parse")
source=source.replace("if(cp.source){", "if(cp.source){assert.equal(cp.variant,process.env.A5_VARIANT);")
source=source.replace('JSON.stringify({source,sample,count,scope,rows})', 'JSON.stringify({source,sample,count,scope,rows,variant:process.env.A5_VARIANT,transforms})')
source=source.replace('JSON.stringify({source,sample,count,offset,scope,', 'JSON.stringify({source,sample,count,offset,scope,variant:process.env.A5_VARIANT,transforms,')
source=source.replace('Actual public rules/auto controller. Train seeds1-500; heldout10001-10500; pilot<=50 train-only.', 'Isolated candidate rules; unchanged A4 fixtures. TRAIN1–50 diagnostic only, no acceptance.')
(out/'matrix.mjs').write_text(source)
report=root/'reports/cardrpg-big/a5/b1/expanded-01';report.mkdir(parents=True,exist_ok=True)
(report/'manifest.json').write_bytes((out/'manifest.json').read_bytes())
(report/'REGISTERED-METHOD.md').write_text('''# Expanded TRAIN diagnostic01

Registered before expanded sampling. Two unadopted candidates: aware-latched(response0.30 with queued phase), aware-distributed(same plus120/135 boss basic/signature). Exact immutable A4 fixture source and transformed source hashes are in manifest.json. TRAIN1–50 only. Do not sample10001–10500 or fresh20001–20500.

Prior pilots are insufficient for selection: saturated epic residual arms were rejected as evidence of acceptance, but saturation of this selected31cell group alone is not the registered band gate. That gate concerns bare-to-Legendary spreads across all intended levels, not a requirement that every coherent epic team sometimes lose. This expanded run directly tests that concern rather than inferring universal ease from a biased residual subset. All prior failed results and interpretation stay visible.

For each candidate, run unchanged full-route tiers30, boss bands165, fixed farming15 first. If any intended band saturates all tiers or lacks15pp spread, still report every ladder result; do not silently skip bad cells. Then coherent fourth-slot384, shared sets64, all220triples×3bosses660 and3train-selected coherent/random cells. Same cases, same normalizations, same uniform team sampling as A4.50seeds/cell are diagnostic and cannot satisfy acceptance500.

Compare all original A4 TRAIN1–50 outcomes by exact case keys, not A4heldout aggregates. Preserve new top crew selection, cat aggregates, allset scenes, negative piece gains, bounded display shares and band saturation. This does not test the2304bare piece cells yet; label them NOT VERIFIED. The full selected candidate requires those cells, fulltrain500, fresh registered acceptance, calibrated set/cat fixtures, display correlation and earned progression.

No production edits or gate movement. Report outcomes even if both variants fail. Native single-process sims under110second shared-lock slices with120second handoffs; no model calls.
''')
print('Registered expanded TRAIN ladder/equipped/set/team checks.')
