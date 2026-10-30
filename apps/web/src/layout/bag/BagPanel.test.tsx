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
  const view = render(<BagPanel state={state} onEquip={onEquip} onToggleLock={onToggleLock} />);
  return { ...view, onEquip, onToggleLock };
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
    expect(screen.getByTestId('block-reason-equip-best').textContent).toBe('Best gear already equipped');
  });
});

describe('BagPanel: counter and sorting', () => {
  it('turns the counter into a warning at 90 percent of the bag limit', () => {
    const base = sampleStateV2();
    const equipped = base.inventory.filter((i) => i.equipped);
    const nine = bagItems(base).slice(0, 9);
    const { unmount } = renderBag({ ...base, bagLimit: 10, inventory: [...equipped, ...nine] });
    expect(screen.getByTestId('bag-count').className).toContain('warn');
    expect(screen.getByTestId('bag-count').textContent).toBe('Bag 9 / 10');
    expect(screen.getByRole('status').textContent).toBe('Bag almost full');
    unmount();

    renderBag({ ...base, bagLimit: 10, inventory: [...equipped, ...bagItems(base).slice(0, 8)] });
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
});

describe('BagPanel: keyboard', () => {
  it('reaches the sort select, then the item cards, then the Equip and Lock buttons', () => {
    const { container } = renderBag();
    pick(/Silverclaw Saber/);
    const focusable = [...container.querySelectorAll<HTMLElement>('select, button:not(:disabled)')];
    const sort = screen.getByRole('combobox', { name: 'Sort bag' });
    const cards = within(screen.getByRole('list', { name: 'Bag items' })).getAllByRole('button');
    const equip = screen.getByRole('button', { name: 'Equip' });
    const lock = screen.getByRole('button', { name: 'Lock' });

    expect(focusable[0]).toBe(sort);
    expect(focusable.indexOf(cards[0]!)).toBe(1);
    for (const card of cards) expect(focusable.indexOf(card)).toBeLessThan(focusable.indexOf(equip));
    expect(focusable.indexOf(equip)).toBeLessThan(focusable.indexOf(lock));

    sort.focus();
    expect(document.activeElement).toBe(sort);
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
