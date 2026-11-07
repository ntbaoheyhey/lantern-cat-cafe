import { describe, it, expect } from 'vitest';
import * as R from './index';
import { clone } from '../internal';
function account(level=1){const s=R.setGameplayV4(R.createDepthAccount(7),true);s.account.cards.forEach(c=>c.level=level);return s;}
function boss(id='yarn-giant',extra:string[]=[]){return R.createBattle({seed:18,chapter:1,gameplayV4:true,cats:R.battleCats(account(6)),enemies:[id,...extra]});}
function attack(b:R.Battle,targetId:string){const c=R.legalChoices(b).find(c=>c.targetId===targetId&&R.SKILLS[c.skillId]?.effects.some(e=>e.kind==='hit'));expect(c).toBeDefined();return R.act(b,c!);}
describe('gameplay v4 encounter bands and boss lifecycle',()=>{
 it('snapshots a gear-independent band and preserves lower routes',()=>{
  const s=account(6),a=R.startRun(s,1,23).state;
  const bare=clone(s);bare.gear=[];bare.equipment={};
  const b=R.startRun(bare,1,23).state;
  expect(a.run!.challengeLevel).toBe(6);
  expect(R.enterNode(a,'0-0').state.run!.battle!.initial.enemyStats).toEqual(R.enterNode(b,'0-0').state.run!.battle!.initial.enemyStats);
  expect(R.startRun(s,1,23,'campaign','2026-11-06',1).state.run!.challengeLevel).toBe(1);
  for(const level of [0,7,NaN,1.5]){const r=R.startRun(s,1,23,'campaign','2026-11-06',level);expect(r.ok).toBe(false);expect(r.state).toBe(s);}
 });
 it('validates all declared content levels and freezes explicit snapshots',()=>{
  for(const level of [...Array.from({length:10},(_,i)=>i+1),50])expect(Object.values(R.challengeStatsV4(level)).every(s=>s.hp>0&&s.attack>0)).toBe(true);
  for(const level of [0,51,NaN,1.1])expect(()=>R.challengeStatsV4(level)).toThrow();
  const b=boss(),stats=clone(b.initial.enemyStats!);stats['yarn-giant']!.hp=123;
  expect(R.createBattle({...b.initial,challengeLevel:50,enemyStats:stats}).actors.find(a=>a.catalogId==='yarn-giant')!.maxHp).toBe(123);
 });
 it('emits one phase at exactly half health, never resets after healing',()=>{
  const b=boss(),e=b.actors.find(a=>a.side==='enemy')!;e.hp=e.maxHp/2;
  R.phaseBossV4(b,e);expect(e.phase).toBe(2);expect(b.v4!.events.filter(e=>e.kind==='boss-phase')).toHaveLength(1);
  e.hp=e.maxHp;R.phaseBossV4(b,e);e.hp=1;R.phaseBossV4(b,e);
  expect(b.v4!.events.filter(e=>e.kind==='boss-phase')).toHaveLength(1);
 });
 it('crosses phase immediately on damage rather than waiting for another round',()=>{
  const b=boss(),e=b.actors.find(a=>a.side==='enemy')!;e.hp=Math.floor(e.maxHp/2)+1;attack(b,e.id);
  expect(b.round).toBe(1);expect(e.phase).toBe(2);expect(b.v4!.events.some(e=>e.kind==='boss-phase')).toBe(true);
 });
 it('retires linked helpers in the lethal action and refuses any cleanup turn',()=>{
  const b=boss('yarn-giant',['binding-thread']),e=b.actors.find(a=>a.catalogId==='yarn-giant')!,add=b.actors.at(-1)!;
  expect(add.linkedBossId).toBe(e.id);e.hp=1;attack(b,e.id);
  expect(b.result).toBe('party');expect(add.hp).toBe(0);expect(b.queue).toEqual([]);
  expect(b.v4!.events.filter(e=>e.kind==='boss-finish')).toHaveLength(1);
  expect(b.v4!.events.some(e=>e.kind==='boss-phase')).toBe(false);
  const snapshot=clone(b);expect(R.enemyAct(b)).toBe(false);expect(R.legalChoices(b)).toEqual([]);R.finishBossV4(b);expect(b).toEqual(snapshot);
 });
 it('leaves unrelated enemies alive and does not retire twice',()=>{
  const b=boss('yarn-giant',['binding-thread']),e=b.actors.find(a=>a.catalogId==='yarn-giant')!,add=b.actors.at(-1)!;
  delete add.linkedBossId;e.hp=0;expect(R.finishBossV4(b)).toBe(false);expect(add.hp).toBeGreaterThan(0);expect(b.result).toBeNull();
  expect(R.finishBossV4(b)).toBe(false);expect(b.v4!.events.filter(e=>e.kind==='boss-finish')).toHaveLength(1);
 });
 it('gives party loss priority for simultaneous fatal outcomes',()=>{
  const b=boss('yarn-giant',['binding-thread']);b.actors.forEach(a=>{if(a.side==='party'||a.catalogId==='yarn-giant')a.hp=0;});
  R.finishBossV4(b);expect(b.result).toBe('enemy');expect(b.v4!.events.at(-1)).toMatchObject({kind:'boss-finish',outcome:'enemy'});
 });
 it('resolves a lethal enemy strike and lethal retaliation as a loss',()=>{
  const b=boss(),e=b.actors.find(a=>a.side==='enemy')!,cat=b.actors[0]!;
  b.actors.filter(a=>a.side==='party').forEach(a=>{a.hp=0;a.shield=0;});cat.hp=1;
  cat.statuses=[{id:'riposte',stacks:1,remaining:2,source:cat.id,appliedRound:0}];
  e.hp=1;b.queue=[e.id];b.intents[0]!.targetId=cat.id;
  expect(R.enemyAct(b)).toBe(true);expect(cat.hp).toBe(0);expect(e.hp).toBe(0);expect(b.result).toBe('enemy');
  expect(b.v4!.events.at(-1)).toMatchObject({kind:'boss-finish',outcome:'enemy'});
 });
 it('does not list already defeated helpers as newly retired',()=>{
  const b=boss('yarn-giant',['binding-thread']);b.actors.filter(a=>a.side==='enemy').forEach(a=>a.hp=0);R.finishBossV4(b);
  expect(b.v4!.events.at(-1)).toMatchObject({kind:'boss-finish',retiredIds:[]});
 });
 it('stops round-end processing immediately after a boss damage-over-time defeat',()=>{
  const b=boss('yarn-giant',['binding-thread']),e=b.actors.find(a=>a.catalogId==='yarn-giant')!,add=b.actors.at(-1)!;
  e.hp=1;e.statuses=[{id:'scald',stacks:1,remaining:3,source:'soot',appliedRound:0}];
  add.statuses=[{id:'scald',stacks:1,remaining:3,source:'soot',appliedRound:0}];b.queue=['mochi'];
  const c=R.legalChoices(b).find(c=>c.skillId==='defend')!;expect(R.act(b,c)).toBe(true);expect(b.result).toBe('party');
  const finish=b.log.findIndex(e=>e.kind==='retire');expect(finish).toBeGreaterThan(0);expect(b.log.slice(finish+1).some(e=>['dot','heal','damage'].includes(e.kind))).toBe(false);
 });
 it('replays all three bosses and preserves saved challenge bands',()=>{
  for(let chapter=1;chapter<=3;chapter++){
   const s=account(6);s.cleared=[1,2,3];const run=R.startRun(s,chapter,78).state;
   const b=R.playBattle(R.createBattle({seed:78,chapter,gameplayV4:true,challengeLevel:6,cats:R.battleCats(s),enemies:[R.CHAPTERS[chapter-1]!.boss,'binding-thread']}),'auto');
   expect(R.replayBattle(b.initial,b.choices)).toEqual(b);
   expect(R.importSave(R.exportSave(run))).toEqual(run);expect(R.exportSave(run)).toMatch(/^THC10\./);
  }
 });
 it('keeps OFF encounters free of new band and link fields',()=>{
  const s=R.startRun(R.createDepthAccount(),1,7).state;expect(s.run!.challengeLevel).toBeUndefined();
  const b=R.createBattle({seed:7,chapter:1,cats:R.battleCats(s),enemies:['yarn-giant','binding-thread']});
  expect(b.v4).toBeUndefined();expect(b.actors.every(a=>a.linkedBossId===undefined)).toBe(true);
  b.actors.find(a=>a.catalogId==='yarn-giant')!.hp=0;expect(R.finishBossV4(b)).toBe(false);expect(b.actors.at(-1)!.hp).toBeGreaterThan(0);
 });
});
