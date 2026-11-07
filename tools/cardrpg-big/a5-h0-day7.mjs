// REFERENCE: PROMPT-A5 H0; same earned P6 save and A4 first-node route, all fights at x1.
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const out='reports/cardrpg-big/a5/h0/day7',artifact=resolve('docs/cardrpg3/index.html');await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']}),page=await browser.newPage({viewport:{width:1280,height:720}});
const read=()=>page.evaluate(()=>({state:window.__depthReview.state,battle:window.__depthReview.battle,screen:window.__depthReview.screen}));
const nav=async name=>page.getByRole('navigation',{name:'Cafe screens'}).getByRole('button',{name,exact:true}).click();
const errors=[],encounters=[],captures=[],choices=[];let complete=false,start;
page.on('pageerror',e=>errors.push(String(e)));
const capture=async label=>{const path=`${out}/${label}.png`;await page.screenshot({path});captures.push({label,path,screen:(await read()).screen});};
try{
 await page.goto('file://'+artifact);await page.getByRole('heading',{name:'A small light. A brave little team.'}).waitFor({timeout:120000});
 const save=await readFile('reports/cardrpg-big/a4/p6/economy/day7.save','utf8');assert.equal(createHash('sha256').update(save).digest('hex'),'62b7006757b7c325ea0bc6e7d0ad20fe358caafc4568b539525d42e0b3e0efac');
 await nav('Save & settings');await page.getByLabel('Save code',{exact:true}).fill(save);await page.getByRole('button',{name:'Import save code',exact:true}).click();start=(await read()).state;assert.equal(start.account.day,7);
 await nav('Cafe');await capture('earned-day7-cafe');await page.getByRole('button',{name:/Tangled Cafe/}).click();
 for(let step=0;step<24;step++){
  const m=await read();if(m.state.run?.complete)break;
  const node=await page.evaluate(()=>{const run=window.__depthReview.state.run,last=run.nodes.find(n=>n.id===run.visited.at(-1));return run.nodes.find(n=>last?last.next.includes(n.id):n.depth===0);});assert(node);
  await page.locator('.dp-node:enabled').filter({has:page.locator('b',{hasText:new RegExp(`^${node.kind}$`)})}).first().click();
  if(['battle','elite','boss'].includes(node.kind)){
   await capture(`prepare-${step}-${node.kind}`);const setup=(await read()).battle.initial;const began=Date.now();await page.getByRole('button',{name:'Fight',exact:true}).click();await page.getByLabel('Playback speed',{exact:true}).selectOption('1');
   await page.waitForFunction(()=>window.__depthReview.screen==='result'&&!window.__depthReview.showBattle,null,{timeout:300000});
   const wallMs=Date.now()-began,battle=(await read()).battle;encounters.push({node:node.id,kind:node.kind,wallMs,setup,battle});await capture(`result-${step}-${node.kind}`);
   await page.getByRole('button',{name:'Continue to rewards',exact:true}).click();if(battle.result!=='party')break;
   if(await page.locator('.dp-reward').count()){choices.push({kind:'reward',text:await page.locator('.dp-reward').first().innerText()});await page.locator('.dp-reward').first().click();}
  }else if(node.kind==='event')await page.locator('.cr-panel .dp-three button:enabled').first().click();
  else if(node.kind==='treasure')await page.getByRole('button',{name:'Take 70 run points',exact:true}).click();
  else if(node.kind==='shop')await page.getByRole('button',{name:'Save your points and leave',exact:true}).click();
  else if(node.kind==='campfire')await page.getByRole('button',{name:'Heal the team · 35% HP',exact:true}).click();
 }
 assert.deepEqual(encounters.map(x=>({kind:x.kind,result:x.battle.result,actions:x.battle.choices.length})),[{kind:'battle',result:'party',actions:11},{kind:'battle',result:'party',actions:9},{kind:'boss',result:'enemy',actions:25}]);assert.deepEqual(errors,[]);complete=true;
}finally{
 const boss=encounters.find(e=>e.kind==='boss'),b=boss?.battle;
 const diagnosis=b?{firstDeath:b.firstDeath,actors:b.actors.map(a=>({id:a.id,name:a.name,side:a.side,row:a.row,hp:a.hp,maxHp:a.maxHp,shield:a.shield,equipment:a.equipment,setEffects:a.setEffects})),plan:b.v4?.plan,crews:b.v4?.events.filter(e=>e.kind==='crew-active'),eventCounts:Object.fromEntries([...new Set(b.log.map(e=>e.kind))].map(kind=>[kind,b.log.filter(e=>e.kind===kind).length])),damageToPartyByRow:Object.fromEntries(['front','rear'].map(row=>[row,b.log.filter(e=>e.kind==='damage'&&b.actors.some(a=>a.id===e.targetId&&a.side==='party'&&a.row===row)).reduce((n,e)=>n+e.amount,0)])),method:'Rows are final rows; inspect ordered swap/damage events before attributing all damage to starting formation.'}:null;
 await writeFile(`${out}/checks.json`,JSON.stringify({complete,method:'Exact public-command-earned A4 day7 save imported through UI; same route/reward policy; all encounters real x1/no skip. A reproduction, not seven elapsed days or new acceptance sampling.',artifactSha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),start,encounters,choices,captures,diagnosis,errors},null,2));await browser.close();
}
