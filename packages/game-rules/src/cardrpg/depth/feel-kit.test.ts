import {expect,it} from 'vitest';
import * as R from './index';
function account(){const s=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(71),true));s.account.cards.forEach(c=>{c.level=6;});return s;}
it('normalizes old four-skill loadouts into Basic + Ultimate for every live cat',()=>{
 for(const cat of R.CATS){
  const s=account();if(!s.account.cards.some(c=>c.cardId===cat.id))s.account.cards.push({...s.account.cards[0]!,id:cat.id,cardId:cat.id});
  s.skills[cat.id]=cat.skills.map(s=>s.id);
  expect(R.availableSkills(s,cat.id).map(s=>s.id)).toEqual([`${cat.id}-1`,`${cat.id}-4`]);
  const own=R.battleCats({...s,team:[cat.id],formationC2:false})[0]!;
  const b=R.createBattle({seed:71,chapter:1,cats:[{...own,skills:cat.skills.map(s=>s.id)}],enemies:['button-guard'],gameplayA6:true,gameplayV4:true,skillsV5:true});
  const actor=b.actors[0]!;actor.charge=100;actor.turns=4;b.queue=[actor.id];
  expect(actor.skills).toEqual([`${cat.id}-1`,`${cat.id}-4`]);
  for(const id of ['defend','wait',`${cat.id}-2`,`${cat.id}-3`]){const before=JSON.stringify(b);expect(R.act(b,{actorId:actor.id,skillId:id,targetId:actor.id})).toBe(false);expect(JSON.stringify(b)).toBe(before);}
 }
});
it('resolves enemy signatures only from full rage, including a previously charged ram',()=>{
 for(const foe of R.ENEMIES)for(const charged of [false,true]){
  const s=account(),b=R.createBattle({seed:71,chapter:foe.chapter,cats:R.battleCats(s),enemies:[foe.id],gameplayA6:true,gameplayV4:true,skillsV5:true,formationC2:true});
  const enemy=b.actors.find(a=>a.catalogId===foe.id)!;enemy.charge=charged?100:0;enemy.bonuses.v5Charge=1;enemy.turns=5;b.queue=[enemy.id];b.v4!.committed=true;
  for(const intent of b.intents)intent.signature=true;
  expect(R.enemyAct(b)).toBe(true);expect(b.v4!.events.some(e=>e.kind==='ultimate.cast'&&e.actorId===enemy.id)).toBe(charged);
  expect(b.log.some(e=>e.kind==='charge')).toBe(false);
 }
});
