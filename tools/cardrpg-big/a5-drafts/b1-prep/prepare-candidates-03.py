from pathlib import Path
import json,hashlib,datetime
r=Path('/Users/bao/taskbar-hero-cardrpg-a4');p=Path('/tmp/cardrpg-a5-b1-prep');out=p/'candidates-03';out.mkdir(exist_ok=True)
f='packages/game-rules/src/cardrpg/depth/policies.ts';battle='packages/game-rules/src/cardrpg/depth/battle.ts';original=(r/f).read_text()
needle='    let score = value(preview) + planPreference(b,choice);';assert original.count(needle)==1
helper='''/** Diagnostic: next scheduled enemy response, omitting remaining ally actions. */
function nextEnemyValueV4(preview: Battle): number {
  if(preview.result)return value(preview);
  const reply=previewCopy(preview),round=reply.round;
  reply.queue=reply.queue.filter(id=>reply.actors.some(a=>a.id===id&&a.side==='enemy'&&a.hp>0));
  let steps=0;
  while(!reply.result&&reply.round===round&&currentActor(reply)?.side==='enemy'&&steps++<8)enemyAct(reply);
  return value(reply);
}
'''
variants={'baseline':{}}
for name,weight in [('reply-half',.5),('reply-full',1)]:
 s=original.replace('/** One-action lookahead keeps playback cheap and makes every decision reproducible. */',helper+'\n/** Isolated bounded reply pilot; not a published rule. */')
 s=s.replace(needle,needle+f'\n    if(b.v4)score+={weight}*(nextEnemyValueV4(preview)-value(preview));')
 variants[name]={f:s}
variants['reply-partial']={f:variants['reply-half'][f],battle:(p/'candidates-02/partial-closing'/battle).read_text()}
sha=lambda x:hashlib.sha256(x).hexdigest()
manifest={'registeredAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'count':50,'seedStart':1,'seedEnd':50,'source':{path:sha((r/path).read_bytes()) for path in [f,battle]},'variants':{}}
for name,files in variants.items():
 manifest['variants'][name]={}
 for path,body in files.items():
  dest=out/name/path;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(body);manifest['variants'][name][path]=sha(dest.read_bytes())
(out/'manifest.json').write_text(json.dumps(manifest,indent=2))
method='''# B1 candidate pilot03: automatic response to a visible threat

Registered before sampling. TRAIN1–50 on the same31 residual cells. Reuse the exact pilot01 baseline; retain failed pilots01/02 and every outcome. Production and acceptance20001–20500 remain unchanged.

Evidence: the six losing traces first lose Mochi on round6; pilot02 phase latching leaves all1362 round6 first deaths intact, while partial closing reduces burst but saturates18after arms. The production one-action policy scores only its own immediate effect, without resolving any advertised enemy reply. Testing whether earlier automatic protection helps is justified; its benefit is not assumed.

For each legal party action, clone its existing preview, remove remaining ally IDs from the preview queue, and resolve only enemy actions already scheduled in that round (max8). This is a conservative bounded approximation, not a full-round oracle: omitted allies could alter targets/status/RNG before the real reply. It uses the same deterministic combat engine and current intent data as existing previews. New round actions are not resolved.

reply-half adds0.5times the difference between the response value and the original party-preview value. reply-full uses1.0. reply-partial combines reply-half with the already registered75%front/50%rear closing signature (no phase latching). No new RNG, items, stat changes, command inputs or fixture calibration. OFF takes the original evaluator exactly.

Report every paired gain, saturation, first-death round and action count. A lower item gain caused by universal victories is a failed candidate. Performance costs of any selected policy must be measured against the Prepare forecast400ms and actual battle budgets before adoption. Expand a promising candidate to all fourth-slot/tier/band/cat/set cases before selecting production rules. No passing balance claim from31residual cells. Shared lock,110s CPU slices and120s handoffs.
'''
(out/'REGISTERED-CANDIDATES.md').write_text(method)
report=r/'reports/cardrpg-big/a5/b1/candidates-03';report.mkdir(parents=True,exist_ok=True)
for name in ['manifest.json','REGISTERED-CANDIDATES.md']:(report/name).write_bytes((out/name).read_bytes())
old=json.loads((r/'reports/cardrpg-big/a5/b1/candidates-01/results.json').read_text());(report/'partial.json').write_text(json.dumps({'manifest':manifest,'source':old['source'],'rows':[v for v in old['rows'] if v['variant']=='baseline'],'baselineReuse':'pilot01 exact rows; not new samples'}))
(p/'a5-candidate-pilot-03.mjs').write_text((p/'a5-candidate-pilot-02.mjs').read_text().replace('candidates-02','candidates-03'))
(p/'run-candidates-03.mjs').write_text((p/'run-candidates-02.mjs').read_text().replace('candidates-02','candidates-03').replace('pilot 02','pilot 03').replace('pilot-02','pilot-03'))
print('Registered pilot03 before sampling, no production edit.')
