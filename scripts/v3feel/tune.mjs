/** Explicit sandbox tuning trials, never acceptance evidence or the parity baseline. */
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const trials=[];
try{for(const fixture of config.fixtures){
 const {page}=await openFixture(browser,fixture);
 const result=await page.evaluate(()=>{
  const {R,initial}=window.__v3a2,rows=[];
  for(const partyGain of [1.1,1.6,2.0,2.4,2.8])for(const enemyGain of [1,1.5,2]){
   for(const id of Object.keys(R.CAT_BY_ID))R.RAGE_GAIN_A6[id]=partyGain;
   for(const id of Object.keys(R.ENEMY_BY_ID))R.RAGE_GAIN_A6[id]=enemyGain;
   const b=structuredClone(initial);R.playBattle(b,'auto');
   const casts=b.v4.events.filter(e=>e.kind==='ultimate.cast').length,actions=b.log.filter(e=>['action','enemy-action'].includes(e.kind)).length;
   rows.push({partyGain,enemyGain,result:b.result,round:b.round,actions,casts,estimatedSeconds:(actions-casts)*.8+casts*2.2+(b.round-1)*.3,remaining:b.actors.filter(a=>a.side==='enemy').map(a=>({id:a.id,hp:a.hp}))});
  }
  return rows;
 });
 trials.push({fixture:fixture.id,rows:result});await page.close();
 console.log(fixture.id,JSON.stringify(result.map(({remaining,...row})=>row)));
}}finally{await browser.close();}
writeFileSync('reports/v3-feel/Q1-cadence-trials.json',JSON.stringify({at:new Date().toISOString(),method:'Isolated charge coefficient trials with production rules; estimated presentation lengths; no fixture stats changed. Not parity baseline.',trials},null,2)+'\n');
