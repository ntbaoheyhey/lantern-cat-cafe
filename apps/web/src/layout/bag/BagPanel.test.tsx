// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, renderHook, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ItemV2, ServerStateV2 } from '../../api/GameApiV2';
import { sampleStateV2, useSampleStateV2 } from '../sampleState';
import { BagPanel } from './BagPanel';

afterEach(cleanup);

function renderBag(state: ServerStateV2 = sampleStateV2()) {
  const onEquip = vi.fn();
  const onToggleLock = vi.fn();
  const onForge = vi.fn();
  const onList = vi.fn();
  const onNavigate = vi.fn();
  const view = render(
    <BagPanel
      state={state}
      onEquip={onEquip}
      onToggleLock={onToggleLock}
      onForge={onForge}
      onList={onList}
      onNavigate={onNavigate}
    />,
  );
  return { ...view, onEquip, onToggleLock, onForge, onList, onNavigate };
}

function pick(name: RegExp | string) {
  fireEvent.click(screen.getByRole('button', { name }));
}

function cardNames(): string[] {
  const list = screen.getByRole('list', { name: 'Bag items' });
  return within(list)
    .getAllByRole('button')
    .map((b) => b.getAttribute('aria-label')?.split(',')[0] ?? '');
}

function bagItems(state: ServerStateV2): ItemV2[] {
  return state.inventory.filter((i) => !i.equipped);
}

describe('BagPanel: detail and actions', () => {
  it('shows compare deltas with both an up and a down class for the selected item', () => {
    renderBag();
    pick(/Plain Bell Collar/);
    const detail = screen.getByRole('region', { name: 'Item detail' });
    const up = detail.querySelector('.delta-up');
    const down = detail.querySelector('.delta-down');
    expect(up?.textContent?.startsWith('+')).toBe(true);
    expect(down?.textContent?.startsWith('-')).toBe(true);
  });

  it('Equip calls onEquip with the item id and its slot', () => {
    const { onEquip } = renderBag();
    pick(/Silverclaw Saber/);
    pick('Equip');
    expect(onEquip).toHaveBeenCalledWith('it-8', 'weapon');
  });

  it('disables Equip for a weapon of the wrong type and says why', () => {
    renderBag();
    pick(/Cork Knocker/);
    const equip = screen.getByRole('button', { name: 'Equip' }) as HTMLButtonElement;
    expect(equip.disabled).toBe(true);
    expect(screen.getByText('Needs a sword weapon')).toBeTruthy();
    expect(screen.getByTestId('block-reason-equip').textContent).toBe('Needs a sword weapon');
  });

  it('disables Equip for a slot the cat level has not unlocked', () => {
    renderBag();
    pick(/Radiant Catnip Charm/);
    const equip = screen.getByRole('button', { name: 'Equip' }) as HTMLButtonElement;
    expect(equip.disabled).toBe(true);
    expect(screen.getByText('Unlocks at level 20')).toBeTruthy();
    expect(screen.getByTestId('block-reason-equip').textContent).toBe('Unlocks at level 20');
  });

  it('Lock and Unlock call onToggleLock with the new lock state', () => {
    const { onToggleLock } = renderBag();
    pick(/Silverclaw Saber/);
    pick('Lock');
    expect(onToggleLock).toHaveBeenLastCalledWith('it-8', true);
    pick(/Sunfang/);
    pick('Unlock');
    expect(onToggleLock).toHaveBeenLastCalledWith('it-10', false);
  });

  it('Forge button calls onForge with the selected item', () => {
    const { onForge } = renderBag();
    pick(/Silverclaw Saber/);
    pick('Forge');
    expect(onForge).toHaveBeenCalledWith(expect.objectContaining({ id: 'it-8' }));
  });

  it('List button calls onList with the selected item', () => {
    const { onList } = renderBag();
    pick(/Silverclaw Saber/);
    pick('List');
    expect(onList).toHaveBeenCalledWith(expect.objectContaining({ id: 'it-8' }));
  });
});

describe('BagPanel: Equip best', () => {
  it('equips once per slot that has a strict upgrade and skips wrong weapons and worse items', () => {
    const { onEquip } = renderBag();
    pick('Equip best');
    expect(onEquip.mock.calls).toEqual([
      ['it-10', 'weapon'],
      ['it-11', 'helmet'],
      ['it-12', 'armor'],
      ['it-21', 'gloves'],
      ['it-14', 'boots'],
      ['it-17', 'ring'],
    ]);
  });

  it('is disabled when nothing in the bag is better', () => {
    const base = sampleStateV2();
    renderBag({ ...base, inventory: base.inventory.filter((i) => i.equipped) });
    const best = screen.getByRole('button', { name: 'Equip best' }) as HTMLButtonElement;
    expect(best.disabled).toBe(true);
    expect(screen.getByTestId('block-reason-equip-best').textContent).toBe('No higher total-stat score');
  });
});

describe('BagPanel: counter, filters and sorting', () => {
  it('turns the counter into a warning at 90 percent of the bag limit', () => {
    const base = sampleStateV2();
    const equipped = base.inventory.filter((i) => i.equipped).slice(0, 1);
    const storedEight = bagItems(base).slice(0, 8);
    const { unmount } = renderBag({ ...base, bagLimit: 10, inventory: [...equipped, ...storedEight] });
    expect(screen.getByTestId('bag-count').className).toContain('warn');
    expect(screen.getByTestId('bag-count').textContent).toBe('Bag 9 / 10');
    expect(screen.getByTestId('bag-storage').textContent).toBe('8 stored · 1 equipped');
    expect(screen.getByRole('status').textContent).toBe('Bag almost full');
    unmount();

    renderBag({ ...base, bagLimit: 10, inventory: [...equipped, ...bagItems(base).slice(0, 7)] });
    expect(screen.getByTestId('bag-count').className).not.toContain('warn');
    expect(screen.getByRole('status').textContent).toBe('');
  });

  it('sorts the grid by the chosen key', () => {
    renderBag();
    const sort = screen.getByRole('combobox', { name: 'Sort bag' });
    // Rarity is the default: highest rarity first, then level.
    expect(cardNames()[0]).toBe('Radiant Catnip Charm');

    fireEvent.change(sort, { target: { value: 'slot' } });
    expect(cardNames()[0]).toBe('Sunfang');

    fireEvent.change(sort, { target: { value: 'newest' } });
    expect(cardNames()[0]).toBe('Silverclaw Saber');

    fireEvent.change(sort, { target: { value: 'level' } });
    expect(cardNames()[0]).toBe('Radiant Catnip Charm');
  });

  it('T1: Select item updates the right detail panel', () => {
    renderBag();
    pick(/Silverclaw Saber/);
    const detail = screen.getByRole('region', { name: 'Item detail' });
    expect(within(detail).getByRole('heading', { level: 3 }).textContent).toBe('Silverclaw Saber');
    expect(within(detail).getByText('Rare')).toBeTruthy();
    expect(within(detail).getAllByText(/Lv 7/).length).toBeGreaterThan(0);
    expect(within(detail).getByRole('button', { name: 'Equip' })).toBeTruthy();
    expect(within(detail).getByRole('button', { name: 'Forge' })).toBeTruthy();
    expect(within(detail).getByRole('button', { name: 'List' })).toBeTruthy();

    pick(/Sunfang/);
    expect(within(detail).getByRole('heading', { level: 3 }).textContent).toBe('Sunfang');
    expect(within(detail).getByText('Epic')).toBeTruthy();
    expect(within(detail).getAllByText(/Lv 10/).length).toBeGreaterThan(0);
  });

  it('T2: Filters change the grid and keep the count', () => {
    renderBag();
    const initialCount = screen.getByTestId('bag-count').textContent;
    expect(initialCount).toBe('Bag 22 / 200');
    expect(screen.getByTestId('bag-storage').textContent).toBe('15 stored · 7 equipped');

    // Weapons filter
    fireEvent.click(screen.getByRole('button', { name: 'Weapons' }));
    const weapons = cardNames();
    expect(weapons.length).toBe(4);
    expect(weapons.every((n) => ['Silverclaw Saber', 'Cork Knocker', 'Sunfang', 'Rose Thorns'].includes(n))).toBe(true);
    expect(screen.getByTestId('bag-count').textContent).toBe(initialCount);

    // Armor filter
    fireEvent.click(screen.getByRole('button', { name: 'Armor' }));
    const armors = cardNames();
    expect(armors.some((n) => n === 'Silverclaw Saber')).toBe(false);
    expect(armors.some((n) => n.includes('Helm') || n.includes('Armor') || n.includes('Gloves'))).toBe(true);
    expect(screen.getByTestId('bag-count').textContent).toBe(initialCount);

    // All filter
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(cardNames().length).toBe(15);
    expect(screen.getByTestId('bag-count').textContent).toBe(initialCount);
  });

  it('T4: Empty bag shows the empty state', () => {
    const base = sampleStateV2();
    renderBag({ ...base, inventory: base.inventory.filter((i) => i.equipped) });
    expect(screen.getByTestId('bag-empty')).toBeTruthy();
    expect(screen.getByText('Your bag is empty.')).toBeTruthy();
  });

  it('T5: Rarity is visible without colour (text pill)', () => {
    renderBag();
    pick(/Silverclaw Saber/);
    const detail = screen.getByRole('region', { name: 'Item detail' });
    const pill = detail.querySelector('.rarity-pill');
    expect(pill).not.toBeNull();
    expect(pill?.textContent).toContain('Rare');

    pick(/Sunfang/);
    const epicPill = detail.querySelector('.rarity-pill');
    expect(epicPill?.textContent).toContain('Epic');
  });
});

describe('BagPanel: keyboard', () => {
  it('reaches toolbar controls, item cards, then action buttons in order', () => {
    const { container } = renderBag();
    pick(/Silverclaw Saber/);
    const focusable = [...container.querySelectorAll<HTMLElement>('select, button:not(:disabled)')];
    const filterAll = screen.getByRole('button', { name: 'All' });
    const sort = screen.getByRole('combobox', { name: 'Sort bag' });
    const equipBest = screen.getByRole('button', { name: 'Equip best' });
    const cards = within(screen.getByRole('list', { name: 'Bag items' })).getAllByRole('button');
    const equip = screen.getByRole('button', { name: 'Equip' });
    const forge = screen.getByRole('button', { name: 'Forge' });
    const list = screen.getByRole('button', { name: 'List' });
    const lock = screen.getByRole('button', { name: 'Lock' });

    // Toolbar controls precede item cards
    expect(focusable.indexOf(filterAll)).toBeLessThan(focusable.indexOf(cards[0]!));
    expect(focusable.indexOf(sort)).toBeLessThan(focusable.indexOf(cards[0]!));
    expect(focusable.indexOf(equipBest)).toBeLessThan(focusable.indexOf(cards[0]!));

    // Cards precede detail actions
    for (const card of cards) {
      expect(focusable.indexOf(card)).toBeLessThan(focusable.indexOf(equip));
    }

    // Detail actions in order
    expect(focusable.indexOf(equip)).toBeLessThan(focusable.indexOf(forge));
    expect(focusable.indexOf(forge)).toBeLessThan(focusable.indexOf(list));
    expect(focusable.indexOf(list)).toBeLessThan(focusable.indexOf(lock));
  });

  it('T6: supports arrow keys through 8-column slot grid and Enter to select', () => {
    renderBag();
    const list = screen.getByRole('list', { name: 'Bag items' });
    const cards = within(list).getAllByRole('button');
    expect(cards.length).toBeGreaterThanOrEqual(15);

    // Initial focus on first card
    const firstCard = cards[0]!;
    const secondCard = cards[1]!;
    const tenthCard = cards[9]!;

    firstCard.focus();
    expect(document.activeElement).toBe(firstCard);

    // ArrowRight moves to next (+1)
    fireEvent.keyDown(firstCard, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(secondCard);

    // ArrowDown moves down 8 columns (+8)
    fireEvent.keyDown(secondCard, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(tenthCard);

    // ArrowUp moves up 8 columns (-8)
    fireEvent.keyDown(tenthCard, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(secondCard);

    // ArrowLeft moves back (-1)
    fireEvent.keyDown(secondCard, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(firstCard);

    // Enter selects the card
    fireEvent.keyDown(firstCard, { key: 'Enter' });
    expect(firstCard.getAttribute('aria-pressed')).toBe('true');
  });
});

describe('BagPanel: item icons', () => {
  it('shows the specific set icon for a helmet in the bag and in detail', () => {
    renderBag();
    const moonHelmet = screen.getByRole('button', { name: /^Starforged Moon Helm/ });
    expect(moonHelmet.querySelector('[data-icon="arm.moon.helmet"]')).not.toBeNull();
    fireEvent.click(moonHelmet);
    const detail = screen.getByRole('region', { name: 'Item detail' });
    expect(detail.querySelector('[data-icon="arm.moon.helmet"]')).not.toBeNull();
  });

  it('shows the set icon for an equipped helmet when moved into the bag', () => {
    const base = sampleStateV2();
    renderBag({
      ...base,
      inventory: base.inventory.map((i) => (i.id === 'it-2' ? { ...i, equipped: false } : i)),
    });
    const cozyHelmet = screen.getByRole('button', { name: /^Snug Knit Beanie/ });
    expect(cozyHelmet.querySelector('[data-icon="arm.cozy.helmet"]')).not.toBeNull();
  });
});

describe('useSampleStateV2', () => {
  it('equip moves the equipped flag, refuses a slot mismatch and empties a slot for null', () => {
    const { result } = renderHook(() => useSampleStateV2());
    act(() => result.current.equip('it-8', 'weapon'));
    expect(result.current.state.equipped.weapon).toBe('it-8');
    expect(result.current.state.inventory.find((i) => i.id === 'it-8')?.equipped).toBe(true);
    expect(result.current.state.inventory.find((i) => i.id === 'it-1')?.equipped).toBe(false);

    act(() => result.current.equip('it-15', 'weapon'));
    expect(result.current.state.equipped.weapon).toBe('it-8');

    act(() => result.current.equip('it-9', 'weapon'));
    expect(result.current.state.equipped.weapon).toBe('it-8');

    act(() => result.current.equip(null, 'weapon'));
    expect(result.current.state.equipped.weapon).toBeNull();
    expect(result.current.state.inventory.find((i) => i.id === 'it-8')?.equipped).toBe(false);
  });

  it('setLocked updates the lock flag of one item', () => {
    const { result } = renderHook(() => useSampleStateV2());
    act(() => result.current.setLocked('it-8', true));
    expect(result.current.state.inventory.find((i) => i.id === 'it-8')?.locked).toBe(true);
  });
});

describe('Mission AGR2-FIX: Empty slots and right detail hint', () => {
  it('draws empty slots up to capacity even when bag is empty and shows detail hint card', () => {
    const base = sampleStateV2();
    renderBag({ ...base, bagLimit: 40, inventory: base.inventory.filter((i) => i.equipped) });

    expect(screen.getByTestId('bag-empty')).toBeTruthy();
    expect(screen.getByText('Your bag is empty.')).toBeTruthy();

    // Seven worn items consume capacity even though they are outside the stored-item grid.
    const list = screen.getByRole('list', { name: 'Bag items' });
    const emptySlots = list.querySelectorAll('.bag-slot.empty');
    expect(emptySlots.length).toBe(33);
    expect(screen.getByTestId('bag-count').textContent).toBe('Bag 7 / 40');

    // Right detail panel shows short hint card and compare skeleton
    const detail = screen.getByRole('region', { name: 'Item detail' });
    expect(detail.classList.contains('is-empty')).toBe(true);
    expect(within(detail).getByText('Item Details')).toBeTruthy();
    expect(within(detail).getByText(/Select an item to compare it with what you wear/)).toBeTruthy();
    expect(within(detail).getByText('Compare')).toBeTruthy();
  });

  it('filters and displays materials and relic items with rarity text pill', () => {
    const base = sampleStateV2();
    const relicItem: ItemV2 = {
      id: 'relic-1',
      itemKey: 'relic.moonPearl',
      slot: 'charm',
      rarity: 'legendary',
      level: 15,
      bonus: [],
      locked: true,
      equipped: false,
    };
    renderBag({
      ...base,
      inventory: [...base.inventory, relicItem],
    });

    // Relics filter
    fireEvent.click(screen.getByRole('button', { name: 'Relics' }));
    const relicBtn = screen.getByRole('button', { name: /Moon Pearl Relic/ });
    expect(relicBtn).toBeTruthy();
    fireEvent.click(relicBtn);

    const detail = screen.getByRole('region', { name: 'Item detail' });
    expect(within(detail).getAllByText('Moon Pearl Relic').length).toBeGreaterThan(0);
    // A synthetic Relic item carries no receipt or token proof. Never invent one.
    expect(within(detail).getByText('Mint proof unavailable')).toBeTruthy();
    expect(within(detail).queryByText(/#1042|minted/)).toBeNull();
  });

  it('shows filter empty notice when a category has 0 items and keeps capacity slots', () => {
    const base = sampleStateV2();
    // Default sampleState has no materials
    renderBag(base);

    fireEvent.click(screen.getByRole('button', { name: 'Materials' }));
    expect(screen.getByTestId('bag-filter-empty')).toBeTruthy();
    expect(screen.getByText('No items matching this filter.')).toBeTruthy();
  });
});
