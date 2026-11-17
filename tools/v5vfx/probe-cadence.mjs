/** Exercise actual DepthModel.act plans in a local seeded battle, without audio/network side effects. */
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-B2-cadence');await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),method:'Local boss fixture, actual DepthModel.step/act and rule-selected actions. Presentation completion is advanced explicitly; not a wall-clock patrol-duration or audio-quality measurement.'};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false});report.url=page.url();
 report.battle=await page.evaluate(async()=>{
  const m=window.__depthReview,s=window.__depthScene,{battleControls}=await import('/src/game/cardrpg/battle-v3/controls.ts');
  cancelAnimationFrame(s.raf);battleControls(m).auto=false;m.paused=false;m.sceneReady=true;
  const rows=[];
  for(let n=0;n<120&&!m.battle?.result;n++){
   m.step('auto');if(!m.plan)break;
   const p=m.plan;rows.push({id:p.presentationId??p.skillId,ultimate:p.ultimate,fixedTiming:p.fixedTiming,duration:p.duration,impact:p.beats[2]?.start,speechLeadInMs:p.speechLeadInMs,voiceWindows:p.voiceWindows,playbackAt:m.playbackAt});
   m.playbackAt+=p.duration;m.animationAt=p.duration;m.finishMoment();
   if(m.plan){m.playbackAt+=m.plan.duration;m.animationAt=m.plan.duration;m.finishMoment();}
  }
  return {formationC2:m.state.formationC2,gameplayA6:m.state.gameplayA6,rows,result:m.battle?.result??null};
 });report.errors=errors;
 if(errors.length||report.battle.rows.some(r=>r.speechLeadInMs>0||!r.fixedTiming))process.exitCode=1;
 await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({out,actions:report.battle.rows.length,ultimates:report.battle.rows.filter(r=>r.ultimate).length,leadIns:[...new Set(report.battle.rows.map(r=>r.speechLeadInMs))],errors}));
}finally{await browser.close();}
