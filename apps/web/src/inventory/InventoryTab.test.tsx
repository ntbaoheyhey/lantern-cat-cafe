// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { gearStat, heroPower, starterGear, type Gear } from '@taskbar-hero/game-rules';
import { afterEach, expect, it } from 'vitest';
import { MockGameApi } from '../api/MockGameApi';
import { GameLoop } from '../game/gameState';
import { demoInventory, DEMO_ITEMS } from './demoItems';
import { formatPower, groupBySlot, powerIfEquipped } from './gearView';
import { InventoryTab } from './InventoryTab';

let loop: GameLoop | null = null;

afterEach(() => {
  loop?.stop();
  loop = null;
  cleanup();
});

async function setup(inventory: Gear[]) {
  const api = new MockGameApi({ inventory });
  loop = new GameLoop({ api });
  await loop.start(document);
  render(<InventoryTab api={api} loop={loop} />);
  return { api, loop };
}

it('equipping updates the power shown', async () => {
  const epic: Gear = { slot: 'weapon', rarity: 'epic', level: 5 };
  await setup([epic]);
  const start = heroPower(starterGear());
  const after = powerIfEquipped(starterGear(), epic);
  expect(screen.getByTestId('inventory-power').textContent).toBe(formatPower(start));
  expect(screen.getByText(`${formatPower(start)} → ${formatPower(after)}`)).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'Equip epic weapon, level 5' }));

  await waitFor(() => expect(screen.getByTestId('inventory-power').textContent).toBe(formatPower(after)));
  expect(loop!.getSnapshot().power).toBeCloseTo(after); // HUD and Hero tab see it too
  // The old common weapon goes back in the bag and can be re-equipped.
  expect(screen.getByRole('button', { name: 'Equip common weapon, level 1' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Equip epic weapon, level 5' })).toBeNull();
});

it('shows a friendly empty state when nothing is unequipped', async () => {
  await setup([]);
  expect(screen.getByTestId('inventory-empty').textContent).toMatch(/bag is empty/);
  expect(screen.queryByRole('button', { name: /^Equip/ })).toBeNull();
  for (const slot of ['Weapon', 'Helm', 'Armor', 'Ring']) {
    expect(screen.getByRole('heading', { name: slot })).toBeTruthy();
  }
});

it('lists every spare item with rarity, level and power, grouped by slot', async () => {
  await setup(DEMO_ITEMS);
  expect(screen.getAllByRole('button', { name: /^Equip/ })).toHaveLength(DEMO_ITEMS.length);
  const helm = DEMO_ITEMS[1]!;
  expect(screen.getByText(`Lv ${helm.level} · Power ${formatPower(gearStat(helm))}`)).toBeTruthy();
});

it('groupBySlot keeps slot order and sorts spare items strongest first', () => {
  const inv = [
    { id: 'a', slot: 'ring', rarity: 'common', level: 1, equipped: false },
    { id: 'b', slot: 'ring', rarity: 'epic', level: 1, equipped: false },
    { id: 'c', slot: 'weapon', rarity: 'common', level: 1, equipped: true },
  ] as const;
  const groups = groupBySlot(inv.map((g) => ({ ...g })));
  expect(groups.map((g) => g.slot)).toEqual(['weapon', 'helm', 'armor', 'ring']);
  expect(groups[0]!.equipped?.id).toBe('c');
  expect(groups[3]!.spare.map((g) => g.id)).toEqual(['b', 'a']);
});

it('demo items appear only in dev or with ?demo', () => {
  expect(demoInventory(false, '')).toEqual([]);
  expect(demoInventory(true, '')).toBe(DEMO_ITEMS);
  expect(demoInventory(false, '?demo')).toBe(DEMO_ITEMS);
});
