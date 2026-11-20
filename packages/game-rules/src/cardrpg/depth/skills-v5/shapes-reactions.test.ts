import {describe,expect,it} from 'vitest';
import {CARDS} from '../../catalog';
import {CAT_BY_ID,STATUS_BY_ID} from '../catalog';
import {applyStatus,createBattle,replayBattle} from '../battle';
import {playBattle} from '../policies';
import type {Actor,Battle,StatusId} from '../contract';
import {adjacentV5,executeShapeV5,landingsV5,type ShapeRuntimeV5,type SkillV5} from './shapes';
import {canReactV5,crumbBurstV5,directReactionV5,spreadV5,type ReactionRuntimeV5} from './reactions';
function battle():Battle {
  return createBattle({seed:3,chapter:1,gameplayV4:true,skillsV5:true,cats:['mochi','mallow','clover'].map(id=>({id,stats:CARDS.find(c=>c.id===id)!.baseStats,row:CAT_BY_ID[id]!.row,skills:CAT_BY_ID[id]!.skills.map(s=>s.id)})),enemies:['button-guard','sock-skipper','teacup-healer','kettle-knight']});
}
function put(a:Actor,id:StatusId,stacks=1){a.statuses.push({id,stacks,remaining:3,source:'mallow',appliedRound:1});}
function runtime(events:string[]):ReactionRuntimeV5 {
  return {rule:id=>STATUS_BY_ID[id],apply:(b,s,t,id,n)=>{const hit=s.effectHit;s.effectHit=100000;b.rng=1;const landed=applyStatus(b,s,t,id,n);s.effectHit=hit;return landed;},loseHp:(b,s,t,n)=>{const amount=Math.min(t.hp,n);t.hp-=amount;spreadV5(b,s,t,runtime(events));return amount;},record:(_b,_s,_t,_k,_n,_text,id)=>{events.push(id);}};
}
describe('Skills V5 shapes',()=>{
  it('single/pierce, row, splash, all and bounce keep specified landing powers',()=>{
    const b=battle(),a=b.actors[0]!,main=b.actors[3]!,roll=()=>0;
    expect(landingsV5(b,a,main,'single',roll).map(x=>x.multiplier)).toEqual([1]);
    expect(landingsV5(b,a,main,'pierce',roll).map(x=>x.multiplier)).toEqual([1]);
    const row=landingsV5(b,a,main,'row',roll);expect(row.length).toBeGreaterThan(1);expect(row.every(x=>x.multiplier===.6&&x.target.row===main.row)).toBe(true);
    expect(landingsV5(b,a,b.actors[4]!,'splash',roll).map(x=>x.multiplier)).toEqual([1,.4,.4]);
    expect(landingsV5(b,a,main,'all',roll).map(x=>x.multiplier)).toEqual([.6,.6,.6,.6]);
    const bounce=landingsV5(b,a,main,'bounce',roll);expect(bounce.map(x=>x.multiplier)).toEqual([1,.7,.5]);expect(new Set(bounce.map(x=>x.target.id)).size).toBe(3);
  });
  it('adjacency follows stable formation order and skips defeated neighbours',()=>{
    const b=battle();b.actors[4]!.hp=0;expect(adjacentV5(b,b.actors[3]!).map(a=>a.id)).toEqual([b.actors[5]!.id]);
  });
  it('weakest/ally-row/team/self/fallen stay on the intended ally side',()=>{
    const b=battle(),a=b.actors[0]!,hurt=b.actors[2]!;hurt.hp=1;
    expect(landingsV5(b,a,a,'weakest',()=>0)[0]!.target.id).toBe(hurt.id);
    expect(landingsV5(b,a,hurt,'ally-row',()=>0).every(x=>x.target.side==='party'&&x.target.row===hurt.row)).toBe(true);
    expect(landingsV5(b,a,a,'team',()=>0)).toHaveLength(3);
    expect(landingsV5(b,a,hurt,'self',()=>0)[0]!.target.id).toBe(a.id);
    hurt.hp=0;expect(landingsV5(b,a,hurt,'fallen',()=>0)[0]!.target.id).toBe(hurt.id);
  });
  it('three random hits use the seeded draw and apply per-hit statuses before the next hit',()=>{
    const b=battle(),a=b.actors[0]!,main=b.actors[3]!,events:string[]=[],ids:string[]=[];
    const skill:SkillV5={...CAT_BY_ID.mochi!.skills[0]!,shape:'multi-hit',effects:[{kind:'hit',power:100},{kind:'rally',status:'snag'}]};
    let draws=0;const io:ShapeRuntimeV5={roll:(_b,n)=>{draws++;return (draws-1)%n;},record:(_b,_a,t)=>{ids.push(t.id);},effect:(_b,_a,t,e)=>{events.push(`${e.kind}:${e.power??e.status}:${t.id}`);}};
    executeShapeV5(b,a,main,skill,io);expect(draws).toBe(3);expect(ids).toEqual(b.actors.slice(3,6).map(a=>a.id));expect(events.map(x=>x.split(':').slice(0,2).join(':'))).toEqual(['hit:40','rally:snag','hit:40','rally:snag','hit:40','rally:snag']);
  });
  it('later random hits retarget after a defeat; self and weakest effects run once',()=>{
    const b=battle(),a=b.actors[0]!,events:string[]=[];
    const skill:SkillV5={...CAT_BY_ID.mochi!.skills[0]!,shape:'multi-hit',effects:[{kind:'hit',power:100},{kind:'shield',power:18,self:true},{kind:'heal',power:18,recipient:'weakest'}]};
    executeShapeV5(b,a,b.actors[3]!,skill,{roll:()=>0,record:()=>{},effect:(_b,_a,t,e)=>{events.push(e.kind+':'+t.id);if(e.kind==='hit')t.hp=0;}});
    expect(events.filter(s=>s.startsWith('hit:'))).toEqual(b.actors.slice(3,6).map(a=>'hit:'+a.id));expect(events.filter(s=>s.startsWith('shield:'))).toHaveLength(1);expect(events.filter(s=>s.startsWith('heal:'))).toHaveLength(1);
  });
});
describe('Skills V5 reactions',()=>{
  it('Crumb Burst needs Crumb and detonate, fires once, and resets next round',()=>{
    const b=battle(),s=b.actors[0]!,t=b.actors[3]!,events:string[]=[],io=runtime(events);let detonations=0;
    expect(crumbBurstV5(b,s,t,io,()=>{detonations++;})).toBe(false);put(t,'crumb',2);
    expect(directReactionV5(b,s,t,'single',io)).toBe(false);
    expect(crumbBurstV5(b,s,t,io,()=>{detonations++;})).toBe(true);expect(crumbBurstV5(b,s,t,io,()=>{detonations++;})).toBe(false);
    expect(detonations).toBe(1);b.round++;expect(crumbBurstV5(b,s,t,io,()=>{detonations++;})).toBe(true);expect(events).toEqual(['crumb-burst','crumb-burst']);
  });
  it('Wildfire needs three Burn and a wide hit, adds one to neighbours without chaining',()=>{
    const b=battle(),s=b.actors[0]!,t=b.actors[4]!,events:string[]=[],io=runtime(events);put(t,'scald',2);
    expect(directReactionV5(b,s,t,'splash',io)).toBe(false);t.statuses[0]!.stacks=3;
    for(const shape of ['single','pierce','bounce','multi-hit']as const)expect(directReactionV5(b,s,t,shape,io)).toBe(false);
    expect(directReactionV5(b,s,t,'splash',io)).toBe(true);expect(adjacentV5(b,t).map(a=>a.statuses.find(s=>s.id==='scald')?.stacks)).toEqual([1,1]);expect(events).toEqual(['wildfire']);
    expect(directReactionV5(b,s,t,'row',io)).toBe(false);b.round++;expect(directReactionV5(b,s,t,'all',io)).toBe(true);
  });
  it('a lethal unmarked wide hit can spread Burn without a second reaction',()=>{
    const b=battle(),s=b.actors[0]!,t=b.actors[4]!,events:string[]=[],io=runtime(events);put(t,'scald',3);t.hp=0;
    expect(directReactionV5(b,s,t,'row',io)).toBe(true);expect(events).toEqual(['wildfire']);expect(adjacentV5(b,t).every(a=>a.statuses.some(s=>s.id==='scald'))).toBe(true);
    expect(directReactionV5(b,s,t,'all',io)).toBe(false);
  });
  it('Rupture needs Bleed and Shred, consumes all Bleed, bypasses shield and cannot chain Spread',()=>{
    const b=battle(),s=b.actors[0]!,t=b.actors[3]!,events:string[]=[],io=runtime(events);put(t,'snag',5);t.shield=500;
    expect(directReactionV5(b,s,t,'single',io)).toBe(false);put(t,'brittle');put(t,'scent');t.hp=50;
    expect(directReactionV5(b,s,t,'single',io)).toBe(true);expect(t.hp).toBe(0);expect(t.shield).toBe(500);expect(t.statuses.some(s=>s.id==='snag')).toBe(false);expect(events).toEqual(['rupture']);expect(b.actors[4]!.statuses).toEqual([]);
  });
  it('Spread needs a marked defeat and transfers only debuffs with half stacks rounded up',()=>{
    const b=battle(),s=b.actors[0]!,t=b.actors[4]!,events:string[]=[],io=runtime(events);put(t,'scent');put(t,'scald',5);put(t,'snag',3);put(t,'cozy',3);
    expect(spreadV5(b,s,t,io)).toBe(false);t.hp=0;expect(spreadV5(b,s,t,io)).toBe(true);
    expect(b.actors[3]!.statuses.map(s=>[s.id,s.stacks])).toEqual([['scent',1],['scald',3],['snag',2]]);expect(events).toEqual(['spread']);expect(spreadV5(b,s,t,io)).toBe(false);
    const other=b.actors[6]!;other.hp=0;expect(spreadV5(b,s,other,io)).toBe(false);
  });
  it('one shared cap covers competing reactions and never leaks the nesting guard',()=>{
    const b=battle(),s=b.actors[0]!,t=b.actors[3]!,events:string[]=[],io=runtime(events);put(t,'snag');put(t,'brittle');put(t,'crumb');put(t,'scald',3);
    expect(directReactionV5(b,s,t,'row',io)).toBe(true);expect(canReactV5(b,t)).toBe(false);expect(crumbBurstV5(b,s,t,io,()=>{})).toBe(false);expect(b.procRounds.v5ReactionDepth).toBeUndefined();expect(events).toEqual(['rupture']);
  });
  it('automatic full battles replay byte-for-byte with the same reaction order',()=>{
    for(const seed of [3,13,23]){const b=battle();const result=playBattle(createBattle({...b.initial,seed}),'auto');expect(replayBattle(result.initial,result.choices)).toEqual(result);}
  });
});
