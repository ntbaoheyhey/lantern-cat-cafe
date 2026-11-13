import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {root,evidenceMeta} from './check-gates.mjs';
import {chromium,openFixture,config} from './browser-fixture.mjs';
const out=resolve(root,'reports/v3-battle/a2/P5');await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors}=await openFixture(browser,config.fixtures[2]),shots=[],rows=[];
 const found=await page.evaluate(()=>{const m=window.__depthReview;for(let i=0;i<80;i++){m.paused=false;m.step();m.paused=true;const p=m.plan,boss=m.battle.actors.find(a=>a.catalogId==='yarn-giant');if(p&&m.battle.actors.find(a=>a.id===p.actorId)?.side==='party'&&p.events.some(e=>e.type==='damage'&&e.targetIds.includes(boss.id)))return true;if(m.plan)m.finishMoment();if(m.plan)m.finishMoment();}return false;});assert.ok(found);
 for(const [mode,skill] of [['flinch',null],['cheer','mochi-4']]){
  if(skill){await page.evaluate(id=>{window.__depthReview.inspect(id,0);window.__depthScene.prepare();},skill);for(let i=0;i<300;i++){if(await page.evaluate(()=>{const m=window.__depthReview,s=window.__depthScene;s.prepare();return s.ready&&m.battle.actors.every(a=>s.actors.get(a.id)?.asset===a.catalogId)&&s.actors.size===m.battle.actors.length;}))break;await page.clock.runFor(34);await new Promise(r=>setTimeout(r,15));}}
  const contact=await page.evaluate(()=>window.__depthReview.plan.beats[2].start);
  for(const offset of [-1,180]){
   const row=await page.evaluate(({at,mode})=>{const m=window.__depthReview,s=window.__depthScene,before=JSON.stringify(m.battle);m.animationAt=at;s.render({...s.view(),fixedTime:10+at/1000,paused:true},0);return {mode,at,motion:structuredClone(s.motionAudit),unchanged:before===JSON.stringify(m.battle)};},{at:contact+offset,mode});
   shots.push(await sharp(await page.screenshot()).resize(640,360).png().toBuffer());rows.push(row);
  }
 }
 assert.ok(rows[1].motion.filter(r=>r.crowd==='flinch').length>=2);assert.ok(rows[3].motion.filter(r=>r.crowd==='cheer').length>=3);assert.ok(rows.every(r=>r.unchanged));
 const reduced=await page.evaluate(()=>{const s=window.__depthScene;s.render({...s.view(),fixedTime:20,paused:true,reducedMotion:true},0);return s.motionAudit.every(r=>r.crowd==='idle');});assert.ok(reduced);assert.deepEqual(errors,[]);
 await sharp({create:{width:1280,height:748,channels:3,background:'#171620'}}).composite([{input:Buffer.from('<svg width="1280" height="28"><text x="12" y="20" fill="white" font-size="17">Before contact / spectator response — enemy boss-hit flinch / allies cheering an ultimate</text></svg>'),left:0,top:0},...shots.map((input,i)=>({input,left:i%2*640,top:28+Math.floor(i/2)*360}))]).png().toFile(resolve(out,'compare-crowd.png'));
 await writeFile(resolve(out,'metrics.json'),JSON.stringify({_meta:evidenceMeta(),rows,reducedMotionStill:reduced,errors},null,2)+'\n');
 console.log('PASS: 2 enemy flinches, 3 ally cheers, reduced-motion stillness, unchanged combat snapshots');
}finally{await browser.close();}
