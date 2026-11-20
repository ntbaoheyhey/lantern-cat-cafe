/** Real campaign result wrappers, distinct from the reward-free practice flow. */
import {createRequire} from 'node:module';import {readFileSync,writeFileSync} from 'node:fs';import {createHash} from 'node:crypto';import {measureScreen} from './measure-screen.mjs';
const require=createRequire(new URL('../../apps/web/package.json',import.meta.url)),{chromium}=require('@playwright/test');
const dir='reports/v3-shell/b2',data=JSON.parse(readFileSync(`${dir}/UI-AUDIT-RAW.json`));
const browser=await chromium.launch({headless:true}),p=await browser.newPage({viewport:{width:1280,height:720},reducedMotion:'reduce'});
try{
 await p.addInitScript(()=>localStorage.setItem('lantern.coach.v3','{"disabled":true}'));
 await p.goto('http://127.0.0.1:5994/?demo=1&squad=1&turn3d=1&cardrpg2=1&a6=1&formationc2=1');await p.getByRole('button',{name:'Play free',exact:true}).click();await p.locator('.uv-shell').waitFor();
 for(const id of ['victory','defeat']){
  const outcome=await p.evaluate(async id=>{
   const m=window.__depthReview,R=await import('/@fs/Users/bao/taskbar-hero-chain/packages/game-rules/src/cardrpg/depth/index.ts');
   m.leave();m.state.tutorial=5;m.state.freeInvite=true;m.start(1,'campaign',1);
   if(!m.state.run)throw Error(`Campaign fixture rejected: ${m.notice}`);
   m.enter(R.availableNodes(m.state.run)[0].id);m.fight();
   if(id==='defeat')for(const a of m.battle.actors){if(a.side==='party'){a.hp=1;a.attack=1;a.defense=0;a.shield=0;}else{a.hp=a.maxHp=100000;a.attack=100000;a.defense=100000;}}
   R.playBattle(m.battle,'auto');m.showResult();return {result:m.battle.result,tutorial:!!m.tutorialBattle,actions:m.battle.choices.length};
  },id);
  if(outcome.result!==(id==='victory'?'party':'enemy')||outcome.tutorial)throw Error('Invalid campaign result fixture '+JSON.stringify(outcome));
  await p.getByRole('heading',{name:id==='victory'?'Victory':'Defeat',exact:true}).waitFor();await p.waitForTimeout(350);await p.evaluate(()=>document.fonts.ready);
  const metrics=await p.evaluate(measureScreen),path=`${dir}/shots/ui-before/${id}.png`;await p.screenshot({path});
  const index=data.screens.findIndex(r=>r.id===id);data.screens[index]={...data.screens[index],...metrics,screenshot:{path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')},notes:[`Campaign battle resolved by live rules; ${outcome.actions} recorded actions. ${id==='defeat'?'Overwhelming enemy stats in disposable browser fixture.':'Normal first encounter.'} No combat-source changes.`]};
  console.log(id,outcome,metrics.visibleWords);
 }
 writeFileSync(`${dir}/UI-AUDIT-RAW.json`,JSON.stringify(data,null,2)+'\n');
}finally{await browser.close();}
