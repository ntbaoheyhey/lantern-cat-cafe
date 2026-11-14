/** Rules state hashes plus the actual presentation scheduler's complete fixture duration. */
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chromium,config,openFixture} from './browser-fixture.mjs';
const root=resolve(import.meta.dirname,'../..'),mode=process.argv[2]??'check';
if(!['old','new','check'].includes(mode))throw Error('Use old, new, or check');
const output=resolve(root,`reports/v3-feel/parity-${mode==='check'?'latest':mode}.json`);
if(mode!=='check'&&existsSync(output))throw Error('Never overwrite a parity baseline');
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']}),rows=[];
try{for(const fixture of config.fixtures){
 const {page,errors}=await openFixture(browser,fixture);
 const data=await page.evaluate(()=>{
  const m=window.__depthReview,c=window.__v3a2,actions=[];let wall=0;
  m.paused=false;m.sceneReady=true;m.playbackFrameAt=undefined;
  for(let i=0;i<2000&&!m.battle.result;i++){
   m.step();if(!m.plan)throw Error('No plan for a legal turn');
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
 const row={fixture:fixture.id,durationMs:data.durationMs,result:data.result,actions:data.actions,hash:hash(data.actual),expectedHash:hash(data.expected),parity:data.parity,errors};rows.push(row);await page.close();console.log(`${fixture.id}: ${row.result}, ${(row.durationMs/1000).toFixed(3)}s, ${row.actions.length} plans, ${row.hash}, parity=${row.parity}`);
}}finally{await browser.close();}
const report={at:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),reason:mode==='new'?'user decision F6':mode==='old'?'Unchanged demo before F6':'Compare against new F6 baseline',rows};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');
if(rows.some(r=>!r.parity||r.errors.length||r.result!=='party'))process.exitCode=1;
if(mode==='check'){
 const baseline=JSON.parse(readFileSync(resolve(root,'reports/v3-feel/parity-new.json'),'utf8'));
 if(rows.some(r=>baseline.rows.find(b=>b.fixture===r.fixture)?.hash!==r.hash))throw Error('New F6 parity baseline mismatch');
}
