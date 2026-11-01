import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { sampleStateV2 } from '../sampleState';
import { BagPanel, BAG_FILTERS } from './BagPanel';

afterEach(cleanup);
const handlers = () => ({ onEquip: vi.fn(), onToggleLock: vi.fn() });

it('filter selection is announced once and never changes the total owned count', () => {
  render(<BagPanel state={sampleStateV2()} {...handlers()} />);
  const count = screen.getByTestId('bag-count').textContent;
  const filters = within(screen.getByRole('group', { name: 'Item filters' }));
  for (const filter of BAG_FILTERS) {
    const button = filters.getByRole('button', { name: filter.label });
    fireEvent.click(button);
    expect(filters.getAllByRole('button', { pressed: true })).toEqual([button]);
    expect(screen.getByTestId('bag-count').textContent).toBe(count);
  }
});

it('selection follows item identity through sorting and disappears after the item is equipped', () => {
  const state = sampleStateV2(), actions = handlers();
  const view = render(<BagPanel state={state} {...actions} />);
  fireEvent.click(screen.getByRole('button', { name: /^Silverclaw Saber,/ }));
  fireEvent.change(screen.getByRole('combobox', { name: 'Sort bag' }), { target: { value: 'level' } });
  expect(screen.getByRole('button', { name: /^Silverclaw Saber,/ }).getAttribute('aria-pressed')).toBe('true');
  expect(within(screen.getByRole('region', { name: 'Item detail' })).getByRole('heading', { name: 'Silverclaw Saber' })).toBeTruthy();
  view.rerender(<BagPanel state={{ ...state,
    equipped: { ...state.equipped, weapon: 'it-8' },
    inventory: state.inventory.map(item => item.slot === 'weapon' ? { ...item, equipped: item.id === 'it-8' } : item),
  }} {...actions} />);
  expect(screen.queryByRole('button', { name: /^Silverclaw Saber,/ })).toBeNull();
  expect(within(screen.getByRole('region', { name: 'Item detail' })).queryByRole('heading', { name: 'Silverclaw Saber' })).toBeNull();
  expect(actions.onEquip).not.toHaveBeenCalled();
});

it('empty slot frames are decorative and cannot enter the keyboard tab sequence', () => {
  const state = sampleStateV2();
  render(<BagPanel state={{ ...state, inventory: state.inventory.filter(item => item.equipped) }} {...handlers()} />);
  const empty = screen.getByRole('list', { name: 'Bag items' }).querySelectorAll('.bag-slot.empty');
  expect(empty).toHaveLength(state.bagLimit);
  for (const slot of empty) {
    expect(slot.getAttribute('aria-hidden')).toBe('true');
    expect(slot.querySelector('button, a, input, [tabindex]')).toBeNull();
  }
});
