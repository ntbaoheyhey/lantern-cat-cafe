/** Desktop status fixture and rule-resolved result, using the current scene/components. */
import {chromium,config,openFixture} from './production-fixture.mjs';
import {runtimeEvidence} from './production-fixture.mjs';
import assert from 'node:assert/strict';
import {loadRules} from '../cardrpg-big/a4-load.mjs';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const label=process.argv[2];assert(/^[a-z0-9-]+$/.test(label??''));
const out=resolve('work/v5/CXI/status-outcome',label);try{await access(out);throw Error('Use a fresh evidence directory');}catch(e){if(e.code!=='ENOENT')throw e;}await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),viewport:{width:1280,height:720},method:'Explicit status fixture; victory resolved by real rules in separate unmodified level6 wave1 fixture. Not ordinary progression or reward evidence.',rows:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const sheet=(name,files)=>{
 const path=resolve(out,name+'.jpg');execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...files.flatMap(f=>['-i',f]),'-filter_complex','[0:v]scale=512:-1[a];[1:v]scale=512:-1[b];[2:v]scale=512:-1[c];[3:v]scale=512:-1[d];[a][b][c][d]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0[v]','-map','[v]','-frames:v','1','-q:v','3',path]);return path;
};
try{
 const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false});report.url=page.url();
 await page.evaluate(()=>{const m=window.__depthReview;m.plan=null;m.animationAt=0;for(const a of m.battle.actors){a.shield=a.catalogId==='yarn-giant'?80:0;const id={mochi:'scald',soot:'bitter',clover:'drowsy',panko:'tangle'}[a.catalogId];a.statuses=id?[{id,stacks:1,remaining:2,source:a.id,appliedRound:m.battle.round}]:[];}m.notify(false);});
 await page.waitForFunction(()=>Object.values(window.__depthScene.view().cardStatuses).flat().some(s=>(typeof s==='string'?s:s.id)==='scald'));
 for(const reduced of [false,true]){
  const frames=[],samples=[];await page.evaluate(()=>{const s=window.__depthScene;s.phaseNoticeAt=-100;s.bodyFx.conditions?.clear();s.bodyFx.shields.clear();for(const e of s.actors.values()){e.hurtAt=-100;e.entered=-100;}});
  for(const [i,time]of [20,20.12,20.4,21.2].entries()){
   samples.push(await page.evaluate(({time,reduced})=>{const s=window.__depthScene;s.render({...s.view(),frame:null,fixedTime:time,paused:true,galleryPreview:true,reducedMotion:reduced},0);return {time,statuses:s.view().cardStatuses,audit:structuredClone(s.bodyFx.audit),boxes:[...s.bodyBoxes]};},{time,reduced}));
   const path=resolve(out,`statuses-${reduced?'reduced':'normal'}-${i}.png`);await page.screenshot({path});frames.push(path);
  }
  report.rows.push({id:reduced?'statuses-reduced':'statuses-normal',samples,sheet:sheet(reduced?'statuses-reduced':'statuses-normal',frames)});
 }
 report.errors.push(...errors,...blockedRequests);await page.close();
 const result=await openFixture(browser,config.fixtures.find(f=>f.id==='wave1'),{fixedClock:false});
 const modules=await loadRules(),R=await modules.load('packages/game-rules/src/cardrpg/depth/index.ts');
 const battle=await result.page.evaluate(()=>window.__depthReview.battle);R.playBattle(battle,'auto');
 const outcome={result:battle.result,round:battle.round,log:battle.log.length,party:battle.actors.filter(a=>a.side==='party').map(a=>({id:a.catalogId,hp:a.hp}))};
 await result.page.evaluate(battle=>{const m=window.__depthReview;m.tutorialBattle=battle;m.showResult();},battle);await modules.vite.close();
 await result.page.waitForSelector('.c2-result');if(outcome.result==='party')await result.page.waitForSelector('.b3-victory-crew[data-ready=true]',{timeout:60000});
 const frames=[];for(let i=0;i<4;i++){if(i)await result.page.waitForTimeout(600);const path=resolve(out,`outcome-${i}.png`);await result.page.screenshot({path});frames.push(path);}
 report.rows.push({id:'outcome',outcome,sheet:sheet('outcome',frames),crew:await result.page.locator('.b3-victory-crew').evaluateAll(nodes=>nodes.map(n=>({ready:n.dataset.ready,drawn:n.dataset.drawn,loadError:n.dataset.loadError,label:n.getAttribute('aria-label'),rect:n.getBoundingClientRect().toJSON()})))});
 await result.page.evaluate(()=>{const m=window.__depthReview;m.state.settings.reducedMotion=true;m.notify(false);});
 await result.page.waitForSelector('.c2-result[data-reduced=true] .b3-victory-crew[data-ready=true]');
 const reducedFrames=[];for(let i=0;i<4;i++){if(i)await result.page.waitForTimeout(300);const path=resolve(out,`outcome-reduced-${i}.png`);await result.page.screenshot({path});reducedFrames.push(path);}
 report.rows.push({id:'outcome-reduced',sheet:sheet('outcome-reduced',reducedFrames),crew:await result.page.locator('.b3-victory-crew').evaluate(e=>({ready:e.dataset.ready,drawn:e.dataset.drawn,loadError:e.dataset.loadError,confetti:e.querySelectorAll('.b3-confetti').length,rect:e.getBoundingClientRect().toJSON()}))});
 report.errors.push(...result.errors,...result.blockedRequests);report.ended=new Date().toISOString();
 await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({out,rows:report.rows.length,outcome,errors:report.errors}));if(report.errors.length)process.exitCode=1;
}finally{await browser.close();}
