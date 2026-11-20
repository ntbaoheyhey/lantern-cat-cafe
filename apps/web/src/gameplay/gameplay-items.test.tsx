import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { v2 } from '@taskbar-hero/game-rules';
import { gearComparison, GearDecision } from './GearDecision';
import { CraftResult } from './CraftResult';
import { sampleStateV2 } from '../layout/sampleState';
import type { ItemV2 } from '../api/GameApiV2';
afterEach(cleanup);
it('compares the whole cat through authoritative stat caps without mutating inventory', () => {
  const state = sampleStateV2(), original = JSON.stringify(state);
  const item = state.inventory.find(i => i.slot === 'armor')!;
  const actual = gearComparison(state, item)!;
  const expected = v2.deriveStats({ classId: state.cat.classId!, level: state.cat.level }, [...state.inventory.filter(i => i.equipped && i.slot !== item.slot), item].map(i => ({ itemId: i.itemKey, level: i.level, bonusLines: i.bonus })));
  expect(actual.after).toEqual(expected); expect(JSON.stringify(state)).toBe(original);
  render(<GearDecision state={state} item={item} />);
  expect(screen.getByText('Offence')).toBeTruthy(); expect(screen.getByText('Survival')).toBeTruthy();
});
it('calls only actual top-range bonus values a great roll; common has no invented roll', () => {
  const item: ItemV2 = { ...sampleStateV2().inventory[0]!, rarity: 'common', bonus: [] };
  const ui = render(<CraftResult item={item} />);
  expect(screen.getByTestId('craft-result').dataset.great).toBe('false');
  expect(screen.getByText(/No bonus roll/)).toBeTruthy();
  ui.rerender(<CraftResult item={{ ...item, rarity: 'rare', bonus: [{ stat: 'critChance', value: v2.BONUS_LINE_RANGES.critChance!.rare[1] }] }} />);
  expect(screen.getByTestId('craft-result').dataset.great).toBe('true');
  expect(screen.getByText(/Great bonus roll/)).toBeTruthy();
  expect(screen.getByText(/Bonus quality 100%/)).toBeTruthy();
});
