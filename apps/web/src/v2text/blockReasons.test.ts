import { describe, expect, it } from 'vitest';
import { ERROR_CODES_V2 } from '../api/GameApiV2';
import {
  BLOCK_REASONS,
  CRAFT_BLOCK_REASONS,
  RELIC_BLOCK_REASONS,
  getBlockReason,
  getBossBlockReason,
  getClaimBlockReason,
  getCraftBlockReason,
  getEquipBlockReason,
  getRelicBlockReason,
  getSalvageBlockReason,
} from './blockReasons';

describe('blockReasons v2 mapping & formatters', () => {
  it('every code in ERROR_CODES_V2 has a non-empty cat-cafe message', () => {
    for (const code of ERROR_CODES_V2) {
      const message = BLOCK_REASONS[code];
      expect(message, `Missing message for error code: ${code}`).toBeDefined();
      expect(typeof message).toBe('string');
      expect(message.trim().length).toBeGreaterThan(10);
    }
  });

  it('all craftBlock reasons have friendly messages', () => {
    const reasons = [
      'unknown_recipe',
      'unknown_slot',
      'not_enough_fish',
      'not_enough_yarn',
      'not_enough_fluffTuft',
      'not_enough_shinyButton',
      'not_enough_catnipCrystal',
      'not_enough_starlightScale',
      'not_enough_moonPearl',
    ];
    for (const r of reasons) {
      expect((CRAFT_BLOCK_REASONS as Record<string, string>)[r], `Missing craft reason: ${r}`).toBeDefined();
    }
  });

  it('all relicBlock reasons have messages', () => {
    expect(RELIC_BLOCK_REASONS.daily_limit.toLowerCase()).toContain('daily');
    expect(RELIC_BLOCK_REASONS.not_enough_yarn).toContain('Yarn');
    expect(RELIC_BLOCK_REASONS.no_moon_pearl).toContain('Moon Pearl');
  });

  it('getCraftBlockReason formats dynamic missing currency message', () => {
    const formatted = getCraftBlockReason('not_enough_fish', { diff: 12, matName: 'Fish' });
    expect(formatted).toBe('Needs 12 more Fish');

    const formattedYarn = getCraftBlockReason('not_enough_yarn', { diff: 5, matName: 'Yarn' });
    expect(formattedYarn).toBe('Needs 5 more Yarn');

    const bagFull = getCraftBlockReason(null, { bagFull: true });
    expect(bagFull).toContain('Bag is full');
  });

  it('getSalvageBlockReason handles zero selection and empty eligible items', () => {
    expect(getSalvageBlockReason({ selectedCount: 0, eligibleCount: 5 })).toBe('Select at least one item to salvage.');
    expect(getSalvageBlockReason({ selectedCount: 0, eligibleCount: 0 })).toBe('No unlocked spare gear in your bag to salvage.');
    expect(getSalvageBlockReason({ selectedCount: 2, eligibleCount: 5 })).toBeNull();
  });

  it('getEquipBlockReason formats level, weapon, and class constraints', () => {
    expect(getEquipBlockReason('no_class')).toBe('Choose a class first');
    expect(getEquipBlockReason('slot_locked', { unlockLevel: 20 })).toBe('Unlocks at level 20');
    expect(getEquipBlockReason('wrong_weapon', { requiredWeapon: 'sword' })).toBe('Needs a sword weapon');
    expect(getEquipBlockReason(null)).toBeNull();
  });

  it('getBossBlockReason formats cooldown, keys, and progress constraints', () => {
    expect(getBossBlockReason('cooldown', { secondsLeft: 42 })).toBe('Catnap: 0:42');
    expect(getBossBlockReason('no_key')).toContain('You need a Cat Key');
    expect(getBossBlockReason('no_class')).toBe('Pick a class first.');
    expect(getBossBlockReason('ready')).toBeNull();
  });

  it('getClaimBlockReason formats syncing and offline status', () => {
    expect(getClaimBlockReason({ hasCat: false })).toContain('Choose a class first');
    expect(getClaimBlockReason({ hasCat: true, isSyncing: true })).toContain('Syncing rewards');
    expect(getClaimBlockReason({ hasCat: true, offline: true })).toContain('offline');
    expect(getClaimBlockReason({ hasCat: true, isSyncing: false, offline: false })).toBeNull();
  });

  it('getBlockReason fallback handles known and unknown codes', () => {
    expect(getBlockReason('bag_full')).toBe(BLOCK_REASONS.bag_full);
    expect(getBlockReason('not_enough_fish')).toBe(CRAFT_BLOCK_REASONS.not_enough_fish);
    expect(getBlockReason('custom_error_code')).toBe('custom error code');
  });
});
