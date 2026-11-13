import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {root,evidenceMeta} from './check-gates.mjs';

const out=resolve(root,'reports/v3-battle/a2/P1');await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']}),rows=[];
try{
 for(const fixture of config.fixtures)for(const speed of [1,2,3]){
  const {page,errors}=await openFixture(browser,fixture);
  await page.evaluate(async({root,speed})=>{
   const m=window.__depthReview,s=window.__depthScene;
   m.state.settings.speed=speed;s.audio.setCapture(true);
   window.__thAudio={play(){},stop(){},setBus(){},music(){},unlock:async()=>{},mute(){},pause(){},speed(){},muted:false,ready:true};
   const audio=await import('/@fs'+root+'/apps/web/src/game/cardrpg/battle-v3/audio-timeline.ts');
   window.__voiceReview={takes:audio.VOICE_TIMING,plans:[],last:null};
  },{root,speed});
  let i=0,outstanding=false;
  for(;i<900||outstanding&&i<1200;i+=10){
   outstanding=await page.evaluate(i=>{
    const m=window.__depthReview,s=window.__depthScene,c=window.__voiceReview;
    for(let j=i;j<i+10;j++){
     m.paused=false;if(!m.plan&&!m.battle.result&&j<900)m.step();
     if(m.plan&&c.last!==m.plan){c.last=m.plan;c.plans.push({id:m.plan.id,skill:m.plan.presentationId??m.plan.skillId,voiceWindows:m.plan.voiceWindows??[],duration:m.plan.duration,contact:m.plan.beats[2].start});}
     m.tick(j?1000/30:0,1000+j*1000/30);m.paused=true;
     s.render({...s.view(),fixedTime:10+j/30,paused:true},1/30);
    }
    return !!m.plan;
   },i);
   await page.clock.runFor(333);
  }
  const sample=await page.evaluate(()=>{
   const c=window.__voiceReview,m=window.__depthReview,R=window.__v3a2.R;
   const expected=structuredClone(window.__v3a2.initial),actual=structuredClone(m.battle);R.playBattle(expected,'auto');R.playBattle(actual,'auto');
   return {takes:c.takes,plans:c.plans,events:window.__depthScene.audio.events,parity:JSON.stringify(expected)===JSON.stringify(actual)};
  });
  const voices=sample.events.filter(event=>event.voicePhase),cuts=[];
  let minClearanceMs=Infinity;
  for(let j=0;j<voices.length-1;j++){
   const voice=voices[j],duration=sample.takes.find(take=>take.cueId===voice.cue).durationMs;
   const clearanceMs=(voices[j+1].at-voice.at)*1000-duration;
   minClearanceMs=Math.min(minClearanceMs,clearanceMs);
   if(clearanceMs<0)cuts.push({cue:voice.cue,next:voices[j+1].cue,clearanceMs});
  }
  const required=sample.plans.flatMap(plan=>plan.voiceWindows.map(window=>({plan,...window})));
  const missing=required.filter(window=>!voices.some(event=>event.planId===window.plan.id&&event.skillId===window.plan.skill&&event.cue===window.cue));
  const row={fixture:fixture.id,speed,seconds:i/30,required:required.length,fired:voices.length,missing:missing.length,interrupted:cuts.length,minClearanceMs,cueEventsPerSecond:sample.events.length/(i/30),parity:sample.parity,errors};
  rows.push(row);
  await writeFile(resolve(out,`voice-${fixture.id}-x${speed}.json`),JSON.stringify({_meta:evidenceMeta(),...row,cuts,voices,plans:sample.plans},null,2)+'\n');
  console.log(`${fixture.id} x${speed}: ${voices.length}/${required.length} required voices; cuts ${cuts.length}; clearance ${minClearanceMs.toFixed(1)}ms; cues/s ${row.cueEventsPerSecond.toFixed(2)}; parity ${sample.parity}`);
  assert.equal(missing.length,0);assert.equal(cuts.length,0);assert.ok(sample.parity);assert.deepEqual(errors,[]);
  await page.close();
 }
}finally{await browser.close();}
await writeFile(resolve(out,'audio-window-after.json'),JSON.stringify({_meta:evidenceMeta(),method:'Required cue events compared with B durationMs at actual presentation clock time; audible mix remains for scheduled integration',rows},null,2)+'\n');
