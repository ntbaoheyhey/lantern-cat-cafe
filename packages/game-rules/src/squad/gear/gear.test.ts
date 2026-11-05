import { describe, expect, it } from 'vitest';
import { SQUAD_ITEMS, ITEM_BY_ID, GEAR_SLOTS, describeItem } from './catalog';
import { applyEquipment, effectiveSkill, gearBonuses } from './equipment';
import { offerLoot, runSummary } from './run';
import { createTurnBattle, startTurn, chooseAction, resolveAction, endTurn, getAutoAction, getLegalActions, getLegalTargets, getTimeline,
  equipGear, autoEquipGear, resetGear, beginRun, chooseLoot, continueRun, replayRun } from '../turn/engine';
import { TURN_SKILLS } from '../turn/config';
import type { Hero, TurnBattle } from '../turn/types';
const setup=(hero:Hero='guardian',item?:string,boss=false)=>{
  const b=createTurnBattle({seed:19,encounter:boss?'boss':'group'});
  const a=b.actors.find(a=>a.id===hero)!;a.hp-=120;a.charge=100;
  if(item)a.equipment[ITEM_BY_ID[item]!.slot]=item;
  b.queue.sort((a,z)=>Number(z.actorId===hero)-Number(a.actorId===hero));startTurn(b);return b;
};
const act=(b:TurnBattle,id:string,target?:string)=>{
  const chosen=target??getLegalTargets(b,id).find(t=>t.legal)!.actorId;
  expect(chooseAction(b,{actorId:b.activeId!,skillId:id,targetId:chosen})).toBe(true);
  return resolveAction(b);
};
const hero=(b:TurnBattle,id='guardian')=>b.actors.find(a=>a.id===id)!;

describe('original item and ownership rules',()=>{
  it('has 24 class pieces, six shared pieces, one named Rare+ property and at most two affixes',()=>{
    expect(SQUAD_ITEMS).toHaveLength(30);expect(new Set(SQUAD_ITEMS.map(i=>i.id)).size).toBe(30);
    expect(SQUAD_ITEMS.filter(i=>['charm','relic'].includes(i.slot))).toHaveLength(6);
    for(const i of SQUAD_ITEMS){expect(i.affixes.length).toBeLessThanOrEqual(2);expect(i.main.value).toBeGreaterThan(0);expect(describeItem(i)).toMatch(/[0-9]/);expect(i.flavor.length).toBeGreaterThan(15);if(['Rare','Epic','Legendary'].includes(i.rarity))expect(i.property).toBeTruthy()}
  });
  it('class fit, ownership, slot and combat locking reject without mutating anything',()=>{
    const b=createTurnBattle({gearMode:'starter',interactive:true});
    for(const [h,s,id] of [['guardian','weapon','w-needle'],['witch','outfit','w-needle'],['witch','weapon','w-orbit']] as const){const before=JSON.stringify(b);expect(equipGear(b,h,s,id)).toBe(false);expect(JSON.stringify(b)).toBe(before)}
    expect(beginRun(b)).toBe(true);const before=JSON.stringify(b);expect(equipGear(b,'guardian','weapon',null)).toBe(false);expect(JSON.stringify(b)).toBe(before);
  });
  it('auto-equip and reset are deterministic, with no duplicate shared instances',()=>{
    const b=createTurnBattle({gearMode:'high',interactive:true});expect(autoEquipGear(b)).toBe(true);
    const ids=b.actors.flatMap(a=>Object.values(a.equipment));expect(new Set(ids).size).toBe(ids.length);
    const before=b.actors.map(a=>a.equipment);autoEquipGear(b);expect(b.actors.map(a=>a.equipment)).toEqual(before);
    expect(resetGear(b)).toBe(true);expect(hero(b,'witch').equipment.weapon).toBe('w-orbit');
  });
  it('equipping at rest cannot heal damage by toggling max HP',()=>{
    const b=createTurnBattle({gearMode:'high',interactive:true});b.run.stage='rest';b.turn=2;const a=hero(b);a.hp=80;
    for(let n=0;n<8;n++){equipGear(b,'guardian','outfit','g-apron');equipGear(b,'guardian','outfit','g-coat')}
    expect(a.hp).toBe(80);
  });
});

describe('each named property changes actual deterministic outcomes',()=>{
  it('Needle Lantern chains once to another target',()=>{
    const b=setup('witch','w-needle');const events=act(b,'witchBasic');
    expect(events.filter(e=>e.type==='damage')).toHaveLength(2);expect(new Set(events.filter(e=>e.type==='damage').flatMap(e=>e.targetIds)).size).toBe(2);
    const plain=setup('witch');expect(act(plain,'witchBasic').filter(e=>e.type==='damage')).toHaveLength(1);
  });
  it('Doorbell shields the next ally in remaining order',()=>{
    const b=setup('guardian','g-bell'),next=getTimeline(b).find(s=>s.actorId!=='guardian'&&hero(b,s.actorId).side==='party')!;
    act(b,'rally','guardian');expect(hero(b,next.actorId).shield).toBeGreaterThan(0);expect(hero(b,'guardian').shield).toBeGreaterThan(0);
  });
  it('Last Light adds shield after Milk Flask',()=>{
    const b=setup('alchemist','a-kettle'),plain=setup('alchemist');hero(b).hp-=250;hero(plain).hp-=250;
    act(b,'milkFlask','guardian');act(plain,'milkFlask','guardian');expect(hero(b).shield).toBeGreaterThan(hero(plain).shield);
  });
  it('First Customer advances next round Initiative without repeating the action',()=>{
    const b=setup('guardian','c-bell'),a=hero(b),rank=a.initiative;act(b,'guardianBasic');endTurn(b);
    expect(a.initiative).toBeGreaterThan(rank);expect(b.queue.some(s=>s.actorId===a.id)).toBe(false);
    expect(getTimeline(b).filter(s=>s.actorId===a.id)).toHaveLength(1);
  });
  it('Orbiting Tealight lengthens burn by a whole round',()=>{
    const b=setup('witch','w-orbit'),plain=setup('witch');act(b,'emberOrb');act(plain,'emberOrb');
    expect(b.actors.find(a=>a.statuses.some(s=>s.kind==='burn'))!.statuses.find(s=>s.kind==='burn')!.rounds).toBe(3);
    expect(plain.actors.find(a=>a.statuses.some(s=>s.kind==='burn'))!.statuses.find(s=>s.kind==='burn')!.rounds).toBe(2);
  });
  it('renew adds healing and efficiency reduces actual ultimate cost',()=>{
    const b=setup('alchemist','a-garden'),plain=setup('alchemist');hero(b).hp=20;hero(plain).hp=20;
    act(b,'milkFlask','guardian');act(plain,'milkFlask','guardian');expect(hero(b).hp).toBeGreaterThan(hero(plain).hp);
    const efficient=setup('witch','w-robe');act(efficient,'lanternstorm');expect(hero(efficient,'witch').charge).toBe(31);
  });
  it('Sunspoon changes boss stagger, not just the tooltip',()=>{
    const b=setup('guardian','g-sun',true);act(b,'shieldBash');expect(b.actors.find(a=>a.role==='yarn')!.break).toBe(45);
    const plain=setup('guardian',undefined,true);act(plain,'shieldBash');expect(plain.actors.find(a=>a.role==='yarn')!.break).toBe(30);
  });
  it('Second Chair cleanses guard recipients',()=>{
    const b=setup('guardian','g-mantle');hero(b).statuses.push({kind:'burn',rounds:3,source:'witch',strength:1,appliedRound:1});
    act(b,'rally','guardian');expect(hero(b).statuses.some(s=>s.kind==='burn')).toBe(false);
  });
  it('Inkpetal returns HP once per damaging action and Starry Cloak adds charge',()=>{
    const b=setup('witch','w-cape'),a=hero(b,'witch'),hp=a.hp;act(b,'witchBasic');expect(a.hp).toBeGreaterThan(hp);
    const charged=setup('witch','w-cloak');hero(charged,'witch').charge=0;act(charged,'witchBasic');expect(hero(charged,'witch').charge).toBe(22);
  });
  it('Quilted Return reflects once per incoming action and cannot recurse forever',()=>{
    const b=createTurnBattle({encounter:'group'}),g=hero(b);g.equipment.outfit='g-quilt';g.shield=200;
    const enemy=b.actors.find(a=>a.role==='guard')!;b.queue.sort((a,z)=>Number(z.actorId===enemy.id)-Number(a.actorId===enemy.id));startTurn(b);
    const events=act(b,'guardAttack','guardian');expect(events.filter(e=>e.type==='damage'&&e.skillId==='thorns')).toHaveLength(1);expect(enemy.hp).toBeLessThan(enemy.maxHp);
  });
});

describe('sets, stats, loot and consumables',()=>{
  it.each([
    ['hearthloom',['g-pan','g-quilt','c-bell']],['moonwick',['w-whisk','w-cape','r-wick']],['mossbrew',['a-spout','a-smock','c-leaf']],
  ] as const)('%s has distinct active two- and three-piece bonuses',(set,ids)=>{
    const eq=Object.fromEntries(ids.map(id=>[ITEM_BY_ID[id]!.slot,id]));const g=gearBonuses(eq);expect(g.sets[set]).toBe(3);
    expect(g.properties).toContain({hearthloom:'neighborShield',moonwick:'efficient',mossbrew:'renew'}[set]);
    const b=setup({hearthloom:'guardian',moonwick:'witch',mossbrew:'alchemist'}[set] as Hero);const a=hero(b,b.activeId!);a.equipment=eq;applyEquipment(a,b.preset);
    expect(a.setBonuses).toContain(`${set}:3`);
    if(set==='moonwick')expect(effectiveSkill(a,TURN_SKILLS.lanternstorm!).chargeCost).toBe(85);
    if(set==='mossbrew')expect(effectiveSkill(a,TURN_SKILLS.milkFlask!).cleanse).toBe(true);
    if(set==='hearthloom'){act(b,'rally',a.id);expect(b.actors.filter(a=>a.side==='party'&&a.shield>0)).toHaveLength(2)}
  });
  it('equipment stats feed attack, defense, HP, crit, initiative and cooldown rounds',()=>{
    const b=setup('witch','w-robe'),a=hero(b,'witch'),hp=a.maxHp;applyEquipment(a,b.preset);expect(a.maxHp).toBeGreaterThan(hp);
    expect(effectiveSkill(a,TURN_SKILLS.emberOrb!).cooldown).toBe(1);
    a.equipment.weapon='w-orbit';const attack=a.attack;applyEquipment(a,b.preset);expect(a.attack).toBeGreaterThan(attack);expect(a.crit).toBeGreaterThan(.12);
  });
  it('loot is three distinct deterministic choices and never consumes combat RNG',()=>{
    const b=createTurnBattle({seed:15,gearMode:'starter'}),rng=b.rng;const offer=offerLoot(b);expect(offerLoot(b)).toEqual(offer);expect(new Set(offer).size).toBe(3);expect(b.rng).toBe(rng);
    b.run.stage='loot';b.run.loot=offer;expect(chooseLoot(b,offer[0]!)).toBe(true);expect(b.run.inventory).toContain(offer[0]);expect(chooseLoot(b,offer[1]!)).toBe(false);expect(b.run.itemsFound).toHaveLength(1);
  });
  it.each(['healTonic','shieldBiscuit','cleanseTea','ultimateTreat'])('%s spends a finite charge and an ordinary action',id=>{
    const b=setup(),before=b.run.consumables[id as keyof typeof b.run.consumables];hero(b,'witch').hp-=100;hero(b,'witch').charge=20;
    const events=act(b,id,'witch');expect(b.run.consumables[id as keyof typeof b.run.consumables]).toBe(before-1);expect(b.history).toHaveLength(1);
    expect(events.some(e=>['heal','shield','charge'].includes(e.type))).toBe(true);
    endTurn(b);expect(b.queue.some(s=>s.actorId==='guardian')).toBe(false);
  });
  it('Quicken Yarn moves only a pending ally and respects the per-round cap',()=>{
    const b=setup(),id='alchemist',before=b.queue.findIndex(s=>s.actorId===id),size=b.queue.length;
    act(b,'quickenYarn',id);expect(b.queue.findIndex(s=>s.actorId===id)).toBe(Math.max(0,before-2));expect(b.queue).toHaveLength(size);
    expect(getLegalTargets(b,'quickenYarn').find(t=>t.actorId===id)!.legal).toBe(false);
  });
  it('depleted supplies cannot be chosen and never underflow',()=>{
    const b=setup();b.run.consumables.healTonic=0;const before=JSON.stringify(b);
    expect(getLegalActions(b).find(a=>a.skill.id==='healTonic')!.legal).toBe(false);
    expect(chooseAction(b,{actorId:'guardian',skillId:'healTonic',targetId:'witch'})).toBe(false);expect(JSON.stringify(b)).toBe(before);
  });
  it('replays the complete interactive run including preparation, loot and rest deterministically',()=>{
    const options={seed:11,gearMode:'starter' as const,interactive:true};const b=createTurnBattle(options);
    equipGear(b,'guardian','weapon','g-ladle');beginRun(b);
    for(let n=0;n<650&&!b.result;n++){
      if(b.run.stage==='loot'){chooseLoot(b,b.run.loot[0]!);continue}
      if(b.run.stage==='rest'){continueRun(b);continue}
      startTurn(b);if(b.phase==='choose'){const c=getAutoAction(b,'active')!;expect(chooseAction(b,c)).toBe(true);resolveAction(b)}endTurn(b);
    }
    expect(b.result).not.toBeNull();const replay=replayRun(options,b.run.commands);
    expect(replay.events).toEqual(b.events);expect(replay.result).toEqual(b.result);expect(replay.run).toEqual(b.run);
    expect(runSummary(b).rounds).toBeGreaterThan(1);expect(runSummary(b).mvp).toBeTruthy();
  });
});
