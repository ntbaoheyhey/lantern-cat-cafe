// REFERENCE: PROMPT-A4 G0; adapts auto-path-check/flow-measure's real-click route.
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const artifact=resolve('docs/cardrpg3/index.html'),out='reports/cardrpg-big/a4/g0/browser';
await mkdir(out,{recursive:true});
const sha256=createHash('sha256').update(await readFile(artifact)).digest('hex');
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
const rows=[];
try {
 for(const fixture of ['new-save','day7','a3-boss-comparison']){
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],captures=[],encounters=[];
  page.on('pageerror',error=>errors.push(String(error)));
  await page.goto('file://'+artifact);
  await page.getByRole('heading',{name:'A small light. A brave little team.'}).waitFor({timeout:120000});
  const nav=async name=>page.getByRole('navigation',{name:'Cafe screens'}).getByRole('button',{name,exact:true}).click();
  const capture=async name=>{
   await page.locator('.cr-content').evaluate(el=>el.scrollTo(0,0));
   await page.locator('.cr-content img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
   const facts=await page.evaluate(()=>({screen:window.__depthReview.screen,text:document.querySelector('.cr-content').innerText,
    buttons:[...document.querySelectorAll('.cr-content button')].map(b=>({text:b.textContent,disabled:b.disabled})),overflow:document.documentElement.scrollWidth-innerWidth}));
   await page.screenshot({path:`${out}/${fixture}-${name}.png`});captures.push({name,...facts});
   assert.equal(facts.overflow,0);
  };
  if(fixture==='day7'){
   await nav('Save & settings');
   await page.getByLabel('Save code',{exact:true}).fill(await readFile('reports/cardrpg-big/a4/g0/day7.save.txt','utf8'));
   await page.getByRole('button',{name:'Import save code',exact:true}).click();
   assert.equal(await page.evaluate(()=>window.__depthReview.state.account.day),7);
  } else if(fixture==='a3-boss-comparison'){
   await nav('Save & settings');
   await page.getByRole('button',{name:'Unlock all cats and build materials',exact:true}).click();
   await nav('Cafe');
  } else {
   await page.getByRole('button',{name:/Try the practice table/}).click();
   await page.getByRole('button',{name:'Fight',exact:true}).click();
   await page.getByRole('button',{name:'Skip to result',exact:true}).click();
   await page.getByRole('button',{name:'Complete lesson',exact:true}).click();
   await page.getByRole('button',{name:'Open free welcome invitation',exact:true}).click();
   await nav('Cafe');
  }
  if(fixture!=='a3-boss-comparison'){
   for(const name of ['Cafe','Team & cards','Companions','Equipment','Invitations','Field guide']){
    await nav(name);await capture(name.toLowerCase().replaceAll(/[^a-z]+/g,'-'));
   }
   await nav('Cafe');
  }
  const before=await page.evaluate(()=>structuredClone(window.__depthReview.state));
  await page.getByRole('button',{name:/Tangled Cafe/}).click();
  for(let step=0;step<7;step++){
   const node=await page.evaluate(()=>{
    const run=window.__depthReview.state.run;
    return run.nodes.find(n=>n.id===`${run.visited.length}-0`);
   });
   if(!node||await page.locator('.dp-node:enabled').count()===0)break;
   await page.locator('.dp-node:enabled').filter({has:page.locator('b',{hasText:new RegExp(`^${node.kind}$`)})}).first().click();
   if(['battle','elite','boss'].includes(node.kind)){
    await capture(`prepare-${step}`);
    await page.evaluate(()=>{window.__a4Timing={start:performance.now(),bossDeath:null};
     const tick=()=>{const m=window.__depthReview,t=window.__a4Timing;
      const boss=m.battle?.actors.find(a=>['yarn-giant','rain-spool','pantry-crown'].includes(a.catalogId));
      if(boss?.hp===0&&t.bossDeath===null)t.bossDeath=performance.now()-t.start;
      if(m.screen!=='result')requestAnimationFrame(tick);
     };requestAnimationFrame(tick);});
    await page.getByRole('button',{name:'Fight',exact:true}).click();
    await page.getByLabel('Playback speed',{exact:true}).selectOption('1');
    const timed=node.kind==='boss'||(step===0&&fixture!=='a3-boss-comparison');
    if(!timed)await page.getByRole('button',{name:'Skip to result',exact:true}).click();
    await page.waitForFunction(()=>window.__depthReview.screen==='result'&&!window.__depthReview.showBattle,null,{timeout:300000});
    encounters.push(await page.evaluate(({kind,timed})=>{const b=window.__depthReview.battle;
     return {kind,timed,wallMs:performance.now()-window.__a4Timing.start,bossDeathMs:window.__a4Timing.bossDeath,
      result:b.result,choices:b.choices.length,round:b.round,enemies:b.initial.enemies,initial:b.initial};},{kind:node.kind,timed}));
    await capture(`result-${step}`);
    const won=await page.evaluate(()=>window.__depthReview.battle.result==='party');
    await page.getByRole('button',{name:'Continue to rewards',exact:true}).click();
    if(!won)break;
    if(await page.locator('.dp-reward').count())await page.locator('.dp-reward').first().click();
   }else if(node.kind==='event')await page.locator('.cr-panel .dp-three button:enabled').first().click();
   else if(node.kind==='treasure')await page.getByRole('button',{name:'Take 70 run points',exact:true}).click();
   else if(node.kind==='shop')await page.getByRole('button',{name:'Save your points and leave',exact:true}).click();
   else if(node.kind==='campfire')await page.getByRole('button',{name:'Heal the team · 35% HP',exact:true}).click();
  }
  rows.push({fixture,errors,captures,encounters,before,after:await page.evaluate(()=>structuredClone(window.__depthReview.state))});
  await writeFile(`${out}/audit.json`,JSON.stringify({artifact,sha256,method:'Real clicks. New-save progression and deterministic seven-day reducer fixture. A3 comparison uses the identical visible level10/3star unlock. x1 timing includes Fight loading; screenshots occur outside timing.',rows},null,2));
  assert.deepEqual(errors,[]);console.log(JSON.stringify({fixture,encounters:encounters.map(({initial,...e})=>e),captures:captures.length}));
  await page.close();
 }
} finally {await browser.close();}
