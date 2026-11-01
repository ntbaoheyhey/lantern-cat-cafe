// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { v2 } from '@taskbar-hero/game-rules';
import { sampleStateV2 } from '../sampleState';
import { CharacterPanel } from './CharacterPanel';
import { HeroScreen } from './HeroScreen';
afterEach(cleanup);

it('equipping updates the paper doll and exact shared-rule power, with an additive breakdown', () => {
  const state = sampleStateV2(); const { rerender } = render(<CharacterPanel state={state} />);
  const initial = Number(screen.getByTestId('character-power').textContent);
  const weapon = state.inventory.find(item => item.id === state.equipped.weapon)!;
  const changed = { ...state, inventory: state.inventory.map(item => item.id === weapon.id ? { ...item, level: item.level + 5, bonus: [{ stat: 'atk' as const, value: 100 }] } : item) };
  rerender(<CharacterPanel state={changed} />);
  const stats = v2.deriveStats({ classId: changed.cat.classId!, level: changed.cat.level }, changed.inventory.filter(item => item.equipped).map(item => ({ itemId: item.itemKey, level: item.level, bonusLines: item.bonus })));
  const actual = Number(screen.getByTestId('character-power').textContent);
  expect(actual).toBe(Math.round(v2.powerRating(stats))); expect(actual).toBeGreaterThan(initial);
  expect(['gear', 'level', 'bonus'].reduce((sum, part) => sum + Number(screen.getByTestId(`power-${part}`).textContent), 0)).toBe(actual);
  const unequipped = { ...changed, equipped: { ...changed.equipped, weapon: null }, inventory: changed.inventory.map(item => item.id === weapon.id ? { ...item, equipped: false } : item) };
  rerender(<CharacterPanel state={unequipped} />); expect(screen.getByRole('button', { name: 'Weapon: empty' })).toBeTruthy();
  expect(Number(screen.getByTestId('character-power').textContent)).toBeLessThan(actual);
});
it('confirms through owner, closes on success and announces the result', async () => {
  const choose = vi.fn().mockResolvedValue(true); render(<HeroScreen state={sampleStateV2()} onChooseClass={choose} />);
  const opener = screen.getByText('Change class'); opener.focus(); fireEvent.click(opener);
  expect(document.activeElement).toBe(screen.getByText('Cancel'));
  fireEvent.change(screen.getByLabelText('Cat class'), { target: { value: 'archer' } }); fireEvent.click(screen.getByText('Confirm class'));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(choose).toHaveBeenCalledExactlyOnceWith('archer'); expect(screen.getByRole('status').textContent).toContain('Class changed to Archer.');
  expect(document.activeElement).toBe(opener);
});
it('keeps failed confirmation open, permits retry and leaves an error toast after cancellation', async () => {
  const choose = vi.fn().mockResolvedValue(false); render(<HeroScreen state={sampleStateV2()} onChooseClass={choose} />);
  fireEvent.click(screen.getByText('Change class')); fireEvent.change(screen.getByLabelText('Cat class'), { target: { value: 'archer' } });
  fireEvent.click(screen.getByText('Confirm class'));
  await waitFor(() => expect(within(screen.getByRole('dialog')).getByRole('alert').textContent).toContain('did not go through'));
  expect((screen.getByText('Confirm class') as HTMLButtonElement).disabled).toBe(false);
  fireEvent.click(screen.getByText('Cancel')); expect(screen.getByRole('alert').textContent).toContain('did not go through'); expect(choose).toHaveBeenCalledTimes(1);
});
it('prevents duplicate in-flight requests and disables class action while the loop is busy', async () => {
  let resolve!: (value: boolean) => void;
  const choose = vi.fn(() => new Promise<boolean>(done => { resolve = done; }));
  const { rerender } = render(<HeroScreen state={sampleStateV2()} onChooseClass={choose} />);
  fireEvent.click(screen.getByText('Change class')); fireEvent.change(screen.getByLabelText('Cat class'), { target: { value: 'archer' } });
  fireEvent.click(screen.getByText('Confirm class')); fireEvent.click(screen.getByText('Choosing...')); expect(choose).toHaveBeenCalledTimes(1);
  resolve(true); await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  rerender(<HeroScreen state={sampleStateV2()} onChooseClass={choose} classBusy />); expect((screen.getByText('Change class') as HTMLButtonElement).disabled).toBe(true);
});
it('leaves a typed tab host for pets without changing the character panel', () => {
  render(<HeroScreen state={sampleStateV2()} onChooseClass={vi.fn()} additionalTabs={[{ id: 'pets', label: 'Pets', content: 'Pet preview' }]} />);
  fireEvent.click(screen.getByRole('tab', { name: 'Pets' })); expect(screen.getByRole('tabpanel').textContent).toBe('Pet preview');
  expect(screen.queryByRole('region', { name: 'Character' })).toBeNull();
});
