import {describe,expect,it} from 'vitest';
import {CARDS} from '../../catalog';
import {CAT_BY_ID} from '../catalog';
import {act,applyStatus,createBattle,currentActor,enemyAct,legalChoices,replayBattle} from '../battle';
import {playBattle,chooseAction} from '../policies';
import {createDepthAccount} from '../state';
import {startRun,enterNode} from '../run';
import {exportSave,importSave,saveChecksum} from '../save';
import {setSkillsV5} from './index';
import {validBattleEventV5} from './events';
import {emitGameplayEvent} from '../events-v4';
const setup=(v5=true)=>({seed:3,chapter:1,gameplayV4:true,...(v5?{skillsV5:true}:{}),cats:['velvet','biscuit','brioche'].map(id=>({id,stats:{...CARDS.find(c=>c.id===id)!.baseStats},row:CAT_BY_ID[id]!.row,skills:CAT_BY_ID[id]!.skills.map(s=>s.id)})),enemies:['button-guard','sock-skipper','needle-moth']});
describe('Skills V5 events v2',()=>{
  it('records normalized status/source/target and exclusive log boundaries',()=>{
    const b=createBattle(setup()),source=b.actors[0]!,target=b.actors[3]!;source.effectHit=100000;b.rng=1;
    applyStatus(b,source,target,'tangle',2);
    const e=b.v4!.events.at(-1)!;
    expect(e).toMatchObject({version:2,kind:'status-applied',statusId:'brittle',stacks:2,sourceId:source.id,targetId:target.id,actionId:0,stage:'setup',logIndex:b.log.length});
    expect(validBattleEventV5(e,e.sequence,true)).toBe(true);
  });
  it('keeps three seeded landings in order, including repeated targets',()=>{
    const b=createBattle(setup()),actor=b.actors[1]!;b.queue=[actor.id,...b.queue.filter(id=>id!==actor.id)];const offset=b.log.length;
    expect(act(b,legalChoices(b).find(c=>c.skillId==='biscuit-1')!)).toBe(true);
    const e=b.v4!.events.find(e=>e.kind==='multi-hit'&&e.skillId==='biscuit-1');
    expect(e).toMatchObject({version:2,actionId:1,stage:'action',shape:'multi-hit'});
    if(e?.kind!=='multi-hit')throw Error('missing event');
    expect(e.targets).toEqual(b.log.slice(offset).filter(e=>e.kind==='multi-hit').map(e=>e.targetId));expect(e.targets).toHaveLength(3);
  });
  it('preserves event chronology, capped reactions and deterministic replay through a full fight',()=>{
    const b=playBattle(createBattle(setup()),'auto'),events=b.v4!.events;
    expect(events.every((e,i)=>validBattleEventV5(e,i,true))).toBe(true);
    expect(events.every(e=>e.version===2)).toBe(true);
    let action=0,log=0;const caps=new Set<string>();
    for(const e of events){if(e.version!==2)throw Error('version');expect(e.actionId).toBeGreaterThanOrEqual(action);expect(e.logIndex).toBeGreaterThanOrEqual(log);expect(e.logIndex).toBeLessThanOrEqual(b.log.length);action=e.actionId;log=e.logIndex;
      if(e.kind==='reaction'){const key=`${e.round}/${e.targetId}`;expect(caps.has(key)).toBe(false);caps.add(key);expect(e.primerIds.length).toBeGreaterThan(0);expect(e.targets.length).toBeGreaterThan(0);}}
    expect(events.some(e=>e.kind==='reaction')).toBe(true);expect(replayBattle(b.initial,b.choices)).toEqual(b);
  });
  it('marks pre-action Bleed as action timing and Regen/Burn as round-end timing',()=>{
    const b=createBattle(setup()),a=b.actors[0]!;a.statuses.push({id:'snag',stacks:1,remaining:3,source:a.id,appliedRound:1},{id:'scald',stacks:1,remaining:3,source:a.id,appliedRound:1});
    const initialRound=b.round;
    while(!b.result&&b.round===initialRound){if(currentActor(b)?.side==='enemy')enemyAct(b);else act(b,chooseAction(b,'auto'));}
    const ticks=b.v4!.events.filter(e=>e.kind==='status-tick');expect(ticks.some(e=>e.kind==='status-tick'&&e.statusId==='snag')).toBe(true);
    expect(ticks.some(e=>e.kind==='status-tick'&&e.statusId==='scald')).toBe(true);
    for(const e of ticks){if(e.kind!=='status-tick'||e.version!==2)throw Error('tick');expect(e.stage).toBe(e.statusId==='snag'?'action':'round-end');expect(e.sourceId).toBeTruthy();expect(e.targetId).toBeTruthy();}
  });
  it('leaves OFF events version1 without V5 timing fields',()=>{
    const b=playBattle(createBattle(setup(false)),'auto');expect(b.v4!.events.length).toBeGreaterThan(0);
    for(const e of b.v4!.events){expect(e.version).toBe(1);expect(e).not.toHaveProperty('actionId');expect(validBattleEventV5(e,e.sequence,false)).toBe(true);}
    expect(()=>emitGameplayEvent(b,{kind:'multi-hit',skillId:'biscuit-1',shape:'multi-hit',targets:['x'],text:'x'})).toThrow();
  });
  it('rejects malformed payloads and V2 when the flag is off',()=>{
    const e={version:2,sequence:0,round:1,actionId:1,logIndex:2,stage:'action',kind:'status-tick',statusId:'snag',sourceId:'velvet',targetId:'mochi',amount:8,text:'Bleed'};
    expect(validBattleEventV5(e,0,true)).toBe(true);expect(validBattleEventV5(e,0,false)).toBe(false);
    for(const bad of [{amount:-1},{statusId:'unknown'},{sourceId:''},{actionId:-1},{logIndex:1.5},{stage:'random'},{sequence:3}])expect(validBattleEventV5({...e,...bad},0,true)).toBe(false);
  });
});
describe('Skills V5 event save migration',()=>{
  const saved=()=>enterNode(startRun(setSkillsV5(createDepthAccount(4),true),1,4).state,'0-0').state;
  it('THC15 roundtrips V2 battle events and continues identically',()=>{
    const s=saved(),b=s.run!.battle!;act(b,chooseAction(b,'auto'));const code=exportSave(s);expect(code).toMatch(/^THC15\./);
    const loaded=importSave(code);expect(loaded).toEqual(s);expect(playBattle(loaded.run!.battle!,'auto')).toEqual(playBattle(b,'auto'));
  });
  it('loads a historical THC14 with V1 events without mutating the saved snapshot',()=>{
    const s=saved(),b=s.run!.battle!;b.v4!.events=b.v4!.events.map(e=>{const rest=Object.fromEntries(Object.entries(e).filter(([key])=>!['actionId','stage','logIndex'].includes(key)));return {...rest,version:1} as typeof e;});
    const payload=JSON.stringify(s),code=`THC14.${saveChecksum(payload)}.${payload}`;expect(importSave(code)).toEqual(s);expect(exportSave(importSave(code))).toMatch(/^THC15\./);
  });
});
