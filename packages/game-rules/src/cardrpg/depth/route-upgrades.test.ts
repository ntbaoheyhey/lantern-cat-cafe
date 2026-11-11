import {expect,it} from 'vitest';
import {act,createBattle,legalChoices} from './battle';
import {battleCats,createDepthAccount} from './state';

for(const mode of ['legacy','v4','v5','a6'])for(const [rank,shield,heal] of [[0,70,35],[1,84,42],[2,98,49],[3,112,56]]){
 it(`preserves rank ${rank} shield/healing amounts and status stacks in ${mode}`,()=>{
  for(const [id,amount,kind] of [['mochi',shield,'shield'],['clover',heal,'heal']] as const){
   const cat=battleCats(createDepthAccount()).find(c=>c.id===id)!,skill=`${id}-2`;
   const b=createBattle({seed:19,chapter:1,cats:[cat],enemies:['button-guard'],gameplayV4:mode!=='legacy',skillsV5:mode==='v5'||mode==='a6',gameplayA6:mode==='a6',upgrades:{[skill]:rank!}});
   const actor=b.actors[0]!;actor.hp=Math.floor(actor.maxHp/2);actor.shield=0;b.energy=10;b.queue=[actor.id,...b.queue.filter(a=>a!==actor.id)];
   const choice=legalChoices(b).find(c=>c.skillId===skill)!;expect(choice).toBeTruthy();
   const beforeHp=actor.hp;expect(act(b,choice)).toBe(true);
   expect(kind==='heal'?actor.hp-beforeHp:actor.shield).toBe(amount);
   expect(actor.statuses.find(s=>s.id===(id==='mochi'?'cozy':'steep'))?.stacks).toBe(1);
  }
 });
}
