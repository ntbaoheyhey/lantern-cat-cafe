// REFERENCE: A5 E1 Equipment forecast41. Synthetic UI fixtures; no earned-progression claim.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {loadRules} from '/Users/bao/taskbar-hero-cardrpg-a4/tools/cardrpg-big/a4-load.mjs';
const root='reports/cardrpg-big/a5/e1-equipment-forecast/fixtures';await mkdir(root,{recursive:true});
const {load,vite}=await loadRules(),R=await load('packages/game-rules/src/cardrpg/depth/index.ts');
const sha=s=>createHash('sha256').update(s).digest('hex'),checks=[];
try{
 for(const mode of ['on','off']){
  let state=R.setGameplayV4(R.createDepthAccount(11,0),mode==='on');
  state.cleared=[1,2,3];state.account.chapter=3;state.tutorial=4;state.freeInvite=true;
  state.account.cards.forEach(c=>{c.level=6;});
  const take=r=>{assert(r.ok,r.error);return r.state;};
  for(const slot of ['weapon','outfit','charm','relic']){
   const gear=R.makeGear(state,`bellsteel-${slot}-rare`,41);state.gear.push(gear);
   if(slot!=='relic')state=take(R.equipGear(state,'mochi',gear.id));
  }
  const target=state.gear.find(g=>g.templateId==='bellsteel-relic-rare');assert(target);
  const transfer=state.equipment.mochi.weapon;
  for(const name of ['threshold','transfer','active']){
   const initial=name==='active'?take(R.startRun(state,1,11,'campaign','2026-11-08',1)):state;
   const cat=name==='transfer'?'soot':'mochi',item=name==='transfer'?transfer:target.id;
   const equipped=R.equipGear(initial,cat,item),source=structuredClone(initial);
   const forecasts=[];
   if(mode==='on'&&equipped.ok)for(const chapter of R.CHAPTERS)for(const band of [1,6]){
    const setup=s=>({seed:1,chapter:chapter.id,cats:R.battleCats(s),enemies:[chapter.boss],gameplayV4:true,challengeLevel:band,enemyStats:R.challengeStatsV4(band),plan:{...s.v4.plan}});
    forecasts.push({chapter:chapter.id,boss:R.ENEMY_BY_ID[chapter.boss].name,band,before:R.forecastV4(setup(initial)),after:R.forecastV4(setup(equipped.state)),keys:[R.forecastKeyV4(setup(initial)),R.forecastKeyV4(setup(equipped.state))]});
   }
   assert.deepEqual(initial,source);
   const code=R.exportSave(initial)+'\n',path=`${root}/${mode}-${name}.save`;await writeFile(path,code);assert.equal(R.exportSave(R.importSave(code.trim()))+'\n',code);
   checks.push({name,mode,path,sha256:sha(code),cat,item,templateId:initial.gear.find(g=>g.id===item).templateId,forecasts,
    expectedEquipped:equipped.ok?equipped.state:null,error:equipped.error,method:'Synthetic UI account: three chapters, level6 starters, three Bellsteel pieces plus spare relic; never an earned account or balance fixture.'});
  }
 }
 await writeFile(root+'/checks.json',JSON.stringify({passed:true,checks},null,2)+'\n');console.log(JSON.stringify({passed:true,fixtures:checks.length}));
}finally{await vite.close();}
