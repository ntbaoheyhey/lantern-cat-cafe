import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {root,evidenceMeta} from './check-gates.mjs';
import {chromium,openFixture,config} from './browser-fixture.mjs';
const out=resolve(root,'reports/v3-battle/a2/P6');await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const rows=[],shots=[];
try{
 for(let group=0;group<3;group++){
  const {page,errors}=await openFixture(browser,config.fixtures[0]);
  const ids=await page.evaluate(group=>{
   const m=window.__depthReview,R=window.__v3a2.R;
   if(group){m.offline=true;m.shortcut('unlock');const ids=R.CATS.slice(group*4,group*4+4).map(c=>c.id);m.state.team=ids;m.state.rows=Object.fromEntries(ids.map((id,i)=>[id,i<2?'front':'rear']));m.tutorialBattle=R.createBattle({...window.__v3a2.initial.initial,cats:R.battleCats(m.state)});m.tutorialBattle.v4.committed=true;}
   R.playBattle(m.battle,'auto');m.plan=null;m.roundPlan=null;m.finishMoment();
   return m.battle.actors.filter(a=>a.side==='party').map(a=>a.catalogId);
  },group);
  for(let i=0;i<400;i++){await page.clock.runFor(34);if(await page.locator('.b3-victory-crew[data-ready=true]').count())break;await new Promise(r=>setTimeout(r,15));}
  await page.locator('.b3-victory-crew[data-ready=true]').waitFor();await page.clock.runFor(260);
  const state=await page.evaluate(()=>JSON.stringify(window.__depthReview.battle));
  const before=await page.locator('.b3-victory-crew canvas').screenshot();
  await page.screenshot({path:resolve(out,`cats-${group}.png`)});shots.push(await sharp(await page.screenshot()).resize(640,360).png().toBuffer());
  await page.clock.runFor(750);const after=await page.locator('.b3-victory-crew canvas').screenshot();assert.ok(!before.equals(after));
  await page.evaluate(()=>{const m=window.__depthReview;m.state.settings.reducedMotion=true;m.notify(false);});
  for(let i=0;i<60;i++){await page.clock.runFor(34);if(await page.locator('.b3-victory-crew[data-ready=true]').count())break;await new Promise(r=>setTimeout(r,15));}
  await page.clock.runFor(300);const still1=await page.locator('.b3-victory-crew canvas').screenshot();await page.clock.runFor(800);const still2=await page.locator('.b3-victory-crew canvas').screenshot();assert.ok(still1.equals(still2));assert.equal(await page.locator('.b3-confetti').count(),0);
  assert.equal(await page.evaluate(()=>JSON.stringify(window.__depthReview.battle)),state);assert.deepEqual(errors,[]);
  rows.push({ids,animated:!before.equals(after),reducedStill:still1.equals(still2),combatUnchanged:true,errors});
  if(group===0){await page.setViewportSize({width:390,height:844});await page.clock.runFor(500);await page.screenshot({path:resolve(out,'phone.png')});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
  if(group===0){
   await page.evaluate(()=>{const m=window.__depthReview;m.tutorialBattle=null;m.state.run=null;m.start(1,'campaign',1);m.enter(m.state.run.nodes[0].id);m.fight();window.__v3a2.R.playBattle(m.battle,'auto');m.plan=null;m.roundPlan=null;m.finishMoment();if(m.state.v4?.journey)m.state.v4.journey.pending=[];m.notify(false);});
   for(let i=0;i<60;i++){await page.clock.runFor(34);if(await page.locator('.b3-victory-crew[data-ready=true]').count())break;await new Promise(r=>setTimeout(r,15));}
   await page.clock.runFor(500);assert.equal(await page.locator('.a6-result-goals li').count(),3);assert.ok(await page.locator('[data-reward-id]').count()>0);
   const geometry=await page.evaluate(()=>{const a=document.querySelector('.a6-result-companion').getBoundingClientRect(),r=document.querySelector('.a6-result-receipt').getBoundingClientRect(),h=document.querySelector('.a6-result-heading h2');return {separate:r.top>=a.bottom,heading:getComputedStyle(h).color,columns:getComputedStyle(document.querySelector('.c2-result')).gridTemplateColumns};});assert.ok(geometry.separate);assert.equal(geometry.heading,'rgb(255, 226, 162)');rows[0].phone=geometry;
   await page.screenshot({path:resolve(out,'phone-rewards.png')});await page.setViewportSize({width:1440,height:900});await page.clock.runFor(500);await page.screenshot({path:resolve(out,'desktop-large.png')});
  }
  await page.close();
 }
 await sharp({create:{width:1280,height:720,channels:3,background:'#201829'}}).composite([{input:await sharp(resolve(out,'before.png')).resize(640,360).png().toBuffer(),left:0,top:0},...shots.map((input,i)=>({input,left:(i+1)%2*640,top:Math.floor((i+1)/2)*360}))]).png().toFile(resolve(out,'compare-victory.png'));
 assert.equal(new Set(rows.flatMap(r=>r.ids)).size,12);
 await writeFile(resolve(out,'metrics.json'),JSON.stringify({_meta:evidenceMeta(),cats:12,rows},null,2)+'\n');console.log('PASS: all12 cat celebrations; animation and reduced-motion stillness; unchanged battle; phone width');
}finally{await browser.close();}
