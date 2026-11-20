/** SHIP-port replay comparison. This never writes or approves a baseline. */
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chromium,config,openFixture} from '../../scripts/v3feel/browser-fixture.mjs';
const root=resolve(import.meta.dirname,'../..'),output=resolve(root,process.argv[2]);
if(existsSync(output))throw Error('Preserve previous probe');
const baseline=JSON.parse(readFileSync(resolve(root,'reports/v3-feel/parity-new.json')));
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']}),rows=[];
try{for(const fixture of config.fixtures){
 if(existsSync(resolve(root,'STOP-V4SHIP')))throw Error('STOP-V4SHIP');
 const {page,errors}=await openFixture(browser,fixture,{url:'http://127.0.0.1:5995'});
 const data=await page.evaluate(()=>{
  const m=window.__depthReview,c=window.__v3a2,actions=[];let wall=0;
  m.paused=false;m.sceneReady=true;m.playbackFrameAt=undefined;
  for(let i=0;i<2000&&!m.battle.result;i++){
   m.step();if(!m.plan)throw Error('No plan for legal turn');
   while(m.plan){
    const p=m.plan;actions.push({actorId:p.actorId,skill:p.presentationId??p.skillId,ultimate:p.ultimate,duration:p.duration,impact:p.beats[2].start,startsAtMs:wall});
    for(let j=0;j<2000&&m.plan===p;j++){wall+=1000/30;m.tick(1000/30,wall);}
    if(m.plan===p)throw Error('Presentation did not settle');
   }
  }
  const expected=structuredClone(c.initial);c.R.playBattle(expected,'auto');
  return {durationMs:wall,result:m.battle.result,actions,expected,actual:m.battle,parity:JSON.stringify(expected)===JSON.stringify(m.battle)};
 });
 const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
 const row={fixture:fixture.id,durationMs:data.durationMs,result:data.result,actions:data.actions,hash:hash(data.actual),expectedHash:hash(data.expected),parity:data.parity,errors};
 row.existingBaselineMatch=baseline.rows.find(b=>b.fixture===row.fixture)?.hash===row.hash;
 rows.push(row);await page.close();console.log(JSON.stringify({...row,actions:row.actions.length}));
}}finally{await browser.close();}
const probePass=rows.length===3&&rows.every(r=>r.parity&&!r.errors.length&&r.result==='party');
writeFileSync(output,JSON.stringify({at:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),mode:'probe',newBaseline:false,probePass,existingBaselinePass:rows.every(r=>r.existingBaselineMatch),officialClassBaselineApproved:false,rows},null,2)+'\n');
if(!probePass)process.exitCode=1;
