// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { gearStat, heroPower, starterGear, upgradeCost, type Gear } from '@taskbar-hero/game-rules';
import { afterEach, expect, it, vi } from 'vitest';
import { GameApiError } from '../api/GameApi';
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
  vi.useRealTimers();
});

async function setup(inventory: Gear[], gold = 0) {
  const api = new MockGameApi({ inventory, start: { gold } });
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

const upgradeBtn = (label: string, item = 'common weapon, level 1') =>
  screen.getByRole('button', { name: `${label}: ${item}` }) as HTMLButtonElement;

it('upgrade buttons show the cost, or why they are disabled', async () => {
  await setup([{ slot: 'ring', rarity: 'epic', level: 30 }], 100);
  const cost = upgradeCost({ slot: 'weapon', rarity: 'common', level: 1 })!;
  expect(upgradeBtn(`Upgrade (${cost} gold)`).disabled).toBe(false);
  expect(upgradeBtn('Max level', 'epic ring, level 30').disabled).toBe(true);
  cleanup();
  loop!.stop();
  await setup([], cost - 1);
  expect(upgradeBtn(`Need ${cost} gold`).disabled).toBe(true);
});

it('upgrading raises the level, spends gold, raises power and shows the gain', async () => {
  const { api } = await setup([], 100);
  const before = (await api.getState()).power;
  const cost = upgradeCost({ slot: 'weapon', rarity: 'common', level: 1 })!;
  fireEvent.click(upgradeBtn(`Upgrade (${cost} gold)`));
  expect((await screen.findByRole('status')).textContent).toMatch(/^\+[\d.]+ power$/);
  const s = loop!.getSnapshot().server!;
  expect(s.inventory.find((g) => g.slot === 'weapon')!.level).toBe(2);
  expect(s.gold).toBe(100 - cost);
  expect(s.power).toBeGreaterThan(before);
  expect(screen.getByTestId('inventory-power').textContent).toBe(formatPower(s.power));
});

it('a spare item shows its own power gain', async () => {
  await setup([{ slot: 'helm', rarity: 'rare', level: 1 }], 1000);
  const cost = upgradeCost({ slot: 'helm', rarity: 'rare', level: 1 })!;
  fireEvent.click(upgradeBtn(`Upgrade (${cost} gold)`, 'rare helm, level 1'));
  expect((await screen.findByRole('status')).textContent).toMatch(/^\+[\d.]+ item power$/);
});

it.each([
  ['not_enough_gold', 'Not enough gold for that upgrade yet.'],
  ['max_level', 'That item is already at max level.'],
  ['server_error', 'Upgrade failed, try again.'],
] as const)('maps %s to friendly text', async (code, text) => {
  const { api } = await setup([], 100);
  vi.spyOn(api, 'upgrade').mockRejectedValueOnce(new GameApiError(code));
  fireEvent.click(upgradeBtn('Upgrade (25 gold)'));
  expect((await screen.findByRole('alert')).textContent).toBe(text);
});

it('claims first when the predicted gold covers the cost but the server has not counted it yet', async () => {
  vi.useFakeTimers();
  const api = new MockGameApi();
  loop = new GameLoop({ api });
  await loop.start(document);
  render(<InventoryTab api={api} loop={loop} />);
  await act(() => vi.advanceTimersByTimeAsync(20_000)); // ~80 gold predicted, server still at 0
  expect(loop.getSnapshot().server!.gold).toBe(0);
  const claim = vi.spyOn(loop, 'claim');
  await act(async () => {
    fireEvent.click(upgradeBtn('Upgrade (25 gold)'));
    await vi.advanceTimersByTimeAsync(0);
  });
  expect(claim).toHaveBeenCalled();
  expect(loop.getSnapshot().server!.inventory.find((g) => g.slot === 'weapon')!.level).toBe(2);
});
