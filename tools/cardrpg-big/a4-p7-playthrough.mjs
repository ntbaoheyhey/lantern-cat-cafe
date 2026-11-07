// REFERENCE: GAMEPLAY-V4 P7. Real clicks, earned day7 import, no injected rewards.
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const out=process.env.BIG_PLAYTHROUGH_OUT||'reports/cardrpg-big/a4/p7/journey',artifact=resolve('docs/cardrpg3/index.html');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']}),page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],remote=[],captures=[],encounters=[];let complete=false,day7SaveSha256=null;
page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
const read=()=>page.evaluate(()=>({screen:window.__depthReview.screen,state:window.__depthReview.state,battle:window.__depthReview.battle}));
const nav=async name=>page.getByRole('navigation',{name:'Cafe screens'}).getByRole('button',{name,exact:true}).click();
const capture=async(name,selector='.cr-content')=>{
 await page.locator(selector).scrollIntoViewIfNeeded();await page.locator('.cr-content img').evaluateAll(images=>Promise.all(images.map(i=>i.decode().catch(()=>{}))));
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);assert.equal(overflow,0);
 const path=`${out}/${name}.png`;await page.screenshot({path});captures.push({name,path,overflow,screen:(await read()).screen});
};
const fight=async(kind,timed=false,routeLabel='tutorial')=>{
 await page.getByRole('button',{name:'Fight',exact:true}).click();await page.getByLabel('Playback speed',{exact:true}).selectOption('1');
 const start=Date.now();if(!timed)await page.getByRole('button',{name:'Skip to result',exact:true}).click();
 await page.waitForFunction(()=>window.__depthReview.screen==='result'&&!window.__depthReview.showBattle,null,{timeout:240000});
 const {battle}=await read();encounters.push({route:routeLabel,kind,timed,wallMs:Date.now()-start,result:battle.result,actions:battle.choices.length,initial:battle.initial,events:battle.v4?.events});
 return battle.result==='party';
};
async function route(label,timedBoss=false){
 for(let step=0;step<24;step++){
  const m=await read();if(m.state.run?.complete)break;
  const node=await page.evaluate(()=>{const run=window.__depthReview.state.run,last=run.nodes.find(n=>n.id===run.visited.at(-1));return run.nodes.find(n=>last?last.next.includes(n.id):n.depth===0);});
  if(!node)break;
  await page.locator('.dp-node:enabled').filter({has:page.locator('b',{hasText:new RegExp(`^${node.kind}$`)})}).first().click();
  if(['battle','elite','boss'].includes(node.kind)){
   if(node.kind==='boss')await capture(label+'-boss-prepare');
   const won=await fight(node.kind,node.kind==='boss'&&timedBoss,label);
   await capture(`${label}-${node.kind}-${step}`);
   await page.getByRole('button',{name:'Continue to rewards',exact:true}).click();
   if(!won)break;
   if(await page.locator('.dp-reward').count())await page.locator('.dp-reward').first().click();
  }else if(node.kind==='event')await page.locator('.cr-panel .dp-three button:enabled').first().click();
  else if(node.kind==='treasure')await page.getByRole('button',{name:'Take 70 run points',exact:true}).click();
  else if(node.kind==='shop')await page.getByRole('button',{name:'Save your points and leave',exact:true}).click();
  else if(node.kind==='campfire')await page.getByRole('button',{name:'Heal the team · 35% HP',exact:true}).click();
 }
}
try{
 await page.clock.install();await page.goto('file://'+artifact);await page.getByRole('heading',{name:'A small light. A brave little team.'}).waitFor({timeout:120000});
 await capture('new-save-hub','.dp-v4-cafe');
 await page.getByRole('button',{name:/Try the practice table/}).click();await capture('prepare');await fight('practice');
 await page.getByRole('button',{name:'Complete lesson',exact:true}).click();
 await page.getByRole('button',{name:'Open free welcome invitation',exact:true}).click();
 if(await page.getByRole('button',{name:'Skip reveal',exact:true}).count())await page.getByRole('button',{name:'Skip reveal',exact:true}).click();
 await nav('Cafe');await page.clock.fastForward(3600000);await page.getByRole('button',{name:'Claim cafe service',exact:true}).click();
 await page.getByRole('button',{name:'Claim Warm the Kettle',exact:true}).click();await capture('cafe-hour','.dp-v4-cafe');
 await page.getByRole('button',{name:/Tangled Cafe/}).click();await route('first-hour');
 await nav('Invitations');const before=(await read()).state.v4.selectorMarks??0;await page.getByRole('button',{name:'Invite once · 150 stamps',exact:true}).click();
 if(await page.getByRole('button',{name:'Skip reveal',exact:true}).count())await page.getByRole('button',{name:'Skip reveal',exact:true}).click();
 assert.equal((await read()).state.v4.selectorMarks,before+1);await capture('invitations','.dp-v4-selector');
 await nav('Equipment');await page.locator('.dp-gear-grid button').first().click();await capture('equipment');
 const equip=page.getByRole('button',{name:'Equip selected',exact:true});if(await equip.isEnabled())await equip.click();
 await nav('Collection journal');await capture('journal','.dp-v4-journal');await nav('Fuji Relics');await capture('collectibles','.dp-v4-editions');
 const firstHour=(await read()).state;await writeFile(`${out}/first-hour.json`,JSON.stringify(firstHour,null,2));
 await nav('Save & settings');const day7=await readFile('reports/cardrpg-big/a4/p6/economy/day7.save','utf8');
 const day7Preflight=JSON.parse(await readFile('reports/cardrpg-big/a4/p6/path-preflight/day7-preflight.json','utf8'));
 day7SaveSha256=createHash('sha256').update(day7).digest('hex');assert.equal(day7SaveSha256,day7Preflight.saveSha256);
 await page.getByLabel('Save code',{exact:true}).fill(day7);await page.getByRole('button',{name:'Import save code',exact:true}).click();
 assert.equal(await page.locator('.cr-status.error').count(),0);assert.equal((await read()).state.account.day,7);
 await nav('Cafe');await capture('earned-day7','.dp-v4-cafe');await page.getByRole('button',{name:/Tangled Cafe/}).click();await route('day7',true);
 const outcomes=xs=>xs.map(({kind,result,actions})=>({kind,result,actions}));
 assert.deepEqual(outcomes(encounters.filter(e=>e.route==='day7')),outcomes(day7Preflight.encounters),'Actual UI choices must reproduce the existing earned-save command path');
 await nav('Save & settings');await page.getByRole('button',{name:'Export save code',exact:true}).click();const save=await page.getByLabel('Save code',{exact:true}).inputValue();assert(save.startsWith('THC12.'));
 const saved=(await read()).state;await page.getByRole('button',{name:'Import save code',exact:true}).click();assert.deepEqual((await read()).state,saved);
 assert(encounters.some(e=>e.kind==='boss'));assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);complete=true;
}finally{
 await writeFile(`${out}/checks.json`,JSON.stringify({complete,day7SaveSha256,day7BossReached:encounters.some(e=>e.route==='day7'&&e.kind==='boss'&&e.timed),artifact,sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),method:'Fresh offline page with real UI clicks. Playwright advances one hour for elapsed service, so this is compressed progression, not sixty elapsed wall-clock minutes. Day7 comes from the public-command 45-day economy bot. No unlock shortcuts or injected currencies. The first-hour route uses skip; the day7 route attempts to reach its boss, which uses real x1 playback if reached. An earlier defeat remains recorded and day7BossReached is false; it is not evidence of boss timing. P6 has a separate fixed level6/chapter-unlock timing benchmark. These are different fixtures and outcomes remain explicit.',captures,encounters,errors,remote},null,2));await browser.close();
}
