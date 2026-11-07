// REFERENCE: PROMPT-A5 H0; registered read-only A4 baseline. No clock acceleration, skip, grants or runtime edits.
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import {mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createServer} from 'node:net';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';
import {loadRules} from './a4-load.mjs';
const out=process.env.A5_H0_OUT||'reports/cardrpg-big/a5/h0/session';
const duration=Number(process.env.A5_H0_MINUTES||60)*60000,sliceMs=10*60000;
const artifact=resolve('docs/cardrpg3/index.html'),socketPath=`/tmp/cardrpg-a5-h0-${process.pid}.sock`;
await mkdir(out,{recursive:true});
const hash=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const artifactSha256=hash(await readFile(artifact,'utf8'));
assert.equal(artifactSha256,'067d2062f6836a6d0bb9f6753ece1b2f3ca923688f241866a7f42806c8f7b6a1');
let browser,page,R,vite,started,activeMs=0,leaseStart=0,leaseNumber=0,complete=false,step=0;
let lastState,lastScreen=null,betweenPending=false,firstEquip=false;
const timeline=[],encounters=[],captures=[],errors=[],remote=[],seenChoices=new Set();
const elapsed=()=>activeMs+(leaseStart?Date.now()-leaseStart:0);
const read=()=>page.evaluate(()=>({screen:window.__depthReview.screen,state:window.__depthReview.state,battle:window.__depthReview.battle,showBattle:window.__depthReview.showBattle}));
const record=(kind,data={})=>{const row={index:timeline.length,atMs:elapsed(),wallAt:new Date().toISOString(),kind,...data};timeline.push(row);return row;};
const persist=async()=>{await writeFile(`${out}/timeline.json`,JSON.stringify({complete,artifact,artifactSha256,started,activeMs:elapsed(),method:'60 active elapsed minutes, one persistent headless page, real UI clicks, x1 battles, no skip or clock acceleration. Shared-lock handoffs excluded from active time and retained as wall time. Deterministic automation reading pauses are explicit. These are proxy metrics, not a human playtest.',timeline,encounters,captures,errors,remote},null,2));};
async function snapshot(label,{capture=false}={}){
 const m=await read();const facts=await page.evaluate(()=>{
  const text=document.querySelector('.cr-content')?.innerText||'';
  const visible=e=>!!e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
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
 if(encounters.length===1&&await page.getByLabel('Care',{exact:true}).count()){await page.getByLabel('Care',{exact:true}).selectOption('protect');record('selection',{category:'care',value:'protect'});}
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
 if(m.state.tutorial>=3&&!m.state.freeInvite){await nav('Invitations');await click(button('Open free welcome invitation'),'welcome invitation');record('celebration',{type:'invitation',reason:'visible earned-reveal ceremony'});await delay(1500);await snapshot('welcome',{capture:true});}
 await nav('Cafe');
 for(const name of ['Claim cafe service','Claim Warm the Kettle','Claim Evening Patrol','Claim A Week of Warmth']){const loc=button(name);if(await loc.count()&&await loc.isEnabled())await click(loc,name);}
 m=await read();
 if(m.state.account.currencies.stamps>=150){await nav('Invitations');const draw=button('Invite once · 150 stamps');if(await draw.count()&&await draw.isEnabled()){await click(draw,'earned invitation');record('celebration',{type:'invitation',reason:'visible earned-reveal ceremony'});await delay(1500);await snapshot('earned-invitation',{capture:true});}}
 await nav('Equipment');m=await read();
 const target=m.state.team[0];if(await page.getByLabel('Equip for',{exact:true}).count())await page.getByLabel('Equip for',{exact:true}).selectOption(target);
 const options=m.state.gear.filter(g=>!Object.values(m.state.equipment).some(slots=>Object.values(slots).includes(g.id)));
 const item=options[0];
 if(item){const name=R.GEAR_BY_ID[item.templateId].name;const tile=page.locator('.dp-gear-grid button').filter({hasText:name}).first();
  if(await tile.count()){const test=R.equipGear(m.state,target,item.id);if(test.ok){
   const common={seed:1,chapter:1,enemies:['button-guard','sock-skipper'],gameplayV4:true,challengeLevel:Math.min(...m.state.account.cards.filter(c=>m.state.team.includes(c.cardId)).map(c=>c.level))};
   offer('equipment',[{label:'keep',setup:{...common,cats:R.battleCats(m.state)}},{label:name,setup:{...common,cats:R.battleCats(test.state)}}],{target,item:item.templateId});
   await click(tile,'inspect '+name);await snapshot('equipment-compare',{capture:!firstEquip});await reading();const equip=button('Equip selected');if(await equip.isEnabled())await click(equip,'equip '+name);firstEquip=true;
  }}
 }
 await nav('Companions');m=await read();const selected=await page.evaluate(()=>window.__depthReview.cardId);const card=m.state.account.cards.find(c=>c.cardId===selected)||m.state.account.cards[0];
 if(R.metaCommand(m.state,{type:'level',cardId:card.id}).ok){await click(button('Level up'),'level '+card.cardId);await snapshot('level-up',{capture:step<3});}
 if(step%3===0){await nav('Collection journal');const claims=page.locator('.dp-v4-journal button:enabled').filter({hasText:'Claim milestone'});if(await claims.count())await click(claims.first(),'journal milestone');await snapshot('journal',{capture:step<3});}
 await nav('Cafe');await snapshot('cafe',{capture:step<3});betweenPending=false;step++;
}
async function advance(){
 let m=await read();
 if(m.screen==='prepare'&&m.battle&&!m.battle.result){await preparation();return;}
 if(m.state.tutorial<3){await nav('Cafe');await click(page.getByRole('button',{name:/Try the practice table/}),'practice table');return;}
 if(!m.state.freeInvite||betweenPending||!firstEquip){await interlude();return;}
 if(!m.state.run||m.state.run.complete){if(m.state.run?.complete&&!betweenPending){await interlude();}await nav('Cafe');await click(page.getByRole('button',{name:/Tangled Cafe/}).first(),'start Tangled Cafe');return;}
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
 leaseStart=Date.now();leaseNumber++;record('lease-start',{leaseNumber});
 if(!page){const rules=await loadRules();vite=rules.vite;R=await rules.load('packages/game-rules/src/cardrpg/depth/index.ts');browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});page=await browser.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});started=new Date().toISOString();await page.goto('file://'+artifact);await page.getByRole('heading',{name:'A small light. A brave little team.'}).waitFor({timeout:120000});await snapshot('fresh-save',{capture:true});}
 const deadline=Math.min(duration,activeMs+sliceMs);
 while(elapsed()<deadline)await advance();
 record('lease-end',{leaseNumber});activeMs+=Date.now()-leaseStart;leaseStart=0;
 await writeFile(`${out}/state-checkpoint.json`,JSON.stringify((await read()).state,null,2));await persist();
 console.log(JSON.stringify({leaseNumber,activeMinutes:activeMs/60000,encounters:encounters.length,events:timeline.length}));
}
const server=createServer(socket=>{socket.once('data',async()=>{try{await lease();socket.end(JSON.stringify({code:0,activeMs}));}catch(error){record('failure',{error:String(error),stack:error.stack});await persist();socket.end(JSON.stringify({code:1,error:String(error)}));}});});
await new Promise(resolve=>server.listen(socketPath,resolve));
try{
 while(activeMs<duration){const exit=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs','A5-H0 elapsed-session lease',process.execPath,'tools/cardrpg-big/a5-lock-client.mjs',socketPath],{stdio:'inherit'});child.on('error',reject);child.on('close',resolve);});if(exit!==0)throw Error('H0 lease failed; retain receipt, correct only the failing harness step.');if(activeMs<duration){record('handoff-start');await delay(7000);record('handoff-end');}}
 complete=true;record('session-complete');await persist();assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
}finally{server.close();await browser?.close();await vite?.close();await rm(socketPath,{force:true});}
