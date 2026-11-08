// @ts-nocheck -- reads files with node APIs; game-rules has no @types/node and adding it is out of scope.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CONFIG } from '../../config';
import { V2_CONFIG } from '../config';
import {
  GEAR_RARITIES,
  GEAR_SLOTS,
  RECIPES,
  RELIC_RECIPE,
  SALVAGE,
  SMART_LOOT,
} from './index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '../../../../..');
const DOC_PATH = resolve(REPO_ROOT, 'docs/mechanics-v2.md');

describe('docs/mechanics-v2.md drift test', () => {
  it('exists on disk', () => {
    expect(existsSync(DOC_PATH), `Missing ${DOC_PATH}`).toBe(true);
  });

  const content = readFileSync(DOC_PATH, 'utf8');

  it('matches all cat stat pipeline configurations', () => {
    expect(content).toContain(`baseHp} = ${V2_CONFIG.cat.baseHp}`);
    expect(content).toContain(`baseAtk} = ${V2_CONFIG.cat.baseAtk}`);
    expect(content).toContain(`baseDef} = ${V2_CONFIG.cat.baseDef}`);
    expect(content).toContain(`levelGrowth} = ${V2_CONFIG.cat.levelGrowth}`);
    expect(content).toContain(`[1, ${V2_CONFIG.cat.maxLevel}]`);
    expect(content).toContain(`itemLevelGrowth} = ${V2_CONFIG.cat.itemLevelGrowth}`);
  });

  it('matches all secondary stat caps', () => {
    expect(content).toContain(`min(${V2_CONFIG.caps.critChance}`);
    expect(content).toContain(`min(${V2_CONFIG.caps.dodge}`);
    expect(content).toContain(`min(${V2_CONFIG.caps.attackSpeed}`);
    expect(content).toContain(`max(${V2_CONFIG.caps.minAttackIntervalMs}`);
    expect(content).toContain(`min(${V2_CONFIG.caps.hpRegen}`);
  });

  it('matches damage formula tuning', () => {
    expect(content).toContain(`defScale} = ${V2_CONFIG.damage.defScale}`);
    expect(content).toContain(`minDamage} = ${V2_CONFIG.damage.minDamage}`);
  });

  it('matches idle claim time windows and efficiency', () => {
    const offlineHours = CONFIG.idle.offlineCapSeconds / 3600;
    const onlineMinutes = CONFIG.idle.onlineWindowSeconds / 60;
    expect(content).toContain(`${CONFIG.idle.offlineCapSeconds.toLocaleString()}\\text{ s}`);
    expect(content).toContain(`${offlineHours}\\text{ hours}`);
    expect(content).toContain(`${CONFIG.idle.onlineWindowSeconds}\\text{ s}`);
    expect(content).toContain(`${onlineMinutes}\\text{ minutes}`);
    expect(content).toContain(`${CONFIG.idle.offlineEfficiency}`);
    expect(content).toContain(`walkTimeMs} = ${V2_CONFIG.idle.walkTimeMs.toLocaleString()}`);
    expect(content).toContain(`$${V2_CONFIG.idle.maxRoundsPerClaim.toLocaleString()}$ rounds`);
    expect(content).toContain(`Exactly $${V2_CONFIG.idle.dailyKeys}$ key`);
    expect(content).toContain(`\\times ${V2_CONFIG.idle.yarnBase} \\times ${V2_CONFIG.idle.yarnGrowth}`);
  });

  it('matches drop rates and smart loot ratios', () => {
    expect(content).toContain(`$${V2_CONFIG.idle.gearDropChance * 100}\\%$`);
    expect(content).toContain(`gearDropChance = ${V2_CONFIG.idle.gearDropChance}`);
    expect(content).toContain(`Common: $${V2_CONFIG.idle.gearRarityWeights.common}$`);
    expect(content).toContain(`Uncommon: $${V2_CONFIG.idle.gearRarityWeights.uncommon}$`);
    expect(content).toContain(`Rare: $${V2_CONFIG.idle.gearRarityWeights.rare}$`);
    expect(content).toContain(`Epic: $${V2_CONFIG.idle.gearRarityWeights.epic}$`);
    expect(content).toContain(`Legendary: $${V2_CONFIG.idle.gearRarityWeights.legendary}$`);
    expect(content).toContain(`$${SMART_LOOT.classWeaponShare * 100}\\%$`);
    expect(content).toContain(`SMART_LOOT.classWeaponShare = ${SMART_LOOT.classWeaponShare}`);
  });

  it('matches gear rarity definitions', () => {
    for (const r of GEAR_RARITIES) {
      const name = r.id.charAt(0).toUpperCase() + r.id.slice(1);
      const lineWord = r.bonusLines === 1 ? 'line' : 'lines';
      expect(content).toContain(`${name}: $${r.bonusLines}$ ${lineWord}`);
      expect(content).toContain(`Max Lv ${r.maxLevel}`);
      expect(content).toContain(`${name} ($${r.statMultiplier.toFixed(1)}\\times$)`);
    }
  });

  it('matches recipe costs and salvage guarantees', () => {
    for (const rc of RECIPES) {
      expect(content).toContain(`rcp.${rc.rarity}`);
      expect(content).toContain(`${rc.materials.yarn}\\text{ Yarn}`);
      expect(content).toContain(`${rc.fish.toLocaleString()}\\text{ Fish}`);
    }

    for (const s of SALVAGE) {
      expect(content).toContain(`\\text{Salvage: } ${s.materials.yarn}\\text{ Yarn}`);
    }

    expect(content).toContain(`${RELIC_RECIPE.materials.yarn}\\text{ Yarn} + ${RELIC_RECIPE.materials.moonPearl}\\text{ Moon Pearl}`);
    expect(content).toContain(`$${RELIC_RECIPE.perDay}$ craft per`);
  });

  it('matches boss fight tuning', () => {
    expect(content).toContain(`Exactly $${V2_CONFIG.boss.keyCost}$ Cat Key`);
    expect(content).toContain(`lossCooldownSeconds = ${V2_CONFIG.boss.lossCooldownSeconds}`);
    expect(content).toContain(`${V2_CONFIG.boss.attackIntervalMs.toLocaleString()}\\text{ ms}`);
    expect(content).toContain(`${V2_CONFIG.boss.windupMs.toLocaleString()}\\text{ ms}`);
    expect(content).toContain(`${V2_CONFIG.boss.bigEveryMs.toLocaleString()}\\text{ ms}`);
    expect(content).toContain(`${V2_CONFIG.boss.bigMultiplier}\\times`);
    expect(content).toContain(`${V2_CONFIG.boss.bigWindupMs.toLocaleString()}\\text{ ms}`);
    expect(content).toContain(`${V2_CONFIG.boss.maxMs.toLocaleString()}\\text{ ms}`);
  });

  it('matches bag limits', () => {
    expect(content).toContain(`V2_CONFIG.bag.limit = ${V2_CONFIG.bag.limit}`);
    expect(content).toContain(`$${V2_CONFIG.bag.nearFullRatio * 100}\\%$`);
    expect(content).toContain(`nearFullRatio = ${V2_CONFIG.bag.nearFullRatio}`);
    expect(content).toContain(`$${Math.floor(V2_CONFIG.bag.limit * V2_CONFIG.bag.nearFullRatio)}$ items`);
  });

  it('matches accessory unlock levels', () => {
    for (const slot of GEAR_SLOTS) {
      if (slot.group === 'accessory') {
        const name = slot.id.charAt(0).toUpperCase() + slot.id.slice(1);
        expect(content).toContain(`${name} at Lv ${slot.unlockLevel}`);
      }
    }
  });
});
