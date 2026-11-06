import type { AccountState } from '../contract';
import { clone } from '../internal';
import { createStarterAccount } from '../state';
import { CAT_BY_ID, SKILLS } from './catalog';
import { CONTRACT_VERSION, type DepthAccount } from './contract';
import { GEAR_BY_ID, initializeEquipment } from './equipment';
import { createDepthAccount } from './state';

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
export function validateDepth(value: unknown): asserts value is DepthAccount {
  safeTree(value);
  shape(value, createDepthAccount());
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
  if (state.run) {
    const run = state.run;
    if (!record(run) || !Array.isArray(run.nodes) || !Array.isArray(run.visited) || !Array.isArray(run.rewardChoices)
      || !record(run.hp) || !record(run.boons) || !record(run.upgrades) || ![1, 2, 3].includes(run.chapter)
      || !['campaign', 'daily', 'tower'].includes(run.mode) || typeof run.complete !== 'boolean') fail();
    for (const node of run.nodes) if (!Array.isArray(node.next) || !Array.isArray(node.enemies) || typeof node.id !== 'string') fail();
    if (run.battle && (!Array.isArray(run.battle.actors) || !Array.isArray(run.battle.queue)
      || !Array.isArray(run.battle.log) || !Array.isArray(run.battle.choices) || !record(run.battle.initial))) fail();
  }
  if (![1, 2, 4].includes(state.settings.speed) || !['low', 'medium', 'high'].includes(state.settings.quality)) fail();
}
export function exportSave(state: DepthAccount): string {
  validateDepth(state);
  const payload = JSON.stringify(state);
  return `THC5.${saveChecksum(payload)}.${payload}`;
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
  const match = /^THC5\.([a-f0-9]{8})\.([\s\S]+)$/.exec(trimmed);
  if (!match || saveChecksum(match[2]!) !== match[1]) throw new Error('Save checksum failed. Copy the complete code again.');
  const state: unknown = JSON.parse(match[2]!);
  validateDepth(state);
  return state;
}
