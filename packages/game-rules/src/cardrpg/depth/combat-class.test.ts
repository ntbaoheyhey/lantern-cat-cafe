import { describe, expect, it } from 'vitest';
import * as R from './index';
import type { Actor, Battle } from './contract';

function battle(mode: 'legacy' | 'v4' | 'v5' | 'a6' = 'a6', cats = ['mochi', 'panko', 'soot', 'clover']): Battle {
  const state=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(71),true));
  const available=R.battleCats(state);
  return R.createBattle({seed:71,chapter:1,cats:cats.map(id=>({...available.find(c=>c.id===id)!,skills:R.CAT_BY_ID[id]!.skills.map(s=>s.id)})),enemies:['teacup-healer','button-guard'],
    gameplayV4:mode!=='legacy',skillsV5:['v5','a6'].includes(mode),gameplayA6:mode==='a6',formationC2:mode==='a6'});
}
const harmful=(b:Battle,id:string)=>b.log.filter(e=>e.actorId===id&&['damage','reflect','dot','detonate','reaction-damage'].includes(e.kind)&&e.amount>0);
function turn(b:Battle,actor:Actor){b.queue=[actor.id,...b.actors.filter(a=>a.id!==actor.id).map(a=>a.id)];if(b.v4)b.v4.committed=true;}

describe('V4 combat classes',()=>{
  it('classifies every catalog entry and carries class identity into runtime actors',()=>{
    expect(R.CATS).toHaveLength(12);expect(R.ENEMIES).toHaveLength(13);
    for(const unit of [...R.CATS,...R.ENEMIES])expect(R.COMBAT_CLASSES).toContain(unit.combatClass);
    expect(['mochi','panko','soot','clover'].map(id=>R.CAT_BY_ID[id]!.combatClass)).toEqual(['melee','melee','ranged','healer']);
    expect(R.ENEMY_BY_ID['binding-thread']!.combatClass).toBe('ranged');
    for(const actor of battle().actors)expect(actor.combatClass).toBe((actor.side==='party'?R.CAT_BY_ID: R.ENEMY_BY_ID)[actor.catalogId]!.combatClass);
  });
  it('all base and transformed healer skills restore or protect allies only',()=>{
    const restorative=['heal','cleanse','shield','revive','transfer'];
    const protective=['cozy','steep','glaze','shelter','link','sprout','decoy'];
    for(const cat of R.CATS.filter(c=>c.combatClass==='healer'))for(const base of cat.skills)for(const skill of [base,R.kitSkillV5(base)]){
      expect(['ally','allies','self','fallen']).toContain(skill.target);
      expect(skill.breakPower).toBe(0);
      for(const effect of skill.effects)expect(restorative.includes(effect.kind)||effect.kind==='rally'&&protective.includes(effect.status??'')).toBe(true);
    }
  });
  it('chooses wounded front allies before rear, excludes defeated/full patients, and uses stable ties',()=>{
    const actors=battle().actors.filter(a=>a.side==='party');
    const [mochi,panko,soot,clover]=actors;
    mochi!.hp=mochi!.maxHp-1;panko!.hp=panko!.maxHp;soot!.hp=1;clover!.hp=0;
    expect(R.healerPatient(actors)?.id).toBe('mochi');
    mochi!.hp=mochi!.maxHp;expect(R.healerPatient(actors)?.id).toBe('soot');
    soot!.hp=soot!.maxHp;expect(R.healerPatient([...actors].reverse())?.id).toBe('mochi');
    expect(R.healerPatient(actors.map(a=>({...a,hp:0})))).toBeUndefined();
  });
  it.each(['legacy','v4','v5','a6'] as const)('Teacup basics and signatures never hit, including suppression in %s',mode=>{
    for(const condition of ['basic','signature','hush','drowsy','broken'] as const){
      const b=battle(mode),healer=b.actors.find(a=>a.catalogId==='teacup-healer')!,patient=b.actors.find(a=>a.catalogId==='button-guard')!;
      turn(b,healer);patient.hp=1;healer.charge=condition==='signature'?100:0;
      const intent=b.intents.find(i=>i.actorId===healer.id)!;intent.signature=condition==='signature';intent.interrupted=condition==='broken';
      if(condition==='hush'||condition==='drowsy')healer.statuses.push({id:condition,stacks:1,remaining:3,source:'soot',appliedRound:b.round});
      expect(R.enemyAct(b)).toBe(true);expect(harmful(b,healer.id)).toEqual([]);
      if(condition==='basic'||condition==='signature')expect(b.log.some(e=>e.actorId===healer.id&&e.targetId===patient.id&&e.kind==='heal'&&e.amount>0)).toBe(true);
      else expect(b.log.filter(e=>e.actorId===healer.id&&e.kind==='suppressed')).toHaveLength(1);
    }
  });
  it('a healer given Riposte by an ally cannot reflect damage',()=>{
    const b=battle('v5',['clover']),healer=b.actors[0]!,foe=b.actors.find(a=>a.catalogId==='button-guard')!;
    healer.statuses.push({id:'riposte',stacks:2,remaining:3,source:'panko',appliedRound:b.round});
    turn(b,foe);const intent=b.intents.find(i=>i.actorId===foe.id)!;intent.signature=false;intent.targetId=healer.id;
    expect(R.enemyAct(b)).toBe(true);expect(harmful(b,healer.id)).toEqual([]);
    expect(b.log.some(e=>e.actorId===foe.id&&e.targetId===healer.id&&e.kind==='damage')).toBe(true);
  });
});
