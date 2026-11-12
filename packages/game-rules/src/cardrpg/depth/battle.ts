import { FORMATION_C2, validRowsC2 } from './formation-c2';
import { ECONOMY_C2 } from './economy-c2';
import { triggerPairCombosA6 } from './bonds-a6';
import { gainRageA6, hitRageA6, phaseBossA6, prepareBattleA6 } from './gameplay-a6';
import { kitSkillV5, situationalSkillV5 } from './skills-v5/kits';
import { enemyActionV5, enemyIntentV5, encounterEnemiesV5, phaseHelpersV5, releaseThreadV5 } from './skills-v5/enemies';
import { executeShapeV5, shapeV5, weakestV5, type EffectV5, type ShapeV5 } from './skills-v5/shapes';
import { crumbBurstV5, directReactionV5, spreadV5, type ReactionRuntimeV5 } from './skills-v5/reactions';
import { beforeActionV5, consumeDazeV5, defenseV5, receivedV5, statusIdV5, statusRuleV5, tickStatusesV5, type StatusRuntimeV5 } from './skills-v5/statuses';
import { clone } from '../internal';
import { DEFAULT_PLAN, crewThresholds, enemyGuideV4, openingCrewBonus, validPlan } from './gameplay-v4';
import { GEAR_BY_ID, SETS } from './equipment';
import { emitGameplayEvent } from './events-v4';
import { boonValue } from './boons';
import { ROUTE_SKILL_POWER_PER_RANK } from './route-upgrades';
import { challengeStatsV4, phaseBossV4, finishBossV4 } from './pacing-v4';
import { Rng, deriveSeed } from '../../rng';
import { CAT_BY_ID, ENEMY_BY_ID, hasAdvantage, SKILLS, STATUS_BY_ID, teamCombos } from './catalog';
import { CONTRACT_VERSION, type Actor, type Battle, type BattleSetup, type Choice, type Intent, type Skill, type Status, type StatusId } from './contract';

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
export function linkShareBps(b: Battle, protector: Actor, status: Status) {
  // Missing provenance retains the former snapshot behavior. New C2 links
  // carry their own strength; equipping a set cannot weaken a native skill.
  return b.initial.formationC2 && status.linkShareBp !== undefined ? status.linkShareBp
    : b.v4 && hasEffect(protector,'defend-link') ? (b.initial.formationC2 ? ECONOMY_C2.sets.hearthloomShareBp : 1500)
    : STATUS_BY_ID.link.strength * 100;
}
export function applyStatus(b: Battle, source: Actor, target: Actor, id: StatusId, count = 1, linkStrengthBp?: number) {
  if(b.initial.skillsV5)id=statusIdV5(id);
  const rule = b.initial.skillsV5?statusRuleV5(id,STATUS_BY_ID[id]):STATUS_BY_ID[id];
  if (target.hp <= 0) return false;
  const control = id === 'drowsy' || id === 'hush';
  if (control && (target.bonuses.controlImmuneUntil ?? 0) >= b.round) {
    record(b, source, target, 'immune', 0, `${target.name} recovered control resistance`);
    return false;
  }
  if (rule.kind === 'debuff' && roll(b) >= clamp(9000 + source.effectHit - target.effectResist - (b.initial.skillsV5&&id==='drowsy'&&ENEMY_BY_ID[target.catalogId]?.tier==='boss'?3000:0), 1000, 9800)) {
    record(b, source, target, 'resist', 0, `${target.name} resisted ${rule.name}`);
    return false;
  }
  if(b.v4&&rule.kind==='debuff'&&target.bonuses.pantryCleanse){target.bonuses.pantryCleanse=0;record(b,target,target,'cleanse',1,'Clearleaf Tea cleared the first debuff');return false;}
  let status = target.statuses.find(s => s.id === id);
  if (b.initial.formationC2 && id === 'link' && status) {
    const previousSource = status.source;
    const protector = b.actors.find(a => a.id === previousSource && a.hp > 0 && a.id !== target.id);
    if (protector && linkShareBps(b,protector,status) > (linkStrengthBp ?? rule.strength * 100)) return false;
  }
  if (!status) {
    status = { id, stacks: 0, remaining: 0, source: source.id, appliedRound: b.round };
    target.statuses.push(status);
  }
  status.stacks = Math.min(rule.cap, status.stacks + count);
  status.remaining = rule.duration + (id === 'steep' ? Math.min(2,source.bonuses.statusDuration??0) : 0) + (id === 'scald' && hasEffect(source,'long-scald') ? 1 : 0) + (id === 'scald' && source.side === 'party' ? boonValue(b,'scaldDuration') : 0) + (id === 'steep' && target.catalogId === 'marigold' ? 1 : 0);
  if(b.v4&&id==='scald')status.remaining=Math.min(4,status.remaining);
  if(b.initial.skillsV5)status.remaining=rule.duration;
  if (control && ENEMY_BY_ID[target.catalogId]?.tier === 'boss') status.remaining = 1;
  status.source = source.id;
  status.appliedRound = b.round;
  if (b.initial.formationC2 && id === 'link') status.linkShareBp = linkStrengthBp ?? rule.strength * 100;
  if (control&&!b.initial.skillsV5) target.bonuses.controlImmuneUntil = b.round + 1;
  record(b, source, target, 'status', status.stacks, rule.name);
  if(b.initial.skillsV5)emitGameplayEvent(b,{kind:'status-applied',statusId:id,stacks:status.stacks,sourceId:source.id,actorId:source.id,targetId:target.id,text:`${target.name}: ${rule.name} ×${status.stacks}.`});
  if (source.side === 'party') {
    if (id === 'steep' && hasEffect(source,'steep-cozy')&&(!b.v4||!source.bonuses.steepCozyUsed)){if(b.v4)source.bonuses.steepCozyUsed=1;applyStatus(b,source,target,'cozy');}
    if(id==='scald'&&(!b.v4||source.bonuses.wickRound!==b.round)){if(b.v4)source.bonuses.wickRound=b.round;if(hasEffect(source,'unique:warmwick'))gearGrant(b,source,source,'unique:warmwick','heal',b.v4?4:6);if(b.v4&&hasEffect(source,'scald-charge'))gearGrant(b,source,source,'scald-charge','heal',6);}
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
  if(b.initial.skillsV5)amount=receivedV5(target,amount);
  const actual = Math.min(Math.round(amount), Math.max(0, Math.floor(target.maxHp * .6) - target.shield));
  target.shield += actual;
  record(b, source, target, 'shield', actual);
  if (source.catalogId === 'mochi' && source.id !== target.id) source.shield = Math.min(Math.floor(source.maxHp * .6), source.shield + (b.initial.skillsV5?receivedV5(source,12):12));
}
function heal(b: Battle, source: Actor, target: Actor, amount: number) {
  if (target.hp <= 0 || amount<=0) return;
  amount*=1+(source.bonuses.healingBp??0)/10000;
  if(b.initial.skillsV5)amount=receivedV5(target,amount);
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
  hitRageA6(b,source,target,actual);
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
    if(b.initial.skillsV5)releaseThreadV5(b,target);
    if(b.initial.skillsV5)spreadV5(b,source,target,reactionRuntimeV5);
    if (source.catalogId === 'velvet') { if (b.v4) heal(b,source,source,6); else source.charge = Math.min(100, source.charge + 15); }
    if (source.side === 'party' && source.hp > 0) heal(b,source,source,boonValue(b,'killHeal'));
  }
  if(b.initial.gameplayA6)phaseBossA6(b,target);else phaseBossV4(b,target);
  if(b.initial.skillsV5)phaseHelpersV5(b,target,spawnThread);
  return actual;
}
function damage(b: Battle, source: Actor, target: Actor, power: number, pressure: number, cover = false, shape: ShapeV5 = 'single') {
  if (target.hp <= 0) return;
  if (stacks(target, 'decoy')) {
    target.statuses = target.statuses.filter(s => s.id !== 'decoy');
    record(b, source, target, 'decoy', 0, 'Yarn decoy absorbed the hit');
    return;
  }
  const variance = (9200 + roll(b, 1601)) / 10000;
  if (!b.v4) {
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
  }
  const extraDamage = source.side === 'party' ? (source.shield > 0 ? boonValue(b,'shieldStrike') : 0) + (source.row === 'rear' ? boonValue(b,'rearDamage') : 0) : 0;
  const bonus=source.bonuses;
  const conditional=(source.row==='front'?bonus.frontDamage??0:bonus.rearDamage??0)
    +(ENEMY_BY_ID[target.catalogId]?.tier==='boss'?bonus.bossDamage??0:0)
    +(ENEMY_BY_ID[target.catalogId]?.tier==='elite'?bonus.eliteDamage??0:0)
    +(stacks(target,'scald')?bonus.scaldDamage??0:0)+(stacks(target,'scent')?bonus.markedDamage??0:0)
    +((b.v4?stacks(target,'scent')>0:target.break>=target.breakCap)?bonus.brokenDamage??0:0)+(source.shield>0?bonus.shieldedDamage??0:0)
    +(source.hp<source.maxHp/2?bonus.lowHpDamage??0:0);
  const marked = b.v4 && stacks(target,'scent') ? (hasEffect(source,'marked-break')?3:0)+boonValue(b,'markedDirect') : 0;
  const attack = source.attack * power / 100 + extraDamage + conditional + marked;
  const critical=(bonus.critBp??0)>0&&roll(b)<bonus.critBp! ? 1+(bonus.critDamageBp??5000)/10000 : 1;
  const mitigation = 80 / (80 + (b.initial.skillsV5?defenseV5(target):target.defense));
  const cozy = 1 - stacks(target, 'cozy') * .1;
  const rattled = 1 - stacks(source, 'rattled') * .15;
  const scent = stacks(target, 'scent') ? 1.2 : 1;
  const broken = !b.v4 && target.break >= target.breakCap ? 1.2 : 1;
  const tangled = b.v4 ? 1-stacks(source,'tangle')*.04 : 1;
  let amount = Math.max(1, Math.round(attack * mitigation * cozy * rattled * scent * broken * variance * critical * tangled));
  if (b.v4 && cover && target.row==='rear' && living(b,target.side).some(a=>a.row==='front')) {
    const prevented = amount - Math.max(1,Math.round(amount*(b.initial.formationC2?FORMATION_C2.rearCoverMultiplier:.9))); amount -= prevented;
    if (prevented) emitGameplayEvent(b,{kind:'formation-cover',actorId:source.id,targetId:target.id,amount:prevented,text:`Front cover prevented ${prevented} damage to ${target.name}.`});
  }
  target.shield = Math.max(0, target.shield - stacks(target, 'brittle') * 15);
  const absorbed = Math.min(target.shield, amount);
  target.shield -= absorbed;
  if (b.v4 && absorbed) record(b,source,target,'absorbed',absorbed,'Shield absorbed direct damage');
  let hpDamage = amount - absorbed;
  const link = target.statuses.find(s => s.id === 'link');
  const protector = link && b.actors.find(a => a.id === link.source && a.hp > 0 && a.id !== target.id);
  if (protector) {
    const shared = Math.floor(hpDamage * linkShareBps(b,protector,link) / 10000);
    hpDamage -= shared;
    loseHp(b, source, protector, shared, 'shared');
  }
  loseHp(b, source, target, hpDamage, 'damage');
  if(b.initial.skillsV5)directReactionV5(b,source,target,shape,reactionRuntimeV5);
  if((b.v4?stacks(target,'scent')>0&&source.bonuses.breakShieldRound!==b.round:target.break>=target.breakCap)){if(b.v4)source.bonuses.breakShieldRound=b.round;shield(b,source,source,source.bonuses.breakShield??0);}
  if(b.v4&&hasEffect(source,'ultimate-refund')&&stacks(target,'scent')&&source.bonuses.moonHealRound!==b.round){source.bonuses.moonHealRound=b.round;gearGrant(b,source,source,'ultimate-refund','heal',6);}
  if(hasEffect(source,'third-crumb')&&(b.v4?source.bonuses.thirdCrumbTurn!==source.turns&&((source.bonuses.attackCount??0)+1)%3===0:(source.turns+1)%3===0)){if(b.v4)source.bonuses.thirdCrumbTurn=source.turns;applyStatus(b,source,target,'crumb');}
  if(hasEffect(source,'unique:nightglass')&&stacks(target,'scent')&&source.bonuses.nightglassRound!==b.round){if(b.v4)gearGrant(b,source,source,'unique:nightglass','shield',6);else b.energy=Math.min(10,b.energy+1);source.bonuses.nightglassRound=b.round;}
  if (!b.v4) {
  source.charge = Math.min(100, source.charge + 8);
  target.charge = Math.min(100, target.charge + 7);
  if (source.side === 'party' && stacks(target,'scald')) source.charge = Math.min(100,source.charge + boonValue(b,'scaldCharge'));
  if (source.catalogId === 'mallow' && stacks(target, 'scald')) source.charge = Math.min(100, source.charge + 8);
  } else if (source.catalogId==='mallow' && stacks(target,'scald') && source.bonuses.mallowRound!==b.round) { source.bonuses.mallowRound=b.round; heal(b,source,source,4); }
  if(b.v4&&stacks(target,'scald')&&source.bonuses.scaldHealRound!==b.round){source.bonuses.scaldHealRound=b.round;heal(b,source,source,boonValue(b,'scaldHeal'));}
  if(b.v4&&stacks(target,'scent')&&source.bonuses.markShieldRound!==b.round){source.bonuses.markShieldRound=b.round;shield(b,source,source,boonValue(b,'markedShield'));}
  if (source.catalogId === 'biscuit' && source.hp < source.maxHp / 2 && !source.passiveUsed) {
    source.passiveUsed = true; shield(b, source, source, 30);
  }
  const reflect = stacks(target, 'riposte') * (16+(target.bonuses.counterPower??0)+(hasEffect(target,'counter-plus')?(b.v4?3:8):0)) + (target.catalogId === 'kettle-knight' && target.shield > 0 ? 12 : 0);
  if (reflect && source.hp > 0) loseHp(b, target, source, reflect, 'reflect');
}
const reactionRuntimeV5:ReactionRuntimeV5={apply:applyStatus,loseHp,record,rule:id=>STATUS_BY_ID[id]};
const statusRuntimeV5:StatusRuntimeV5={heal,loseHp,record,rule:id=>STATUS_BY_ID[id],isBoss:actor=>ENEMY_BY_ID[actor.catalogId]?.tier==='boss'};
export function tickStatuses(b: Battle, actor: Actor) {
  if(b.initial.skillsV5)return tickStatusesV5(b,[actor],statusRuntimeV5);
  if (actor.hp <= 0) return;
  for (const s of [...actor.statuses]) {
    const rule = STATUS_BY_ID[s.id], source = b.actors.find(a => a.id === s.source) ?? actor;
    if (rule.tick === 'damage') loseHp(b, source, actor, (rule.strength + (source.side === 'party' ? boonValue(b,'scaldPower')+(source.bonuses.dotPower??0) : 0)) * s.stacks, 'dot');
    if(!b.v4&&rule.tick==='damage'&&hasEffect(source,'scald-charge'))source.charge=Math.min(100,source.charge+3);
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
function enemyActor(id: string, index: number, chapter: number, tutorial = false, enemyStats?: BattleSetup['enemyStats']): Actor {
  const e = ENEMY_BY_ID[id];
  if (!e) throw Error('Unknown enemy');
  const stats = enemyStats?.[id] ?? e;
  const scale = tutorial ? .55 : 1 + Math.max(0, chapter - e.chapter) * .16;
  return { ...actorBase(), id:`foe-${index}-${id}`,catalogId:id,name:e.name,side:'enemy',role:e.role,row:e.row,flavour:e.flavour,hp:Math.round(stats.hp*scale),maxHp:Math.round(stats.hp*scale),attack:Math.round(stats.attack*scale*(tutorial ? 1 : [2.7, 1.95, 1.6][chapter - 1]!)),defense:stats.defense,initiative:5-index%3,effectHit:0,effectResist:e.tier==='boss'?1200:500,breakCap:e.breakCap,skills:[] };
}
export function createBattle(setup: BattleSetup): Battle {
  if(setup.formationC2&&(!setup.gameplayA6||!validRowsC2(setup.cats.map(c=>c.id),Object.fromEntries(setup.cats.map(c=>[c.id,c.row])))))throw Error('C2 requires four cats, two in each row, and Gameplay A6');
  if(setup.gameplayA6&&(!setup.skillsV5||!setup.gameplayV4))throw Error('Gameplay A6 requires Skills V5');
  if(setup.skillsV5&&!setup.gameplayV4)throw Error('Skills V5 requires automatic Gameplay V4');
  const initial = clone(setup);
  if(!initial.skillsV5)delete initial.skillsV5;
  if(!initial.gameplayA6)delete initial.gameplayA6;
  if(setup.gameplayV4) {
    if(setup.plan && !validPlan(setup.plan)) throw Error('Invalid standing plan');
    initial.plan = clone(setup.plan ?? DEFAULT_PLAN);
  }
  if(setup.gameplayV4&&setup.challengeLevel!==undefined)initial.enemyStats??=challengeStatsV4(setup.challengeLevel);
  initial.enemyStats ??= Object.fromEntries(Object.values(ENEMY_BY_ID).map(({ id, hp, attack, defense }) => [id, { hp, attack, defense }]));
  const actors: Actor[] = setup.cats.map((c,index) => {
    const cat = CAT_BY_ID[c.id];
    if (!cat || ![3, 4].includes(c.skills.length) || new Set(c.skills).size !== c.skills.length || c.skills.some(id => SKILLS[id]?.catId !== c.id)) throw Error('Invalid cat skill kit');
    return { ...actorBase(),id:c.id,catalogId:c.id,name:cat.name,side:'party',role:cat.role,row:c.row,flavour:cat.flavour,hp:Math.min(c.stats.hp,setup.hp?.[c.id]??c.stats.hp),maxHp:c.stats.hp,attack:c.stats.attack,defense:c.stats.defense,initiative:9-index,effectHit:c.stats.effectHitBp,effectResist:c.stats.effectResistBp,breakCap:6,skills:[...c.skills],equipment:c.equipment??[],setEffects:c.effects??[],bonuses:{...c.bonuses,critBp:c.stats.critBp,critDamageBp:c.stats.critDamageBp,healingBp:c.stats.healingBp,shieldBp:c.stats.shieldBp} };
  });
  actors.push(...(setup.skillsV5?encounterEnemiesV5(setup.enemies):setup.enemies).map((id,i) => enemyActor(id,i,setup.chapter,setup.tutorial,initial.enemyStats)));
  if(setup.formationC2){const count={front:0,rear:0};for(const foe of actors.filter(a=>a.side==='enemy')){if(count[foe.row]>=2)foe.row=foe.row==='front'?'rear':'front';count[foe.row]++;}}
  const b: Battle = {version:CONTRACT_VERSION,seed:setup.seed,rng:setup.seed,chapter:setup.chapter,actors,round:0,queue:[],acted:[],energy:0,maxEnergy:5,intents:[],log:[],choices:[],result:null,firstDeath:null,procRounds:{},boons:{...setup.boons},mutator:setup.mutator??'',initial};
  if (setup.gameplayV4) {
    b.v4={version:1,plan:clone(initial.plan!),events:[],committed:false};
    b.maxEnergy=0;
    const primary=actors.find(a=>a.side==='enemy'&&ENEMY_BY_ID[a.catalogId]?.tier==='boss');
    if(primary)for(const a of actors)if(a.side==='enemy'&&a.id!==primary.id&&ENEMY_BY_ID[a.catalogId]?.tier!=='boss')a.linkedBossId=primary.id;
    for(const actor of actors) actor.charge=0;
    for(const crew of crewThresholds(setup.cats.map(c=>c.id))) if(crew.threshold) emitGameplayEvent(b,{kind:'crew-active',crew:crew.id,marks:crew.marks,contributors:crew.contributors,threshold:crew.threshold,text:`${crew.name}: ${crew.description}.`});
  }
  prepareBattleA6(b);
  const combos = setup.gameplayV4 ? [] : teamCombos(setup.cats.map(c => c.id));
  for (const actor of living(b,'party')) {
    actor.shield += boonValue(b,'openingShield')+(actor.bonuses.openingShield??0);
    if(b.v4&&setup.packedSupply?.catId===actor.id){
      const id=setup.packedSupply.id;
      if(id==='shield-biscuit')actor.shield+=20;
      if(id==='quicken-yarn')applyStatus(b,actor,actor,'cozy');
      if(id==='cleanse-tea')actor.bonuses.pantryCleanse=1;
      if(id==='ultimate-treat')actor.bonuses.pantryTreat=1;
    }
    if(b.v4) { openingCrewBonus(setup.cats.map(c=>c.id),actor); actor.shield+=actor.bonuses.openingCharge??0; }
    else actor.charge = Math.min(100,actor.charge+boonValue(b,'openingCharge')+(actor.bonuses.openingCharge??0));
    if(hasEffect(actor,'opening-decoy')) { if(b.v4) actor.shield+=12; else applyStatus(b,actor,actor,'decoy'); }
    if(hasEffect(actor,'unique:softcollar')) { if(b.v4) actor.shield+=15; else applyStatus(b,actor,actor,'sprout'); }
    if (boonValue(b,'openingSteep')) applyStatus(b,actor,actor,'steep',boonValue(b,'openingSteep'));
    if (combos.some(c => c.id==='warm-table')) actor.shield += 20;
    if (combos.some(c => c.id==='night-garden')) actor.charge += 10;
    if (actor.catalogId==='inkcap') applyStatus(b,actor,actor,'decoy');
  }
  if (setup.mutator === 'thin-pot' && !b.v4) b.maxEnergy = 4;
  for (const actor of b.actors) {
    if(b.v4 && setup.mutator==='thin-pot' && actor.side==='party'){actor.shield+=12;actor.bonuses.healingBp=(actor.bonuses.healingBp??0)-1000;}
    if (setup.mutator === 'rainy' && actor.side === 'enemy') actor.shield += 20;
    if (setup.mutator === 'warm-floor' && actor.row === 'front') applyStatus(b,actor,actor,'cozy');
    if (setup.mutator === 'late-shift') {
      if (actor.side === 'enemy') actor.attack = Math.round(actor.attack * 1.1);
      else if(b.v4)actor.shield+=15;else actor.charge += 15;
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
    const signature = b.initial.gameplayA6 ? a.charge >= 100 : b.round % 3 === 0;
    const rear = party.filter(p => p.row==='rear');
    const front=party.filter(p=>p.row==='front');
    const reachable=b.v4&&front.length?front:party;
    const target = spec.mechanic==='steal' && (!b.initial.formationC2||signature) && rear.length ? weakest(rear) : b.v4&&spec.mechanic==='snare'?weakest(reachable):reachable[roll(b,reachable.length)]!;
    const intent:Intent={actorId:a.id,targetId:target.id,label:signature?(b.v4?enemyGuideV4(a.catalogId).intent:spec.intent):`${a.name} · ${!b.v4&&spec.mechanic==='heal'?'Cup refill':'basic pressure'}`,counter:b.v4?enemyGuideV4(a.catalogId).counter:spec.counter,power:signature?175:100,status:signature?spec.status:undefined,signature,interrupted:false};
    return b.initial.skillsV5?enemyIntentV5(b,a,intent):intent;
  });
}
function beginRound(b: Battle) {
  b.round++;
  b.acted=[];
  b.energy=b.v4?0:Math.min(10,b.maxEnergy+boonValue(b,'roundEnergy'));
  b.queue=b.actors.filter(a=>a.hp>0).sort((a,c)=>c.initiative-a.initiative||a.id.localeCompare(c.id)).map(a=>a.id);
  for (const a of b.actors) {
    for (const id of Object.keys(a.cooldowns)) a.cooldowns[id]=Math.max(0,a.cooldowns[id]!-1);
    if (a.hp>0 && a.side==='party' && a.row==='front') shield(b,a,a,boonValue(b,'roundShield'));
    if(a.hp>0&&a.side==='party')heal(b,a,a,(a.bonuses.roundHeal??0)+(hasEffect(a,'rear-heal')&&a.row==='rear'?(b.v4?6:16):0));
    if (a.hp>0 && a.catalogId==='brioche') shield(b,a,a,12);
    if (a.hp>0 && a.catalogId==='sorrel' && b.round%2===1) { if(b.v4)shield(b,a,weakest(living(b,'party')),6);else b.energy++; }
    const enemy = ENEMY_BY_ID[a.catalogId];
    if (!b.v4 && enemy?.tier==='boss' && a.hp<=a.maxHp/2 && a.phase===1) { a.phase=2; record(b,a,a,'phase',2,enemy.phases[1]); }
  }
  setIntents(b);
}
function checkResult(b: Battle) {
  if(b.result)return;
  if(finishBossV4(b))return;
  if (!living(b,'party').length || b.round>50) b.result='enemy';
  else if (!living(b,'enemy').length) b.result='party';
}
export function currentActor(b: Battle) { return b.actors.find(a => a.id === b.queue[0] && a.hp > 0); }
export function targets(b: Battle, actor: Actor, skill: Skill): Actor[] {
  const foes=living(b,actor.side==='party'?'enemy':'party'), allies=living(b,actor.side);
  if(b.initial.skillsV5){skill=situationalSkillV5(b,actor,skill);if(['weakest','ally-splash'].includes(shapeV5(skill))){const target=weakestV5(allies);return target?[target]:[];}}
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
export function skillById(id: string, v5 = false): Skill | undefined {const skill=SKILLS[id]??COMMON_SKILLS[id as keyof typeof COMMON_SKILLS];return v5&&skill?kitSkillV5(skill):skill;}
export function energyCost(actor: Actor, skill: Skill) { return skill.cost + (skill.cost>0 && stacks(actor,'hush') ? 1 : 0); }
export function legalChoices(b: Battle): Choice[] {
  const actor=currentActor(b);
  if (!actor||actor.side!=='party'||b.result) return [];
  return [...actor.skills,'defend',...(b.v4?[]:['wait'])].flatMap(id=>{
    const base=skillById(id,b.initial.skillsV5)!,skill=b.initial.skillsV5?situationalSkillV5(b,actor,base):base;
    if ((!b.v4&&(energyCost(actor,skill)>b.energy || skill.charge>actor.charge)) || (b.v4&&skill.type==='ultimate'&&(b.initial.gameplayA6?actor.charge<100:actor.turns<2)) || (actor.cooldowns[id]??0)>0 || skill.effects.some(e=>e.kind==='revive')&&actor.passiveUsed) return [];
    return targets(b,actor,skill).map(t=>({actorId:actor.id,skillId:id,targetId:t.id}));
  });
}
function gearGrant(b:Battle,actor:Actor,target:Actor,effect:string,kind:'heal'|'shield',amount:number){
 const before=kind==='heal'?target.hp:target.shield;
 if(kind==='heal')heal(b,actor,target,amount);else shield(b,actor,target,amount);
 const actual=(kind==='heal'?target.hp:target.shield)-before;
 if(b.v4&&actual>0){
  const set=SETS.find(s=>s.twoEffect===effect||s.fourEffect===effect);
  const templateId=actor.equipment.find(id=>effect.startsWith('unique:')?GEAR_BY_ID[id]?.unique===effect.slice(7):GEAR_BY_ID[id]?.setId===set?.id)??'';
  emitGameplayEvent(b,{kind:'gear-trigger',actorId:actor.id,targetId:target.id,templateId,effect,amount:actual,text:`${GEAR_BY_ID[templateId]?.name??effect} ${kind==='heal'?'restored':'granted'} ${actual} ${kind==='heal'?'HP':'shield'} to ${target.name}.`});
 }
}
function cleanseUniqueV4(b:Battle,actor:Actor,target:Actor){
  if(hasEffect(actor,'unique:gardenkey')&&actor.bonuses.gardenTurn!==actor.turns){actor.bonuses.gardenTurn=actor.turns;gearGrant(b,actor,target,'unique:gardenkey','heal',8);}
}
function executeEffect(b: Battle, actor: Actor, target: Actor, effect: EffectV5, skill: Skill) {
  const power=Math.round((effect.power??0)*(1+ROUTE_SKILL_POWER_PER_RANK*(b.initial.upgrades?.[skill.id]??0))*(b.initial.skillsV5?1+(effect.burnScaling??0)*stacks(target,'scald'):1));
  switch (effect.kind) {
    case 'hit': damage(b,actor,target,power,skill.breakPower,false,shapeV5(skill)); break;
    case 'shield': shield(b,actor,target,power+(actor.bonuses.shieldFlat??0));if(boonValue(b,'shieldHeal'))heal(b,actor,target,boonValue(b,'shieldHeal'));break;
    case 'heal':
      heal(b,actor,target,power+boonValue(b,'healing')+(actor.bonuses.healFlat??0));
      if(hasEffect(actor,'unique:seedcup')&&!actor.bonuses.seedcupUsed){if(b.v4)gearGrant(b,actor,target,'unique:seedcup','shield',12);else applyStatus(b,actor,target,'sprout');actor.bonuses.seedcupUsed=1;}
      if (boonValue(b,'healCleanse')||hasEffect(actor,'healing-cleanse')&&(!b.v4||actor.bonuses.setCleanseTurn!==actor.turns)) {
        const debuff=target.statuses.find(s=>STATUS_BY_ID[s.id].kind==='debuff'&&STATUS_BY_ID[s.id].dispellable);
        if(debuff){target.statuses=target.statuses.filter(s=>s!==debuff);if(b.v4){actor.bonuses.setCleanseTurn=actor.turns;cleanseUniqueV4(b,actor,target);}}
      }
      if(!actor.bonuses.healProc){if(b.v4)shield(b,actor,target,boonValue(b,'healShield'));else actor.charge=Math.min(100,actor.charge+boonValue(b,'healCharge'));actor.bonuses.healProc=1;}
      break;
    case 'cleanse': {
      const before=target.statuses.length;
      if(b.initial.skillsV5&&effect.cleanseCount){
        const removed=target.statuses.filter(s=>STATUS_BY_ID[s.id].kind==='debuff'&&STATUS_BY_ID[s.id].dispellable).slice(0,effect.cleanseCount);
        target.statuses=target.statuses.filter(s=>!removed.includes(s));record(b,actor,target,'dispel',removed.length,'Removed debuffs');
      }else dispel(b,actor,target,'debuff');
      if(before>target.statuses.length){shield(b,actor,target,actor.bonuses.cleanseShield??0);if(b.v4)cleanseUniqueV4(b,actor,target);else if(hasEffect(actor,'unique:gardenkey'))heal(b,actor,target,25);}
      if(before>target.statuses.length&&!actor.bonuses.cleanseProc){if(b.v4){shield(b,actor,target,boonValue(b,'cleanseExtraShield'));if(actor.bonuses.crewCleanse&&!actor.bonuses.crewCleansed){actor.bonuses.crewCleansed=1;shield(b,actor,target,actor.bonuses.crewCleanse);}}else b.energy=Math.min(10,b.energy+boonValue(b,'cleanseEnergy'));actor.bonuses.cleanseProc=1;}
      break;
    }
    case 'dispel': dispel(b,actor,target,'buff'); break;
    case 'detonate': {
      const detonate=()=>{
      const count=stacks(target,'crumb')+stacks(target,'scald');
      loseHp(b,actor,target,count*(24+boonValue(b,'detonatePower'))*power/100,'detonate');
      target.statuses=target.statuses.filter(s=>s.id!=='crumb'&&s.id!=='scald');
      if(count&&boonValue(b,'detonateSplash'))for(const other of living(b,target.side).filter(a=>a.id!==target.id))loseHp(b,actor,other,boonValue(b,'detonateSplash'),'detonate');
      if(count&&hasEffect(actor,'detonate-energy')){if(b.v4){if(actor.bonuses.setDetonateTurn!==actor.turns){actor.bonuses.setDetonateTurn=actor.turns;gearGrant(b,actor,actor,'detonate-energy','shield',8);}}else b.energy=Math.min(10,b.energy+1);}
      if(count&&hasEffect(actor,'unique:crumbbook')&&(!b.v4||actor.bonuses.bookTurn!==actor.turns)){if(b.v4)actor.bonuses.bookTurn=actor.turns;gearGrant(b,actor,actor,'unique:crumbbook','shield',b.v4?10:35);}
      if (count && actor.catalogId==='soot') {if(b.v4)shield(b,actor,actor,6);else actor.charge=Math.min(100,actor.charge+10); }
      };
      if(b.initial.skillsV5)crumbBurstV5(b,actor,target,reactionRuntimeV5,detonate);else detonate();
      break;
    }
    case 'transfer': { const amount=actor.shield;actor.shield=0;shield(b,actor,target,amount);break; }
    case 'revive': target.hp=Math.round(target.maxHp*power/100);target.statuses=[];actor.passiveUsed=true;record(b,actor,target,'revive',target.hp);break;
    case 'execute': damage(b,actor,target,power*(target.hp/target.maxHp<.3+(actor.bonuses.executeThreshold??0)/100?2:1),skill.breakPower,false,shapeV5(skill));break;
    case 'chain': {
      const others=living(b,target.side).filter(t=>t.id!==target.id);
      for (const [i,t] of [target,...others].slice(0,3).entries()) damage(b,actor,t,power*(1-i*.15),skill.breakPower);
      break;
    }
    case 'energy': {
      if(b.v4) {
        // Reflection may defeat the last ally earlier in this same skill.
        const ally=weakest(living(b,actor.side));
        if(ally)shield(b,actor,ally,Math.min(18,power*6));
      } else {b.energy=Math.min(10,b.energy+power);record(b,actor,actor,'energy',power);}
      break;
    }
    case 'swap': {
      const row=actor.row;actor.row=target.row;target.row=row;
      shield(b,actor,actor,boonValue(b,'swapShield')+(hasEffect(actor,'swap-shield')?(b.v4?12:25):0));
      shield(b,actor,target,boonValue(b,'swapShield')+(hasEffect(actor,'swap-shield')?(b.v4?12:25):0));
      if(hasEffect(actor,'unique:rainbell')){
        if(b.v4){
          const debuff=actor.statuses.find(s=>STATUS_BY_ID[s.id].kind==='debuff'&&STATUS_BY_ID[s.id].dispellable);
          if(debuff){
            if(b.initial.formationC2)debuff.stacks=Math.max(0,debuff.stacks-ECONOMY_C2.uniques.rainbellCleanseStacks);
            if(!b.initial.formationC2||debuff.stacks===0)actor.statuses=actor.statuses.filter(s=>s!==debuff);
          }
        }else dispel(b,actor,actor,'debuff');
      }
      break;
    }
    case 'drain': heal(b,actor,actor,actor.attack*power/100);break;
    case 'consume': { const count=stacks(actor,'cozy');actor.statuses=actor.statuses.filter(s=>s.id!=='cozy');if(count)damage(b,actor,target,count*power,0);break; }
    case 'break': if(b.v4){applyStatus(b,actor,target,'rattled',1);break;}target.break=Math.min(target.breakCap,target.break+power);if(target.break>=target.breakCap){const i=b.intents.find(i=>i.actorId===target.id);if(i)i.interrupted=true;}break;
    case 'rally': break;
  }
  if (effect.status) applyStatus(b,actor,target,effect.status,effect.stacks??1);
}
function finishAction(b: Battle, actor: Actor) {
  actor.turns++;
  if(b.v4){b.energy=0;for(const a of b.actors){if(!b.initial.gameplayA6)a.charge=0;a.break=0;}gainRageA6(b,actor,24);}else actor.charge=Math.min(100,actor.charge+6);
  b.acted.push(actor.id);
  b.queue=b.queue.filter(id=>id!==actor.id&&b.actors.some(a=>a.id===id&&a.hp>0));
  checkResult(b);
  if (!b.result && !b.queue.length) {
    if(b.initial.skillsV5)tickStatusesV5(b,b.actors,statusRuntimeV5);
    else for (const a of b.actors) {tickStatuses(b,a);if(b.v4){checkResult(b);if(b.result)break;}}
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
  const actor=currentActor(b)!;
  if(b.initial.skillsV5)b.procRounds.v5ActionSequence=(b.procRounds.v5ActionSequence??0)+1;
  if(b.initial.skillsV5&&!beforeActionV5(b,actor,statusRuntimeV5)){b.choices.push({...choice});record(b,actor,actor,'action',0,'Bleed prevented the action',choice.skillId);finishAction(b,actor);return true;}
  let skill=skillById(choice.skillId,b.initial.skillsV5)!, target=b.actors.find(a=>a.id===choice.targetId)!;
  if(b.initial.skillsV5)skill=situationalSkillV5(b,actor,skill);
  if(b.initial.skillsV5&&consumeDazeV5(b,actor,statusRuntimeV5)){const basic=skillById(actor.skills[0]!,true)!;skill={...basic,effects:basic.effects.map(e=>({...e,...(e.power!==undefined?{power:e.power*.5}:{})}))};target=targets(b,actor,skill)[0]??target;}
  const description = actionDescription(b, actor, target, skill);
  b.choices.push({...choice});
  actor.bonuses.healProc=0;actor.bonuses.cleanseProc=0;
  if(b.v4) {
    b.v4.committed=true;
    emitGameplayEvent(b,{kind:'plan-target',actorId:actor.id,targetId:target.id,plan:{...b.v4.plan},reason:description,text:`${b.v4.plan.focus}/${b.v4.plan.care} plan: ${description}`});
  } else {b.energy-=energyCost(actor,skill);actor.charge-=skill.charge;}
  if(b.initial.gameplayA6&&skill.type==='ultimate'){
    actor.charge=0;
    emitGameplayEvent(b,{kind:'ultimate.cast',actorId:actor.id,targetId:target.id,skillId:skill.id,displayName:skill.name,text:`${actor.name} · ${skill.name}`});
  }
  actor.cooldowns[skill.id]=skill.cooldown+1;
  shield(b,actor,actor,stacks(actor,'glaze')*20);
  if(b.initial.skillsV5)executeShapeV5(b,actor,target,skill,{roll,effect:executeEffect,record});
  else {
  const affected=skill.target==='foes'?living(b,'enemy'):skill.target==='allies'?living(b,'party'):skill.target==='row'?living(b,target.side).filter(a=>a.row===target.row):[target];
  for (const effect of skill.effects) {
    if (effect.self || effect.kind==='energy' || effect.kind==='chain') executeEffect(b,actor,effect.self?actor:target,effect,skill);
    else for (const t of affected) executeEffect(b,actor,t,effect,skill);
  }
  }
  if (actor.catalogId==='panko'&&skill.id==='defend') applyStatus(b,actor,actor,'riposte');
  if(skill.id==='defend'){
    if(hasEffect(actor,'defend-shield'))gearGrant(b,actor,actor,'defend-shield','shield',b.v4?12:25);
    if(hasEffect(actor,'defend-link')){const ally=weakest(living(b,'party').filter(a=>a.id!==actor.id));if(ally)applyStatus(b,actor,ally,'link',1,ECONOMY_C2.sets.hearthloomShareBp);}
    if(hasEffect(actor,'defend-riposte')){
      if(!b.initial.formationC2||(actor.bonuses.bellsteelShelters??0)<ECONOMY_C2.sets.bellsteelSheltersPerBattle){
        applyStatus(b,actor,actor,'shelter');
        if(b.initial.formationC2)actor.bonuses.bellsteelShelters=(actor.bonuses.bellsteelShelters??0)+1;
      }
      if(!b.initial.formationC2||(actor.bonuses.bellsteelRipostes??0)<ECONOMY_C2.sets.bellsteelRipostesPerBattle){
        applyStatus(b,actor,actor,'riposte');
        if(b.initial.formationC2)actor.bonuses.bellsteelRipostes=(actor.bonuses.bellsteelRipostes??0)+1;
      }
    }
    if(hasEffect(actor,'unique:panlid'))applyStatus(b,actor,actor,'riposte',b.v4?1:2);
    if(hasEffect(actor,'unique:doorstop'))gearGrant(b,actor,actor,'unique:doorstop','heal',b.v4?8:25);
  }
  if(skill.id==='wait'&&hasEffect(actor,'unique:tidetray'))shield(b,actor,weakest(living(b,'party')),30);
  if(skill.charge&&!b.v4){
    actor.charge=Math.min(100,actor.charge+(actor.bonuses.ultimateCharge??0)+(hasEffect(actor,'ultimate-refund')?20:0));
    if(hasEffect(actor,'unique:starladle')&&!actor.bonuses.starladleUsed){actor.charge=Math.min(100,actor.charge+25);actor.bonuses.starladleUsed=1;}
    if(hasEffect(actor,'unique:silkspool')&&!actor.bonuses.silkspoolUsed){applyStatus(b,actor,actor,'decoy');actor.bonuses.silkspoolUsed=1;}
  }
  if (skill.id==='defend'&&!b.v4) actor.charge=Math.min(100,actor.charge+boonValue(b,'defendCharge'));
  if (skill.id==='wait') heal(b,actor,actor,boonValue(b,'waitHeal'));
  if (skill.charge&&!b.v4) b.energy=Math.min(10,b.energy+boonValue(b,'ultimateEnergy'));
  if(b.v4&&skill.id==='defend')heal(b,actor,actor,boonValue(b,'defendHeal'));
  if(b.v4&&skill.type==='ultimate')shield(b,actor,actor,boonValue(b,'ultimateShield'));
  if(b.v4){
    if(skill.effects.some(e=>['hit','chain','execute'].includes(e.kind)))actor.bonuses.attackCount=(actor.bonuses.attackCount??0)+1;
    if(skill.type==='ultimate'){
      heal(b,actor,actor,actor.bonuses.ultimateCharge??0);
      if(!actor.bonuses.uniqueUltimateUsed){
        actor.bonuses.uniqueUltimateUsed=1;
        if(hasEffect(actor,'unique:silkspool'))gearGrant(b,actor,actor,'unique:silkspool','shield',12);
        if(hasEffect(actor,'unique:starladle'))gearGrant(b,actor,actor,'unique:starladle','heal',12);
        if(actor.bonuses.pantryTreat){heal(b,actor,actor,12);actor.bonuses.pantryTreat=0;}
      }
    }
  }
  triggerPairCombosA6(b, actor, { damage, apply: applyStatus, shield, heal });
  record(b,actor,target,'action',0,description,skill.id);
  finishAction(b,actor);
  return true;
}
function spawnThread(b: Battle, source: Actor, limit=2) {
  if (living(b,'enemy').filter(a=>a.catalogId==='binding-thread').length>=limit) return;
  const actor=enemyActor('binding-thread',b.actors.length,b.chapter,false,b.initial.enemyStats);
  if(b.v4)actor.linkedBossId=ENEMY_BY_ID[source.catalogId]?.tier==='boss'?source.id:source.linkedBossId;
  b.actors.push(actor);
  record(b,source,actor,'summon',0,'Binding Thread joins next round');
}
export function enemyAct(b: Battle): boolean {
  const actor=currentActor(b);
  if (!actor||actor.side!=='enemy'||b.result) return false;
  if(b.initial.skillsV5)b.procRounds.v5ActionSequence=(b.procRounds.v5ActionSequence??0)+1;
  if(b.initial.skillsV5&&!beforeActionV5(b,actor,statusRuntimeV5)){record(b,actor,actor,'enemy-action',0,'Bleed prevented the action');finishAction(b,actor);return true;}
  const dazed=b.initial.skillsV5&&consumeDazeV5(b,actor,statusRuntimeV5);
  const intent=b.intents.find(i=>i.actorId===actor.id)!;
  const spec=ENEMY_BY_ID[actor.catalogId]!;
  const party=living(b,'party');
  const shelter=party.find(a=>stacks(a,'shelter')&&(!b.initial.formationC2||a.row==='front'||!party.some(p=>p.row==='front')));
  const front=party.filter(a=>a.row==='front');
  const reachable=b.v4&&front.length&&(spec.mechanic!=='steal'||b.initial.formationC2&&!intent.signature)?front:party;
  const target=shelter??reachable.find(a=>a.id===intent.targetId)??weakest(reachable);
  if (!target) {checkResult(b);return false;}
  shield(b,actor,actor,stacks(actor,'glaze')*20);
  const impaired=intent.interrupted||stacks(actor,'drowsy')>0||!!dazed;
  const quiet=stacks(actor,'hush')>0;
  const rageReady=!!b.initial.gameplayA6&&actor.charge>=100&&!impaired&&!quiet;
  if(rageReady){
    actor.charge=0;intent.power=175;
    emitGameplayEvent(b,{kind:'ultimate.cast',actorId:actor.id,skillId:actor.catalogId,displayName:spec.intent,text:`${actor.name} · ${spec.intent}`});
  }
  const signature=(intent.signature||rageReady)&&!impaired;
  if(rageReady)intent.signature=true;
  const creditSuppression = () => {
    record(b,actor,actor,'suppressed',1,impaired?'Control softened enemy action':'Hush stopped enemy utility');
    const controller=b.actors.find(a=>a.id===actor.statuses.find(s=>s.id===(impaired?'drowsy':'hush'))?.source);
    if(controller?.bonuses.crewSuppress&&!controller.bonuses.crewSuppressed){controller.bonuses.crewSuppressed=1;heal(b,controller,controller,controller.bonuses.crewSuppress);}
  };
  if(b.v4&&impaired&&!b.initial.skillsV5) creditSuppression();
  if (impaired) {
    if(b.initial.skillsV5&&actor.catalogId==='spool-ram')actor.bonuses.v5Charge=0;
    damage(b,actor,target,b.initial.skillsV5?(spec.tier==='boss'?100:50):40,0,b.v4&&spec.mechanic!=='steal');
  }
  else if(b.initial.skillsV5&&enemyActionV5(b,actor,intent,target,{damage,apply:applyStatus,shield,heal,roll,record})){/* V5 chapter-one mechanic resolved. */}
  else if (b.v4&&signature&&quiet&&['heal','shield'].includes(spec.mechanic)) {
    // Suppression spends the committed utility turn; it does not replace it with a hit.
    creditSuppression();
  }
  else if (spec.mechanic==='heal'&&!quiet&&(!b.v4||signature)) heal(b,actor,weakest(living(b,'enemy')),65);
  else if (spec.mechanic==='shield'&&!quiet&&(!b.v4||signature)) for (const a of living(b,'enemy').filter(a=>a.row===actor.row)) shield(b,actor,a,45);
  else {
    let affected=[target];
    if(signature&&['charge','bind','storm','banquet','dot'].includes(spec.mechanic)) affected=party.filter(a=>actor.phase===2||a.row===(spec.mechanic==='dot'?'rear':'front'));
    if (!affected.length) affected=[target];
    for (const t of affected) {
      if (signature&&spec.mechanic==='storm') t.shield=0;
      const wide=signature&&['charge','bind','storm','banquet','dot'].includes(spec.mechanic);
      // These legacy later-chapter signatures lacked the V5 row/all landing reduction.
      // Keep their identities (shield wash / Hush) without an early, unfixable burst wall.
      const landing=b.initial.gameplayA6&&wide?(spec.mechanic==='storm'?.65:spec.mechanic==='banquet'?.9:1):1;
      damage(b,actor,t,(signature?intent.power:100)*landing,0,!!b.v4&&!wide&&spec.mechanic!=='steal');
      if (spec.status&&(signature||['dot','snare','bomb'].includes(spec.mechanic))) applyStatus(b,actor,t,spec.status);
      if (signature&&spec.mechanic==='bomb') {loseHp(b,actor,t,stacks(t,'crumb')*35,'detonate');t.statuses=t.statuses.filter(s=>s.id!=='crumb');}
    }
    if (spec.mechanic==='steal'||signature&&spec.mechanic==='banquet') {if(b.v4){const removed=Math.min(6,target.shield);target.shield-=removed;record(b,actor,target,'strip-shield',removed);}else b.energy=Math.max(0,b.energy-1);}
    if ((!b.v4||actor.hp>0)&&signature&&(spec.mechanic==='summon'||spec.mechanic==='banquet'&&actor.phase===2||spec.mechanic==='bind')) {
      if(!quiet) spawnThread(b,actor);
      else if(b.v4&&living(b,'enemy').filter(a=>a.catalogId==='binding-thread').length<2) creditSuppression();
    }
    if (spec.mechanic==='reflect'&&actor.turns===0) {shield(b,actor,actor,70);applyStatus(b,actor,actor,'cozy');}
  }
  record(b,actor,target,'enemy-action',0,impaired?(b.v4?'Drowsy intent · softened basic':'Broken intent · softened basic'):intent.label,
    b.initial.gameplayA6?`enemy:${actor.catalogId}${signature?'':':basic'}`:'');
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
