import { clone } from '../internal';
import { describe, expect, it } from 'vitest';
import { CARDS } from '../catalog';
import { CATS, ENEMIES } from './catalog';
import { act, applyStatus, createBattle, currentActor, enemyAct, legalChoices, replayBattle } from './battle';
import { chooseAction, playBattle } from './policies';
import type { BattleSetup } from './contract';
const setup=(seed=11,enemies=['button-guard','sock-skipper']):BattleSetup=>({seed,chapter:1,cats:CATS.slice(0,3).map(c=>({id:c.id,stats:{...CARDS.find(old=>old.id===c.id)!.baseStats},row:c.row,skills:c.skills.slice(0,3).map(s=>s.id)})),enemies});

describe('depth numbered-round decisions',()=>{
  it.each([false, true])('finishes a reflected fatal hit before a follow-up shield (surviving ally: %s)', withAlly => {
    const ids = withAlly ? ['velvet', 'mochi'] : ['velvet'];
    const b = createBattle({ seed: 21, chapter: 1, gameplayV4: true,
      cats: ids.map(id => {
        const cat = CATS.find(c => c.id === id)!;
        return { id, stats: { ...CARDS.find(c => c.id === id)!.baseStats }, row: cat.row,
          skills: cat.skills.slice(0, 3).map(skill => skill.id) };
      }), enemies: ['kettle-knight'], hp: { velvet: 4 } });
    const velvet = b.actors.find(actor => actor.id === 'velvet')!;
    const kettle = b.actors.find(actor => actor.catalogId === 'kettle-knight')!;
    kettle.shield = 10000; // Keep the shield through the hit so its reflection is guaranteed.
    const choice = { actorId: velvet.id, skillId: 'velvet-3', targetId: kettle.id };
    expect(legalChoices(b)).toContainEqual(choice);
    const before = clone(b);
    expect(legalChoices(b)).toContainEqual(chooseAction(b, 'auto'));
    expect(b).toEqual(before);
    const beforeShield = b.actors.find(actor => actor.id === 'mochi')?.shield;
    expect(act(b, choice)).toBe(true);
    expect(velvet.hp).toBe(0);
    expect(b.log.some(event => event.kind === 'reflect' && event.targetId === velvet.id)).toBe(true);
    if (withAlly) {
      expect(b.result).toBeNull();
      expect(b.actors.find(actor => actor.id === 'mochi')!.shield).toBe(beforeShield! + 12);
    } else {
      expect(b.result).toBe('enemy');
      expect(b.log.some(event => event.kind === 'shield' && event.actorId === velvet.id)).toBe(false);
    }
    expect(b.actors.every(actor => Number.isFinite(actor.hp) && Number.isFinite(actor.shield))).toBe(true);
  });
  it('gives each living actor one action in each numbered round',()=>{
    const b=createBattle(setup());const seen=new Set<string>();
    for(let i=0;i<90&&!b.result;i++) {
      const a=currentActor(b)!,key=`${b.round}/${a.id}`;
      expect(seen.has(key)).toBe(false);seen.add(key);
      if(a.side==='enemy')enemyAct(b);else act(b,legalChoices(b).find(c=>c.skillId==='defend')!);
    }
    expect(b.round).toBeGreaterThan(5);
  });
  it('rejects invalid skill, energy, target, ownership and double actions atomically',()=>{
    const b=createBattle(setup()),before=clone(b);
    expect(act(b,{actorId:'mochi',skillId:'soot-1',targetId:b.actors[3]!.id})).toBe(false);
    expect(b).toEqual(before);
    expect(act(b,{actorId:'mochi',skillId:'mochi-1',targetId:b.actors[4]!.id})).toBe(false);
    expect(b).toEqual(before);
    b.energy=0;const low=clone(b);
    expect(act(b,{actorId:'mochi',skillId:'mochi-2',targetId:'clover'})).toBe(false);expect(b).toEqual(low);
    const choice=legalChoices(b)[0]!;expect(act(b,choice)).toBe(true);
    const after=clone(b);expect(act(b,choice)).toBe(false);expect(b).toEqual(after);
  });
  it('allows a mark or piercing skill to reach the rear',()=>{
    const b=createBattle(setup());b.rng=1;applyStatus(b,b.actors[0]!,b.actors[4]!,'scent');
    expect(legalChoices(b).some(c=>c.skillId==='mochi-1'&&c.targetId===b.actors[4]!.id)).toBe(true);
    act(b,legalChoices(b)[0]!);
    expect(legalChoices(b).some(c=>c.skillId==='soot-1'&&c.targetId===b.actors[4]!.id)).toBe(true);
  });
  it('break interrupts a committed signature while retaining its actor turn',()=>{
    const b=createBattle(setup(1,['spool-ram'])),foe=b.actors[3]!;
    foe.break=foe.breakCap-1;b.intents[0]!.signature=true;
    act(b,legalChoices(b).find(c=>c.skillId==='mochi-1')!);
    expect(b.intents[0]!.interrupted).toBe(true);
    while(currentActor(b)?.side==='party')act(b,legalChoices(b).find(c=>c.skillId==='defend')!);
    enemyAct(b);expect(foe.turns).toBe(1);expect(b.log.some(e=>e.text==='Broken intent · softened basic')).toBe(true);
  });
  it('uses Effect Hit and Effect Resist and temporary control immunity',()=>{
    let low=0,high=0;
    for(let seed=1;seed<=200;seed++)for(const improved of [false,true]) {
      const b=createBattle(setup(seed)),source=b.actors[0]!,target=b.actors[3]!;
      b.rng=seed;source.effectHit=improved?6000:0;target.effectResist=5000;
      if(applyStatus(b,source,target,'scald')){if(improved)high++;else low++;}
    }
    expect(high-low).toBeGreaterThan(70);
    const b=createBattle(setup());b.rng=1;const s=b.actors[0]!,t=b.actors[3]!;
    expect(applyStatus(b,s,t,'drowsy')).toBe(true);expect(applyStatus(b,s,t,'drowsy')).toBe(false);
  });
  it('never mutates its setup and replays every recorded action exactly',()=>{
    const input=setup(44),before=clone(input),b=playBattle(createBattle(input),'smart');
    expect(input).toEqual(before);expect(replayBattle(input,b.choices)).toEqual(b);
  });
  it.each(ENEMIES.filter(e=>e.tier==='boss'))('changes phase for $name at half health',enemy=>{
    const b=createBattle(setup(22,[enemy.id])),boss=b.actors[3]!;boss.hp=Math.floor(boss.maxHp*.49);
    while(b.round===1&&!b.result){if(currentActor(b)?.side==='enemy')enemyAct(b);else act(b,legalChoices(b).find(c=>c.skillId==='defend')!);}
    expect(boss.phase).toBe(2);expect(b.log.some(e=>e.kind==='phase')).toBe(true);
  });
  it('rejects repeated skill slots before starting',()=>{
    const input=setup();input.cats[0]!.skills=['mochi-1','mochi-1','mochi-2'];expect(()=>createBattle(input)).toThrow();
  });
});
