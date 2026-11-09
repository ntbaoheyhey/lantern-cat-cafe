import {describe,expect,it} from 'vitest';
import {CARDS} from '../../catalog';
import {CAT_BY_ID,STATUS_BY_ID} from '../catalog';
import {act,applyStatus,createBattle,currentActor,dispel,enemyAct,legalChoices,replayBattle,tickStatuses} from '../battle';
import {playBattle} from '../policies';
import {createDepthAccount} from '../state';
import {enterNode,startRun} from '../run';
import {exportSave,importSave,saveChecksum} from '../save';
import {setGameplayV4} from '../gameplay-v4';
import type {Actor,Battle,StatusId} from '../contract';
import {CORE_STATUS_RULES_V5,defenseV5,receivedV5,statusRuleV5} from './statuses';
import {setSkillsV5,skillsV5} from './index';
const setup=(on=true,enemies=['button-guard','sock-skipper'])=>({seed:1,chapter:1,gameplayV4:true,...(on?{skillsV5:true}:{}),cats:['mochi','soot','clover'].map(id=>({id,stats:{...CARDS.find(c=>c.id===id)!.baseStats},row:CAT_BY_ID[id]!.row,skills:CAT_BY_ID[id]!.skills.map(s=>s.id)})),enemies});
// Timing/interaction fixtures guarantee a landing; probability is tested separately.
function land(b:Battle,s:Actor,t:Actor,id:StatusId,n=1){const hit=s.effectHit;s.effectHit=100000;b.rng=1;expect(applyStatus(b,s,t,id,n)).toBe(true);s.effectHit=hit;}
const status=(a:Actor,id:StatusId)=>a.statuses.find(s=>s.id===id);
const direct=(b:Battle,id:string)=>b.log.filter(e=>e.kind==='damage'&&e.targetId===id).reduce((n,e)=>n+e.amount,0);

describe('Skills V5 core keywords',()=>{
 it.each(CORE_STATUS_RULES_V5)('$name shares one slot, caps, refreshes and cleanses/dispels',rule=>{
  const b=createBattle(setup()),s=b.actors[1]!,t=b.actors[0]!;
  land(b,s,t,rule.id,1);status(t,rule.id)!.remaining=1;b.round++;
  land(b,t,t,rule.id,99);expect(t.statuses.filter(x=>x.id===rule.id)).toHaveLength(1);
  expect(status(t,rule.id)).toMatchObject({stacks:rule.cap,remaining:rule.duration,source:t.id,appliedRound:b.round});
  dispel(b,s,t,rule.kind);expect(status(t,rule.id)).toBeUndefined();
 });
 it.each(CORE_STATUS_RULES_V5.filter(s=>s.kind==='debuff'))('$name uses effect hit/resist',rule=>{
  let low=0,high=0;
  for(let seed=1;seed<=100;seed++)for(const hit of [0,6000]){
   const b=createBattle(setup()),s=b.actors[1]!,t=b.actors[0]!;s.effectHit=hit;t.effectResist=5000;b.rng=seed;
   if(applyStatus(b,s,t,rule.id)){if(hit)high++;else low++;}
  }
  expect(high-low).toBeGreaterThan(25);
 });
 it('maps legacy Tangle/Hush/Rattled only when enabled',()=>{
  for(const [old,next]of [['tangle','brittle'],['hush','drowsy'],['rattled','drowsy']]as const){
   for(const on of [false,true]){const b=createBattle(setup(on));land(b,b.actors[1]!,b.actors[0]!,old);expect(status(b.actors[0]!,on?next:old)).toBeDefined();}
  }
 });
 it('resolves Regen before Burn regardless of application order; Warm and shield do not block Burn',()=>{
  const b=createBattle(setup()),s=b.actors[1]!,t=b.actors[0]!;t.hp=10;t.shield=100;
  land(b,s,t,'scald',2);land(b,s,t,'steep');land(b,s,t,'cozy',3);
  tickStatuses(b,t);expect(t.hp).toBe(16);expect(t.shield).toBe(100);
  expect(b.log.filter(e=>e.kind==='status-tick').map(e=>e.skillId)).toEqual(['steep','scald']);
  expect(status(t,'scald')).toMatchObject({stacks:1,remaining:2});
 });
 it('Bleed resolves before its bearer acts and shields absorb it',()=>{
  const b=createBattle(setup()),t=b.actors[0]!,s=b.actors[3]!;t.shield=10;const hp=t.hp;
  land(b,s,t,'snag',2);const choice=legalChoices(b).find(c=>c.skillId==='mochi-1')!;expect(act(b,choice)).toBe(true);
  expect(t.hp).toBe(hp-6);expect(t.shield).toBe(18);
  const tick=b.log.findIndex(e=>e.kind==='status-tick'&&e.skillId==='snag'),hit=b.log.findIndex(e=>e.kind==='damage');expect(tick).toBeLessThan(hit);
 });
 it('fatal Bleed consumes a legal turn without executing the selected skill',()=>{
  const b=createBattle(setup()),t=b.actors[0]!;t.hp=1;t.shield=0;land(b,b.actors[3]!,t,'snag');
  const n=b.log.length;expect(act(b,legalChoices(b)[0]!)).toBe(true);expect(t.hp).toBe(0);expect(b.log.slice(n).some(e=>e.actorId===t.id&&e.kind==='damage')).toBe(false);expect(b.acted).toContain(t.id);
 });
 it('Bitter halves healing and shielding, and expires after two round ends',()=>{
  const b=createBattle(setup()),t=b.actors[0]!;land(b,b.actors[1]!,t,'bitter');expect(receivedV5(t,80)).toBe(40);expect(receivedV5(t,70)).toBe(35);
  t.hp--;t.shield=0;expect(act(b,legalChoices(b).find(c=>c.skillId==='mochi-2'&&c.targetId===t.id)!)).toBe(true);expect(t.shield).toBe(35);
  t.hp=t.maxHp-100;land(b,b.actors[1]!,t,'steep');tickStatuses(b,t);expect(t.hp).toBe(t.maxHp-91);expect(status(t,'bitter')?.remaining).toBe(1);tickStatuses(b,t);expect(status(t,'bitter')).toBeUndefined();
 });
 it('Shred reduces defense by eight percent per stack; a direct hit strips 15 shield per stack',()=>{
  const b=createBattle(setup()),t=b.actors[3]!;land(b,b.actors[1]!,t,'brittle',3);expect(defenseV5(t)).toBeCloseTo(t.defense*.76);t.shield=500;
  const choice=legalChoices(b).find(c=>c.skillId==='mochi-1')!,before=t.shield;act(b,choice);
  const absorbed=b.log.filter(e=>e.kind==='absorbed'&&e.targetId===t.id).reduce((n,e)=>n+e.amount,0);expect(before-t.shield).toBe(45+absorbed);
 });
 it('Mark permits rear targeting and increases direct damage; Warm reduces direct damage',()=>{
  const run=(id?:StatusId,n=1)=>{const b=createBattle(setup()),t=b.actors[3]!;if(id)land(b,b.actors[1]!,t,id,n);b.rng=3;act(b,legalChoices(b).find(c=>c.skillId==='mochi-1'&&c.targetId===t.id)!);return direct(b,t.id);};
  expect(run('scent')).toBeGreaterThan(run());expect(run('cozy',3)).toBeLessThan(run());
  const b=createBattle(setup()),t=b.actors[4]!;land(b,b.actors[1]!,t,'scent');expect(legalChoices(b).some(c=>c.skillId==='mochi-1'&&c.targetId===t.id)).toBe(true);
 });
 it('Daze replaces a party support choice with a half-power basic, then grants one round immunity',()=>{
  const b=createBattle(setup()),t=b.actors[0]!;land(b,b.actors[3]!,t,'drowsy');
  act(b,legalChoices(b).find(c=>c.skillId==='mochi-2')!);expect([...b.log].reverse().find(e=>e.kind==='action')?.skillId).toBe('mochi-1');expect(status(t,'drowsy')).toBeUndefined();
  expect(t.cooldowns['mochi-2']).toBeUndefined();expect(t.cooldowns['mochi-1']).toBe(1);
  b.round=2;b.rng=1;expect(applyStatus(b,b.actors[3]!,t,'drowsy')).toBe(false);b.round=3;land(b,b.actors[3]!,t,'drowsy');
 });
 it('Daze survives a round end until the next own action',()=>{
  const b=createBattle(setup()),t=b.actors[0]!;land(b,b.actors[3]!,t,'drowsy');tickStatuses(b,t);expect(status(t,'drowsy')?.remaining).toBe(1);
 });
 it('boss Daze loses the signature without reducing the basic; boss Daze resistance is higher',()=>{
  const run=(dazed:boolean)=>{const b=createBattle(setup(true,['yarn-giant'])),t=b.actors[3]!;b.queue=[t.id];b.intents[0]!.signature=dazed;b.intents[0]!.power=175;if(dazed)land(b,b.actors[1]!,t,'drowsy');b.rng=3;enemyAct(b);return b.log.filter(e=>e.kind==='damage'&&e.actorId===t.id).map(e=>e.amount);};
  expect(run(true)).toEqual(run(false));
  let boss=0,regular=0;for(let seed=1;seed<=200;seed++){for(const bossMode of [false,true]){const b=createBattle(setup(true,[bossMode?'yarn-giant':'button-guard'])),t=b.actors[3]!;t.effectResist=0;b.rng=seed;if(applyStatus(b,b.actors[1]!,t,'drowsy')){if(bossMode)boss++;else regular++;}}}expect(regular-boss).toBeGreaterThan(30);
 });
 it('Burn plus Bleed share a six-percent boss HP budget that resets next round',()=>{
  const b=createBattle(setup(true,['yarn-giant'])),t=b.actors[3]!;t.maxHp=100;t.hp=100;t.shield=0;
  land(b,b.actors[1]!,t,'scald',5);land(b,b.actors[1]!,t,'snag',5);b.queue=[t.id];enemyAct(b);
  // Enemy action closes the round: its Bleed spends the entire six-HP budget before Burn.
  expect(t.hp).toBe(94);expect(b.log.filter(e=>e.kind==='status-tick'&&e.targetId===t.id).reduce((n,e)=>n+e.amount,0)).toBe(6);
  tickStatuses(b,t);expect(t.hp).toBe(88);
 });
 it('replays automatically with legal choices and no empty party turn',()=>{for(const seed of [1,11,30]){const b=playBattle(createBattle({...setup(),seed}),'auto');expect(replayBattle(b.initial,b.choices)).toEqual(b);}});
 it('OFF omits all V5 state, including an explicit false setup flag',()=>{const a=createBattle(setup(false)),b=createBattle({...setup(false),skillsV5:false});expect(b).toEqual(a);});
});

describe('Skills V5 save migration and committed mode',()=>{
 it.each([false,true])('loads old mode %s unchanged and defaults V5 off',v4=>{const old=v4?setGameplayV4(createDepthAccount(4),true):createDepthAccount(4),code=exportSave(old),loaded=importSave(code);expect(skillsV5(loaded)).toBe(false);expect(exportSave(loaded)).toBe(code);expect(importSave(exportSave(setSkillsV5(loaded,true)))).toEqual(setSkillsV5(loaded,true));});
 it('THC14 retains its flag, statuses and active battle while a next-run toggle stays separate',()=>{let s=setSkillsV5(createDepthAccount(4),true);s=enterNode(startRun(s,1,4).state,'0-0').state;expect(s.run?.skillsV5).toBe(true);expect(s.run?.battle?.initial.skillsV5).toBe(true);const b=s.run!.battle!;land(b,b.actors[1]!,b.actors[0]!,'snag');s=setSkillsV5(s,false);expect(skillsV5(s)).toBe(true);expect(exportSave(s)).toMatch(/^THC14\./);expect(importSave(exportSave(s))).toEqual(s);});
 it('rejects malformed optional flags without silently enabling new mechanics',()=>{const s=createDepthAccount(1),payload=JSON.stringify({...s,skillsV5:'true'});expect(()=>importSave(`THC14.${saveChecksum(payload)}.${payload}`)).toThrow();expect(statusRuleV5('snag',STATUS_BY_ID.snag).cap).toBe(5);expect(currentActor(createBattle(setup()))?.id).toBe('mochi');});
});
