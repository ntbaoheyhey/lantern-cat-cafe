import { clone } from '../internal';
import { boonValue } from './boons';
import { Rng, deriveSeed } from '../../rng';
import { CAT_BY_ID, ENEMY_BY_ID, hasAdvantage, SKILLS, STATUS_BY_ID, teamCombos } from './catalog';
import { CONTRACT_VERSION, type Actor, type Battle, type BattleSetup, type Choice, type Effect, type Intent, type Skill, type StatusId } from './contract';

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const hasEffect = (actor: Actor, id: string) => actor.setEffects.includes(id);
export const stacks = (actor: Actor, id: StatusId) => actor.statuses.find(s => s.id === id)?.stacks ?? 0;
const living = (battle: Battle, side: Actor['side']) => battle.actors.filter(a => a.side === side && a.hp > 0);
function roll(battle: Battle, max = 10000) {
  const rng = new Rng(battle.rng);
  const result = rng.int(0, max - 1);
  battle.rng = deriveSeed(battle.rng, 1);
  return result;
}
function record(b: Battle, source: Actor, target: Actor, kind: string, amount = 0, text = '', skillId = '') {
  b.log.push({ round: b.round, actorId: source.id, targetId: target.id, skillId, kind, amount, text });
}
export function dispel(b: Battle, source: Actor, target: Actor, kind: 'buff' | 'debuff') {
  const before = target.statuses.length;
  target.statuses = target.statuses.filter(s => STATUS_BY_ID[s.id].kind !== kind || !STATUS_BY_ID[s.id].dispellable);
  record(b, source, target, 'dispel', before - target.statuses.length, `Removed ${kind}s`);
}
export function applyStatus(b: Battle, source: Actor, target: Actor, id: StatusId, count = 1) {
  const rule = STATUS_BY_ID[id];
  if (target.hp <= 0) return false;
  const control = id === 'drowsy' || id === 'hush';
  if (control && (target.bonuses.controlImmuneUntil ?? 0) >= b.round) {
    record(b, source, target, 'immune', 0, `${target.name} recovered control resistance`);
    return false;
  }
  if (rule.kind === 'debuff' && roll(b) >= clamp(9000 + source.effectHit - target.effectResist, 1000, 9800)) {
    record(b, source, target, 'resist', 0, `${target.name} resisted ${rule.name}`);
    return false;
  }
  let status = target.statuses.find(s => s.id === id);
  if (!status) {
    status = { id, stacks: 0, remaining: 0, source: source.id, appliedRound: b.round };
    target.statuses.push(status);
  }
  status.stacks = Math.min(rule.cap, status.stacks + count);
  status.remaining = rule.duration + (id === 'steep' ? Math.min(2,source.bonuses.statusDuration??0) : 0) + (id === 'scald' && hasEffect(source,'long-scald') ? 1 : 0) + (id === 'scald' && source.side === 'party' ? boonValue(b,'scaldDuration') : 0) + (id === 'steep' && target.catalogId === 'marigold' ? 1 : 0);
  if (control && ENEMY_BY_ID[target.catalogId]?.tier === 'boss') status.remaining = 1;
  status.source = source.id;
  status.appliedRound = b.round;
  if (control) target.bonuses.controlImmuneUntil = b.round + 1;
  record(b, source, target, 'status', status.stacks, rule.name);
  if (source.side === 'party') {
    if (id === 'steep' && hasEffect(source,'steep-cozy')) applyStatus(b,source,target,'cozy');
    if (id === 'scald' && hasEffect(source,'unique:warmwick')) heal(b,source,source,6);
    if (id === 'scald' && boonValue(b,'scaldBrittle')) applyStatus(b,source,target,'brittle');
    if (id === 'scald' && boonValue(b,'scaldCrumb')) applyStatus(b,source,target,'crumb');
    if (id === 'scent' && boonValue(b,'markCrumb')) applyStatus(b,source,target,'crumb');
    if (id === 'tangle' && boonValue(b,'tangleRattle')) applyStatus(b,source,target,'rattled');
  }
  return true;
}
function shield(b: Battle, source: Actor, target: Actor, amount: number) {
  if(amount<=0)return;
  amount*=1+(source.bonuses.shieldBp??0)/10000;
  const actual = Math.min(Math.round(amount), Math.max(0, Math.floor(target.maxHp * .6) - target.shield));
  target.shield += actual;
  record(b, source, target, 'shield', actual);
  if (source.catalogId === 'mochi' && source.id !== target.id) source.shield = Math.min(Math.floor(source.maxHp * .6), source.shield + 12);
}
function heal(b: Battle, source: Actor, target: Actor, amount: number) {
  if (target.hp <= 0 || amount<=0) return;
  amount*=1+(source.bonuses.healingBp??0)/10000;
  if (source.catalogId === 'cinnamon' && target.hp < target.maxHp / 2) shield(b, source, target, 15);
  const actual = Math.min(target.maxHp - target.hp, Math.round(amount));
  const overflow = Math.max(0, Math.round(amount) - actual);
  if (source.side === 'party' && overflow) shield(b,source,target,overflow * boonValue(b,'overhealShield') / 100);
  target.hp += actual;
  record(b, source, target, 'heal', actual);
  if (source.catalogId === 'clover' && !source.passiveUsed) { source.passiveUsed = true; dispel(b, source, target, 'debuff'); }
}
function loseHp(b: Battle, source: Actor, target: Actor, amount: number, kind: string) {
  const actual = Math.min(target.hp, Math.max(0, Math.round(amount)));
  target.hp -= actual;
  record(b, source, target, kind, actual);
  if (target.hp === 0 && stacks(target, 'sprout') && !target.bonuses.sproutUsed) {
    target.bonuses.sproutUsed = 1;
    target.statuses = target.statuses.filter(s => s.id !== 'sprout');
    target.hp = Math.round(target.maxHp * .25);
    record(b, target, target, 'survive', target.hp, 'Second sprout');
  }
  if (target.hp === 0) {
    if (target.side === 'party' && b.firstDeath === null) b.firstDeath = target.role;
    record(b, source, target, 'defeat');
    if (source.catalogId === 'velvet') source.charge = Math.min(100, source.charge + 15);
    if (source.side === 'party' && source.hp > 0) heal(b,source,source,boonValue(b,'killHeal'));
  }
  return actual;
}
function damage(b: Battle, source: Actor, target: Actor, power: number, pressure: number) {
  if (target.hp <= 0) return;
  if (stacks(target, 'decoy')) {
    target.statuses = target.statuses.filter(s => s.id !== 'decoy');
    record(b, source, target, 'decoy', 0, 'Yarn decoy absorbed the hit');
    return;
  }
  const variance = (9200 + roll(b, 1601)) / 10000;
  const weak = hasAdvantage(source.flavour, target.flavour) ? 1 : 0;
  const extraPressure = source.side === 'party' && source.bonuses.pressureRound !== b.round ? boonValue(b,'breakPressure') : 0;
  source.bonuses.pressureRound = b.round;
  const pressureTotal = pressure + weak + stacks(target, 'tangle') + extraPressure + (hasEffect(source,'marked-break')&&stacks(target,'scent')?1:0);
  target.break = Math.min(target.breakCap, target.break + pressureTotal);
  if (target.break >= target.breakCap) {
    const intent = b.intents.find(i => i.actorId === target.id);
    if (intent) intent.interrupted = true;
    record(b, source, target, 'break', pressureTotal, 'Intent interrupted');
    if (source.side === 'party' && b.procRounds.breakEnergy !== b.round) {
      b.energy = Math.min(10,b.energy + boonValue(b,'breakEnergy'));
      b.procRounds.breakEnergy = b.round;
    }
  }
  const extraDamage = source.side === 'party' ? (source.shield > 0 ? boonValue(b,'shieldStrike') : 0) + (source.row === 'rear' ? boonValue(b,'rearDamage') : 0) : 0;
  const bonus=source.bonuses;
  const conditional=(source.row==='front'?bonus.frontDamage??0:bonus.rearDamage??0)
    +(ENEMY_BY_ID[target.catalogId]?.tier==='boss'?bonus.bossDamage??0:0)
    +(ENEMY_BY_ID[target.catalogId]?.tier==='elite'?bonus.eliteDamage??0:0)
    +(stacks(target,'scald')?bonus.scaldDamage??0:0)+(stacks(target,'scent')?bonus.markedDamage??0:0)
    +(target.break>=target.breakCap?bonus.brokenDamage??0:0)+(source.shield>0?bonus.shieldedDamage??0:0)
    +(source.hp<source.maxHp/2?bonus.lowHpDamage??0:0);
  const attack = source.attack * power / 100 + extraDamage + conditional;
  const critical=(bonus.critBp??0)>0&&roll(b)<bonus.critBp! ? 1+(bonus.critDamageBp??5000)/10000 : 1;
  const mitigation = 80 / (80 + target.defense);
  const cozy = 1 - stacks(target, 'cozy') * .1;
  const rattled = 1 - stacks(source, 'rattled') * .15;
  const scent = stacks(target, 'scent') ? 1.2 : 1;
  const broken = target.break >= target.breakCap ? 1.2 : 1;
  const amount = Math.max(1, Math.round(attack * mitigation * cozy * rattled * scent * broken * variance * critical));
  target.shield = Math.max(0, target.shield - stacks(target, 'brittle') * 15);
  const absorbed = Math.min(target.shield, amount);
  target.shield -= absorbed;
  let hpDamage = amount - absorbed;
  const link = target.statuses.find(s => s.id === 'link');
  const protector = link && b.actors.find(a => a.id === link.source && a.hp > 0 && a.id !== target.id);
  if (protector) {
    const shared = Math.floor(hpDamage * .3);
    hpDamage -= shared;
    loseHp(b, source, protector, shared, 'shared');
  }
  loseHp(b, source, target, hpDamage, 'damage');
  if(target.break>=target.breakCap)shield(b,source,source,source.bonuses.breakShield??0);
  if(hasEffect(source,'third-crumb')&&(source.turns+1)%3===0)applyStatus(b,source,target,'crumb');
  if(hasEffect(source,'unique:nightglass')&&stacks(target,'scent')&&source.bonuses.nightglassRound!==b.round){b.energy=Math.min(10,b.energy+1);source.bonuses.nightglassRound=b.round;}
  source.charge = Math.min(100, source.charge + 8);
  target.charge = Math.min(100, target.charge + 7);
  if (source.side === 'party' && stacks(target,'scald')) source.charge = Math.min(100,source.charge + boonValue(b,'scaldCharge'));
  if (source.catalogId === 'mallow' && stacks(target, 'scald')) source.charge = Math.min(100, source.charge + 8);
  if (source.catalogId === 'biscuit' && source.hp < source.maxHp / 2 && !source.passiveUsed) {
    source.passiveUsed = true; shield(b, source, source, 30);
  }
  const reflect = stacks(target, 'riposte') * (16+(target.bonuses.counterPower??0)+(hasEffect(target,'counter-plus')?8:0)) + (target.catalogId === 'kettle-knight' && target.shield > 0 ? 12 : 0);
  if (reflect && source.hp > 0) loseHp(b, target, source, reflect, 'reflect');
}
export function tickStatuses(b: Battle, actor: Actor) {
  if (actor.hp <= 0) return;
  for (const s of [...actor.statuses]) {
    const rule = STATUS_BY_ID[s.id], source = b.actors.find(a => a.id === s.source) ?? actor;
    if (rule.tick === 'damage') loseHp(b, source, actor, (rule.strength + (source.side === 'party' ? boonValue(b,'scaldPower')+(source.bonuses.dotPower??0) : 0)) * s.stacks, 'dot');
    if(rule.tick==='damage'&&hasEffect(source,'scald-charge'))source.charge=Math.min(100,source.charge+3);
    if (actor.hp <= 0) break;
    if (rule.tick === 'heal') {
      heal(b, source, actor, (rule.strength + (actor.side === 'party' ? boonValue(b,'steepPower') : 0)) * s.stacks);
      const scald = actor.statuses.find(x => x.id === 'scald');
      if (scald) scald.stacks--;
    }
    s.remaining--;
    if (s.remaining <= 0) record(b, actor, actor, 'expire', 0, rule.name);
  }
  actor.statuses = actor.statuses.filter(s => s.remaining > 0 && s.stacks > 0);
}
function actorBase(): Pick<Actor, 'shield' | 'charge' | 'break' | 'statuses' | 'cooldowns' | 'passiveUsed' | 'phase' | 'equipment' | 'setEffects' | 'bonuses' | 'turns'> {
  return { shield:0,charge:20,break:0,statuses:[],cooldowns:{},passiveUsed:false,phase:1,equipment:[],setEffects:[],bonuses:{},turns:0 };
}
function enemyActor(id: string, index: number, chapter: number, tutorial = false): Actor {
  const e = ENEMY_BY_ID[id];
  if (!e) throw Error('Unknown enemy');
  const scale = tutorial ? .55 : 1 + Math.max(0, chapter - e.chapter) * .16;
  return { ...actorBase(), id:`foe-${index}-${id}`,catalogId:id,name:e.name,side:'enemy',role:e.role,row:e.row,flavour:e.flavour,hp:Math.round(e.hp*scale),maxHp:Math.round(e.hp*scale),attack:Math.round(e.attack*scale*(tutorial ? 1 : [2.7, 1.95, 1.6][chapter - 1]!)),defense:e.defense,initiative:5-index%3,effectHit:0,effectResist:e.tier==='boss'?1200:500,breakCap:e.breakCap,skills:[] };
}
export function createBattle(setup: BattleSetup): Battle {
  const actors: Actor[] = setup.cats.map((c,index) => {
    const cat = CAT_BY_ID[c.id];
    if (!cat || c.skills.length !== 3 || new Set(c.skills).size !== 3 || c.skills.some(id => SKILLS[id]?.catId !== c.id)) throw Error('Invalid three-skill loadout');
    return { ...actorBase(),id:c.id,catalogId:c.id,name:cat.name,side:'party',role:cat.role,row:c.row,flavour:cat.flavour,hp:Math.min(c.stats.hp,setup.hp?.[c.id]??c.stats.hp),maxHp:c.stats.hp,attack:c.stats.attack,defense:c.stats.defense,initiative:9-index,effectHit:c.stats.effectHitBp,effectResist:c.stats.effectResistBp,breakCap:6,skills:[...c.skills],equipment:c.equipment??[],setEffects:c.effects??[],bonuses:{...c.bonuses,critBp:c.stats.critBp,critDamageBp:c.stats.critDamageBp,healingBp:c.stats.healingBp,shieldBp:c.stats.shieldBp} };
  });
  actors.push(...setup.enemies.map((id,i) => enemyActor(id,i,setup.chapter,setup.tutorial)));
  const b: Battle = {version:CONTRACT_VERSION,seed:setup.seed,rng:setup.seed,chapter:setup.chapter,actors,round:0,queue:[],acted:[],energy:0,maxEnergy:5,intents:[],log:[],choices:[],result:null,firstDeath:null,procRounds:{},boons:{...setup.boons},mutator:setup.mutator??'',initial:clone(setup)};
  const combos = teamCombos(setup.cats.map(c => c.id));
  for (const actor of living(b,'party')) {
    actor.shield += boonValue(b,'openingShield')+(actor.bonuses.openingShield??0);
    actor.charge = Math.min(100,actor.charge+boonValue(b,'openingCharge')+(actor.bonuses.openingCharge??0));
    if(hasEffect(actor,'opening-decoy'))applyStatus(b,actor,actor,'decoy');
    if(hasEffect(actor,'unique:softcollar'))applyStatus(b,actor,actor,'sprout');
    if (boonValue(b,'openingSteep')) applyStatus(b,actor,actor,'steep',boonValue(b,'openingSteep'));
    if (combos.some(c => c.id==='warm-table')) actor.shield += 20;
    if (combos.some(c => c.id==='night-garden')) actor.charge += 10;
    if (actor.catalogId==='inkcap') applyStatus(b,actor,actor,'decoy');
  }
  if (setup.mutator === 'thin-pot') b.maxEnergy = 4;
  for (const actor of b.actors) {
    if (setup.mutator === 'rainy' && actor.side === 'enemy') actor.shield += 20;
    if (setup.mutator === 'warm-floor' && actor.row === 'front') applyStatus(b,actor,actor,'cozy');
    if (setup.mutator === 'late-shift') {
      if (actor.side === 'enemy') actor.attack = Math.round(actor.attack * 1.1);
      else actor.charge += 15;
    }
  }
  beginRound(b);
  if (combos.some(c => c.id==='crumb-circuit')) b.energy++;
  return b;
}
function weakest(actors: Actor[]) { return [...actors].sort((a,c) => a.hp/a.maxHp-c.hp/c.maxHp)[0]!; }
function setIntents(b: Battle) {
  const party = living(b,'party');
  if (!party.length) return;
  b.intents = living(b,'enemy').map((a): Intent => {
    const spec = ENEMY_BY_ID[a.catalogId]!;
    const signature = b.round % 3 === 0;
    const rear = party.filter(p => p.row==='rear');
    const target = spec.mechanic==='steal' && rear.length ? weakest(rear) : party[roll(b,party.length)]!;
    return {actorId:a.id,targetId:target.id,label:signature?spec.intent:`${a.name} · ${spec.mechanic==='heal'?'Cup refill':'basic pressure'}`,counter:spec.counter,power:signature?175:100,status:signature?spec.status:undefined,signature,interrupted:false};
  });
}
function beginRound(b: Battle) {
  b.round++;
  b.acted=[];
  b.energy=Math.min(10,b.maxEnergy+boonValue(b,'roundEnergy'));
  b.queue=b.actors.filter(a=>a.hp>0).sort((a,c)=>c.initiative-a.initiative||a.id.localeCompare(c.id)).map(a=>a.id);
  for (const a of b.actors) {
    for (const id of Object.keys(a.cooldowns)) a.cooldowns[id]=Math.max(0,a.cooldowns[id]!-1);
    if (a.hp>0 && a.side==='party' && a.row==='front') shield(b,a,a,boonValue(b,'roundShield'));
    if(a.hp>0&&a.side==='party')heal(b,a,a,(a.bonuses.roundHeal??0)+(hasEffect(a,'rear-heal')&&a.row==='rear'?16:0));
    if (a.hp>0 && a.catalogId==='brioche') shield(b,a,a,12);
    if (a.hp>0 && a.catalogId==='sorrel' && b.round%2===1) b.energy++;
    const enemy = ENEMY_BY_ID[a.catalogId];
    if (enemy?.tier==='boss' && a.hp<=a.maxHp/2 && a.phase===1) { a.phase=2; record(b,a,a,'phase',2,enemy.phases[1]); }
  }
  setIntents(b);
}
function checkResult(b: Battle) {
  if (!living(b,'party').length || b.round>50) b.result='enemy';
  else if (!living(b,'enemy').length) b.result='party';
}
export function currentActor(b: Battle) { return b.actors.find(a => a.id === b.queue[0] && a.hp > 0); }
export function targets(b: Battle, actor: Actor, skill: Skill): Actor[] {
  const foes=living(b,actor.side==='party'?'enemy':'party'), allies=living(b,actor.side);
  if (skill.target==='self') return [actor];
  if (skill.target==='fallen') return b.actors.filter(a=>a.side===actor.side&&a.hp===0);
  if (skill.target==='ally'||skill.target==='allies') return allies;
  if (skill.target==='foe'&&!hasEffect(actor,'pierce-row')) {
    const front=foes.filter(a=>a.row==='front');
    return front.length ? foes.filter(a=>a.row==='front'||stacks(a,'scent')) : foes;
  }
  return foes;
}
const defend: Skill = { id:'defend',catId:'',name:'Defend',description:'Gain 35 shield and Cozy. Panko also gains Riposte.',type:'defend',target:'self',cost:0,cooldown:0,charge:0,breakPower:0,effects:[{kind:'shield',power:35},{kind:'rally',status:'cozy'}],unlockLevel:1,unlockStars:1 };
const wait: Skill = {...defend,id:'wait',name:'Pour energy',description:'Gain 1 shared energy. Use one action.',type:'support',effects:[{kind:'energy',power:1}]};
export const COMMON_SKILLS = {defend,wait};
export function skillById(id: string): Skill | undefined { return SKILLS[id] ?? COMMON_SKILLS[id as keyof typeof COMMON_SKILLS]; }
export function energyCost(actor: Actor, skill: Skill) { return skill.cost + (skill.cost>0 && stacks(actor,'hush') ? 1 : 0); }
export function legalChoices(b: Battle): Choice[] {
  const actor=currentActor(b);
  if (!actor||actor.side!=='party'||b.result) return [];
  return [...actor.skills,'defend','wait'].flatMap(id=>{
    const skill=skillById(id)!;
    if (energyCost(actor,skill)>b.energy || skill.charge>actor.charge || (actor.cooldowns[id]??0)>0 || skill.effects.some(e=>e.kind==='revive')&&actor.passiveUsed) return [];
    return targets(b,actor,skill).map(t=>({actorId:actor.id,skillId:id,targetId:t.id}));
  });
}
function executeEffect(b: Battle, actor: Actor, target: Actor, effect: Effect, skill: Skill) {
  const power=Math.round((effect.power??0)*(1+.2*(b.initial.upgrades?.[skill.id]??0)));
  switch (effect.kind) {
    case 'hit': damage(b,actor,target,power,skill.breakPower); break;
    case 'shield': shield(b,actor,target,power+(actor.bonuses.shieldFlat??0));if(boonValue(b,'shieldHeal'))heal(b,actor,target,boonValue(b,'shieldHeal'));break;
    case 'heal':
      heal(b,actor,target,power+boonValue(b,'healing')+(actor.bonuses.healFlat??0));
      if(hasEffect(actor,'unique:seedcup')&&!actor.bonuses.seedcupUsed){applyStatus(b,actor,target,'sprout');actor.bonuses.seedcupUsed=1;}
      if (boonValue(b,'healCleanse')||hasEffect(actor,'healing-cleanse')) {
        const debuff=target.statuses.find(s=>STATUS_BY_ID[s.id].kind==='debuff'&&STATUS_BY_ID[s.id].dispellable);
        if(debuff)target.statuses=target.statuses.filter(s=>s!==debuff);
      }
      if(!actor.bonuses.healProc){actor.charge=Math.min(100,actor.charge+boonValue(b,'healCharge'));actor.bonuses.healProc=1;}
      break;
    case 'cleanse': {
      const before=target.statuses.length;
      dispel(b,actor,target,'debuff');
      if(before>target.statuses.length){shield(b,actor,target,actor.bonuses.cleanseShield??0);if(hasEffect(actor,'unique:gardenkey'))heal(b,actor,target,25);}
      if(before>target.statuses.length&&!actor.bonuses.cleanseProc){b.energy=Math.min(10,b.energy+boonValue(b,'cleanseEnergy'));actor.bonuses.cleanseProc=1;}
      break;
    }
    case 'dispel': dispel(b,actor,target,'buff'); break;
    case 'detonate': {
      const count=stacks(target,'crumb')+stacks(target,'scald');
      loseHp(b,actor,target,count*(24+boonValue(b,'detonatePower'))*power/100,'detonate');
      target.statuses=target.statuses.filter(s=>s.id!=='crumb'&&s.id!=='scald');
      if(count&&boonValue(b,'detonateSplash'))for(const other of living(b,target.side).filter(a=>a.id!==target.id))loseHp(b,actor,other,boonValue(b,'detonateSplash'),'detonate');
      if(count&&hasEffect(actor,'detonate-energy'))b.energy=Math.min(10,b.energy+1);
      if(count&&hasEffect(actor,'unique:crumbbook'))shield(b,actor,actor,35);
      if (count && actor.catalogId==='soot') actor.charge=Math.min(100,actor.charge+10);
      break;
    }
    case 'transfer': { const amount=actor.shield;actor.shield=0;shield(b,actor,target,amount);break; }
    case 'revive': target.hp=Math.round(target.maxHp*power/100);target.statuses=[];actor.passiveUsed=true;record(b,actor,target,'revive',target.hp);break;
    case 'execute': damage(b,actor,target,power*(target.hp/target.maxHp<.3+(actor.bonuses.executeThreshold??0)/100?2:1),skill.breakPower);break;
    case 'chain': {
      const others=living(b,target.side).filter(t=>t.id!==target.id);
      for (const [i,t] of [target,...others].slice(0,3).entries()) damage(b,actor,t,power*(1-i*.15),skill.breakPower);
      break;
    }
    case 'energy': b.energy=Math.min(10,b.energy+power);record(b,actor,actor,'energy',power);break;
    case 'swap': { const row=actor.row;actor.row=target.row;target.row=row;shield(b,actor,actor,boonValue(b,'swapShield')+(hasEffect(actor,'swap-shield')?25:0));shield(b,actor,target,boonValue(b,'swapShield')+(hasEffect(actor,'swap-shield')?25:0));if(hasEffect(actor,'unique:rainbell'))dispel(b,actor,actor,'debuff');break; }
    case 'drain': heal(b,actor,actor,actor.attack*power/100);break;
    case 'consume': { const count=stacks(actor,'cozy');actor.statuses=actor.statuses.filter(s=>s.id!=='cozy');if(count)damage(b,actor,target,count*power,0);break; }
    case 'break': target.break=Math.min(target.breakCap,target.break+power);if(target.break>=target.breakCap){const i=b.intents.find(i=>i.actorId===target.id);if(i)i.interrupted=true;}break;
    case 'rally': break;
  }
  if (effect.status) applyStatus(b,actor,target,effect.status,effect.stacks??1);
}
function finishAction(b: Battle, actor: Actor) {
  actor.turns++;
  actor.charge=Math.min(100,actor.charge+6);
  b.acted.push(actor.id);
  b.queue=b.queue.filter(id=>id!==actor.id&&b.actors.some(a=>a.id===id&&a.hp>0));
  checkResult(b);
  if (!b.result && !b.queue.length) {
    for (const a of b.actors) tickStatuses(b,a);
    checkResult(b);
    if (!b.result) beginRound(b);
  }
}
/** Mutates only an accepted legal choice. Rejected actions leave the snapshot identical. */
function actionDescription(b: Battle, actor: Actor, target: Actor, skill: Skill): string {
  const health = Math.round(target.hp / target.maxHp * 100);
  if (skill.effects.some(effect => effect.kind === 'revive')) return `${actor.name} revives ${target.name} · ${skill.name}`;
  if (skill.target === 'allies') {
    const lowest = Math.min(...living(b, 'party').map(ally => Math.round(ally.hp / ally.maxHp * 100)));
    return `${actor.name} supports the team (lowest HP ${lowest}%) · ${skill.name}`;
  }
  if (target.side === 'enemy') {
    const weakest = Math.min(...targets(b, actor, skill).map(foe => foe.hp));
    const reason = target.hp === weakest ? 'focuses the weakest reachable foe' : 'pressures a foe';
    return `${actor.name} ${reason}, ${target.name} (HP ${health}%) · ${skill.name}`;
  }
  const verb = skill.effects.some(effect => effect.kind === 'heal') ? 'heals' : 'protects';
  if (skill.id === 'wait') return `${actor.name} restores shared energy for the team`;
  return `${actor.name} ${verb} ${target.name} (HP ${health}%) · ${skill.name}`;
}
export function act(b: Battle, choice: Choice): boolean {
  if (!legalChoices(b).some(c=>c.actorId===choice.actorId&&c.skillId===choice.skillId&&c.targetId===choice.targetId)) return false;
  const actor=currentActor(b)!, skill=skillById(choice.skillId)!, target=b.actors.find(a=>a.id===choice.targetId)!;
  const description = actionDescription(b, actor, target, skill);
  b.choices.push({...choice});
  actor.bonuses.healProc=0;actor.bonuses.cleanseProc=0;
  b.energy-=energyCost(actor,skill);actor.charge-=skill.charge;
  actor.cooldowns[skill.id]=skill.cooldown+1;
  shield(b,actor,actor,stacks(actor,'glaze')*20);
  const affected=skill.target==='foes'?living(b,'enemy'):skill.target==='allies'?living(b,'party'):skill.target==='row'?living(b,target.side).filter(a=>a.row===target.row):[target];
  for (const effect of skill.effects) {
    if (effect.self || effect.kind==='energy' || effect.kind==='chain') executeEffect(b,actor,effect.self?actor:target,effect,skill);
    else for (const t of affected) executeEffect(b,actor,t,effect,skill);
  }
  if (actor.catalogId==='panko'&&skill.id==='defend') applyStatus(b,actor,actor,'riposte');
  if(skill.id==='defend'){
    if(hasEffect(actor,'defend-shield'))shield(b,actor,actor,25);
    if(hasEffect(actor,'defend-link')){const ally=weakest(living(b,'party').filter(a=>a.id!==actor.id));if(ally)applyStatus(b,actor,ally,'link');}
    if(hasEffect(actor,'defend-riposte')){applyStatus(b,actor,actor,'shelter');applyStatus(b,actor,actor,'riposte');}
    if(hasEffect(actor,'unique:panlid'))applyStatus(b,actor,actor,'riposte',2);
    if(hasEffect(actor,'unique:doorstop'))heal(b,actor,actor,25);
  }
  if(skill.id==='wait'&&hasEffect(actor,'unique:tidetray'))shield(b,actor,weakest(living(b,'party')),30);
  if(skill.charge){
    actor.charge=Math.min(100,actor.charge+(actor.bonuses.ultimateCharge??0)+(hasEffect(actor,'ultimate-refund')?20:0));
    if(hasEffect(actor,'unique:starladle')&&!actor.bonuses.starladleUsed){actor.charge=Math.min(100,actor.charge+25);actor.bonuses.starladleUsed=1;}
    if(hasEffect(actor,'unique:silkspool')&&!actor.bonuses.silkspoolUsed){applyStatus(b,actor,actor,'decoy');actor.bonuses.silkspoolUsed=1;}
  }
  if (skill.id==='defend') actor.charge=Math.min(100,actor.charge+boonValue(b,'defendCharge'));
  if (skill.id==='wait') heal(b,actor,actor,boonValue(b,'waitHeal'));
  if (skill.charge) b.energy=Math.min(10,b.energy+boonValue(b,'ultimateEnergy'));
  record(b,actor,target,'action',0,description,skill.id);
  finishAction(b,actor);
  return true;
}
function spawnThread(b: Battle, source: Actor) {
  if (living(b,'enemy').filter(a=>a.catalogId==='binding-thread').length>=2) return;
  const actor=enemyActor('binding-thread',b.actors.length,b.chapter);
  b.actors.push(actor);
  record(b,source,actor,'summon',0,'Binding Thread joins next round');
}
export function enemyAct(b: Battle): boolean {
  const actor=currentActor(b);
  if (!actor||actor.side!=='enemy'||b.result) return false;
  const intent=b.intents.find(i=>i.actorId===actor.id)!;
  const spec=ENEMY_BY_ID[actor.catalogId]!;
  const party=living(b,'party');
  const shelter=party.find(a=>stacks(a,'shelter'));
  const target=shelter??party.find(a=>a.id===intent.targetId)??weakest(party);
  if (!target) {checkResult(b);return false;}
  shield(b,actor,actor,stacks(actor,'glaze')*20);
  const impaired=intent.interrupted||stacks(actor,'drowsy')>0;
  const quiet=stacks(actor,'hush')>0;
  const signature=intent.signature&&!impaired;
  if (impaired) damage(b,actor,target,40,0);
  else if (spec.mechanic==='heal'&&!quiet) heal(b,actor,weakest(living(b,'enemy')),65);
  else if (spec.mechanic==='shield'&&!quiet) for (const a of living(b,'enemy').filter(a=>a.row===actor.row)) shield(b,actor,a,45);
  else {
    let affected=[target];
    if(signature&&['charge','bind','storm','banquet','dot'].includes(spec.mechanic)) affected=party.filter(a=>actor.phase===2||a.row===(spec.mechanic==='dot'?'rear':'front'));
    if (!affected.length) affected=[target];
    for (const t of affected) {
      if (signature&&spec.mechanic==='storm') t.shield=0;
      damage(b,actor,t,signature?intent.power:100,0);
      if (spec.status&&(signature||['dot','snare','bomb'].includes(spec.mechanic))) applyStatus(b,actor,t,spec.status);
      if (signature&&spec.mechanic==='bomb') {loseHp(b,actor,t,stacks(t,'crumb')*35,'detonate');t.statuses=t.statuses.filter(s=>s.id!=='crumb');}
    }
    if (spec.mechanic==='steal'||signature&&spec.mechanic==='banquet') b.energy=Math.max(0,b.energy-1);
    if (signature&&!quiet&&(spec.mechanic==='summon'||spec.mechanic==='banquet'&&actor.phase===2||spec.mechanic==='bind')) spawnThread(b,actor);
    if (spec.mechanic==='reflect'&&actor.turns===0) {shield(b,actor,actor,70);applyStatus(b,actor,actor,'cozy');}
  }
  record(b,actor,target,'enemy-action',0,impaired?'Broken intent · softened basic':intent.label);
  actor.break=0;
  finishAction(b,actor);
  return true;
}
export function replayBattle(setup: BattleSetup, choices: Choice[]): Battle {
  const b=createBattle(setup);
  for (const choice of choices) {
    while (!b.result&&currentActor(b)?.side==='enemy') enemyAct(b);
    if (!act(b,choice)) throw Error('Replay contains an illegal action');
  }
  while (!b.result&&currentActor(b)?.side==='enemy') enemyAct(b);
  return b;
}
