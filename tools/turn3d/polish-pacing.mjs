import {createRequire} from 'node:module';import {resolve} from 'node:path';import fs from 'node:fs';
const root=resolve(import.meta.dirname,'../..'),web=resolve(root,'apps/web'),require=createRequire(resolve(web,'package.json'));
const {createServer}=await import(require.resolve('vite'));const vite=await createServer({configFile:false,root:web,envDir:false,server:{middlewareMode:true,hmr:false,ws:false,watch:null},appType:'custom'});
const E=await vite.ssrLoadModule(resolve(root,'packages/game-rules/src/squad/turn/engine.ts'));
const {choosePolicyLoot}=await vite.ssrLoadModule(resolve(root,'packages/game-rules/src/squad/gear/run.ts'));
const {TurnPresenter}=await vite.ssrLoadModule(resolve(web,'src/game/squad/turn3d/presenter.ts'));
const rows=[];
for(const preset of ['hearthkeepers','lanternbreakers'])for(let seed=1;seed<=30;seed++){
 const b=E.createTurnBattle({seed,preset,encounter:'campaign',gearMode:'starter',interactive:true});E.beginRun(b);
 while(!b.result){if(b.run.stage==='loot'){E.chooseLoot(b,choosePolicyLoot(b,'active'));continue}if(b.run.stage==='rest'){E.autoEquipGear(b);E.continueRun(b);continue}E.startTurn(b);if(b.phase==='choose'){E.chooseAction(b,E.getAutoAction(b,'active'));E.resolveAction(b)}E.endTurn(b)}
 const p=new TurnPresenter();let ms=0;const groups=[];for(const e of b.events){const last=groups.at(-1);if(last?.[0].actionId===e.actionId)last.push(e);else groups.push([e])}for(const group of groups){p.push(group);while(p.busy&&ms<1200000){p.tick(10);ms+=10}if(p.busy)throw Error('Presenter did not finish')}const decisions=b.history.filter(h=>['guardian','witch','alchemist'].includes(h.actorId)).length;
 rows.push({preset,seed,winner:b.result.winner,actions:b.turn,rounds:b.round,manualDecisions:decisions,presenterMs:ms,estimatedMs:ms+decisions*2000+45000});
}
const summary=['hearthkeepers','lanternbreakers'].map(preset=>{const a=rows.filter(r=>r.preset===preset&&r.winner==='party');return {preset,wins:a.length,meanPresenterSeconds:a.reduce((n,r)=>n+r.presenterMs,0)/a.length/1000,meanManualDecisions:a.reduce((n,r)=>n+r.manualDecisions,0)/a.length,estimatedMinutes:a.reduce((n,r)=>n+r.estimatedMs,0)/a.length/60000}});
fs.writeFileSync('reports/turn3d-polish/pacing.json',JSON.stringify({date:new Date().toISOString(),method:'Measured the actual x1 presenter by draining each accepted event stream in 10ms increments. Human estimate adds 2 seconds per hero decision and 45 seconds total for preparation/loot/rest. Not a human playtest or measured reading speed.',summary,rows},null,2));console.log(JSON.stringify(summary));await vite.close();
