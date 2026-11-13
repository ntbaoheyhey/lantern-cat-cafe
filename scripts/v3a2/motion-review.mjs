import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import sharp from 'sharp';
import {root,evidenceMeta} from './check-gates.mjs';
import {chromium,config,openFixture} from './browser-fixture.mjs';
const out=resolve(root,'reports/v3-battle/a2/M1');await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const performance={},strips=[],errors=[];
try{
 for(const fixture of config.fixtures){
  const {page,errors:pageErrors}=await openFixture(browser,fixture,{fixedClock:false});
  performance[fixture.id]=await page.evaluate(async()=>{
   const m=window.__depthReview,s=window.__depthScene,start=performance.now(),intervals=[];let count=0,previous=start;
   cancelAnimationFrame(s.raf);
   await new Promise(resolve=>{const tick=now=>{const delta=now-previous;previous=now;
    m.paused=false;if(!m.plan&&!m.battle.result)m.step();m.tick(delta,now);m.paused=true;
    s.render({...s.view(),fixedTime:10+(now-start)/1000,quality:'high',paused:true},delta/1000);intervals.push(delta);count++;
    if(now-start<12000)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);});
   const seconds=(performance.now()-start)/1000;return {frames:count,seconds,fps:count/seconds,longFrames:intervals.filter(d=>d>25).length,units:s.actors.size};
  });
  errors.push(...pageErrors);console.log(`${fixture.id} High: ${performance[fixture.id].fps.toFixed(2)} fps / ${performance[fixture.id].units} units`);
  await page.close();
 }
 const {page,errors:stripErrors}=await openFixture(browser,config.fixtures[0]);
 for(const [id,motion] of [['mochi-1','dash-slash'],['panko-2','leap-slam'],['brioche-2','spin'],['cinnamon-2','throw'],['soot-2','staff-cast'],['clover-2','summon']]){
  await page.evaluate(id=>{window.__depthReview.inspect(id,0);window.__depthScene.prepare();},id);
  for(let retry=0;retry<300;retry++){
   if(await page.evaluate(()=>window.__depthScene.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length))break;
   await page.clock.runFor(34);await new Promise(resolve=>setTimeout(resolve,20));
   if(retry===299)throw Error('Rig preparation timed out: '+id);
  }
  const timing=await page.evaluate(()=>{const p=window.__depthReview.plan;return {impact:p.beats[2].start,duration:p.duration};});
  const times=[0,100,Math.max(120,timing.impact-200),timing.impact-150,timing.impact-100,timing.impact-50,timing.impact,timing.impact+66,timing.impact+133,timing.impact+200,timing.impact+300,timing.duration-1];
  const shots=[];
  for(const t of times){
   await page.evaluate(t=>{const m=window.__depthReview,s=window.__depthScene;m.animationAt=t;s.render({...s.view(),fixedTime:10+t/1000,paused:true},1/30);},t);
   await page.clock.runFor(1);
   const png=await page.screenshot();shots.push(await sharp(png).resize(320,180).png().toBuffer());
  }
  await sharp({create:{width:1280,height:568,channels:3,background:'#171620'}}).composite([
   ...shots.map((input,i)=>({input,left:i%4*320,top:28+Math.floor(i/4)*180})),
   {input:Buffer.from(`<svg width="1280" height="28"><text x="12" y="20" fill="white" font-size="15">${motion} — ${id} — anticipation / travel / strike / return — 12 sampled frames</text></svg>`),left:0,top:0}
  ]).png().toFile(resolve(out,`motion-${motion}.png`));strips.push({id,motion,times});
  console.log(`${motion}: 12 rendered frames`);
 }
 errors.push(...stripErrors);await page.close();
}finally{await browser.close();}
await writeFile(resolve(out,'browser-review.json'),JSON.stringify({_meta:evidenceMeta(),performance,strips,errors},null,2)+'\n');
if(errors.length)throw Error(errors.join('\n'));
