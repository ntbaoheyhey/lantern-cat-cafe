/** Actual browser regression: support recipients, complete totals and a single clock. */
import {writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {chromium,openFixture,config} from './browser-fixture.mjs';
import {root,evidenceMeta} from './check-gates.mjs';
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const out=resolve(root,'reports/v3-battle/a2/V2');await mkdir(out,{recursive:true});
try{
 const {page,errors}=await openFixture(browser,config.fixtures[0]);
 await page.evaluate(()=>{
  const s=window.__depthScene,render=s.numbers.render.bind(s.numbers);
  window.__numberCheck={fixed:0,native:0,expected:0,shown:{},continuous:[],clipped:[]};
  s.numbers.render=function(...args){args[6]===undefined?window.__numberCheck.native++:window.__numberCheck.fixed++;return render(...args);};
 });
 for(let i=0;i<590;i++){
  await page.evaluate(i=>{
   const m=window.__depthReview,s=window.__depthScene,c=window.__numberCheck;
   m.paused=false;if(!m.plan&&!m.battle.result)m.step();m.tick(i?1000/30:0,1000+i*1000/30);m.paused=true;
   s.render({...s.view(),fixedTime:10+i/30,paused:true},1/30);
   for(const n of s.numbers.drawn)if(n.x<0||n.y<0||n.x+n.width>s.width||n.y+n.height>s.height)c.clipped.push({frame:i,...n});
   if(m.plan?.skillId==='mochi-4'){
    c.expected=m.plan.events.filter(e=>e.type==='damage').reduce((n,e)=>n+e.amount,0);
    for(const n of s.numbers.drawn)if(n.kind==='damage')c.shown[n.key]=Number(n.text.replace(/[^0-9]/g,''));
    if(m.animationAt>=3200)c.continuous.push(s.numbers.drawn.some(n=>n.id==='mochi'&&n.kind==='shield'));
   }
  },i);
  await page.clock.runFor(Math.round((i+1)*1000/30)-Math.round(i*1000/30));
 }
 const data=await page.evaluate(()=>window.__numberCheck);
 await writeFile(resolve(out,'number-regression.json'),JSON.stringify({_meta:evidenceMeta(),...data,errors},null,2)+'\n');
 assert.equal(data.native,0,'native render clock must stay stopped');assert.equal(data.fixed,590);
 assert.ok(data.expected>0);assert.equal(Object.values(data.shown).reduce((a,b)=>a+b,0),data.expected);
 assert.ok(data.continuous.every(Boolean),'shield number survives every post-impact frame');assert.deepEqual(errors,[]);
 assert.deepEqual(data.clipped,[],'rising numbers stay inside the battle viewport');
 console.log(`PASS: Mochi secondary damage ${data.expected}, ${Object.keys(data.shown).length} pieces; ${data.fixed} fixed renders, ${data.native} native renders; shield persistence ${data.continuous.length} frames`);
}finally{await browser.close();}
