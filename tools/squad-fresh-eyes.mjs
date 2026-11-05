// Separate browser sessions for three play perspectives; frame review uses squad-effects.mjs.
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { root, chromium, openSquad } from './squad-support.mjs';
const perspective=process.argv[2];
if(!['newcomer','skeptic','active'].includes(perspective))throw Error('Choose newcomer, skeptic or active');
const out=resolve(root,'reports/squad/fresh-eyes');mkdirSync(out,{recursive:true});
const browser=await chromium.launch(),started=Date.now(),checkpoints=[];
try{
 const {page,errors,writes}=await openSquad(browser);
 const record=async name=>{
  const data=await page.evaluate(()=>{
   const b=window.__squadReview.controller.battle;
   return {time:b.time,wave:b.wave,phase:b.phase,actors:b.actors.map(a=>({id:a.id,hp:a.hp,shield:a.shield,statuses:a.statuses.map(s=>s.kind)})),result:b.result,commands:b.commands};
  });
  const filename=`${perspective}-${name}.png`;
  await page.locator('canvas').screenshot({path:resolve(out,filename)});
  checkpoints.push({name,wallSeconds:(Date.now()-started)/1000,file:filename,...data});
  writeFileSync(resolve(out,`${perspective}.json`),JSON.stringify({perspective,started:new Date(started).toISOString(),checkpoints,errors,writes},null,2)+'\n');
  console.log(`${perspective}: ${name}, sim ${data.time}ms`);
 };
 if(perspective==='newcomer'){
  await page.getByRole('button',{name:'Start encounter',exact:true}).click();
  await page.waitForTimeout(4600);await record('opening');
  await page.waitForFunction(()=>window.__squadReview.controller.battle.wave===1,{},{timeout:40000});await page.waitForTimeout(1500);await record('wave-two');
  await page.waitForFunction(()=>window.__squadReview.controller.battle.result,{},{timeout:120000});await record('result');
 }else if(perspective==='skeptic'){
  await page.getByRole('button',{name:'Yarn Giant',exact:true}).click();
  await page.getByRole('button',{name:'Start encounter',exact:true}).click();
  await page.waitForTimeout(12500);await record('first-thread');
  await page.waitForTimeout(37000);await record('phase-pressure');
  await page.waitForFunction(()=>window.__squadReview.controller.battle.result,{},{timeout:100000});await record('boss-result');
  await page.getByRole('button',{name:'Training',exact:true}).click();
  await page.getByRole('combobox',{name:/Squad/}).selectOption('lanternbreakers');
  await page.getByRole('button',{name:'Start encounter',exact:true}).click();
  await page.waitForTimeout(Math.max(0,180000-(Date.now()-started)));await record('three-minutes');
 }else{
  await page.getByRole('button',{name:'Yarn Giant',exact:true}).click();
  for(const box of await page.locator('.sq-auto input').all())await box.uncheck();
  await page.getByRole('button',{name:'Start encounter',exact:true}).click();
  let recorded=false;
  for(let elapsed=0;elapsed<150000;elapsed=Date.now()-started){
   const state=await page.evaluate(()=>{const b=window.__squadReview.controller.battle;return {done:!!b.result,thread:b.actors.find(a=>a.role==='thread'&&a.hp>0)?.id,exposed:b.actors.some(a=>a.role==='yarn'&&a.statuses.some(s=>s.kind==='exposed')),priority:b.priority,boss:b.actors.find(a=>a.role==='yarn'&&a.hp>0)?.id,time:b.time};});
   if(state.done)break;
   if(state.thread&&state.priority!==state.thread){const target=page.locator('.sq-targets button').filter({hasText:'Binding Thread'}).first();await target.focus();await page.keyboard.press('Enter');}
   if(!state.thread&&state.priority!==state.boss){const boss=page.locator('.sq-targets button').filter({hasText:'Yarn Giant'});if(await boss.count())await boss.click();}
   // Manual barriers when charged; storm is held for the explicitly exposed knot.
   for(const [i,button] of (await page.locator('.sq-ultimate').all()).entries())if(await button.isEnabled()&&(i!==1||state.exposed)){
    await page.locator('.sq-arena-caption').click();await page.keyboard.press(String(i+1));
    if(!recorded){await page.waitForTimeout(700);await record('manual-ultimate');recorded=true;}
   }
   await page.waitForTimeout(250);
  }
  await record('result');
  const commands=checkpoints.at(-1).commands;
  assert(commands.some(c=>c.type==='priority'));for(const hero of ['guardian','witch','alchemist'])assert(commands.some(c=>c.type==='ultimate'&&c.hero===hero));
 }
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
}finally{await browser.close();}
