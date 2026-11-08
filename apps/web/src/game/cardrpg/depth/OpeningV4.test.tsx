import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { DepthModel } from './model';
import { FirstEquipmentV4, PracticePayoffV4 } from './OpeningV4';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const opening = () => {
  const m = new DepthModel(true); m.state = R.setGameplayV4(R.createDepthAccount(11), true);
  m.state.tutorial = 3; m.invite(true); return m;
};
it('uses earned crafting costs, selects the actual item and never recrafts a comparison', () => {
  const m = opening(), before = R.exportSave(m.state), money = { ...m.state.account.currencies };
  const reveal = vi.fn(), ui = render(<FirstEquipmentV4 m={m} reveal={reveal} />);
  expect(R.exportSave(m.state)).toBe(before);
  fireEvent.click(screen.getByRole('button', { name: 'Tailor for Soot' }));
  expect(m.state.account.currencies.fish).toBe(money.fish - 180);
  expect(m.state.account.currencies.threads).toBe(money.threads - 30);
  expect(m.state.gear.find(g => g.id === m.itemId)?.templateId).toBe('moonwick-weapon-rare');
  expect(m.cardId).toBe('soot'); expect(reveal).toHaveBeenCalledOnce();
  const after = R.exportSave(m.state); ui.rerender(<FirstEquipmentV4 m={m} reveal={reveal} />);
  fireEvent.click(screen.getByRole('button', { name: 'Compare Soot’s piece' }));
  expect(R.exportSave(m.state)).toBe(after);
  expect((screen.getByRole('button', { name: 'Tailor for Clover' }) as HTMLButtonElement).disabled).toBe(true);
});
it('hides the opening for OFF, returning and active-route saves', () => {
  const m = opening(), ui = render(<FirstEquipmentV4 m={m} reveal={vi.fn()} />);
  for (const mode of ['off', 'returning', 'route']) {
    m.state = opening().state;
    if (mode === 'off') m.state = R.setGameplayV4(m.state, false);
    if (mode === 'returning') m.state.cleared = [1];
    if (mode === 'route') m.state = R.startRun(m.state, 1, 7930).state;
    ui.rerender(<FirstEquipmentV4 m={m} reveal={vi.fn()} />); expect(ui.container.childElementCount).toBe(0);
  }
});
it('gives the cushion one gentle turn so placement has an observed payoff; OFF remains exact', () => {
  const m = opening(); m.tutorial();
  const on = m.battle!; expect(on.initial.enemyStats?.['practice-cushion']).toEqual({ hp: 300, attack: 60, defense: 0 });
  const standard = R.playBattle(R.createBattle(on.initial), 'auto');
  const changed = R.playBattle(R.createBattle({ ...on.initial, cats: on.initial.cats.map(c => ({ ...c, row: c.id === 'clover' ? 'front' : 'rear' })) }), 'auto');
  expect(standard.result).toBe('party'); expect(changed.result).toBe('party');
  expect(R.outcomeV4(standard).damageByRow.front).toBeLessThan(R.outcomeV4(changed).damageByRow.front);
  render(<PracticePayoffV4 battle={standard} />); expect(screen.getByText(/Mochi held the front/)).toBeTruthy();
  m.state = R.setGameplayV4(m.state, false); m.tutorial();
  expect(m.battle).toEqual(R.createBattle({ seed: 7, chapter: 1, cats: R.battleCats(m.state), enemies: ['practice-cushion'], tutorial: true }));
});
