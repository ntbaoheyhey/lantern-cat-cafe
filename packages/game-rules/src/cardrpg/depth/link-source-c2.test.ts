import {expect,it} from 'vitest';
import * as R from './index';
import {clone} from '../internal';
import {actorValueV5} from './skills-v5/policy';

function fixture(c2=true){
 const state=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(71,0),true));
 const battle=R.createBattle({seed:71,chapter:1,cats:R.battleCats(state),enemies:['button-guard'],gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:c2});
 const mochi=battle.actors.find(a=>a.id==='mochi')!,panko=battle.actors.find(a=>a.id==='panko')!,enemy=battle.actors.find(a=>a.side==='enemy')!;
 mochi.setEffects=['defend-link'];
 for(const a of battle.actors){a.statuses=[];a.shield=0;a.hp=a.maxHp=1000;a.bonuses={};}
 panko.hp=500;
 return {battle,mochi,panko,enemy};
}
function defend(f:ReturnType<typeof fixture>){
 f.battle.queue=[f.mochi.id];f.mochi.cooldowns={};
 expect(R.act(f.battle,{actorId:f.mochi.id,skillId:'defend',targetId:f.mochi.id})).toBe(true);
}
function hit(f:ReturnType<typeof fixture>){
 const {battle,enemy,panko,mochi}=f;
 battle.queue=[enemy.id];enemy.attack=200;enemy.charge=0;enemy.statuses=[];
 panko.row='front';panko.shield=0;panko.defense=0;mochi.statuses=[];
 Object.assign(battle.intents.find(i=>i.actorId===enemy.id)!,{targetId:panko.id,signature:false,power:100});
 const start=battle.log.length;expect(R.enemyAct(battle)).toBe(true);
 const logs=battle.log.slice(start),shared=logs.filter(e=>e.kind==='shared').reduce((n,e)=>n+e.amount,0),direct=logs.filter(e=>e.kind==='damage'&&e.targetId===panko.id).reduce((n,e)=>n+e.amount,0);
 expect(shared+direct).toBeGreaterThan(100);
 return {shared,total:shared+direct};
}
it('keeps a native link at 30% when its caster wears Hearthloom',()=>{
 const f=fixture();R.applyStatus(f.battle,f.mochi,f.panko,'link');
 const damage=hit(f);expect(damage.shared).toBe(Math.floor(damage.total*.3));
});
it('uses the configured gear share, then allows the native skill to replace it',()=>{
 const f=fixture();defend(f);
 const gear=hit(f);expect(gear.shared).toBe(Math.floor(gear.total*R.ECONOMY_C2.sets.hearthloomShareBp/10000));
 R.applyStatus(f.battle,f.mochi,f.panko,'link');
 const skill=hit(f);expect(skill.shared).toBe(Math.floor(skill.total*.3));
});
it('does not overwrite a living stronger skill link when Defend grants a gear link',()=>{
 const f=fixture(),clover=f.battle.actors.find(a=>a.id==='clover')!;
 R.applyStatus(f.battle,clover,f.panko,'link');
 const original=clone(f.panko.statuses.find(s=>s.id==='link')!);
 defend(f);expect(f.panko.statuses.find(s=>s.id==='link')).toMatchObject({source:original!.source,linkShareBp:original!.linkShareBp});
 clover.hp=0;defend(f);
 expect(f.panko.statuses.find(s=>s.id==='link')?.source).toBe(f.mochi.id);
});
it('preserves the legacy equipped-caster link behavior outside C2',()=>{
 const f=fixture(false);R.applyStatus(f.battle,f.mochi,f.panko,'link');
 const damage=hit(f);expect(damage.shared).toBe(Math.floor(damage.total*.15));
});
it('values a weak gear link below a native skill link during auto-play',()=>{
 const f=fixture();defend(f);
 f.battle.acted=[];f.panko.hp=200;f.panko.shield=0;f.enemy.attack=200;
 Object.assign(f.battle.intents.find(i=>i.actorId===f.enemy.id)!,{targetId:f.panko.id,power:100});
 const without=clone(f.panko);without.statuses=without.statuses.filter(s=>s.id!=='link');
 const baseline=actorValueV5(f.battle,without),gear=actorValueV5(f.battle,f.panko)-baseline;
 R.applyStatus(f.battle,f.mochi,f.panko,'link');
 const native=actorValueV5(f.battle,f.panko)-baseline;
 expect(gear).toBeGreaterThan(0);expect(native).toBeGreaterThan(gear*4);
});
