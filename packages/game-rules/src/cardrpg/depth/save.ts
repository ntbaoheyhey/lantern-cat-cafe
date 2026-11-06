import { EQUIPMENT_SLOTS, type AccountState, type Slot } from '../contract';
import { clone } from '../internal';
import { createStarterAccount } from '../state';
import { CAT_BY_ID, ENEMY_BY_ID, SKILLS } from './catalog';
import { CONTRACT_VERSION, type BattleSetup, type DepthAccount } from './contract';
import { GEAR_BY_ID, initializeEquipment } from './equipment';
import { createDepthAccount } from './state';

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
function validateEnemySnapshot(value: unknown): void {
  if (!record(value) || !record(value.enemyStats)) fail();
  for (const id of Object.keys(ENEMY_BY_ID)) {
    const stats = value.enemyStats[id];
    if (!record(stats) || !Number.isInteger(stats.hp) || Number(stats.hp) <= 0
      || !Number.isInteger(stats.attack) || Number(stats.attack) <= 0
      || !Number.isInteger(stats.defense) || Number(stats.defense) < 0) fail();
  }
}
export function validateDepth(value: unknown): asserts value is DepthAccount {
  safeTree(value);
  const example = createDepthAccount();
  // Equipment is a dynamic map. Valid unequips and transfers remove starter keys.
  example.equipment = {};
  shape(value, example);
  const state = value as DepthAccount;
  validateAccount(state.account);
  if (state.version !== CONTRACT_VERSION || state.team.length !== 3 || new Set(state.team).size !== 3) fail();
  for (const id of state.team) {
    if (!state.account.cards.some(c => c.cardId === id) || !['front', 'rear'].includes(state.rows[id]!)) fail();
    const skills = state.skills[id];
    if (!Array.isArray(skills) || skills.length !== 3 || new Set(skills).size !== 3 || skills.some(s => SKILLS[s]?.catId !== id)) fail();
  }
  if (!state.team.some(id => state.rows[id] === 'front')) fail();
  for (const gear of state.gear) {
    if (!GEAR_BY_ID[gear.templateId] || !Number.isInteger(gear.enhancement) || gear.enhancement < 0
      || gear.enhancement > 12 || !Array.isArray(gear.affixes) || !record(gear.rolls)) fail();
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
    if (!record(run) || !Array.isArray(run.nodes) || !Array.isArray(run.visited) || !Array.isArray(run.rewardChoices)
      || !record(run.hp) || !record(run.boons) || !record(run.upgrades) || ![1, 2, 3].includes(run.chapter)
      || !['campaign', 'daily', 'tower'].includes(run.mode) || typeof run.complete !== 'boolean') fail();
    for (const node of run.nodes) if (!Array.isArray(node.next) || !Array.isArray(node.enemies) || typeof node.id !== 'string') fail();
    if (run.battle && (!Array.isArray(run.battle.actors) || !Array.isArray(run.battle.queue)
      || !Array.isArray(run.battle.log) || !Array.isArray(run.battle.choices) || !record(run.battle.initial))) fail();
  }
  if (state.lastBattle) validateEnemySnapshot(state.lastBattle);
  if (state.run?.battle) validateEnemySnapshot(state.run.battle.initial);
  if (![1, 2, 4].includes(state.settings.speed) || !['low', 'medium', 'high'].includes(state.settings.quality)) fail();
}
export function exportSave(state: DepthAccount): string {
  validateDepth(state);
  const payload = JSON.stringify(state);
  return `THC7.${saveChecksum(payload)}.${payload}`;
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
  const match = /^THC([567])\.([a-f0-9]{8})\.([\s\S]+)$/.exec(trimmed);
  if (!match || saveChecksum(match[3]!) !== match[2]) throw new Error('Save checksum failed. Copy the complete code again.');
  const parsed: unknown = JSON.parse(match[3]!);
  safeTree(parsed);
  const state = match[1] === '7' ? parsed : migrateDepth(parsed);
  validateDepth(state);
  return state;
}
