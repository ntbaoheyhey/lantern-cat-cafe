# REFERENCE: PROMPT-A5 E2/E3 and H0 protocol. Register an elapsed current-source diagnostic.
import datetime
import hashlib
import json
import shutil
from pathlib import Path

root = Path.cwd()
out = root/'reports/cardrpg-big/a5/engagement/current-01'
scratch = Path('/tmp/cardrpg-a5-engagement-01')
assert not out.exists() and not scratch.exists()
out.mkdir(parents=True)
scratch.mkdir()
sha = lambda b: hashlib.sha256(b).hexdigest()
build_path = root/'reports/cardrpg-big/a5/e1-crew-advice-band/build/manifest.json'
build = json.loads(build_path.read_text())
for p,h in build['sourceHashes'].items():
    if p.startswith(('apps/','packages/','assets/')):
        assert sha((root/p).read_bytes()) == h, p
artifact = Path('/tmp/cardrpg-a5-crew-advice-29/artifact/index.html')
assert sha(artifact.read_bytes()) == build['sha256']
(out/'artifact').mkdir()
shutil.copy2(artifact,out/'artifact/index.html')
source = scratch/'source'
shutil.copytree(root/'packages/game-rules/src',source/'packages/game-rules/src')
reg35=json.loads((root/'reports/cardrpg-big/a5/b1/emergency-policy-35/REGISTERED-METHOD.json').read_text())
source_hashes={p:sha((source/p).read_bytes()) for p in reg35['source']}

s=(root/'tools/cardrpg-big/a5-h0-session.mjs').read_text()
s=s.replace('// REFERENCE: PROMPT-A5 H0; registered read-only A4 baseline. No clock acceleration, skip, grants or runtime edits.', '// REFERENCE: PROMPT-A5 E2/E3; engagement/current-01/REGISTERED-METHOD.md. Current-source elapsed diagnostic, not acceptance.')
s=s.replace("const out=process.env.A5_H0_OUT||'reports/cardrpg-big/a5/h0/session';", "const out='reports/cardrpg-big/a5/engagement/current-01/session';\nconst registration=JSON.parse(await readFile('reports/cardrpg-big/a5/engagement/current-01/REGISTERED-METHOD.json'));\nassert.equal(process.env.BIG_RULES_ROOT,registration.sourceRoot);\nfor(const [p,h] of Object.entries(registration.source))assert.equal(createHash('sha256').update(await readFile(registration.sourceRoot+'/'+p)).digest('hex'),h,p);")
s=s.replace("Number(process.env.A5_H0_MINUTES||60)*60000", '30*60000')
s=s.replace("resolve('docs/cardrpg3/index.html')", "resolve('reports/cardrpg-big/a5/engagement/current-01/artifact/index.html')")
s=s.replace('cardrpg-a5-h0-${process.pid}', 'cardrpg-a5-engagement-${process.pid}')
s=s.replace("assert.equal(artifactSha256,'067d2062f6836a6d0bb9f6753ece1b2f3ca923688f241866a7f42806c8f7b6a1');", 'assert.equal(artifactSha256,registration.artifactSha256);')
s=s.replace('let browser,page,R,vite,started', 'let browser,page,cdp,R,vite,started')
s=s.replace('const timeline=[],encounters=[]', 'let nextCapture=5*60000;\nconst timeline=[],encounters=[]')
s=s.replace("method:'60 active elapsed minutes", "method:'30 active elapsed minutes")
s=s.replace("const visible=e=>!!e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';", "const visible=e=>{if(!e.getClientRects().length||getComputedStyle(e).visibility==='hidden')return false;for(let p=e;p;p=p.parentElement)if(p.tagName==='DETAILS'&&!p.open&&!p.querySelector(':scope > summary')?.contains(e))return false;return true;};")
s=s.replace(" const m=await read();const facts=await page.evaluate(()=>{", " const m=await read();\n const discoveries=await page.evaluate(()=>window.__a5DiscoveryObservations?.splice(0)??[]);\n for(const d of discoveries)record('celebration',{type:'discovery',text:d.text,sequence:d.sequence,observedAt:d.wallAt,atMs:Math.max(0,elapsed()-(Date.now()-d.wallAt)),reason:'DOM New discovery card observed'});\n if(elapsed()>=nextCapture){capture=true;label='minute-'+Math.floor(nextCapture/60000)+'-'+label;nextCapture+=5*60000;}\n const facts=await page.evaluate(()=>{")
s=s.replace(" if(encounters.length===1&&await page.getByLabel('Care',{exact:true}).count()){await page.getByLabel('Care',{exact:true}).selectOption('protect');record('selection',{category:'care',value:'protect'});}", " if(encounters.length===1){await click(button('Protect · below 65% HP'),'care Protect');record('selection',{category:'care',value:'protect'});}")
old="await click(button('Open free welcome invitation'),'welcome invitation');record('celebration'"
new="await click(button('Open free welcome invitation'),'welcome invitation');await page.getByRole('region',{name:'Invitation reveal',exact:true}).waitFor();record('celebration'"
assert old in s
s=s.replace(old,new)
old="await snapshot('welcome',{capture:true});}"
new="""await snapshot('welcome',{capture:true});
  await button('Choose your first upgrade').waitFor({state:'visible',timeout:20000});
  await click(button('Choose your first upgrade'),'choose first upgrade');await reading();
  const before=(await read()).state;await click(button('Tailor for Soot'),'tailor first Soot wand');
  await snapshot('opening-equipment-compare',{capture:true});await reading();
  await click(button('Equip selected'),'equip first Soot wand');
  const after=(await read()).state,common={seed:1,chapter:1,enemies:['button-guard','sock-skipper'],gameplayV4:true,challengeLevel:1};
  offer('equipment',[{label:'keep starting kit',setup:{...common,cats:R.battleCats(before)}},{label:'tailor Soot wand',setup:{...common,cats:R.battleCats(after)}}],{opening:true});
  firstEquip=true;
 }"""
assert old in s
s=s.replace(old,new)
s=s.replace(" await nav('Cafe');\n for(const name", " await nav('Cafe');await page.getByText('Cafe service, daily board and star rewards',{exact:true}).click();\n for(const name")
s=s.replace("'Claim A Week of Warmth']", "'Claim A Week of Warmth','Collect 3-star reward','Collect 9-star reward','Collect 18-star reward']")
s=s.replace("const target=m.state.team[0];if(await page.getByLabel('Equip for',{exact:true}).count())await page.getByLabel('Equip for',{exact:true}).selectOption(target);", "const target=m.state.team[0];await click(page.getByRole('group',{name:'Equip for',exact:true}).getByRole('button',{name:R.CAT_BY_ID[target].name,exact:true}),'equip for '+target);")
s=s.replace("leaseStart=Date.now();leaseNumber++;record", "if(cdp)await cdp.send('Page.setWebLifecycleState',{state:'active'});\n leaseStart=Date.now();leaseNumber++;record")
s=s.replace("started=new Date().toISOString();await page.goto", """cdp=await page.context().newCDPSession(page);
 await page.addInitScript(()=>{
  window.__a5DiscoveryObservations=[];const seen=new Set();
  const observe=()=>{for(const e of document.querySelectorAll('[aria-label="New discovery"][data-discovery-sequence]')){
   const sequence=e.getAttribute('data-discovery-sequence');if(seen.has(sequence)||!e.getClientRects().length)continue;
   seen.add(sequence);window.__a5DiscoveryObservations.push({sequence,text:e.innerText,wallAt:Date.now()});
  }};
  new MutationObserver(observe).observe(document,{childList:true,subtree:true,attributes:true,attributeFilter:['data-discovery-sequence']});
 });
 started=new Date().toISOString();await page.goto""")
s=s.replace(" await writeFile(`${out}/state-checkpoint.json`", " await snapshot('lease-checkpoint',{capture:true});\n await cdp.send('Page.setWebLifecycleState',{state:'frozen'});\n await writeFile(`${out}/state-checkpoint.json`")
# Read the checkpoint before freezing, as page.evaluate cannot run while frozen.
s=s.replace(" await cdp.send('Page.setWebLifecycleState',{state:'frozen'});\n await writeFile(`${out}/state-checkpoint.json`,JSON.stringify((await read()).state,null,2));await persist();", " await writeFile(`${out}/state-checkpoint.json`,JSON.stringify((await read()).state,null,2));await persist();\n await cdp.send('Page.setWebLifecycleState',{state:'frozen'});")
s=s.replace('A5-H0 elapsed-session lease','A5 current engagement01 lease').replace('H0 lease failed;','Engagement01 lease failed;')
p=root/'tools/cardrpg-big/a5-engagement-session.mjs';p.write_text(s)
reg={'registeredAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
     'runtimeSource':build['head'],'sourceRoot':str(source),'source':source_hashes,
     'artifactSha256':build['sha256'],'artifactBytes':build['bytes'],
     'artifact':'reports/cardrpg-big/a5/engagement/current-01/artifact/index.html',
     'buildManifest':str(build_path.relative_to(root)),'buildManifestSha256':sha(build_path.read_bytes()),
     'script':str(p.relative_to(root)),'scriptSha256':sha(p.read_bytes()),
     'durationActiveMinutes':30,'viewport':[1280,720],'acceptanceSeedsUsed':False,
     'comparison':'Historical H0 protocol, current production source. No33/34/35 policy adoption. Explicit UI/measurement adaptations in markdown; not a pure isolated combat effect.'}
(out/'REGISTERED-METHOD.json').write_text(json.dumps(reg,indent=2)+'\n')
(out/'REGISTERED-METHOD.md').write_text('''# Current A5 elapsed journey01 — registered before running

Measure30 active elapsed minutes on sourcee14d320ed and artifact4b15da6d. One fresh save,1280×720, real clicks, x1, no skip/import/grants/time acceleration. Current production is unchanged; rejected33/34 and experimental35 policies are excluded. These are automated engagement proxies, not acceptance or a human playtest.

Reuse H0 practice, welcome, first affordable spare equipment for Mochi, one available selected-cat level per interlude, Chapter1 routes, first node/boon/affordable event, camp heal, shop saving, periodic journal and affordable150stamp invitations. Change Care to Protect before the first campaign encounter. Same3.5s decision and5s result reading allowances. New opening follows its real paid180fish/30thread Soot craft, compare and equip. New star rewards are collected when available. These content/UI adaptations are explicit and prevent interpreting the comparison as a single-rule causal experiment. No action or gate adapts to results.

Record complete battle setups/logs, positive currency/gear/cat rewards, visible invitation ceremonies and DOM-observed discovery cards. Do not count undisplayed pending discoveries. Preparation/equipment meaningful-offer proxy stays distinct finalHP/actions/result on TRAIN1/2/3, with repeated contexts deduplicated. Route options alone are not counted. Combat wallseconds remains the H0 noninteractive proxy; decision reading and other elapsed time remain separate.

Visible words exclude collapsed-details descendants, with the summary itself visible; keep historical H0 raw counts and identify its later corrected copy audit separately. Developer controls and seed labels are counted. Targeted captures cover opening, first12encounters and each5minute boundary; this is not the Z full screenshot pack.

Shared timing lock leases last about10minutes, ending at a safe action boundary and below20minutes. Browser lifecycle is frozen between leases, thawed after reacquisition; wall timestamps and at least7s handoff remain. Cafe service accrues real walltime; there is no clock edit. Register immutable source/script/artifact hashes and preserve every failure. Do not restart successful samples or reinterpret missing windows as complete.
''')
print(json.dumps({'registered':str(out),'artifactSha256':build['sha256'],'source':build['head'],'script':str(p)}))
