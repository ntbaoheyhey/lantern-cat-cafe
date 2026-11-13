/** Verify the new weekly track against the actual model and reward rules. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {openAudioScreen} from '../audio/ui-fixtures.mjs';
const require=createRequire(new URL('../../apps/web/package.json',import.meta.url));
const {chromium}=require('@playwright/test');
const b=await chromium.launch(),p=await b.newPage({viewport:{width:1280,height:720},reducedMotion:'reduce'});
try{
 await openAudioScreen(p,'season-track-countdown-edition');
 const gift=p.getByRole('button',{name:'Collect 10-task weekly gift',exact:true});
 assert(await gift.isDisabled(),'Locked milestone is disabled');
 const before=await p.evaluate(async()=>{
  const m=window.__depthReview,R=await import('/@fs/Users/bao/taskbar-hero-chain/packages/game-rules/src/cardrpg/depth/index.ts');
  m.state.dailyA6={...R.dailyBoardA6(m.state,m.cafeNow).progress,weeklyPoints:10,weeklyClaims:[]};
  m.notify(false);
  return {currencies:{...m.state.account.currencies},expected:R.dailyBoardA6(m.state,m.cafeNow).weekly[0].reward};
 });
 await gift.click();
 await p.waitForFunction(()=>window.__depthReview.state.dailyA6.weeklyClaims.includes(10));
 const after=await p.evaluate(()=>({...window.__depthReview.state.account.currencies}));
 for(const [key,value] of Object.entries(before.expected))assert.equal(after[key]-before.currencies[key],value,`Exact bound ${key} grant`);
 assert(await gift.isDisabled(),'Claimed milestone is disabled');
 await p.evaluate(()=>window.dispatchEvent(new CustomEvent('shell:season-claim',{detail:10})));
 assert.deepEqual(await p.evaluate(()=>({...window.__depthReview.state.account.currencies})),after,'Repeated claim cannot mint another reward');
 await p.getByRole('button',{name:'Close page',exact:true}).click();
 await p.evaluate(()=>window.dispatchEvent(new CustomEvent('shell:page',{detail:'season'})));
 await p.getByRole('dialog',{name:'season',exact:true}).waitFor();assert(await gift.isDisabled(),'Reopened track retains collected state');
 const result={date:new Date().toISOString(),before,after,checks:['locked milestone disabled','exact existing-rule grant','duplicate rejected','collected state survives reopen'],exitCode:0};
 writeFileSync('reports/v3-shell/b2/q6/season-flow.json',JSON.stringify(result,null,2)+'\n');console.log('PASS weekly track: exact grants, duplicate protection, retained collected state');
}finally{await b.close();}
