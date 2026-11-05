import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createTurnBattle, startTurn, chooseAction, resolveAction, endTurn, getAutoAction,
  getTimeline, getLegalActions, getLegalTargets, delayActor, advanceActor, replayTurns } from './engine';
import { TURN_KITS, TURN_SKILLS } from './config';
import type { TurnBattle, TurnChoice } from './types';

function step(b: TurnBattle, policy: 'auto'|'active'='auto') {
  startTurn(b);
  if (b.phase === 'choose') { const choice=getAutoAction(b,policy); expect(choice).not.toBeNull(); expect(chooseAction(b,choice!)).toBe(true); resolveAction(b); }
  endTurn(b);
}
function ready(id='guardian',encounter:'group'|'boss'|'dummy'='group') {
  const b=createTurnBattle({encounter});
  b.queue.sort((a,z)=>Number(z.actorId===id)-Number(a.actorId===id));startTurn(b);return b;
}
function act(b:TurnBattle,skillId:string,targetId:string){expect(chooseAction(b,{actorId:b.activeId!,skillId,targetId})).toBe(true);return resolveAction(b);}
const hash=(x:unknown)=>{let h=2166136261;for(const ch of JSON.stringify(x))h=Math.imul(h^ch.charCodeAt(0),16777619);return h>>>0;};

describe('turn scheduler and deterministic replay',()=>{
  it('previews repeatedly without consuming RNG or altering the battle',()=>fc.assert(fc.property(fc.integer(),seed=>{
    const b=createTurnBattle({seed});const before=JSON.stringify(b);const t=getTimeline(b,80);
    expect(t).toEqual(getTimeline(createTurnBattle({seed}),80));expect(JSON.stringify(b)).toBe(before);
  }),{numRuns:60}));
  it('never loses or duplicates a living pending actor when moved',()=>fc.assert(fc.property(fc.integer(),fc.array(fc.integer({min:-8,max:8}),{maxLength:30}), (seed,moves)=>{
    const b=createTurnBattle({seed});const expected=b.queue.map(s=>s.actorId).sort();
    moves.forEach((n,i)=>{const id=expected[i%expected.length]!;if(n>0)delayActor(b,id,n);else advanceActor(b,id,-n);
      expect(b.queue.map(s=>s.actorId).sort()).toEqual(expected);expect(new Set(b.queue.map(s=>s.actorId)).size).toBe(expected.length);});
  }),{numRuns:45}));
  it('locks one choice and resolves one action in each slot',()=>{
    const b=ready();const choice=getAutoAction(b)!;const turn=b.turn;expect(startTurn(b)?.id).toBe(b.activeId);expect(b.turn).toBe(turn);
    expect(chooseAction(b,choice)).toBe(true);expect(chooseAction(b,choice)).toBe(false);resolveAction(b);
    const length=b.events.length;expect(resolveAction(b)).toEqual([]);expect(b.events.length).toBe(length);endTurn(b);
    const copy=JSON.stringify(b);endTurn(b);expect(JSON.stringify(b)).toBe(copy);
  });
  it('removes defeated actors from all future timeline slots',()=>{
    const b=ready();const victim=b.actors.find(a=>a.side==='enemy')!;victim.hp=1;
    act(b,'guardianBasic',victim.id);expect(victim.hp).toBe(0);expect(getTimeline(b,50).some(s=>s.actorId===victim.id)).toBe(false);
  });
  it('auto and active always choose a legal action across seeds',()=>fc.assert(fc.property(fc.integer({min:1,max:100000}),seed=>{
    for(const policy of ['auto','active'] as const){const b=createTurnBattle({seed});for(let i=0;i<55&&!b.result;i++)step(b,policy);}
  }),{numRuns:12}));
  it('replays accepted choices to the same complete log hash',()=>{
    for(const seed of [1,11,29]){const b=createTurnBattle({seed,encounter:'patrol'});for(let i=0;i<650&&!b.result;i++)step(b);
      expect(b.result).not.toBeNull();const replay=replayTurns({seed,encounter:'patrol'},b.history);expect(hash(replay.events)).toBe(hash(b.events));expect(replay.result).toEqual(b.result);}
  });
  it('has sequential event ids and nondecreasing beats within every action',()=>{
    const b=createTurnBattle();for(let i=0;i<100&&!b.result;i++)step(b);
    b.events.forEach((e,i)=>{expect(e.seq).toBe(i);expect(e.actorId).toBeTypeOf('string');expect(e.targetIds).toBeInstanceOf(Array);
      const prev=b.events[i-1];if(prev?.actionId===e.actionId)expect(e.beat).toBeGreaterThanOrEqual(prev.beat);});
  });
  it('settles each wave exactly once and cannot pay again after victory',()=>{
    const b=createTurnBattle({encounter:'patrol'});b.actors.filter(a=>a.side==='party').forEach(a=>a.attack=10000);
    for(let i=0;i<100&&!b.result;i++)step(b);expect(b.result?.winner).toBe('party');expect(b.settledWaves).toEqual([0,1,2]);expect(b.fishFound).toBe(27);
    const before=JSON.stringify(b);for(let i=0;i<5;i++){startTurn(b);resolveAction(b);endTurn(b);}expect(JSON.stringify(b)).toBe(before);
  });
});

describe('turn skills, targets and committed intentions',()=>{
  it('has twelve hero buttons with complete turn metadata',()=>{
    expect(Object.values(TURN_KITS).flat()).toHaveLength(12);
    Object.values(TURN_KITS).flat().forEach(id=>{const s=TURN_SKILLS[id]!;expect(s.description.length).toBeGreaterThan(15);expect(s.cooldown).toBeGreaterThanOrEqual(0);expect(s.chargeCost===0||s.chargeCost===100).toBe(true);});
  });
  it('row abilities hit exactly the selected living row',()=>{
    const b=ready('witch');const front=b.actors.find(a=>a.side==='enemy'&&a.row==='front')!;
    const legal=getLegalTargets(b,'emberOrb').find(t=>t.actorId===front.id)!;
    expect(legal.affectedIds.sort()).toEqual(b.actors.filter(a=>a.side==='enemy'&&a.row==='front').map(a=>a.id).sort());
    const before=new Map(b.actors.map(a=>[a.id,a.hp]));act(b,'emberOrb',front.id);
    for(const a of b.actors)expect(a.hp<before.get(a.id)!).toBe(legal.affectedIds.includes(a.id));
  });
  it('taunt visibly redirects committed single target attacks',()=>{
    const b=ready();act(b,'rally','guardian');
    for(const enemy of b.actors.filter(a=>a.side==='enemy')){const i=b.intents[enemy.id]!;if(TURN_SKILLS[i.skillId]!.target==='enemy')expect(i.targetId).toBe('guardian');}
    expect(b.events.some(e=>e.type==='intent'&&e.note?.includes('Taunt'))).toBe(true);
  });
  it('bash interrupts the announced action, grants the passive shield and moves one slot',()=>{
    const b=ready();const target=b.actors.find(a=>a.role==='charger')!;act(b,'shieldBash',target.id);
    expect(b.intents[target.id]?.interrupted).toBe(true);expect(target.statuses.some(s=>s.kind==='stun')).toBe(true);
    expect(b.actors.find(a=>a.id==='guardian')!.shield).toBeGreaterThan(0);expect(b.events.some(e=>e.type==='passive'&&e.skillId==='steadfast')).toBe(true);
    expect(b.queue.filter(s=>s.actorId===target.id)).toHaveLength(1);
  });
  it('cooldown two excludes the next two own turns, with no timer ticking',()=>{
    const b=ready();const target=b.actors.find(a=>a.side==='enemy')!;act(b,'shieldBash',target.id);endTurn(b);
    const g=b.actors.find(a=>a.id==='guardian')!;expect(g.cooldowns.shieldBash).toBe(2);
    for(let n=2;n>=1;n--){b.queue.sort((a,z)=>Number(z.actorId==='guardian')-Number(a.actorId==='guardian'));startTurn(b);expect(getLegalActions(b).find(a=>a.skill.id==='shieldBash')!.legal).toBe(false);
      act(b,'guardianBasic',b.actors.find(a=>a.side==='enemy'&&a.hp>0)!.id);endTurn(b);expect(g.cooldowns.shieldBash).toBe(n-1);}
  });
  it('cleanse clears harmful statuses before healing and shielding the team',()=>{
    const b=ready('alchemist');const a=b.actors.find(a=>a.id==='alchemist')!;a.charge=100;
    const g=b.actors.find(a=>a.id==='guardian')!;g.hp-=100;g.statuses.push({kind:'burn',source:'enemy',turns:2,strength:1,appliedTurn:0});
    const events=act(b,'nineLives','guardian');expect(g.statuses.some(s=>s.kind==='burn')).toBe(false);expect(g.hp).toBeGreaterThan(g.maxHp-100);expect(g.shield).toBeGreaterThan(0);
    expect(events.findIndex(e=>e.type==='status_expire')).toBeLessThan(events.findIndex(e=>e.type==='heal'));expect(a.charge).toBeLessThan(100);
  });
  it('guard and shields reduce incoming HP damage',()=>{
    const plain=createTurnBattle({seed:9}), guarded=createTurnBattle({seed:9});
    const target=guarded.actors.find(a=>a.id==='witch')!;target.shield=30;target.shieldTurns=2;target.statuses.push({kind:'guard',source:'guardian',turns:2,strength:.3,appliedTurn:0});
    for(const b of [plain,guarded]){b.queue.sort((a,z)=>Number(z.actorId.includes('flanker'))-Number(a.actorId.includes('flanker')));startTurn(b);const c=getAutoAction(b)!;expect(c.targetId).toBe('witch');chooseAction(b,c);resolveAction(b);}
    expect(target.hp).toBeGreaterThan(plain.actors.find(a=>a.id==='witch')!.hp);
  });
  it('boss binding creates a targetable thread; killing it exposes the knot',()=>{
    const b=ready('w3-yarn-0','boss');b.intents[b.activeId!]!.skillId='bindThread';b.intents[b.activeId!]!.targetId='witch';b.intents[b.activeId!]!.targetIds=['witch'];
    act(b,'bindThread','witch');endTurn(b);const thread=b.actors.find(a=>a.role==='thread')!;expect(thread.boundAlly).toBe('witch');
    b.queue.sort((a,z)=>Number(z.actorId==='guardian')-Number(a.actorId==='guardian'));startTurn(b);thread.hp=1;act(b,'guardianBasic',thread.id);
    expect(b.actors.find(a=>a.id==='witch')!.statuses.some(s=>s.kind==='restrain')).toBe(false);expect(b.actors.find(a=>a.role==='yarn')!.statuses.some(s=>s.kind==='exposed')).toBe(true);
  });
  it('invalid and repeated choices are side effect free',()=>{
    const b=ready();const before=JSON.stringify(b);const invalid:TurnChoice={actorId:'guardian',skillId:'nineLives',targetId:'guardian'};
    expect(chooseAction(b,invalid)).toBe(false);expect(JSON.stringify(b)).toBe(before);
  });
});
