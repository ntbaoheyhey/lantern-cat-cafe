import { initializeJourneyV4, validateJourneyV4 } from './journey-v4';
import { validateJournalV4, LESSONS_V4 } from './meta-v4';
import { validateIssuance } from './scarcity';
import { EQUIPMENT_SLOTS, type AccountState, type Slot } from '../contract';
import { clone } from '../internal';
import { createStarterAccount } from '../state';
import { CAT_BY_ID, ENEMY_BY_ID, SKILLS } from './catalog';
import { CONTRACT_VERSION, type BattleSetup, type DepthAccount } from './contract';
import { AFFIX_BY_ID, GEAR_BY_ID, initializeEquipment } from './equipment';
import { createDepthAccount } from './state';
import { SUPPLY_IDS_V4 } from './items-v4';
import { validPlan } from './gameplay-v4';

// Enemy catalogue used by 0.5 and 0.6 save codes. Keep these migration values fixed.
const legacyEnemyStats: NonNullable<BattleSetup['enemyStats']> = {
  'button-guard': { hp: 210, attack: 48, defense: 25 },
  'sock-skipper': { hp: 165, attack: 54, defense: 8 },
  'spool-ram': { hp: 300, attack: 74, defense: 16 },
  'needle-moth': { hp: 155, attack: 43, defense: 6 },
  'teacup-healer': { hp: 180, attack: 35, defense: 10 },
  'kettle-knight': { hp: 340, attack: 62, defense: 35 },
  'yarn-giant': { hp: 820, attack: 80, defense: 22 },
  'binding-thread': { hp: 90, attack: 25, defense: 0 },
  'practice-cushion': { hp: 230, attack: 14, defense: 0 },
  'pollen-scout': { hp: 270, attack: 54, defense: 10 },
  'rain-spool': { hp: 1050, attack: 85, defense: 24 },
  'crumb-sentinel': { hp: 360, attack: 68, defense: 22 },
  'pantry-crown': { hp: 1220, attack: 92, defense: 25 },
};

export const SAVE_KEY = 'taskbar-hero-cardrpg-depth-v1';
/** Detects accidental copy/paste corruption. Local saves are user-editable. */
export function saveChecksum(text: string): string {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
function fail(): never { throw new Error('Save code has an unsupported or damaged structure.'); }
function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function safeTree(value: unknown, depth = 0): void {
  if (depth > 35) fail();
  if (typeof value === 'number' && (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER)) fail();
  if (!value || typeof value !== 'object') return;
  if (Object.keys(value).length > 50000) fail();
  for (const [key, child] of Object.entries(value)) {
    if (['__proto__', 'prototype', 'constructor'].includes(key)) fail();
    safeTree(child, depth + 1);
  }
}
/** Required schema fields are checked recursively, including legacy account fields. */
function shape(value: unknown, example: unknown): void {
  if (example === null) return;
  if (Array.isArray(example)) {
    if (!Array.isArray(value)) fail();
    if (example.length) for (const entry of value) shape(entry, example[0]);
  } else if (record(example)) {
    if (!record(value)) fail();
    for (const [key, child] of Object.entries(example)) shape(value[key], child);
  } else if (typeof value !== typeof example) fail();
}
function validateAccount(value: unknown): asserts value is AccountState {
  shape(value, createStarterAccount());
  const account = value as AccountState;
  if (account.version !== '0.4.0' || account.cards.length < 3 || account.cards.some(c => !CAT_BY_ID[c.cardId]
    || !Number.isInteger(c.level) || c.level < 1 || c.level > 60 || !Number.isInteger(c.stars) || c.stars < 1 || c.stars > 5)) fail();
  if (Object.values(account.currencies).some(n => !Number.isInteger(n) || n < 0)) fail();
}
export function migrateAccount(legacy: AccountState, now = 0): DepthAccount {
  validateAccount(legacy);
  const state = createDepthAccount(legacy.seed, now);
  state.account = clone(legacy);
  state.account.pendingRun = null;
  state.gear = [];
  state.equipment = {};
  state.team = legacy.teams.find(t => t.id === legacy.activeTeamId)!.cardIds.map(id => legacy.cards.find(c => c.id === id)!.cardId);
  for (const card of legacy.cards) {
    state.rows[card.cardId] = CAT_BY_ID[card.cardId]!.row;
    state.skills[card.cardId] = CAT_BY_ID[card.cardId]!.skills.slice(0, 3).map(s => s.id);
  }
  initializeEquipment(state);
  state.tutorial = 3;
  return state;
}
function validateSupply(value:unknown):void {if(value===undefined)return;if(!record(value)||!SUPPLY_IDS_V4.includes(value.id as typeof SUPPLY_IDS_V4[number])||value.id==='milk-tonic'||typeof value.catId!=='string'||!CAT_BY_ID[value.catId])fail();}
function validateEnemySnapshot(value: unknown): void {
  if (!record(value) || !record(value.enemyStats)) fail();
  for (const id of Object.keys(ENEMY_BY_ID)) {
    const stats = value.enemyStats[id];
    if (!record(stats) || !Number.isInteger(stats.hp) || Number(stats.hp) <= 0
      || !Number.isInteger(stats.attack) || Number(stats.attack) <= 0
      || !Number.isInteger(stats.defense) || Number(stats.defense) < 0) fail();
  }
  if(value.challengeLevel!==undefined&&(!Number.isSafeInteger(value.challengeLevel)||Number(value.challengeLevel)<1||Number(value.challengeLevel)>50))fail();
  validateSupply(value.packedSupply);
  if(value.skillsV5!==undefined&&(typeof value.skillsV5!=='boolean'||value.skillsV5&&!value.gameplayV4))fail();
  if(value.gameplayV4!==undefined&&typeof value.gameplayV4!=='boolean') fail();
  if(value.gameplayV4&&!validPlan(value.plan)) fail();
}
export function validateDepth(value: unknown): asserts value is DepthAccount {
  safeTree(value);
  const example = createDepthAccount();
  // Equipment is a dynamic map. Valid unequips and transfers remove starter keys.
  example.equipment = {};
  shape(value, example);
  const state = value as DepthAccount;
  if(state.skillsV5!==undefined&&typeof state.skillsV5!=='boolean')fail();
  if(state.gameplayV4 !== undefined && typeof state.gameplayV4 !== 'boolean') fail();
  if(state.gameplayV4 && !state.v4) fail();
  if(state.v4 && (state.v4.version!==1 || !validPlan(state.v4.plan))) fail();
  if(state.v4?.loadouts!==undefined){
    if(!Array.isArray(state.v4.loadouts)||state.v4.loadouts.length!==3)fail();
    for(const preset of state.v4.loadouts){
      if(preset===null)continue;
      if(!record(preset)||typeof preset.name!=='string'||!preset.name.trim()||preset.name.length>40
        ||!Array.isArray(preset.team)||preset.team.length!==3||new Set(preset.team).size!==3
        ||!record(preset.rows)||!record(preset.equipment)||!validPlan(preset.plan))fail();
      if(preset.team.some(id=>!CAT_BY_ID[id]||!['front','rear'].includes(preset.rows[id]!))||!preset.team.some(id=>preset.rows[id]==='front'))fail();
      const refs=new Set<string>();
      for(const [id,slots] of Object.entries(preset.equipment)){
        if(!preset.team.includes(id)||!record(slots))fail();
        for(const [slot,ref] of Object.entries(slots)){
          if(!EQUIPMENT_SLOTS.includes(slot as Slot)||typeof ref!=='string'||!ref||refs.has(ref))fail();
          refs.add(ref);
        }
      }
    }
  }
  if(state.v4){
    const v=state.v4;
    for(const n of [v.selectorMarks,v.revealSequence,v.legacySealCount])if(n!==undefined&&(!Number.isSafeInteger(n)||n<0))fail();
    if(v.legacySealCount!==undefined&&v.legacySealCount>10000)fail();
    if(v.spentEffortIds!==undefined&&(!Array.isArray(v.spentEffortIds)||v.spentEffortIds.length>10000||new Set(v.spentEffortIds).size!==v.spentEffortIds.length||v.spentEffortIds.some(p=>typeof p!=='string'||p.length>120)))fail();
    if(v.reveals!==undefined){
      if(!Array.isArray(v.reveals)||v.reveals.length>60||v.revealSequence===undefined)fail();
      for(const [i,e] of v.reveals.entries())if(e.version!==1||e.kind!=='earned-reveal'||e.sequence!==v.revealSequence-v.reveals.length+i||e.round!==0||!Number.isSafeInteger(e.draw)||e.draw<1||typeof e.itemId!=='string'||typeof e.text!=='string'||!Number.isSafeInteger(e.duplicate)||e.duplicate<0||!Number.isSafeInteger(e.pityBefore)||e.pityBefore<0||e.pityBefore>59||!Number.isSafeInteger(e.pityAfter)||e.pityAfter<0||e.pityAfter>59)fail();
    }
    if(v.issuance)validateIssuance(v.issuance);
    validateJournalV4(state);
    validateJourneyV4(state);
    if(v.clockWatermark!==undefined&&(!Number.isSafeInteger(v.clockWatermark)||v.clockWatermark<0))fail();
    if(v.lessons!==undefined&&(!Array.isArray(v.lessons)||new Set(v.lessons).size!==v.lessons.length||v.lessons.some(id=>!LESSONS_V4.some(l=>l.id===id))))fail();
  }
  validateAccount(state.account);
  if (state.version !== CONTRACT_VERSION || state.team.length !== 3 || new Set(state.team).size !== 3) fail();
  for (const id of state.team) {
    if (!state.account.cards.some(c => c.cardId === id) || !['front', 'rear'].includes(state.rows[id]!)) fail();
    const skills = state.skills[id];
    if (!Array.isArray(skills) || skills.length !== 3 || new Set(skills).size !== 3 || skills.some(s => SKILLS[s]?.catId !== id)) fail();
  }
  if (!state.team.some(id => state.rows[id] === 'front')) fail();
  if(new Set(state.gear.map(g=>g.id)).size!==state.gear.length)fail();
  for (const gear of state.gear) {
    if (!GEAR_BY_ID[gear.templateId] || !Number.isInteger(gear.enhancement) || gear.enhancement < 0
      || gear.enhancement > 12 || ![1,2,3].includes(gear.tier) || !Array.isArray(gear.affixes) || !record(gear.rolls)
      || new Set(gear.affixes).size!==gear.affixes.length || gear.affixes.some(id=>!AFFIX_BY_ID[id]?.slots.includes(GEAR_BY_ID[gear.templateId]!.slot))
      || Object.values(gear.rolls).some(n=>!Number.isSafeInteger(n)||n<0)) fail();
  }
  const equipped = new Set<string>();
  for (const [cardId, loadout] of Object.entries(state.equipment)) {
    if (!state.account.cards.some(card => card.cardId === cardId) || !record(loadout)) fail();
    for (const [slot, instanceId] of Object.entries(loadout)) {
      if (!EQUIPMENT_SLOTS.includes(slot as Slot) || typeof instanceId !== 'string'
        || equipped.has(instanceId)) fail();
      const item = state.gear.find(gear => gear.id === instanceId);
      if (!item || GEAR_BY_ID[item.templateId]!.slot !== slot) fail();
      equipped.add(instanceId);
    }
  }
  if (state.run) {
    const run = state.run;
    if(run.challengeLevel!==undefined&&(!Number.isSafeInteger(run.challengeLevel)||run.challengeLevel<1||run.challengeLevel>50))fail();
    validateSupply(run.packedSupply);
    if (!record(run) || !Array.isArray(run.nodes) || !Array.isArray(run.visited) || !Array.isArray(run.rewardChoices)
      || !record(run.hp) || !record(run.boons) || !record(run.upgrades) || ![1, 2, 3].includes(run.chapter)
      || !['campaign', 'daily', 'tower'].includes(run.mode) || typeof run.complete !== 'boolean') fail();
    for (const node of run.nodes) if (!Array.isArray(node.next) || !Array.isArray(node.enemies) || typeof node.id !== 'string') fail();
    if (run.battle && (!Array.isArray(run.battle.actors) || !Array.isArray(run.battle.queue)
      || !Array.isArray(run.battle.log) || !Array.isArray(run.battle.choices) || !record(run.battle.initial))) fail();
    if(run.skillsV5!==undefined&&(typeof run.skillsV5!=='boolean'||run.skillsV5&&!run.gameplayV4))fail();
    if(run.gameplayV4!==undefined&&typeof run.gameplayV4!=='boolean') fail();
    if(run.battle?.initial.gameplayV4) {
      const v=run.battle.v4;
      if(!v||v.version!==1||!validPlan(v.plan)||typeof v.committed!=='boolean'||!Array.isArray(v.events)) fail();
      const kinds=['crew-active','formation-cover','plan-target','gear-trigger','boss-phase','boss-finish','earned-reveal'];
      if(v.events.some((e,i)=>e.version!==1||e.sequence!==i||!Number.isInteger(e.round)||e.round<0||!kinds.includes(e.kind)||typeof e.text!=='string')) fail();
    }
  }
  if (state.lastBattle) validateEnemySnapshot(state.lastBattle);
  if (state.run?.battle) validateEnemySnapshot(state.run.battle.initial);
  if (![1, 2, 4].includes(state.settings.speed) || !['low', 'medium', 'high'].includes(state.settings.quality)) fail();
}
export function exportSave(state: DepthAccount): string {
  validateDepth(state);
  const payload = JSON.stringify(state);
  return `THC${(state.skillsV5||state.run?.skillsV5||state.lastBattle?.skillsV5) ? '14' : state.v4?.journey ? '13' : state.v4 ? '12' : '7'}.${saveChecksum(payload)}.${payload}`;
}
function migrateDepth(value: unknown): unknown {
  if (!record(value) || !['0.5.0', '0.6.0'].includes(String(value.version))) fail();
  const next = clone(value);
  next.version = CONTRACT_VERSION;
  if (record(next.lastBattle)) next.lastBattle.enemyStats = clone(legacyEnemyStats);
  if (record(next.run) && record(next.run.battle)) {
    next.run.battle.version = CONTRACT_VERSION;
    if (record(next.run.battle.initial)) next.run.battle.initial.enemyStats = clone(legacyEnemyStats);
  }
  return next;
}
export function importSave(code: string, now = 0): DepthAccount {
  const trimmed = code.trim();
  if (trimmed.length > 8_000_000) throw new Error('Save code exceeds the supported size.');
  if (trimmed.startsWith('{')) {
    const legacy: unknown = JSON.parse(trimmed);
    safeTree(legacy);
    validateAccount(legacy);
    return migrateAccount(legacy, now);
  }
  const match = /^THC(5|6|7|8|9|10|11|12|13|14)\.([a-f0-9]{8})\.([\s\S]+)$/.exec(trimmed);
  if (!match || saveChecksum(match[3]!) !== match[2]) throw new Error('Save checksum failed. Copy the complete code again.');
  const parsed: unknown = JSON.parse(match[3]!);
  safeTree(parsed);
  const state = ['7','8','9','10','11','12','13','14'].includes(match[1]!) ? parsed : migrateDepth(parsed);
  validateDepth(state);
  if (!['13','14'].includes(match[1]!)) initializeJourneyV4(state);
  validateDepth(state);
  return state;
}
