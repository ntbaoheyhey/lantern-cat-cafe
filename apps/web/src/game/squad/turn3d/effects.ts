import type { TurnEvent } from '@taskbar-hero/game-rules/src/squad/turn/types';

export type BeatKind = 'anticipation'|'travel'|'impact'|'reaction'|'residue';
export interface EffectBeat { kind:BeatKind; start:number; duration:number; camera:number; shake:number; flash:number; clip:string; vfx:string; soundCue:string }
export interface EffectRecipe { name:string; color:string; accent:string; shape:string; ultimate:boolean; duration:number[]; clip:string; motifs:string[]; shake:number }
export interface EffectPlan { id:number; actorId:string; skillId:string; targetIds:string[]; color:string; accent:string; shape:string; duration:number; ultimate:boolean; beats:EffectBeat[]; events:TurnEvent[]; name:string; motifs:string[] }
export interface EffectFrame { plan:EffectPlan; beat:EffectBeat; progress:number; actionProgress:number; elapsed:number; color:string; camera:number; shake:number; flash:number; clip:string; intensity:number }
const gold='#ffd48a', violet='#c49aff', teal='#86ebc7', red='#ff8b9e';
const recipe=(name:string,color:string,shape:string,options:Partial<EffectRecipe>={}):EffectRecipe=>({name,color,accent:'#fff3d4',shape,ultimate:false,duration:[300,260,80,210,310],clip:'attack',motifs:['glow','ribbon','ring','sparks','afterglow'],shake:1,...options});

/** Authored choreography, not damage logic. Milliseconds here never advance rules. */
export const EFFECT_REGISTRY:Record<string,EffectRecipe>={
  bossIntro:recipe('The knot awakens',red,'thread',{ultimate:true,clip:'telegraph',duration:[1200,250,110,330,400],shake:1.7,motifs:['woven-crown','red-spokes','knot-eye','thread-tension','dust-fall']}),
  healTonic:recipe('Warm Milk Tonic','#ffe4bd','mend',{clip:'cast',shake:0,motifs:['cork-pop','cream-helix','milk-crown','heart-rise','cream-drops']}),
  shieldBiscuit:recipe('Shield Biscuit','#eebc6e','wall',{clip:'guard',shake:.2,motifs:['biscuit-sigil','crumb-spiral','honey-facets','warm-shell','crumb-dust']}),
  quickenYarn:recipe('Quicken Yarn','#b7d6ff','thread',{clip:'cast',shake:0,motifs:['unspool','sky-loop','forward-chevron','step-lights','blue-fibres']}),
  cleanseTea:recipe('Clearleaf Tea','#bcecc9','patch',{clip:'heal-receive',shake:0,motifs:['tea-steam','leaf-helix','clear-ripple','veil-lift','mint-dew']}),
  ultimateTreat:recipe('Starlight Treat','#ffcaee','storm',{clip:'cast',shake:.1,motifs:['treat-glint','sugar-orbit','five-star','charge-rings','sugar-stars']}),
  relicProc:recipe('Relic Resonance','#edc888','rally',{clip:'cast',shake:0,duration:[160,140,70,180,250],motifs:['engraved-sigil','relic-orbit','diamond-crown','brass-echo','fine-sparks']}),
  thorns:recipe('Quilted Return','#dcb080','arrow',{shake:.4,motifs:['stitch-tense','return-needles','sewn-cross','thread-snap','cotton-dust']}),
  guardianBasic:recipe('Hearthblade',gold,'slash',{motifs:['ladle-glint','crescent','star','recoil','gold-dust']}),
  shieldBash:recipe('Shield Bash',gold,'bash',{clip:'special',duration:[360,230,100,240,330],shake:1.5,motifs:['shield-charge','shield-rush','hexagon','stagger','shield-shards']}),
  rally:recipe('Rally',gold,'rally',{clip:'cast',motifs:['paw-sigil','gold-ribbons','shield','salute','guard-dome'],shake:.3}),
  hearthwall:recipe('Hearthwall',gold,'wall',{ultimate:true,clip:'special',duration:[1200,250,100,240,450],shake:1.3,motifs:['sunrise','three-pillars','hexagon-wall','guard','gold-canopy']}),
  witchBasic:recipe('Wick Spark',violet,'orb',{clip:'cast',motifs:['wick','ember-trail','four-star','recoil','embers']}),
  threadSnare:recipe('Thread Snare',violet,'thread',{clip:'special',motifs:['spindle','looping-thread','woven-star','tether','thread-loops'],shake:.4}),
  emberOrb:recipe('Ember Orb',violet,'orb',{clip:'cast',accent:'#ffb27c',duration:[400,350,100,250,400],shake:1.5,motifs:['lantern-pulse','comet','ember-flower','stagger','embers']}),
  lanternstorm:recipe('Lanternstorm',violet,'storm',{ultimate:true,clip:'special',duration:[1220,230,100,300,450],shake:2,motifs:['three-lanterns','falling-ribbons','triple-star','stagger','violet-cinders']}),
  alchemistBasic:recipe('Sour Drop',teal,'flask',{clip:'cast',motifs:['flask-tilt','potion-arc','splash','recoil','bubbles']}),
  milkFlask:recipe('Milk Flask',teal,'flask',{clip:'cast',accent:'#fff6dc',duration:[300,360,60,220,400],shake:0,motifs:['milk-glow','flask-arc','cream-splash','heal','soft-bubbles']}),
  mossFlask:recipe('Moss Flask',teal,'patch',{clip:'special',duration:[350,320,70,250,420],shake:0,motifs:['leaf-swirl','green-arc','petal-ring','heal','moss-garden']}),
  nineLives:recipe('Nine-Lives Shelter',teal,'shelter',{ultimate:true,clip:'special',duration:[1200,250,90,280,480],shake:.4,motifs:['nine-seeds','spiral-leaves','petal-dome','heal','leaf-canopy']}),
  steadfast:recipe('Steadfast',gold,'wall',{duration:[200,140,60,180,280],clip:'cast',shake:0}),
  warmWick:recipe('Warm Wick',violet,'orb',{duration:[200,140,60,180,280],clip:'cast',shake:0}),
  lastSip:recipe('Last Sip',teal,'shelter',{duration:[200,140,60,180,280],clip:'cast',shake:0}),
  lastLight:recipe('Last Light',gold,'wall',{duration:[200,140,60,180,280],clip:'cast',shake:0}),
  needleLantern:recipe('Needle Lantern',violet,'arrow'),
  guardAttack:recipe('Button Cut','#e4bd8e','slash'),
  flankerAttack:recipe('Sock Skip','#efaec6','slash',{duration:[250,240,60,220,260],clip:'special'}),
  rangerAttack:recipe('Needle Shot','#d1c1ff','arrow',{clip:'cast',motifs:['wing-glint','needle-ribbon','pin-star','recoil','thread-dust']}),
  healerAttack:recipe('Teacup Mend','#a3dfc1','mend',{clip:'cast',shake:0}),
  chargerAttack:recipe('Spool Charge','#edbb88','charge',{duration:[900,230,110,260,360],clip:'special',shake:1.8}),
  eliteAttack:recipe('Kettle Crush','#bed4ed','bash',{duration:[850,240,110,260,360],clip:'special',shake:1.7}),
  yarnAttack:recipe('Spindle Sweep',red,'sweep',{duration:[1000,260,110,280,400],clip:'telegraph',shake:2,motifs:['red-arm','sweep-ribbon','thread-fan','knockback','red-fibres']}),
  bindThread:recipe('Loose End',red,'thread',{duration:[850,330,90,220,430],clip:'cast',motifs:['launcher','red-helix','knot','bound','binding-loop']}),
  crossSweep:recipe('Cross Stitch',red,'cross',{ultimate:true,duration:[1000,250,110,280,400],clip:'telegraph',shake:2,motifs:['crossed-arms','cross-ribbons','red-cross','stagger','loose-threads']}),
  threadAttack:recipe('Tighten',red,'thread',{duration:[250,220,60,200,280],shake:.4}),
  dummyAttack:recipe('Cushion Nudge','#e4c3ad','bash',{shake:0}),
  burn:recipe('Burn','#ffad7d','orb',{duration:[120,100,60,150,230],shake:.2}),
  status_apply:recipe('Status applied',violet,'thread',{duration:[180,120,60,180,300],shake:0,clip:'cast'}),
  status_expire:recipe('Status faded',teal,'mend',{duration:[120,120,40,150,230],shake:0,clip:'idle'}),
  death:recipe('Down',red,'cross',{duration:[150,120,60,300,380],shake:0,clip:'down'}),
  wave_clear:recipe('A breath between waves',gold,'rally',{duration:[200,200,80,230,400],shake:0,clip:'victory'}),
  victory:recipe('The cafe is safe',gold,'storm',{ultimate:true,duration:[800,220,80,350,550],shake:0,clip:'victory'}),
  defeat:recipe('A lesson for tomorrow',red,'mend',{duration:[300,150,60,300,500],shake:0,clip:'down'}),
};
const kinds:BeatKind[]=['anticipation','travel','impact','reaction','residue'];
export function createActionPlan(events:readonly TurnEvent[]):EffectPlan {
  const first=events.find(e=>e.type==='action_start')??['victory','defeat','wave_clear'].map(type=>events.find(e=>e.type===type)).find(Boolean)??events.find(e=>['boss_phase','passive','damage','status_apply','status_expire','death','gear_proc'].includes(e.type))??events[0];
  const key=first?.type==='boss_phase'?'bossIntro':first?.type==='action_start'||first?.type==='damage'||first?.type==='passive'||first?.type==='gear_proc'?first.skillId:first?.type??'status_apply';
  const data=EFFECT_REGISTRY[key]??EFFECT_REGISTRY.status_apply!;
  let at=0;const beats=kinds.map((kind,i):EffectBeat=>{const duration=Math.max(i===0&&events.some(e=>e.type==='action_start')?600:0,Math.round(data.duration[i]!*(i===3&&(data.ultimate||events.some(e=>e.type==='death'))?1.4:1)*(!data.ultimate&&i!==2?.73:1)));const beat={kind,start:at,duration,camera:data.ultimate?(i===0?1.2:i<3?.8:.2):i===0?.12:0,
    shake:kind==='impact'?data.shake:kind==='reaction'?data.shake*.2:0,flash:kind==='impact'?(data.ultimate?.055:.025):0,
    clip:data.clip==='down'||data.clip==='victory'?data.clip:i===0?data.clip:i===1&&['slash','bash','charge'].includes(data.shape)?'step':i>=3?'idle':data.clip,vfx:data.motifs[i]??'glow',soundCue:`${key}.${kind}`};at+=duration;return beat;});
  const targetIds=[...new Set((events.find(e=>e.type==='action_start')?.targetIds??events.flatMap(e=>['damage','heal','shield','status_apply','passive','death'].includes(e.type)?e.targetIds:[])))];
  return {id:events[0]?.actionId??0,actorId:(first?.type==='death'?first.targetIds[0]:first?.actorId)||first?.actors?.find(a=>a.side==='party'&&a.hp>0)?.id||'guardian',skillId:key,targetIds,color:data.color,accent:data.accent,shape:data.shape,duration:at,ultimate:data.ultimate,beats,events:[...events],name:data.name,motifs:data.motifs};
}
export function sampleActionPlan(plan:EffectPlan,elapsed:number,reducedMotion=false):EffectFrame {
  const t=Math.max(0,Math.min(plan.duration,elapsed));const beat=plan.beats.find(b=>t<b.start+b.duration)??plan.beats[4]!;
  const progress=Math.max(0,Math.min(1,(t-beat.start)/beat.duration));
  return {plan,beat,progress,actionProgress:t/plan.duration,elapsed:t,color:plan.color,camera:reducedMotion?0:beat.camera,
    shake:reducedMotion?0:beat.shake*(1-progress),flash:reducedMotion?0:beat.flash*(1-progress),clip:beat.clip,intensity:beat.kind==='impact'?1:Math.sin(progress*Math.PI)*.7+.3};
}
