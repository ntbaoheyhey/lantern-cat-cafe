/** Compare authoritative starter replays before connecting the S3 journey.
 * No product rules, balances, wallets or chain state are changed.
 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=resolve(import.meta.dirname,'../../..'),require=createRequire(resolve(root,'apps/web/package.json'));
const {build}=await import(require.resolve('vite')),temp=await mkdtemp('/tmp/v4ship-judge-probe-');
try{
 const entry=resolve(temp,'entry.ts');
 await writeFile(entry,`export * as R from ${JSON.stringify(resolve(root,'packages/game-rules/src/cardrpg/depth/index.ts'))};\nexport {DepthModel} from ${JSON.stringify(resolve(root,'apps/web/src/game/cardrpg/depth/model.ts'))};\n`);
 await build({root,configFile:false,envDir:false,publicDir:false,logLevel:'silent',build:{emptyOutDir:false,outDir:temp,minify:false,lib:{entry,formats:['es'],fileName:()=> 'runtime.mjs'}}});
 const {R,DepthModel}=await import(pathToFileURL(resolve(temp,'runtime.mjs'))),rows=[];
 for(const variant of ['current-three-cat','four-cat-current-classes','four-cat-catalog-boss','four-cat-patrol','four-cat-guard','four-cat-ram']){
  const current=variant!=='current-three-cat';let state=R.createDepthAccount(43113,0);
  if(current)state=R.setFormationC2(R.setGameplayA6(state,true));
  const setup={seed:43113,chapter:1,cats:R.battleCats(state),enemies:variant==='four-cat-patrol'?['button-guard','teacup-healer']:variant==='four-cat-guard'?['button-guard']:variant==='four-cat-ram'?['spool-ram']:['yarn-giant'],
   ...(['current-three-cat','four-cat-current-classes'].includes(variant)?{enemyStats:{'yarn-giant':{hp:320,attack:12,defense:3}}}:{}),
   ...(current?{gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:true}:{})};
  const authoritative=R.playBattle(R.createBattle(setup),current?'auto':'smart');
  const m=new DepthModel(true,current,current,current,current),battle=R.createBattle(setup);
  if(battle.v4)battle.v4.committed=true;
  m.state=state;Object.assign(m.state.settings,{speed:1,quality:'high',reducedMotion:false});
  Object.assign(m,{replay:battle,replayChoices:authoritative.choices,replayIndex:0,tutorialBattle:null,galleryBattle:null,plan:null,roundPlan:null,watching:true,paused:false,sceneStarted:true,sceneReady:true,screen:'map',playbackFrameAt:undefined});
  let elapsed=0,plans=0;
  for(let i=0;i<2000&&!battle.result;i++){
   m.replayStep();assert(m.plan,'Replay needs a scheduled action');plans++;
   while(m.plan){const p=m.plan;for(let j=0;j<2000&&m.plan===p;j++){elapsed+=1000/30;m.tick(1000/30,elapsed);}assert.notEqual(m.plan,p);}
  }
  assert.equal(battle.result,'party');assert(JSON.stringify(battle)===JSON.stringify(R.replayBattle(setup,authoritative.choices)),'Replay diverged from authoritative choices');
  const healers=new Set(battle.actors.filter(a=>a.combatClass==='healer').map(a=>a.id));
  rows.push({variant,team:setup.cats.map(c=>c.id),durationSeconds:elapsed/1000,rounds:battle.round,plans,choices:authoritative.choices.length,
   healerDamage:battle.log.filter(e=>healers.has(e.actorId)&&['damage','dot','reflect','detonate','reaction-damage'].includes(e.kind)).reduce((n,e)=>n+e.amount,0),result:battle.result,exactReplay:true});
 }
 const report={at:new Date().toISOString(),scope:'Read-only rules/scheduler experiment. Compare existing starter override320/12/3 with unmodified catalog encounters; no browser or chain timing claim.',rows};
 await writeFile(resolve(root,'reports/v4-ship/S3/judge-path-probe.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await rm(temp,{recursive:true,force:true});}
