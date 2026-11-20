import { clone } from '../internal';
import { Rng, deriveSeed } from '../../rng';
import { act, currentActor, enemyAct, legalChoices, skillById, stacks } from './battle';
import type { Actor, Battle, Choice } from './contract';
import { planPreference } from './gameplay-v4';
import { ENEMY_BY_ID } from './catalog';
export type Policy = 'random' | 'auto' | 'greedy' | 'smart';

function previewCopy(b: Battle): Battle {
  return {...b,...(b.v4?{v4:{...b.v4,plan:{...b.v4.plan},events:[]}}:{}),procRounds:{...b.procRounds},actors:b.v4?b.actors.map(a=>({...a,statuses:a.statuses.map(s=>({...s})),cooldowns:{...a.cooldowns},skills:[...a.skills],equipment:[...a.equipment],setEffects:[...a.setEffects],bonuses:{...a.bonuses}})):clone(b.actors),queue:[...b.queue],acted:[...b.acted],intents:clone(b.intents),log:[],choices:[]};
}
function actorValue(a: Actor): number {
  if(a.hp<=0)return a.side === 'party' ? -300 : -35;
  const health=a.hp + (a.hp/a.maxHp<.3?-65:0);
  const beneficial=stacks(a,'steep')*28+stacks(a,'cozy')*8+stacks(a,'decoy')*25+stacks(a,'sprout')*30;
  const harmful=stacks(a,'scald')*27+stacks(a,'crumb')*13+stacks(a,'rattled')*14+stacks(a,'hush')*12;
  return health + Math.min(a.shield,a.maxHp*.35)*.45 + beneficial - harmful;
}
/** Bounded one-turn utility: value the prevention already present on an actor. */
function valueV4(b: Battle, a: Actor): number {
  let n=actorValue(a);
  if(a.hp<=0)return n;
  if(a.side==='party') {
    const exposed=a.row==='front'||!b.actors.some(x=>x.side==='party'&&x.hp>0&&x.row==='front');
    n+=stacks(a,'glaze')*9+stacks(a,'riposte')*(exposed?14:5);
    // Shelter/link redirect damage rather than deleting it; do not count a free heal.
  } else {
    const intent=b.intents.find(i=>i.actorId===a.id);
    n-=stacks(a,'tangle')*a.attack*.04;
    if(intent?.signature&&stacks(a,'drowsy'))n-=a.attack*.5;
    if(intent?.signature&&stacks(a,'hush')&&['heal','shield','summon','bind'].includes(ENEMY_BY_ID[a.catalogId]?.mechanic??''))n-=24;
  }
  return n;
}
function value(b: Battle): number {
  const party=b.actors.filter(a=>a.side==='party').reduce((n,a)=>n+(b.v4?valueV4(b,a):actorValue(a)),0);
  if (b.result) return b.result === 'party' ? 100000 + party * 2 - b.round * 40 - b.choices.length * 3 : -100000;
  const foes=b.actors.filter(a=>a.side==='enemy').reduce((n,a)=>n+(b.v4?valueV4(b,a):actorValue(a))*(a.catalogId === 'binding-thread' ? .2 : 1),0);
  const pressure=b.actors.filter(a=>a.side==='enemy'&&a.hp>0).reduce((n,a)=>{
    const intent=b.intents.find(i=>i.actorId===a.id);
    return n+a.break*(intent?.signature?12:5)+(intent?.interrupted?35:0);
  },0);
  return b.v4 ? party - foes*1.1 : party - foes*1.1 + pressure + b.energy*3;
}
/** Diagnostic: next scheduled enemy response, omitting remaining ally actions. */
function nextEnemyValueV4(preview: Battle): number {
  if(preview.result)return value(preview);
  const reply=previewCopy(preview),round=reply.round;
  reply.queue=reply.queue.filter(id=>reply.actors.some(a=>a.id===id&&a.side==='enemy'&&a.hp>0));
  let steps=0;
  while(!reply.result&&reply.round===round&&currentActor(reply)?.side==='enemy'&&steps++<8)enemyAct(reply);
  return value(reply);
}

/** Isolated bounded reply pilot; not a published rule. */
function automatic(b: Battle): Choice {
  const scored = legalChoices(b).map(choice => {
    const preview = previewCopy(b);
    act(preview, choice);
    let score = value(preview) + planPreference(b,choice);
    if(b.v4)score+=0.15*(nextEnemyValueV4(preview)-value(preview));
    for (const actor of b.actors) {
      const after = preview.actors.find(candidate => candidate.id === actor.id)!;
      // Removing an enemy also removes its future turns, even when little HP remains.
      if (actor.side === 'enemy' && actor.hp > 0 && after.hp === 0) score += 200;
      if (actor.side === 'party' && actor.hp > 0 && actor.hp < actor.maxHp * .5) {
        score += Math.max(0, after.hp - actor.hp) * (1 - actor.hp / actor.maxHp) * 2;
      }
    }
    return { choice, score };
  });
  scored.sort((a, c) => c.score - a.score
    || a.choice.skillId.localeCompare(c.choice.skillId)
    || a.choice.targetId.localeCompare(c.choice.targetId));
  return scored[0]!.choice;
}
function ordinary(b: Battle, policy: 'auto' | 'greedy'): Choice {
  if (policy === 'auto') return automatic(b);
  const choices=legalChoices(b);
  const offensive=choices.filter(c=>skillById(c.skillId)!.effects.some(e=>['hit','execute','chain'].includes(e.kind)));
  return [...offensive].sort((a,c)=>{
    const power=(choice:Choice)=>skillById(choice.skillId)!.effects.reduce((n,e)=>n+(['hit','chain','execute'].includes(e.kind)?e.power??0:0),0);
    return power(c)-power(a);
  })[0]??choices[0]!;
}
export function chooseAction(b: Battle, policy: Policy): Choice {
  const choices=legalChoices(b);
  if(!choices.length)throw Error('No legal party action');
  if(policy==='random')return choices[new Rng(deriveSeed(b.seed,b.choices.length+700)).int(0,choices.length-1)]!;
  if(policy==='auto'||policy==='greedy')return ordinary(b,policy);
  const scored=choices.map(choice=>{
    const preview=previewCopy(b),round=preview.round;
    act(preview,choice);
    // Evaluate the committed enemy response with the same public state and RNG.
    // Remaining allies use the ordinary greedy policy in this bounded two-round search.
    let steps=0;
    while(!preview.result&&preview.round<round+2&&steps++<32) {
      if(currentActor(preview)?.side==='enemy')enemyAct(preview);
      else act(preview,ordinary(preview,'greedy'));
    }
    return {choice,score:value(preview)};
  });
  scored.sort((a,c)=>c.score-a.score||a.choice.skillId.localeCompare(c.choice.skillId)||a.choice.targetId.localeCompare(c.choice.targetId));
  return scored[0]!.choice;
}
export function playBattle(b: Battle, policy: Policy, maxActions=900): Battle {
  for(let i=0;i<maxActions&&!b.result;i++) {
    if(currentActor(b)?.side==='enemy') {
      if(!enemyAct(b))throw Error('Enemy turn stalled');
    } else if(!act(b,chooseAction(b,policy)))throw Error('Policy selected an illegal action');
  }
  if(!b.result)throw Error('Battle exceeded its action bound');
  return b;
}
