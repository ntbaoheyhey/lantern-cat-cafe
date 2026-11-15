/** Seek-based policy checks complement, but never replace, the real-time films. */
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const folder='reports/v3-feel/REVIEW/Q1';
mkdirSync(folder,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const rows=[];
try{for(const fixture of config.fixtures){
 const {page,errors}=await openFixture(browser,fixture);
 const row=await page.evaluate(()=>{
  const m=window.__depthReview,s=window.__depthScene,R=window.__v3a2.R;
  m.paused=false;m.sceneReady=true;
  const plans=[];
  for(let i=0;i<100&&!plans.some(p=>p.ultimate);i++){
   if(!m.plan)m.step();
   if(!m.plan)throw Error('Missing plan');
   if(m.plan.actorId)plans.push(m.plan);
   while(m.plan)m.tick(100);
  }
  const samples=[],scaling=[],returns=[],focus=[];
  for(const plan of [plans.find(p=>!p.ultimate),plans.find(p=>p.ultimate)]){
   if(!plan)throw Error('Missing tier');
   m.plan=plan;m.animationAt=0;m.paused=true;s.effects.clear();
   for(const reduced of [false,true])for(let at=0;at<=plan.duration;at+=1000/60){
    m.animationAt=at;
    s.render({...s.view(),reducedMotion:reduced,paused:true,fixedTime:10+at/1000},0);
    const audit=s.audit(),motion=audit.motion.find(p=>p.id===plan.actorId);
    samples.push({tier:plan.ultimate?'ultimate':'basic',reduced,at,shakePx:Math.hypot(audit.camera.x,audit.camera.y)*s.width/audit.camera.worldWidth});
    if(plan.ultimate&&!reduced&&at<600){
     const title=document.querySelector('.b3-focus-name'),b=title?.getBoundingClientRect();
     focus.push({at,visible:!!title&&!title.hidden,box:b?{x:b.x,y:b.y,width:b.width,height:b.height}:null,effectDraws:s.effects.stats.draws});
    }
    if(!plan.ultimate&&at>=plan.duration-1000/60&&motion)returns.push({at,reduced,dx:motion.dx,dy:motion.dy});
   }
   for(const speed of [1,2,3])for(const reduced of [false,true]){
    m.plan=plan;m.roundPlan=null;m.animationAt=0;m.playbackFrameAt=undefined;
    m.state.settings.speed=speed;m.state.settings.reducedMotion=reduced;m.paused=false;
    let wall=0,impact=null;
    while(m.plan===plan&&wall<3000){wall+=5;m.tick(5,wall);if(impact===null&&m.animationAt>=plan.beats[2].start)impact=wall;}
    scaling.push({tier:plan.ultimate?'ultimate':'basic',speed,reduced,wallDuration:wall,expectedDuration:plan.duration/speed,wallImpact:impact,expectedImpact:plan.beats[2].start/speed});
   }
  }
  m.paused=true;
  return {samples,scaling,returns,focus,kits:R.CATS.map(c=>({id:c.id,skills:R.battleKitA6(c.id).map(s=>({id:s.id,type:s.type}))}))};
 });
 rows.push({fixture:fixture.id,...row,errors});await page.close();
 console.log(JSON.stringify({fixture:fixture.id,reducedShake:Math.max(...row.samples.filter(s=>s.reduced).map(s=>s.shakePx)),focusPositions:new Set(row.focus.map(f=>JSON.stringify(f.box))).size,focusEffectDraws:Math.max(...row.focus.map(f=>f.effectDraws)),errors}));
}}finally{await browser.close();}
writeFileSync(folder+'/policy-inspection.json',JSON.stringify({at:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),method:'Deterministic seeks on the production renderer; clock checks use 5 ms increments; not real-time FPS or listening evidence.',rows},null,2)+'\n');
if(rows.some(r=>r.errors.length||r.samples.some(s=>s.reduced&&s.shakePx>1e-8)||r.scaling.some(s=>Math.abs(s.wallDuration-s.expectedDuration)>5.001||s.wallImpact===null||Math.abs(s.wallImpact-s.expectedImpact)>5.001)))process.exitCode=1;
