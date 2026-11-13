import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { CARD_BY_ID } from '@taskbar-hero/game-rules/cardrpg';
import { DepthModel } from './model';
import { CompanionGrowthV4 } from './CompanionGrowthV4';
import { Collection } from './TeamCollection';

vi.mock('./CompanionPreview', () => ({ CompanionPreview: () => null }));
afterEach(cleanup);
const model = () => new DepthModel(true, true);
const card = (m: DepthModel) => m.state.account.cards.find(c => c.cardId === 'mochi')!;

it('previews the exact transaction without spending or recording a discovery', () => {
  const m = model(), before = R.exportSave(m.state);
  const expected = R.metaCommand(m.state, { type: 'level', cardId: card(m).id });
  expect(expected.ok).toBe(true);
  render(<CompanionGrowthV4 m={m} catId="mochi" kind="level" />);
  expect(R.exportSave(m.state)).toBe(before);
  expect(screen.getByText('Mochi to level 2')).toBeTruthy();
  expect(screen.getByText('25 fish points')).toBeTruthy();
  expect(screen.getByText('2 threads')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Level up' }));
  expect(m.state).toEqual(expected.state);
});

it('names the ultimate unlocked by level six and matches the actual stat gains', () => {
  const m = model(); card(m).level = 5;
  const before = R.depthStats(m.state, 'mochi');
  const ui = render(<CompanionGrowthV4 m={m} catId="mochi" kind="level" />);
  const ultimate = R.CAT_BY_ID.mochi!.skills[3]!;
  expect(screen.getByText(`Unlocks ${ultimate.name}.`)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Level up' }));
  const after = R.depthStats(m.state, 'mochi');
  const expectedStats = [['hp', 'Health'], ['attack', 'Attack'], ['defense', 'Defense']] as const;
  for (const [id, label] of expectedStats) if (after[id] !== before[id])
    expect(screen.getByText(text => text.includes(`+${after[id] - before[id]} ${label}`))).toBeTruthy();
  expect(R.availableSkills(m.state, 'mochi').map(s => s.id)).toContain(ultimate.id);
  ui.rerender(<CompanionGrowthV4 m={m} catId="mochi" kind="level" />);
  expect(screen.queryByText(`Unlocks ${ultimate.name}.`)).toBeNull();
});

it('shows currency and shard costs for a star that unlocks the same ultimate', () => {
  const m = model(); card(m).stars = 2; card(m).shards = 100;
  const expected = R.metaCommand(m.state, { type: 'ascend', cardId: card(m).id });
  expect(expected.ok).toBe(true);
  render(<CompanionGrowthV4 m={m} catId="mochi" kind="ascend" />);
  expect(screen.getByText('Mochi to 3 stars')).toBeTruthy();
  const spent = card(m).shards - expected.state.account.cards.find(c => c.cardId === 'mochi')!.shards;
  expect(screen.getByText(`${spent} matching shards`)).toBeTruthy();
  expect(screen.getByText(`Unlocks ${R.CAT_BY_ID.mochi!.skills[3]!.name}.`)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Add a star' }));
  expect(m.state).toEqual(expected.state);
});

it('disables unavailable training without changing the account and recovers after funds change', () => {
  const m = model(); m.state.account.currencies.fish = 0;
  const before = R.exportSave(m.state), ui = render(<CompanionGrowthV4 m={m} catId="mochi" kind="level" />);
  const button = screen.getByRole('button', { name: 'Level up' }) as HTMLButtonElement;
  expect(button.disabled).toBe(true); expect(screen.getByText('Need 25 fish.')).toBeTruthy();
  fireEvent.click(button); expect(R.exportSave(m.state)).toBe(before);
  m.state.account.currencies.fish = 25; ui.rerender(<CompanionGrowthV4 m={m} catId="mochi" kind="level" />);
  expect((screen.getByRole('button', { name: 'Level up' }) as HTMLButtonElement).disabled).toBe(false);
  card(m).level = CARD_BY_ID.mochi!.levelCap; ui.rerender(<CompanionGrowthV4 m={m} catId="mochi" kind="level" />);
  expect((screen.getByRole('button', { name: 'Level up' }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByText('Cat reached its rarity level cap.')).toBeTruthy();
});

it('honors route locks and rechecks the command if funds changed after the preview', () => {
  const m = model(), ui = render(<CompanionGrowthV4 m={m} catId="mochi" kind="level" />);
  m.state.account.currencies.fish = 0;
  const before = R.exportSave(m.state); fireEvent.click(screen.getByRole('button', { name: 'Level up' }));
  expect(R.exportSave(m.state)).toBe(before);
  m.state.account.currencies.fish = 600; m.state.tutorial = 4; m.start(1);
  ui.rerender(<CompanionGrowthV4 m={m} catId="mochi" kind="level" />);
  expect((screen.getByRole('button', { name: 'Level up' }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByText('Finish this route before training your companions.')).toBeTruthy();
});

it('integrates with selected companions and preserves the legacy OFF buttons', () => {
  const m = model(), ui = render(<Collection m={m} />);
  expect(screen.getByText('Mochi to level 2')).toBeTruthy();
  m.cardId = 'soot'; ui.rerender(<Collection m={m} />);
  expect(screen.queryByText('Mochi to level 2')).toBeNull();
  expect(screen.getByText('Soot to level 2')).toBeTruthy();
  m.state = R.setGameplayV4(m.state, false); ui.rerender(<Collection m={m} />);
  expect(ui.container.querySelector('[data-growth]')).toBeNull();
  expect(screen.getByRole('button', { name: 'Level up' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Add a star' })).toBeTruthy();
});

it('shows both A6 level shortages, then spends the exact public cost only after all funds return', () => {
  const m = new DepthModel(true,true,true,true); card(m).level = 10;
  Object.assign(m.state.account.currencies, { fish:40, threads:0 });
  const before = structuredClone(m.state), ui = render(<CompanionGrowthV4 m={m} catId="mochi" kind="level"/>);
  const button = screen.getByRole('button', { name:'Level up' }) as HTMLButtonElement;
  expect(document.getElementById(button.getAttribute('aria-describedby')!)!.textContent).toContain('Need 210 more fish · 2 more threads.');
  expect(screen.getByText('250 fish points')).toBeTruthy();expect(screen.getByText('2 threads')).toBeTruthy();
  fireEvent.click(button);expect(m.state).toEqual(before);
  Object.assign(m.state.account.currencies, { fish:250, threads:1 });
  ui.rerender(<CompanionGrowthV4 m={m} catId="mochi" kind="level"/>);
  expect(screen.getByText('Need 1 more thread.')).toBeTruthy();expect(button.disabled).toBe(true);
  m.state.account.currencies.threads=2;ui.rerender(<CompanionGrowthV4 m={m} catId="mochi" kind="level"/>);
  const expected=R.metaCommand(m.state,{type:'level',cardId:card(m).id});expect(expected.ok).toBe(true);
  fireEvent.click(screen.getByRole('button',{name:'Level up'}));expect(m.state).toEqual(expected.state);
});

it('discloses fish alongside missing A6 shards and allows a star without threads', () => {
  const m = new DepthModel(true,true,true,true);Object.assign(card(m),{stars:2,shards:7});
  Object.assign(m.state.account.currencies,{fish:40,threads:0});
  const before=structuredClone(m.state),ui=render(<CompanionGrowthV4 m={m} catId="mochi" kind="ascend"/>);
  expect(screen.getByText('300 fish points')).toBeTruthy();expect(screen.getByText('7 / 20 matching shards')).toBeTruthy();
  expect(screen.getByText('Need 260 more fish · 13 more matching shards.')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Add a star'}));expect(m.state).toEqual(before);
  m.state.account.currencies.fish=300;ui.rerender(<CompanionGrowthV4 m={m} catId="mochi" kind="ascend"/>);
  expect(screen.getByText('Need 13 more matching shards.')).toBeTruthy();
  card(m).shards=20;ui.rerender(<CompanionGrowthV4 m={m} catId="mochi" kind="ascend"/>);
  const expected=R.metaCommand(m.state,{type:'ascend',cardId:card(m).id});expect(expected.ok).toBe(true);
  fireEvent.click(screen.getByRole('button',{name:'Add a star'}));expect(m.state).toEqual(expected.state);expect(m.state.account.currencies.threads).toBe(0);
});
