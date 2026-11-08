// REFERENCE: reports/cardrpg-big/a5/e3/BROWSER-METHOD.md. Real clicks, fresh save, x1, no skip.
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const width=Number(process.argv[2]||1280),height=width===1440?900:width===1024?600:720;
const artifact=process.env.A5_E3_ARTIFACT||'/tmp/cardrpg-a5-e3-artifact/index.html',out=`${process.env.A5_E3_OUT||'reports/cardrpg-big/a5/e3'}/browser-${width}`;
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const page=await browser.newPage({viewport:{width,height}}),errors=[],remote=[],timeline=[],captures=[],encounters=[];
const button=name=>page.getByRole('button',{name,exact:true});
const read=()=>page.evaluate(()=>({state:window.__depthReview.state,battle:window.__depthReview.battle,screen:window.__depthReview.screen}));
let started=Date.now(),complete=false,beforeEquipment,afterEquipment,comparison;
const record=(kind,data={})=>timeline.push({kind,atMs:Date.now()-started,...data});
async function click(locator,label){await locator.click();record('click',{label});}
async function capture(name,selector){
 await page.locator(selector).scrollIntoViewIfNeeded();
 const metrics=await page.evaluate(selector=>{
  const root=document.querySelector(selector),text=root.innerText;
  const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number),luma=c=>c.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((n,x,i)=>n+x*[.2126,.7152,.0722][i],0);
  const contrast=[...root.querySelectorAll('*')].filter(e=>e.getClientRects().length&&!e.children.length&&e.textContent.trim()&&!e.matches('button:disabled,option,progress')&&!e.closest('details:not([open])')).map(e=>{
   let p=e,bgs;const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;
   while(p){const box=p.getBoundingClientRect();if(x<box.left||x>box.right||y<box.top||y>box.bottom){p=p.parentElement;continue;}const s=getComputedStyle(p),stops=[...s.backgroundImage.matchAll(/rgba?\([^)]+\)/g)].map(m=>rgb(m[0]));
    if(stops.length&&stops.every(c=>c.length===3||c[3]===1)){bgs=stops;break;}
    const c=rgb(s.backgroundColor);if(c.length===3||c[3]===1){bgs=[c];break;}p=p.parentElement;}
   const a=luma(rgb(getComputedStyle(e).color)),ls=(bgs||[[29,27,40]]).map(luma),b=Math.max(Math.min(...ls),Math.min(Math.max(...ls),a));
   return{text:e.textContent.trim(),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
  });return{text,overflow:document.documentElement.scrollWidth-innerWidth,contrast};
 },selector);
 const path=`${out}/${name}.png`;await page.screenshot({path});captures.push({name,path,atMs:Date.now()-started,...metrics});
 assert.equal(metrics.overflow,0,name);assert(metrics.contrast.every(c=>c.ratio>=4.5),JSON.stringify(metrics.contrast.filter(c=>c.ratio<4.5)));
}
async function fight(kind){
 const before=await read(),start=Date.now();await click(button('Fight'),'Fight '+kind);
 await page.getByLabel('Playback speed',{exact:true}).selectOption('1');record('speed',{value:1});
 await page.waitForFunction(()=>window.__depthReview.screen==='result'&&!window.__depthReview.showBattle,null,{timeout:180000});
 const after=await read(),wallMs=Date.now()-start;encounters.push({kind,wallMs,setup:before.battle.initial,battle:after.battle});
 record('result',{encounter:kind,result:after.battle.result,wallMs});assert.equal(after.battle.result,'party');
}
page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
try{
 await page.goto('file://'+artifact);await page.getByRole('heading',{name:'A small light. A brave little team.'}).waitFor({timeout:120000});started=Date.now();
 assert.equal((await read()).state.tutorial,0);await capture('home','.dp-v4-home');
 assert.equal(await button('Feel lab').count(),0);await click(page.getByRole('button',{name:/^Try the practice table/}),'practice');
 await click(button('Select Soot for placement'),'select Soot');await click(button('Place Soot in Front'),'Soot front');await capture('placement-option','.dp-v4-prepare');
 await click(button('Place Soot in Back'),'Soot back');await click(button('Select Mochi for placement'),'select Mochi');
 await capture('placement-chosen','.dp-v4-prepare');await fight('practice');await capture('placement-payoff','.dp-v4-opening');
 assert.match(await page.locator('.dp-v4-opening').innerText(),/Mochi held the front/);
 await click(button('Complete lesson'),'complete lesson');await click(button('Open free welcome invitation'),'welcome invitation');record('reward',{type:'welcome invitation',state:(await read()).state});
 await page.getByRole('region',{name:'Invitation reveal',exact:true}).waitFor();await capture('invitation-reveal','.dp-invitation-stage');
 // The ordinary reveal completes by itself. The next button only appears after it has finished.
 await button('Choose your first upgrade').waitFor({state:'visible',timeout:20000});await capture('welcome-reward','.dp-v4-opening');
 await click(button('Choose your first upgrade'),'choose upgrade');await capture('upgrade-choice','.dp-v4-opening');beforeEquipment=(await read()).state;
 await click(button('Tailor for Soot'),'tailor Soot wand');comparison=await page.locator('.dp-v4-utility').innerText();await capture('equipment-compare','.dp-v4-utility');
 await click(button('Equip selected'),'equip Soot wand');afterEquipment=(await read()).state;record('equipped',{card:'soot',state:afterEquipment});
 assert.equal(beforeEquipment.account.currencies.fish-afterEquipment.account.currencies.fish,180);assert.equal(beforeEquipment.account.currencies.threads-afterEquipment.account.currencies.threads,30);
 await click(button('Start tonight’s route'),'start route');await page.locator('.dp-node:enabled').first().click();record('click',{label:'first route stop'});
 await capture('route-prepare','.dp-v4-star-target');await fight('route-first');await capture('route-result','.dp-v4-outcome');
 await click(button('Continue to rewards'),'settle first stop');record('reward',{type:'first stop',state:(await read()).state});
 await page.locator('.dp-reward').first().click();record('click',{label:'first offered boon'});
 await page.getByRole('heading',{name:'Known about the boss: 1/3'}).waitFor();await capture('scouted-boss','.dp-v4-scouting');record('scouted',{text:await page.locator('.dp-v4-scouting').innerText()});
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);complete=true;
}finally{
 const practice=encounters.find(e=>e.kind==='practice'),equipped=timeline.find(e=>e.kind==='equipped'),scouted=timeline.find(e=>e.kind==='scouted');
 const gates={practice25s:!!practice&&practice.wallMs<=25000,placementInviteEquip180s:!!equipped&&equipped.atMs<=180000,scoutedMap300s:!!scouted&&scouted.atMs<=300000};
 await writeFile(out+'/checks.json',JSON.stringify({complete,width,height,artifact,sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),method:'Fresh save, real UI clicks, x1 battles, natural invitation reveal, no skips/imports/clock acceleration. Automation does not model human reading time.',gates,timeline,captures,encounters,beforeEquipment,afterEquipment,comparison,errors,remote},null,2));
 await browser.close();console.log(JSON.stringify({complete,width,gates,encounters:encounters.map(e=>({kind:e.kind,wallMs:e.wallMs})),elapsedMs:Date.now()-started}));
}
