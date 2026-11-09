import {describe,expect,it} from 'vitest';
import {CARDS} from '../../catalog';
import {CATS,CAT_BY_ID,SKILLS} from '../catalog';
import {act,createBattle,currentActor,enemyAct,legalChoices,replayBattle,skillById} from '../battle';
import {chooseAction,playBattle} from '../policies';
import type {Actor,Battle,StatusId} from '../contract';
import {COMBO_ROLES_V5,CREWS_V5,describeSkillV5,kitSkillV5} from './kits';
import {enemyActionV5,enemyIntentV5,type EnemyRuntimeV5} from './enemies';
import {shapeV5} from './shapes';
function battle(cats:readonly string[]=['mochi','mallow','clover'],enemies=['button-guard','sock-skipper'],seed=3):Battle {
  return createBattle({seed,chapter:1,gameplayV4:true,skillsV5:true,cats:cats.map(id=>({id,stats:{...CARDS.find(c=>c.id===id)!.baseStats},row:CAT_BY_ID[id]!.row,skills:CAT_BY_ID[id]!.skills.map(s=>s.id)})),enemies});
}
function put(a:Actor,id:StatusId,stacks=1){a.statuses.push({id,stacks,remaining:3,source:'mallow',appliedRound:1});}
function use(b:Battle,id:string,skill:string,target:string){const actor=b.actors.find(a=>a.id===id)!;b.queue=[id,...b.actors.filter(a=>a.id!==id&&a.hp>0).map(a=>a.id)];actor.turns=3;actor.effectHit=100000;b.rng=1;expect(act(b,{actorId:id,skillId:skill,targetId:target})).toBe(true);}
describe('Skills V5 preserved kits',()=>{
  it('all 48 skills retain identities and generate copy from their effective data',()=>{
    for(const cat of CATS){expect(COMBO_ROLES_V5[cat.id]).toBeTruthy();for(const old of cat.skills){const before=JSON.stringify(old),skill=kitSkillV5(old);expect(skill.id).toBe(old.id);expect(skill.name).toBe(old.name);expect(skill.description).toBe(describeSkillV5(skill));expect(JSON.stringify(old)).toBe(before);expect(skillById(old.id)).toBe(old);expect(skillById(old.id,true)).toBe(skill);}}
  });
  it('all twelve cats have a multi-target skill after the approved Cinnamon amendment',()=>{
    const multi=['splash','row','all','bounce','multi-hit','team','ally-row','ally-splash'];
    const missing=CATS.filter(c=>!c.skills.some(s=>multi.includes(shapeV5(kitSkillV5(s))))).map(c=>c.id);
    expect(missing).toEqual([]);expect(kitSkillV5(SKILLS['cinnamon-4']!).effects).toEqual([{kind:'revive',power:40}]);
  });
  it('Comfort cup heals the weakest80 and adjacent32, Warm only main, cooldown one',()=>{
    const b=battle(['cinnamon','mochi','clover']);b.actors[0]!.hp-=90;b.actors[2]!.hp-=90;b.actors[1]!.hp=1;
    const choices=legalChoices(b).filter(c=>c.skillId==='cinnamon-2');expect(choices.map(c=>c.targetId)).toEqual(['mochi']);expect(skillById('cinnamon-2',true)!.cooldown).toBe(1);
    use(b,'cinnamon','cinnamon-2','mochi');expect(b.actors[1]!.hp).toBe(81);expect(b.actors[0]!.cooldowns['cinnamon-2']).toBe(2);for(const i of [0,2])expect(b.actors[i]!.hp).toBe(b.actors[i]!.maxHp-58);expect(b.actors.slice(0,3).map(a=>a.statuses.some(s=>s.id==='cozy'))).toEqual([false,true,false]);expect(b.v4!.events.find(e=>e.kind==='multi-hit')?.targets).toEqual(['mochi','cinnamon','clover']);
  });
  it('Mochi cleanses exactly one debuff per ally before giving the team shields',()=>{
    const b=battle();for(const a of b.actors.filter(a=>a.side==='party')){put(a,'bitter');put(a,'scald');}
    use(b,'mochi','mochi-4','mochi');for(const a of b.actors.filter(a=>a.side==='party')){expect(a.statuses.some(s=>s.id==='bitter')).toBe(false);expect(a.statuses.some(s=>s.id==='scald')).toBe(true);expect(a.shield).toBeGreaterThanOrEqual(130);}
  });
  it('Mallow Burnt sugar gains 30 percent per Burn stack without consuming Warm',()=>{
    const plain=battle(),primed=battle();for(const b of [plain,primed]){put(b.actors[1]!,'cozy');b.actors[3]!.hp=b.actors[3]!.maxHp=5000;}
    put(primed.actors[3]!,'scald',3);use(plain,'mallow','mallow-3',plain.actors[3]!.id);use(primed,'mallow','mallow-3',primed.actors[3]!.id);
    const damage=(b:Battle)=>b.log.filter(e=>e.actorId==='mallow'&&e.kind==='damage').reduce((n,e)=>n+e.amount,0);
    expect(damage(primed)/damage(plain)).toBeCloseTo(1.9,1);expect(primed.actors[1]!.statuses.some(s=>s.id==='cozy')).toBe(true);
  });
  it('Brioche applies Shred before the direct hit so a prepared Bleed can Rupture',()=>{
    const b=battle(['brioche','biscuit','velvet']);put(b.actors[3]!,'snag',3);use(b,'brioche','brioche-3',b.actors[3]!.id);
    expect(b.log.some(e=>e.kind==='reaction'&&e.skillId==='rupture')).toBe(true);expect(b.actors[3]!.statuses.some(s=>s.id==='snag')).toBe(false);
  });
  it('Second serving heals35 and Warms the team without casualties, otherwise revives40 once',()=>{
    const b=battle(['cinnamon','mochi','clover']);for(const a of b.actors.slice(0,3))a.hp-=100;
    b.actors[0]!.turns=3;expect(legalChoices(b).some(c=>c.skillId==='cinnamon-4')).toBe(true);
    use(b,'cinnamon','cinnamon-4','cinnamon');for(const a of b.actors.slice(0,3)){expect(a.hp).toBe(a.maxHp-65);expect(a.statuses.some(s=>s.id==='cozy')).toBe(true);}
    expect(b.actors[0]!.passiveUsed).toBe(false);b.actors[0]!.cooldowns={};b.actors[1]!.hp=0;
    use(b,'cinnamon','cinnamon-4','mochi');expect(b.actors[1]!.hp).toBe(Math.round(b.actors[1]!.maxHp*.4));expect(b.actors[0]!.passiveUsed).toBe(true);
    b.actors[0]!.cooldowns={};b.actors[1]!.hp=0;use(b,'cinnamon','cinnamon-4','cinnamon');expect(b.actors[1]!.hp).toBe(0);
  });
  it('isolated bosses and elites gain existing helpers only with V5 enabled',()=>{
    for(const id of ['yarn-giant','rain-spool','pantry-crown','spool-ram','kettle-knight','pollen-scout','crumb-sentinel']){
      const b=battle(undefined,[id]);expect(b.actors.filter(a=>a.catalogId==='binding-thread')).toHaveLength(['yarn-giant','rain-spool','pantry-crown'].includes(id)?2:1);
      expect(createBattle({...b.initial,skillsV5:false}).actors).toHaveLength(4);
    }
    const end=playBattle(battle(['velvet','biscuit','brioche'],['yarn-giant']),'auto');
    expect(end.actors.find(a=>a.catalogId==='yarn-giant')!.bonuses.v5Helpers).toBe(1);expect(end.log.filter(e=>e.kind==='summon')).toHaveLength(2);expect(replayBattle(end.initial,end.choices)).toEqual(end);
  });
  it('defeating a thread releases its own restraint while preserving another source',()=>{
    const b=battle(['velvet','biscuit','brioche'],['yarn-giant']),threads=b.actors.filter(a=>a.catalogId==='binding-thread');
    for(const i of [0,1])b.actors[i]!.statuses=[{id:'brittle',stacks:1,remaining:2,source:threads[i]!.id,appliedRound:1}];
    threads[0]!.hp=1;use(b,'velvet','velvet-1',threads[0]!.id);expect(b.actors[0]!.statuses.some(s=>s.id==='brittle')).toBe(false);expect(b.actors[1]!.statuses.some(s=>s.id==='brittle')).toBe(true);
  });
  it('all four design crews finish with nonempty choices and byte-identical replay',()=>{
    for(const crew of CREWS_V5)for(const seed of [3,13]){
      const b=battle(crew.cats,['button-guard','needle-moth','teacup-healer'],seed);let steps=0;
      while(!b.result&&steps++<900){if(currentActor(b)?.side==='enemy')expect(enemyAct(b)).toBe(true);else {expect(legalChoices(b).length).toBeGreaterThan(0);expect(act(b,chooseAction(b,'auto'))).toBe(true);}}
      expect(b.result).not.toBeNull();expect(replayBattle(b.initial,b.choices)).toEqual(b);
    }
  });
  it('auto, greedy and smart use deterministic V5 state without mutating previews',()=>{
    for(const policy of ['auto','greedy','smart']as const){const b=battle(['velvet','biscuit','brioche'],['practice-cushion']);const before=JSON.stringify(b);expect(chooseAction(b,policy)).toEqual(chooseAction(b,policy));expect(JSON.stringify(b)).toBe(before);const end=playBattle(b,policy);expect(replayBattle(end.initial,end.choices)).toEqual(end);}
  });
});
describe('Skills V5 chapter-one enemies',()=>{
  function fixture(id:string){const b=battle(['mochi','mallow','clover'],[id,'button-guard']),a=b.actors[3]!,events:{kind:string;target:string;power?:number;status?:StatusId}[]=[];
    const io:EnemyRuntimeV5={damage:(_b,_s,t,p)=>{events.push({kind:'hit',target:t.id,power:p});},apply:(_b,_s,t,id)=>{events.push({kind:'status',target:t.id,status:id});return true;},shield:(_b,_s,t,p)=>{events.push({kind:'shield',target:t.id,power:p});},heal:(_b,_s,t,p)=>{events.push({kind:'heal',target:t.id,power:p});},roll:()=>0,record:()=>{}};
    const intent={...b.intents[0]!,signature:true,power:175};return {b,a,events,io,intent};}
  it('Button Guard shields its entire row',()=>{const f=fixture('button-guard');enemyActionV5(f.b,f.a,f.intent,f.b.actors[0]!,f.io);expect(f.events.filter(e=>e.kind==='shield').map(e=>e.target)).toEqual(f.b.actors.slice(3).map(a=>a.id));});
  it('Sock Skipper reaches the rear and applies Bleed; Shelter still redirects',()=>{const f=fixture('sock-skipper');enemyActionV5(f.b,f.a,f.intent,f.b.actors[0]!,f.io);expect(f.events[0]!.target).toBe('clover');expect(f.events[1]!.status).toBe('snag');put(f.b.actors[0]!,'shelter');f.events.length=0;enemyActionV5(f.b,f.a,f.intent,f.b.actors[0]!,f.io);expect(f.events[0]!.target).toBe('mochi');});
  it('Spool Ram charges then row-hits; Daze cancels the charge',()=>{const f=fixture('spool-ram');enemyActionV5(f.b,f.a,f.intent,f.b.actors[0]!,f.io);expect(f.a.bonuses.v5Charge).toBe(1);expect(f.events).toHaveLength(0);enemyActionV5(f.b,f.a,f.intent,f.b.actors[0]!,f.io);expect(f.events.filter(e=>e.kind==='hit')).toHaveLength(2);expect(f.a.bonuses.v5Charge).toBe(0);f.a.bonuses.v5Charge=1;put(f.a,'drowsy');f.b.queue=[f.a.id,'mochi'];expect(enemyAct(f.b)).toBe(true);expect(f.a.bonuses.v5Charge).toBe(0);});
  it('Needle Moth lands exactly three seeded 40-percent hits',()=>{const f=fixture('needle-moth');enemyActionV5(f.b,f.a,f.intent,f.b.actors[0]!,f.io);expect(f.events.map(e=>e.power)).toEqual([40,40,40]);});
  it('Teacup starts Regen once, Marks on basics and heals weakest every second round',()=>{
    const f=fixture('teacup-healer');f.b.actors[4]!.hp=1;f.b.round=1;
    const opening=enemyIntentV5(f.b,f.a,f.intent);expect(opening.signature).toBe(false);
    enemyActionV5(f.b,f.a,opening,f.b.actors[0]!,f.io);
    expect(f.events).toEqual([{kind:'status',target:f.a.id,status:'steep'},{kind:'hit',target:'mochi',power:100},{kind:'status',target:'mochi',status:'scent'}]);
    f.events.length=0;f.a.turns=1;f.b.round=2;const heal=enemyIntentV5(f.b,f.a,f.intent);expect(heal.signature).toBe(true);
    enemyActionV5(f.b,f.a,heal,f.b.actors[0]!,f.io);expect(f.events).toEqual([{kind:'heal',target:f.b.actors[4]!.id,power:65}]);
    f.events.length=0;f.a.turns=2;f.b.round=3;enemyActionV5(f.b,f.a,enemyIntentV5(f.b,f.a,f.intent),f.b.actors[0]!,f.io);
    expect(f.events).toEqual([{kind:'hit',target:'mochi',power:100},{kind:'status',target:'mochi',status:'scent'}]);
  });
  it('Kettle basic applies Burn to the front row only below half HP',()=>{const f=fixture('kettle-knight');f.intent.signature=false;enemyActionV5(f.b,f.a,f.intent,f.b.actors[0]!,f.io);expect(f.events.some(e=>e.status==='scald')).toBe(false);f.events.length=0;f.a.hp=1;enemyActionV5(f.b,f.a,f.intent,f.b.actors[0]!,f.io);expect(f.events.filter(e=>e.status==='scald').map(e=>e.target)).toEqual(['mochi','mallow']);});
  it('Yarn phase one uses Row/Shred and phase two uses All/Bitter',()=>{const f=fixture('yarn-giant');enemyActionV5(f.b,f.a,f.intent,f.b.actors[0]!,f.io);expect(f.events.filter(e=>e.status==='brittle')).toHaveLength(2);f.events.length=0;f.a.phase=2;enemyActionV5(f.b,f.a,f.intent,f.b.actors[0]!,f.io);expect(f.events.filter(e=>e.status==='bitter')).toHaveLength(3);});
  it('later-chapter opponents retain their prior resolver',()=>{const f=fixture('rain-spool');expect(enemyActionV5(f.b,f.a,f.intent,f.b.actors[0]!,f.io)).toBe(false);expect(enemyIntentV5(f.b,f.a,f.intent)).toBe(f.intent);});
});
