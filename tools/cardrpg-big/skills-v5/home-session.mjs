// REFERENCE: Skills V5 S8; s8/home/REGISTERED-METHOD.md. Prospective V5 rerun of Home03; same fixed public-click policy. Current-source elapsed diagnostic, not acceptance.
import {chromium} from '../../../apps/web/node_modules/@playwright/test/index.mjs';
import {mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createServer} from 'node:net';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';
import {loadRules} from './load.mjs';
const out='reports/cardrpg-big/skills-v5/s8/home/session';
const registration=JSON.parse(await readFile('reports/cardrpg-big/skills-v5/s8/home/REGISTERED-METHOD.json'));
assert.equal(process.env.BIG_RULES_ROOT,registration.sourceRoot);
for(const [p,h] of Object.entries(registration.source))assert.equal(createHash('sha256').update(await readFile(registration.sourceRoot+'/'+p)).digest('hex'),h,p);
const duration=60*60000,sliceMs=110000;
const artifact=resolve(registration.artifact),socketPath=`/tmp/cardrpg-v5a-home-${process.pid}.sock`;
await mkdir(out,{recursive:true});
const hash=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const artifactSha256=hash(await readFile(artifact,'utf8'));
assert.equal(artifactSha256,registration.artifactSha256);
let browser,page,cdp,R,vite,started,activeMs=0,leaseStart=0,leaseNumber=0,complete=false,step=0;
let lastState,lastScreen=null,betweenPending=false,firstEquip=false;
let nextCapture=5*60000;
const timeline=[],encounters=[],captures=[],errors=[],remote=[],seenChoices=new Set();
const elapsed=()=>activeMs+(leaseStart?Date.now()-leaseStart:0);
const read=()=>page.evaluate(()=>({screen:window.__depthReview.screen,state:window.__depthReview.state,battle:window.__depthReview.battle,showBattle:window.__depthReview.showBattle}));
const record=(kind,data={})=>{const row={index:timeline.length,atMs:elapsed(),wallAt:new Date().toISOString(),kind,...data};timeline.push(row);return row;};
const persist=async()=>{await writeFile(`${out}/timeline.json`,JSON.stringify({complete,artifact,artifactSha256,started,activeMs:elapsed(),method:'60 active elapsed minutes, one persistent headless page, real UI clicks, x1 battles, no skip or clock acceleration. Shared-lock handoffs excluded from active time and retained as wall time. Deterministic automation reading pauses are explicit. These are proxy metrics, not a human playtest.',timeline,encounters,captures,errors,remote},null,2));};
async function snapshot(label,{capture=false}={}){
 const m=await read();
 const discoveries=await page.evaluate(()=>window.__a5DiscoveryObservations?.splice(0)??[]);
 for(const d of discoveries)record('celebration',{type:'discovery',text:d.text,sequence:d.sequence,observedAt:d.wallAt,atMs:Math.max(0,elapsed()-(Date.now()-d.wallAt)),reason:'DOM New discovery card observed'});
 if(elapsed()>=nextCapture){capture=true;label='minute-'+Math.floor(nextCapture/60000)+'-'+label;nextCapture+=5*60000;}
 const facts=await page.evaluate(()=>{
  const visible=e=>{if(!e.getClientRects().length||getComputedStyle(e).visibility==='hidden')return false;for(let p=e;p;p=p.parentElement)if(p.tagName==='DETAILS'&&!p.open&&!p.querySelector(':scope > summary')?.contains(e))return false;return true;};
  const root=document.querySelector('.cr-content'),parts=[];
  if(root){const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
   while((node=walker.nextNode())){const parent=node.parentElement;if(!parent||parent.closest('option,script,style')||!visible(parent))continue;
    const range=document.createRange();range.selectNodeContents(node);if(range.getClientRects().length)parts.push(node.textContent.trim());}
   for(const select of root.querySelectorAll('select'))if(visible(select))parts.push(select.selectedOptions[0]?.textContent||'');
  }
  const text=parts.filter(Boolean).join('\n');
  const buttons=[...document.querySelectorAll('button')].filter(visible).map(e=>({text:e.innerText.trim(),label:e.getAttribute('aria-label'),disabled:e.disabled}));
  const dev=buttons.filter(x=>/Feel lab|Review studio|Mechanics lab|Frame meter|Look A\/B|Before \/ after/.test(x.text));
  return {text,words:text.trim().split(/\s+/).filter(Boolean).length,buttons,debugControls:dev,seedLabels:(text.match(/seed\s+\d+/gi)||[]),overflow:document.documentElement.scrollWidth-innerWidth};
 });
 if(lastScreen!==m.screen){record('screen',{screen:m.screen,label,...facts});lastScreen=m.screen;}
 if(lastState){
  const currencies=Object.fromEntries(Object.entries(m.state.account.currencies).map(([k,n])=>[k,n-(lastState.account.currencies[k]||0)]).filter(([,n])=>n>0));
  const gear=m.state.gear.filter(g=>!lastState.gear.some(old=>old.id===g.id));
  const cats=m.state.account.cards.filter(c=>!lastState.account.cards.some(old=>old.cardId===c.cardId));
  if(Object.keys(currencies).length||gear.length||cats.length)record('reward',{label,currencies,gear:gear.map(g=>g.templateId),cats:cats.map(c=>c.cardId)});
 }
 lastState=structuredClone(m.state);
 if(capture&&captures.length<90){const path=`${out}/${String(captures.length).padStart(3,'0')}-${label.replace(/[^a-z0-9-]/gi,'-')}.png`;await page.screenshot({path});captures.push({path,atMs:elapsed(),screen:m.screen,label,...facts});}
 await persist();return m;
}
async function click(locator,label){await locator.click();record('click',{label});await snapshot(label);}
const button=name=>page.getByRole('button',{name,exact:true});
const nav=async name=>click(page.getByRole('navigation',{name:'Cafe screens'}).getByRole('button',{name,exact:true}),`nav:${name}`);
async function reading(ms=3500){const start=elapsed();await delay(ms);record('wait',{reason:'scripted reading allowance',startMs:start,endMs:elapsed(),decisionAvailable:true});}
const outcome=setup=>[1,2,3].map(seed=>{const b=R.playBattle(R.createBattle({...structuredClone(setup),seed}),'auto');return {result:b.result,hp:b.actors.map(a=>[a.catalogId,a.hp]),actions:b.choices.length};});
function offer(category,variants,context){
 const key=hash({category,context,variants:variants.map(v=>v.label)});if(seenChoices.has(key)||variants.length<2)return;
 seenChoices.add(key);const results=variants.map(v=>({label:v.label,outcomes:outcome(v.setup)}));
 record('choice-offered',{category,context,meaningful:new Set(results.map(x=>hash(x.outcomes))).size>1,method:'Same train seeds1/2/3; distinct result, actor HP or action count. Local counterfactuals never alter the UI state.',options:results});
}
async function preparation(){
 const m=await snapshot('prepare',{capture:encounters.length<12});const setup=m.battle.initial;
 const context={chapter:setup.chapter,enemies:setup.enemies,cats:setup.cats.map(c=>({id:c.id,row:c.row,stats:c.stats,equipment:c.equipment}))};
 offer('focus',['finish','support','leader'].map(focus=>({label:focus,setup:{...setup,plan:{...(setup.plan||{care:'steady'}),focus}}})),context);
 offer('care',['steady','protect'].map(care=>({label:care,setup:{...setup,plan:{...(setup.plan||{focus:'finish'}),care}}})),context);
 for(const cat of setup.cats){const options=['front','rear'].map(row=>({...setup,cats:setup.cats.map(c=>c.id===cat.id?{...c,row}:c)})).filter(s=>s.cats.some(c=>c.row==='front'));
  offer('formation',options.map(s=>({label:`${cat.id}:${s.cats.find(c=>c.id===cat.id).row}`,setup:s})),{...context,cat:cat.id});}
 if(encounters.length===1){await click(button('Protect · below 65% HP'),'care Protect');record('selection',{category:'care',value:'protect'});}
 await reading();
 const before=await read(),startMs=elapsed();await click(button('Fight'),'Fight');await page.getByLabel('Playback speed',{exact:true}).selectOption('1');
 record('combat-start',{startMs,setup:before.battle.initial});
 await page.waitForFunction(()=>window.__depthReview.screen==='result'&&!window.__depthReview.showBattle,null,{timeout:300000});
 const endMs=elapsed(),after=await read();encounters.push({index:encounters.length,startMs,endMs,wallMs:endMs-startMs,setup:before.battle.initial,battle:after.battle});
 record('combat-end',{startMs,endMs,result:after.battle.result,actions:after.battle.choices.length,firstDeath:after.battle.firstDeath});
 await snapshot('result',{capture:encounters.length<=12});await reading(5000);
 const lesson=button('Complete lesson');await click(await lesson.count()?lesson:button('Continue to rewards'),'settle encounter');
 if(before.state.run&&after.battle.result==='enemy')betweenPending=true;
}
async function interlude(){
 await nav('Cafe');let m=await read();
 if(m.state.tutorial>=3&&!m.state.freeInvite){await nav('Invitations');await click(button('Open free welcome invitation'),'welcome invitation');await page.getByRole('region',{name:'Invitation reveal',exact:true}).waitFor();record('celebration',{type:'invitation',reason:'visible earned-reveal ceremony'});await delay(1500);await snapshot('welcome',{capture:true});
  await button('Choose your first upgrade').waitFor({state:'visible',timeout:20000});
  await click(button('Choose your first upgrade'),'choose first upgrade');await reading();
  const before=(await read()).state;await click(button('Tailor for Soot'),'tailor first Soot wand');
  await snapshot('opening-equipment-compare',{capture:true});await reading();
  await click(button('Equip selected'),'equip first Soot wand');
  const after=(await read()).state,common={seed:1,chapter:1,enemies:['button-guard','sock-skipper'],gameplayV4:true,skillsV5:true,challengeLevel:1};
  offer('equipment',[{label:'keep starting kit',setup:{...common,cats:R.battleCats(before)}},{label:'tailor Soot wand',setup:{...common,cats:R.battleCats(after)}}],{opening:true});
  firstEquip=true;
 }
 await nav('Cafe');await page.getByText('Cafe service, daily board and star rewards',{exact:true}).click();
 for(const name of ['Claim cafe service','Claim Warm the Kettle','Claim Evening Patrol','Claim A Week of Warmth','Collect 3-star reward','Collect 9-star reward','Collect 18-star reward']){const loc=button(name);if(await loc.count()&&await loc.isEnabled())await click(loc,name);}
 m=await read();
 if(m.state.account.currencies.stamps>=150){await nav('Invitations');const draw=button('Invite once · 150 stamps');if(await draw.count()&&await draw.isEnabled()){await click(draw,'earned invitation');record('celebration',{type:'invitation',reason:'visible earned-reveal ceremony'});await delay(1500);await snapshot('earned-invitation',{capture:true});}}
 await nav('Equipment');m=await read();
 const target=m.state.team[0];await click(page.getByRole('group',{name:'Equip for',exact:true}).getByRole('button',{name:R.CAT_BY_ID[target].name,exact:true}),'equip for '+target);
 const options=m.state.gear.filter(g=>!Object.values(m.state.equipment).some(slots=>Object.values(slots).includes(g.id)));
 const item=options[0];
 if(item){const name=R.GEAR_BY_ID[item.templateId].name;const tile=page.locator('.dp-gear-grid button').filter({hasText:name}).first();
  if(await tile.count()){const test=R.equipGear(m.state,target,item.id);if(test.ok){
   const common={seed:1,chapter:1,enemies:['button-guard','sock-skipper'],gameplayV4:true,skillsV5:true,challengeLevel:Math.min(...m.state.account.cards.filter(c=>m.state.team.includes(c.cardId)).map(c=>c.level))};
   offer('equipment',[{label:'keep',setup:{...common,cats:R.battleCats(m.state)}},{label:name,setup:{...common,cats:R.battleCats(test.state)}}],{target,item:item.templateId});
   await click(tile,'inspect '+name);await snapshot('equipment-compare',{capture:!firstEquip});await reading();const equip=button('Equip selected');if(await equip.isEnabled())await click(equip,'equip '+name);firstEquip=true;
  }}
 }
 await nav('Companions');m=await read();
 const selected=await page.evaluate(()=>window.__depthReview.cardId);
 const cards=m.state.account.cards.filter(c=>m.state.team.includes(c.cardId)).sort((a,b)=>a.level-b.level||m.state.team.indexOf(a.cardId)-m.state.team.indexOf(b.cardId));
 const card=cards.find(c=>R.metaCommand(m.state,{type:'level',cardId:c.id}).ok);
 if(card){
  if(card.cardId!==selected)await click(page.locator('.cr-card-grid').getByRole('button',{name:new RegExp('^'+R.CAT_BY_ID[card.cardId].name+',')}),'review growth '+card.cardId);
  record('affordable-growth-policy',{selected:card.cardId,level:card.level,team:cards.map(c=>({id:c.cardId,level:c.level})),method:'Lowest-level current teammate with a legal public level command; one level per interlude. Inspect visible price before click.'});
  await reading();await click(button('Level up'),'level '+card.cardId);await snapshot('level-up',{capture:step<3});
 }
 if(step%3===0){await nav('Collection journal');const claims=page.locator('.dp-v4-journal button:enabled').filter({hasText:'Claim milestone'});if(await claims.count())await click(claims.first(),'journal milestone');await snapshot('journal',{capture:step<3});}
 await nav('Cafe');await snapshot('cafe',{capture:step<3});betweenPending=false;step++;
}
async function advance(){
 let m=await read();
 if(m.screen==='prepare'&&m.battle&&!m.battle.result){await preparation();return;}
 if(m.state.tutorial<3){await nav('Cafe');await click(page.getByRole('button',{name:/Try the practice table/}),'practice table');return;}
 if(!m.state.freeInvite||betweenPending||step===0){await interlude();return;}
 if(!m.state.run||m.state.run.complete){if(m.state.run?.complete&&!betweenPending){await interlude();}await nav('Cafe');const plans=page.locator('.dp-v4-star-plans');
 if(await plans.count()){
  await click(plans.locator('summary'),'review available crews for the next star');await reading();
  const options=await plans.getByRole('button').allTextContents();record('star-crew-policy',{options,method:'Choose first named, legal Home option. Suggestions have no combat ranking.'});
  const chosen=plans.getByRole('button').first(),name=await chosen.innerText();await click(chosen,name);
  await snapshot('chosen-star-crew',{capture:true});await reading();
 }
 const primary=page.getByRole('region',{name:'Tonight at home',exact:true}).locator('button.cr-primary');const label=await primary.innerText();record('home-route-policy',{label,cleared:m.state.cleared,levels:m.state.account.cards.filter(c=>m.state.team.includes(c.cardId)).map(c=>({id:c.cardId,level:c.level}))});await click(primary,label);return;}
 await nav('Night route');m=await read();const run=m.state.run;
 if(run.rewardChoices.length){await snapshot('reward-choice',{capture:step<3});await reading();await click(page.locator('.dp-reward').first(),'choose first offered boon');return;}
 const current=run.nodes.find(n=>n.id===run.current);
 if(current){await reading();
  if(current.kind==='event')await click(page.locator('.cr-panel .dp-three button:enabled').first(),'first affordable event');
  else if(current.kind==='treasure')await click(button('Take 70 run points'),'take route points');
  else if(current.kind==='shop')await click(button('Save your points and leave'),'save route points');
  else if(current.kind==='campfire')await click(button('Heal the team · 35% HP'),'heal at camp');
  else throw Error(`Unresolved node ${current.kind},screen${m.screen}`);
 }else{const nodes=R.availableNodes(run);assert(nodes.length);record('route-options',{options:nodes.map(n=>({id:n.id,kind:n.kind,enemies:n.enemies})),meaningful:'NOT VERIFIED until a paired outcome comparison'});await reading();await click(page.locator('.dp-node:enabled').first(),'choose '+nodes[0].id);}
}
async function lease(){
 if(cdp)await cdp.send('Page.setWebLifecycleState',{state:'active'});
 leaseStart=Date.now();leaseNumber++;record('lease-start',{leaseNumber});
 if(!page){const rules=await loadRules();vite=rules.vite;R=await rules.load('packages/game-rules/src/cardrpg/depth/index.ts');browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});page=await browser.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});cdp=await page.context().newCDPSession(page);
 await page.addInitScript(()=>{
  window.__a5DiscoveryObservations=[];const seen=new Set();
  const observe=()=>{for(const e of document.querySelectorAll('[aria-label="New discovery"][data-discovery-sequence]')){
   const sequence=e.getAttribute('data-discovery-sequence');if(seen.has(sequence)||!e.getClientRects().length)continue;
   seen.add(sequence);window.__a5DiscoveryObservations.push({sequence,text:e.innerText,wallAt:Date.now()});
  }};
  new MutationObserver(observe).observe(document,{childList:true,subtree:true,attributes:true,attributeFilter:['data-discovery-sequence']});
 });
 started=new Date().toISOString();await page.goto('file://'+artifact);await page.getByRole('heading',{name:'A small light. A brave little team.'}).waitFor({timeout:120000});await snapshot('fresh-save',{capture:true});}
 const deadline=Math.min(duration,activeMs+sliceMs);
 while(elapsed()<deadline)await advance();
 record('lease-end',{leaseNumber});activeMs+=Date.now()-leaseStart;leaseStart=0;
 await snapshot('lease-checkpoint',{capture:true});
 await writeFile(`${out}/state-checkpoint.json`,JSON.stringify((await read()).state,null,2));await persist();
 await cdp.send('Page.setWebLifecycleState',{state:'frozen'});
 console.log(JSON.stringify({leaseNumber,activeMinutes:activeMs/60000,encounters:encounters.length,events:timeline.length}));
}
const server=createServer(socket=>{socket.once('data',async()=>{try{await lease();socket.end(JSON.stringify({code:0,activeMs}));}catch(error){record('failure',{error:String(error),stack:error.stack});await persist();socket.end(JSON.stringify({code:1,error:String(error)}));}});});
await new Promise(resolve=>server.listen(socketPath,resolve));
try{
 while(activeMs<duration){const exit=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs','V5A S8 Home lease',process.execPath,'tools/cardrpg-big/a5-lock-client.mjs',socketPath],{stdio:'inherit'});child.on('error',reject);child.on('close',resolve);});if(exit!==0)throw Error('Home engagement03 lease failed; retain receipt, correct only the failing harness step.');if(activeMs<duration){record('handoff-start');await delay(7000);record('handoff-end');}}
 complete=true;record('session-complete');await persist();assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
}finally{server.close();await browser?.close();await vite?.close();await rm(socketPath,{force:true});}
