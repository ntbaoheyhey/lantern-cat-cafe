import { ABILITIES, HEROES, NAMES, PASSIVES, SQUAD_CONFIG } from '../config';
import type { Hero, Role, TurnSkill } from './types';

export { HEROES, NAMES };
export const TURN_PASSIVES = PASSIVES;

/** Independent local turn tuning. No real-time numbers or production rewards are changed. */
export const TURN_CONFIG = {
  version: 3, defaultSeed: 11, maxTurns: 650, preview: 24,
  initiative: { maxMove: 8, minRank: 1, maxRank: 12 },
  defenseScale: 80, minDamage: 1, variance: 0.08, critMultiplier: 1.5,
  caps: { crit: 0.4, guard: 0.5, shieldFraction: 0.6, burn: 3 },
  guardFraction: 0.3, shieldRounds: 2, burnDamage: 12,
  charge: { max: 100, initial: 15, action: 16, received: 7 },
  passive: { cooldown: 2, guardianShield: 30, witchCharge: 12, alchemistShield: 30, injuredFraction: 0.65 },
  control: { normalRounds: 1, bossRounds: 1, recoveryRounds: 1, bossRecoveryRounds: 2, delay: 2, bossDelay: 1 },
  policy: { healThreshold: 0.78, urgentHeal: 0.45, guardThreshold: 0.7, shelterThreshold: 0.72,
    priority: { thread: 100, healer: 75, charger: 55, elite: 45, ranger: 40, flanker: 30, guard: 20, yarn: 10, dummy: 0 },
    activePriority: { thread: 140, healer: 90, charger: 65, elite: 55, ranger: 45, flanker: 35, guard: 20, yarn: 15, dummy: 0 },
    woundedBonus: 20, killBonus: 100, exposedBonus: 85, threatBonus: 50,
    lootTwo: 20, lootThree: 45, lootRole: {guardian: .65, witch: 2.2, alchemist: 1.2},
    active: { roleWeight: 0, interruption: .7, bossInterruption: 0, rescue: 0, shield: 0, taunt: 0, consumedReserve: 65 } },
  boss: { standalone: { hp: 3400, attack: 220 }, phaseFraction: 0.5, enrageRounds: 15, enrageMultiplier: 1.7, enrageGrowth: 0.12,
    breakMax: 100, bashBreak: 30, ordinaryBreak: 7, guardedBreak: 12,
    exposedRounds: 2, exposedMultiplier: 1.6, bindRounds: 3,
    addsEvery: 4, addsPerWave: 2, maxEnemies: 8, threadSlot: 7, addSlots: [2, 3, 1, 4, 5, 6],
    cycleOne: ['yarnAttack', 'bindThread'], cycleTwo: ['yarnAttack', 'bindThread', 'crossSweep'] },
  equipment: { statScale: 1, maxCooldownReduction: 1, minUltimateCost: 70, costReduction: 15,
    chainPower: .5, neighborShield: 24, afterheal: 20, extraBurnRounds: 1, renew: 18,
    extraBreak: 15, vampiric: 12, actionCharge: 6, thorns: 10, maxStatusChance: .35,
    sets: { hearthDefense: 5, hearthShield: .12, moonAttack: 6, moonCrit: .03, mossHealing: .15, mossHp: 25 } },
  consumables: { counts: { healTonic: 2, shieldBiscuit: 2, quickenYarn: 2, cleanseTea: 2, ultimateTreat: 1 },
    tonic: 150, biscuit: 80, quickenSteps: 2, tea: 40, treat: 40 },
  localFish: { wave: 9, boss: 15 },
  presets: {
    hearthkeepers: { name: 'Hearthkeepers', hp: 1.12, attack: 1.04, healing: 1.12, shield: 1.15, initiative: 0 },
    lanternbreakers: { name: 'Lanternbreakers', hp: 0.95, attack: 1.04, healing: 1, shield: 1, initiative: 1 },
  },
  stats: {
    guardian: { hp: 610, attack: 52, defense: 42, initiative: 8, crit: 0.08 },
    witch: { hp: 340, attack: 65, defense: 14, initiative: 6, crit: 0.12 },
    alchemist: { hp: 380, attack: 38, defense: 22, initiative: 4, crit: 0.05 },
    guard: { hp: 245, attack: 64, defense: 32, initiative: 5, crit: 0.04 },
    flanker: { hp: 145, attack: 40, defense: 5, initiative: 7, crit: 0.08 },
    ranger: { hp: 175, attack: 60, defense: 8, initiative: 5, crit: 0.05 },
    healer: { hp: 230, attack: 12, defense: 12, initiative: 3, crit: 0 },
    charger: { hp: 245, attack: 100, defense: 20, initiative: 2, crit: 0.05 },
    elite: { hp: 380, attack: 98, defense: 50, initiative: 3, crit: 0.08 },
    yarn: { hp: 4000, attack: 245, defense: 28, initiative: 6, crit: 0 },
    thread: { hp: 85, attack: 18, defense: 0, initiative: 5, crit: 0 },
    dummy: { hp: 1200, attack: 0, defense: 16, initiative: 1, crit: 0 },
  } satisfies Record<Role, { hp: number; attack: number; defense: number; initiative: number; crit: number }>,
  waves: SQUAD_CONFIG.waves,
  trainingRoles: ['guard', 'flanker', 'charger', 'ranger', 'healer', 'elite'] as readonly Role[],
} as const;

const skill = (id: string, target: TurnSkill['target'], values: Partial<TurnSkill> = {}): TurnSkill => ({
  id, name: ABILITIES[id]!.name, description: ABILITIES[id]!.description,
  target, power: 1, cooldown: 0, chargeCost: 0, icon: ABILITIES[id]!.shape, ...values,
});

export const CONSUMABLE_SKILLS:Record<string,TurnSkill>={
  healTonic: { id:'healTonic',name:'Warm Milk Tonic',description:`Restore ${TURN_CONFIG.consumables.tonic} HP. Uses this cat's action.`,target:'ally',power:0,cooldown:0,chargeCost:0,heal:TURN_CONFIG.consumables.tonic,icon:'flask',consumable:true },
  shieldBiscuit: { id:'shieldBiscuit',name:'Shield Biscuit',description:`Grant ${TURN_CONFIG.consumables.biscuit} shield for 2 rounds. Uses an action.`,target:'ally',power:0,cooldown:0,chargeCost:0,shield:TURN_CONFIG.consumables.biscuit,icon:'wall',consumable:true },
  quickenYarn: { id:'quickenYarn',name:'Quicken Yarn',description:`Move a pending ally ${TURN_CONFIG.consumables.quickenSteps} places earlier this round; once per recipient per round.`,target:'ally',power:0,cooldown:0,chargeCost:0,orderSteps:TURN_CONFIG.consumables.quickenSteps,icon:'snare',consumable:true },
  cleanseTea: { id:'cleanseTea',name:'Clearleaf Tea',description:`Cleanse harmful effects and restore ${TURN_CONFIG.consumables.tea} HP. Uses an action.`,target:'ally',power:0,cooldown:0,chargeCost:0,heal:TURN_CONFIG.consumables.tea,cleanse:true,icon:'moss',consumable:true },
  ultimateTreat: { id:'ultimateTreat',name:'Starlight Treat',description:`Grant ${TURN_CONFIG.consumables.treat} ultimate charge. Uses an action.`,target:'ally',power:0,cooldown:0,chargeCost:0,chargeGrant:TURN_CONFIG.consumables.treat,icon:'spark',consumable:true },
};

/** Three basics and nine activated hero skills; enemy identities match the comparison engine. */
export const TURN_SKILLS: Record<string, TurnSkill> = {
  ...CONSUMABLE_SKILLS,
  guardianBasic: skill('guardianBasic', 'enemy', { melee: true }),
  witchBasic: skill('witchBasic', 'enemy'),
  alchemistBasic: skill('alchemistBasic', 'enemy'),
  shieldBash: skill('shieldBash', 'enemy', { power: 1.35, cooldown: 2, status: 'stun', duration: 1, delay: 2, melee: true,
    description: 'Interrupt one committed intent and push it back by two positions. Control resistance prevents repeated locks.' }),
  rally: skill('rally', 'self', { power: 0, cooldown: 3, shield: 45, status: 'guard', duration: 2,
    description: 'Guard and shield Mochi for two rounds; taunt all hostile single-target intents.' }),
  hearthwall: skill('hearthwall', 'allAllies', { power: 0, cooldown: 3, chargeCost: 100, shield: 95, status: 'guard', duration: 2 }),
  threadSnare: skill('threadSnare', 'row', { power: 0.55, cooldown: 3, status: 'snare', duration: 1, delay: 2,
    description: 'Damage and delay every living foe in the chosen row. Does not cancel their actions.' }),
  emberOrb: skill('emberOrb', 'row', { power: 1.75, cooldown: 2, status: 'burn', duration: 2,
    description: 'Burst across the chosen row and burn it for two rounds.' }),
  lanternstorm: skill('lanternstorm', 'allEnemies', { power: 0.9, cooldown: 3, chargeCost: 100, hits: 3 }),
  milkFlask: skill('milkFlask', 'ally', { power: 0, cooldown: 1, heal: 140 }),
  mossFlask: skill('mossFlask', 'allAllies', { power: 0, cooldown: 3, heal: 45, status: 'guard', duration: 2 }),
  nineLives: skill('nineLives', 'allAllies', { power: 0, cooldown: 3, chargeCost: 100, heal: 95, shield: 90, cleanse: true }),
  guardAttack: skill('guardAttack', 'enemy', { melee: true }),
  flankerAttack: skill('flankerAttack', 'enemy', { melee: true }),
  rangerAttack: skill('rangerAttack', 'enemy'),
  healerAttack: skill('healerAttack', 'ally', { power: 0, heal: 80 }),
  chargerAttack: skill('chargerAttack', 'enemy', { power: 1.5, heavy: true, melee: true }),
  eliteAttack: skill('eliteAttack', 'enemy', { power: 1.4, heavy: true, melee: true }),
  yarnAttack: skill('yarnAttack', 'row', { power: 1.35, heavy: true }),
  crossSweep: skill('crossSweep', 'allEnemies', { power: 1.1, heavy: true }),
  bindThread: skill('bindThread', 'enemy', { power: 0.3, heavy: true }),
  threadAttack: skill('threadAttack', 'enemy', { power: 0.5 }),
  dummyAttack: skill('dummyAttack', 'enemy', { power: 0 }),
};
export const TURN_KITS: Record<Hero, readonly [string, string, string, string]> = {
  guardian: ['guardianBasic', 'shieldBash', 'rally', 'hearthwall'],
  witch: ['witchBasic', 'threadSnare', 'emberOrb', 'lanternstorm'],
  alchemist: ['alchemistBasic', 'milkFlask', 'mossFlask', 'nineLives'],
};

/** Truthful tooltips derived from tuning, so balancing cannot leave stale UI numbers. */
export function describeTurnSkill(s: TurnSkill): string {
  const parts = [s.power > 0 ? `${Math.round(s.power * 100)}% attack${s.hits ? ` × ${s.hits} hits` : ''}` : '',
    s.heal ? `Heal ${s.heal} before squad bonuses` : '', s.shield ? `${s.shield} shield for ${TURN_CONFIG.shieldRounds} rounds` : '',
    s.status ? `${s.status} ${s.duration ?? 1} round(s)` : '', s.delay ? `push back up to ${s.delay} positions` : '',
    s.cleanse ? 'cleanse harmful effects first' : '', s.chargeCost ? `${s.chargeCost} charge` : 'No charge cost',
    s.cooldown ? `${s.cooldown} round cooldown` : 'Always ready',
    `Target: ${s.target.replace(/([A-Z])/g, ' $1').toLowerCase()}`];
  return parts.filter(Boolean).join(' · ') + '.';
}
