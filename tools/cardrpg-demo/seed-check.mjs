import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
const b=await chromium.launch({channel:'chromium'}),p=await b.newPage();await p.goto('http://127.0.0.1:5523/?demo&squad=1&cardrpg=1');await p.waitForFunction(()=>window.__cardrpgReview);
const result=await p.evaluate(async()=>{
 const r=await import('/@fs/private/tmp/cardrpg-a-preview/packages/game-rules/src/cardrpg/index.ts'),e=await import('/@fs/private/tmp/cardrpg-a-preview/packages/game-rules/src/squad/turn/engine.ts');
 const rows=[];for(const policy of ['auto','active'])for(const seed of [11,12,13,14,15]){const x=r.startBattle(r.createStarterAccount(11),seed);if(!x.ok)throw Error(x.error.message);const b=x.value.battle;e.beginRun(b);for(let i=0;i<3000&&!b.result;i++){if(b.run.stage==='loot'){e.chooseLoot(b,b.run.loot[0]);continue}if(b.run.stage==='rest'){e.continueRun(b);continue}e.startTurn(b);if(b.phase==='choose'){const c=e.getAutoAction(b,policy);if(c&&e.chooseAction(b,c))e.resolveAction(b)}e.endTurn(b)}rows.push({policy,seed,result:b.result})}return rows;
});console.log(JSON.stringify(result,null,2));await b.close();
