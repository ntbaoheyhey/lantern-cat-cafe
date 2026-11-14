import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {openAudioScreen} from '../audio/ui-fixtures.mjs';
const require=createRequire(new URL('../../apps/web/package.json',import.meta.url)),{chromium}=require('@playwright/test');
const topicFixtures={team:'team-formation',inventory:'bag-items',forge:'forge-enhance',gacha:'invitations',season:'season-track',battle:'cafe-hub',wallet:'wallet-panel',cafe:'wallet-cafe'};
const topics=(process.env.TOPICS||'team,inventory,forge,gacha,season,battle').split(','),width=Number(process.env.WIDTH||1280),height=width===1440?900:width<600?844:720,label=process.env.LABEL||'trial1';
const out=`reports/v3-shell/b2/q8/${label}-${width}`,steps=[],fallbacks=[],errors=[];mkdirSync(out,{recursive:true});
const signed=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const topic of topics){
  const p=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});p.on('pageerror',e=>errors.push({topic,error:e.message}));
  // Geometry captures do not exercise the public RPC. C1 has its own real-read
  // browser probe; isolated tour pages must not exhaust the shared public limit.
  await p.route('https://api.avax-test.network/**',route=>route.abort());
  try{
   await openAudioScreen(p,topicFixtures[topic],process.env.CAPTURE_URL||'http://127.0.0.1:5996');
   await p.evaluate(async topic=>{
    window.__coachFallbacks=[];window.addEventListener('coach:fallback',e=>window.__coachFallbacks.push(e.detail));
    const {LESSONS}=await import('/src/game/cardrpg/shell/lessons.ts');localStorage.setItem('lantern.coach.v3',JSON.stringify(Object.fromEntries(Object.keys(LESSONS).map(key=>[key,key!==topic]))));
    window.dispatchEvent(new Event('coach:changed'));
    if(topic==='battle'){window.__depthReview.watchNow();window.__depthReview.notify(false);}
    if(topic==='forge')window.dispatchEvent(new Event('coach:forge'));
    if(topic==='wallet')window.dispatchEvent(new Event('chain:wallet'));
    if(topic==='cafe')window.dispatchEvent(new Event('coach:cafe'));
    if(topic==='season')window.dispatchEvent(new CustomEvent('shell:page',{detail:'season'}));
   },topic);
   await p.locator(`.b-coach[data-topic="${topic}"]`).waitFor();
   for(let i=0;i<10;i++){
    const coach=p.locator(`.b-coach[data-topic="${topic}"]`);if(!await coach.count())break;
    await p.waitForFunction(()=>document.querySelector('.b-coach')?.getAttribute('data-ready')==='true');
    await p.evaluate(()=>document.fonts.ready);
    // Import lesson metadata first, then sample all boxes atomically in a
    // rendering frame. A separate async import between readiness and sampling
    // can otherwise observe layout after a balance update but before paint.
    const row=await p.evaluate(async()=>{
     const {LESSONS}=await import('/src/game/cardrpg/shell/lessons.ts');
     return new Promise((resolve,reject)=>{
      const started=performance.now();let stable;
      const sample=()=>{
       const coach=document.querySelector('.b-coach'),topic=coach.dataset.topic,index=Number(coach.dataset.step),lesson=LESSONS[topic][index];
       const box=e=>{if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
       const target=[...document.querySelectorAll(lesson.target)].find(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0;});
       const row={topic,index,text:lesson.text,owned:true,fallback:coach.dataset.fallback==='true',target:box(target),spotlight:box(coach.querySelector('.b-coach-focus')),bubble:box(coach.querySelector('.b-coach-card')),skip:box(coach.querySelector('button')),selector:lesson.target};
       const t=row.target,s=row.spotlight,key=JSON.stringify([t,s,row.bubble]);
       const aligned=t&&s&&Math.abs(t.x-s.x-8)<.01&&Math.abs(t.y-s.y-8)<.01&&Math.abs(s.width-t.width-16)<.01&&Math.abs(s.height-t.height-16)<.01;
       if(!aligned||stable?.key!==key)stable={key,at:performance.now()};
       if(aligned&&performance.now()-stable.at>=200)return resolve(row);
       if(performance.now()-started>10000)return reject(new Error('Coach geometry did not settle: '+JSON.stringify(row)));
       requestAnimationFrame(sample);
      };requestAnimationFrame(sample);
     });
    });
    const path=`${out}/${topic}-${i}.png`;await p.screenshot({path});row.screenshot=signed(path);steps.push(row);
    writeFileSync(`${out}/walkthrough.json`,JSON.stringify({viewport:{width,height},steps,errors,fallbacks},null,2)+'\n');
    assert(!row.fallback,`${topic}/${i}: missing ${row.selector}`);const t=row.target,s=row.spotlight,b=row.bubble;
    assert(t&&s&&b);assert(t.x-s.x>=7.99&&t.y-s.y>=7.99&&s.x+s.width-t.x-t.width>=7.99&&s.y+s.height-t.y-t.height>=7.99,`${topic}/${i}: padding`);
    assert(b.x+b.width<=t.x||b.x>=t.x+t.width||b.y+b.height<=t.y||b.y>=t.y+t.height,`${topic}/${i}: bubble overlaps target`);
    assert(row.skip.x>=0&&row.skip.y>=0&&row.skip.x+row.skip.width<=width&&row.skip.y+row.skip.height<=height,`${topic}/${i}: Skip clipped`);
    const button=p.getByRole('dialog',{name:'Tutorial',exact:true}).getByRole('button',{name:/^(Next|Got it)$/});await button.click();
   }
   fallbacks.push(...await p.evaluate(()=>window.__coachFallbacks));console.log(topic,'PASS',steps.filter(s=>s.topic===topic).length);
  }catch(e){await p.screenshot({path:`${out}/${topic}-failure.png`});console.log(topic,e.message);throw e;}finally{await p.close();}
 }
 assert.equal(errors.length,0,JSON.stringify(errors));assert.equal(fallbacks.length,0);
 writeFileSync(`${out}/walkthrough.json`,JSON.stringify({viewport:{width,height},steps,errors,fallbacks,passed:steps.length},null,2)+'\n');console.log(`PASS ${steps.length} steps at ${width}x${height}`);
}finally{await browser.close();}
