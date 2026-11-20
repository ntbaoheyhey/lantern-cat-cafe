import { describe, expect, it } from 'vitest';
import { CARDS } from '../catalog';
import { CATS, ENEMIES, FLAVOURS, hasAdvantage, SKILLS, STATUSES, STATUS_BY_ID, teamCombos } from './catalog';
import { act, applyStatus, createBattle, currentActor, dispel, enemyAct, legalChoices, stacks, tickStatuses } from './battle';
import type { BattleSetup } from './contract';

export function starterSetup(seed=11, enemies=['button-guard','sock-skipper']): BattleSetup {
  return {seed,chapter:1,cats:CATS.slice(0,3).map(c=>({id:c.id,stats:{...CARDS.find(old=>old.id===c.id)!.baseStats},row:c.row,skills:c.skills.slice(0,3).map(s=>s.id)})),enemies};
}

describe('depth catalogue contract',()=>{
  it('has twelve independent four-skill kits and six roles',()=>{
    expect(CATS).toHaveLength(12);
    expect(new Set(CATS.map(c=>c.role)).size).toBe(6);
    expect(Object.keys(SKILLS)).toHaveLength(48);
    expect(new Set(CATS.map(c=>c.passive.id)).size).toBe(12);
    const mechanics=CATS.map(c=>JSON.stringify(c.skills.map(s=>({target:s.target,effects:s.effects.map(e=>({kind:e.kind,status:e.status,self:e.self}))}))));
    expect(new Set(mechanics).size).toBe(12);
    for(const cat of CATS) {
      expect(cat.skills).toHaveLength(4);
      expect(cat.skills.filter(s=>s.charge>0)).toHaveLength(1);
      expect(cat.skills.every(s=>s.catId===cat.id)).toBe(true);
    }
  });
  it('has thirteen distinct enemy mechanisms, four elites and three phased bosses',()=>{
    expect(ENEMIES).toHaveLength(13);
    expect(new Set(ENEMIES.map(e=>e.mechanic)).size).toBe(13);
    expect(ENEMIES.filter(e=>e.tier==='elite')).toHaveLength(4);
    expect(ENEMIES.filter(e=>e.tier==='boss').every(e=>e.phases.length>=2&&e.counter.length>20)).toBe(true);
  });
  it('defines a five-flavour wheel with exactly one advantage each',()=>{
    expect(FLAVOURS).toHaveLength(5);
    for(const a of FLAVOURS)expect(FLAVOURS.filter(b=>hasAdvantage(a,b))).toHaveLength(1);
  });
  it('shows the starter synergy and conflicting dot/detonation interaction',()=>{
    expect(teamCombos(['mochi','soot','clover']).map(c=>c.id)).toEqual(['warm-table','night-garden']);
    expect(teamCombos(['soot','mallow','velvet']).find(c=>c.id==='crumb-circuit')?.description).toContain('consumes Scald');
  });
});

for(const rule of STATUSES) describe(rule.name,()=>{
  function fixture(){
    const b=createBattle(starterSetup());
    const source=b.actors[0]!,target=b.actors[3]!;
    source.effectHit=10000;target.effectResist=0;b.rng=1;
    return {b,source,target};
  }
  it('applies and caps stacks using its published rule',()=>{
    const {b,source,target}=fixture();
    expect(applyStatus(b,source,target,rule.id,99)).toBe(true);
    expect(stacks(target,rule.id)).toBe(rule.cap);
    expect(target.statuses.find(s=>s.id===rule.id)?.remaining).toBe(rule.duration);
  });
  it('ticks from the data definition',()=>{
    const {b,source,target}=fixture();target.hp-=70;
    applyStatus(b,source,target,rule.id);const hp=target.hp;
    tickStatuses(b,target);
    expect(target.hp).toBe(hp+(rule.tick==='heal'?rule.strength:rule.tick==='damage'?-rule.strength:0));
  });
  it('expires after its published round count',()=>{
    const {b,source,target}=fixture();applyStatus(b,source,target,rule.id);
    for(let i=0;i<rule.duration;i++)tickStatuses(b,target);
    expect(stacks(target,rule.id)).toBe(0);
    expect(b.log.some(e=>e.kind==='expire'&&e.text===rule.name)).toBe(true);
  });
  it('honors dispel type and immunity',()=>{
    const {b,source,target}=fixture();applyStatus(b,source,target,rule.id);
    dispel(b,source,target,rule.kind==='buff'?'debuff':'buff');expect(stacks(target,rule.id)).toBe(1);
    dispel(b,source,target,rule.kind);expect(stacks(target,rule.id)).toBe(rule.dispellable?0:1);
  });
});

for(const enemy of ENEMIES) it(`plays a real scripted scenario against ${enemy.name}`,()=>{
  const b=createBattle(starterSetup(100,[enemy.id]));
  for(let step=0;step<24&&!b.result;step++) {
    if(currentActor(b)?.side==='enemy')expect(enemyAct(b)).toBe(true);
    else expect(act(b,legalChoices(b).find(c=>c.skillId==='defend')!)).toBe(true);
  }
  expect(b.log.some(e=>e.actorId.includes(enemy.id)&&e.kind==='enemy-action')).toBe(true);
  expect(b.round).toBeGreaterThan(2);
  const meaningful=new Set(b.log.filter(e=>e.actorId.includes(enemy.id)).map(e=>e.kind));
  if(enemy.mechanic==='shield')expect(meaningful.has('shield')).toBe(true);
  if(enemy.mechanic==='heal')expect(meaningful.has('heal')).toBe(true);
  if(['summon','bind'].includes(enemy.mechanic))expect(meaningful.has('summon')).toBe(true);
  if(enemy.status)expect(b.log.some(e=>e.kind==='status'&&e.text===STATUS_BY_ID[enemy.status!].name)).toBe(true);
});
