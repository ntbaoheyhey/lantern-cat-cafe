import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {chromium,config,openFixture} from '../v3a2/browser-fixture.mjs';
import {root,evidenceMeta} from '../v3a2/check-gates.mjs';
const out=resolve(root,process.env.BARK_REVIEW_OUT??'reports/v3-solo/S4/bark-review');await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']}),fixtures={};let callouts=[],missingRows=[];
try{
 for(const fixture of config.fixtures)for(const speed of [1,2,3]){
  const key=fixture.id+'-x'+speed;
  const {page,errors}=await openFixture(browser,fixture);
  await page.evaluate(speed=>{window.__depthReview.state.settings.speed=speed;},speed);
  const contract=await page.evaluate(async root=>{
   const audio=await import('/@fs'+root+'/apps/web/src/game/cardrpg/battle-v3/audio-timeline.ts'),R=window.__v3a2.R;
   const required=[...R.CATS.flatMap(cat=>cat.skills.filter(s=>s.type!=='basic'&&s.type!=='passive').flatMap(s=>s.type==='ultimate'?['charge','release'].map(phase=>({unit:cat.id,skill:s.id,phase})):[{unit:cat.id,skill:s.id}])),...R.ENEMIES.map(enemy=>({unit:enemy.id,skill:`enemy:${enemy.id}`}))];
   window.__audioEvidence={plans:[],last:null,sink:[]};
   window.__thAudio={play:(cue,options)=>window.__audioEvidence.sink.push({cue,options}),stop(){},setBus(){},music(){},unlock:async()=>{},mute(){},pause(){},speed(){},muted:false,ready:true};
   window.__depthScene.audio.setCapture(true);
   return {callouts:audio.VOICE_TIMING,missing:required.filter(r=>!audio.voiceTiming(r.unit,r.skill,r.phase))};
  },root);callouts=contract.callouts;missingRows=contract.missing;
  let outstanding=false,i=0;
  for(;i<900||outstanding&&i<1200;i++){
   outstanding=await page.evaluate(({i,root})=>{
    const m=window.__depthReview,s=window.__depthScene,c=window.__audioEvidence;m.paused=false;
    if(!m.plan&&!m.battle.result&&i<900)m.step();
    if(m.plan&&c.last!==m.plan){c.last=m.plan;c.plans.push({id:m.plan.id,skill:m.plan.presentationId??m.plan.skillId,events:m.plan.events,ultimate:m.plan.ultimate,tier:m.plan.sequence?.tier??(m.plan.ultimate?'ultimate':(m.plan.presentationId??m.plan.skillId).startsWith('enemy:')&&!(m.plan.presentationId??m.plan.skillId).endsWith(':basic')?'active':'basic')});}
    m.tick(i?1000/30:0,1000+i*1000/30);m.paused=true;s.render({...s.view(),fixedTime:10+i/30,paused:true},1/30);return !!m.plan;
   },{i,root});
   await page.clock.runFor(Math.round((i+1)*1000/30)-Math.round(i*1000/30));
  }
  const sample=await page.evaluate(async root=>{
   const {isContractCue}=await import('/@fs'+root+'/apps/web/src/game/cardrpg/contracts/audio-cues.ts');
   const c=window.__audioEvidence,m=window.__depthReview,R=window.__v3a2.R,expected=structuredClone(window.__v3a2.initial),actual=structuredClone(m.battle);R.playBattle(expected,'auto');R.playBattle(actual,'auto');
   const events=window.__depthScene.audio.events;return {...c,last:undefined,events,unknown:[...new Set(c.sink.map(e=>e.cue).filter(id=>!isContractCue(id)))],parity:JSON.stringify(expected)===JSON.stringify(actual)};
  },root);
  const seconds=i/30,active=sample.plans.filter(p=>p.tier==='active'),ultimates=sample.plans.filter(p=>p.tier==='ultimate'),barks=sample.events.filter(e=>e.role==='bark'),spacings=barks.slice(1).map((e,i)=>e.at-barks[i].at);
  const forPlan=p=>sample.events.filter(e=>e.planId===p.id&&e.skillId===p.skill);
  const voicesActive=active.filter(p=>forPlan(p).filter(e=>e.voicePhase==='active').length===1).length;
  const voicesUltimate=ultimates.filter(p=>['charge','release'].every(phase=>forPlan(p).filter(e=>e.voicePhase===phase).length===1)).length;
  const impacts=sample.events.filter(e=>e.role==='impact');
  const maxImpacts=Math.max(0,...impacts.map(e=>impacts.filter(x=>x.at>=e.at&&x.at<e.at+.1-1e-8).length));
  fixtures[key]={cueEventsPerSecond:sample.events.length/seconds,voicedActiveFraction:active.length?voicesActive/active.length:0,voicedUltimateFraction:ultimates.length?voicesUltimate/ultimates.length:0,missingContractCueIds:sample.unknown.length,meanBarkIntervalSeconds:spacings.reduce((a,b)=>a+b,0)/Math.max(1,spacings.length),seconds,events:sample.events.length,active:active.length,ultimates:ultimates.length,maxImpactsPer100ms:maxImpacts,parity:sample.parity,browserErrors:errors,sinkEvents:sample.sink.length};
  await writeFile(resolve(out,key+'-events.json'),JSON.stringify({_meta:evidenceMeta(),...sample},null,2)+'\n');
  console.log(key,JSON.stringify(fixtures[key]));
  assert.equal(sample.events.length,sample.sink.length,'every event must actually reach the bridge exactly once');assert.ok(maxImpacts<=6);assert.ok(sample.parity);assert.deepEqual(errors,[]);
  await page.close();
 }
}finally{await browser.close();}
const suite=await readFile(resolve(out,'suite.json'),'utf8').then(JSON.parse).catch(()=>null);
await writeFile(resolve(out,'metrics.json'),JSON.stringify({_meta:evidenceMeta(),fixtures,calloutRows:callouts.length,missingCalloutRows:missingRows,suite},null,2)+'\n');
await writeFile(resolve(out,'callouts.json'),JSON.stringify(callouts,null,2)+'\n');
assert.ok(Object.values(fixtures).every(row=>row.meanBarkIntervalSeconds>=7&&row.meanBarkIntervalSeconds<=8),'Every fixture/speed bark mean must remain in7–8s');
