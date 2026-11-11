import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { DepthModel } from '../depth/model';
import { BondBookA6, BondSummaryA6 } from './BondsA6';
import { CompanionCard } from '../depth/CompanionCard';

afterEach(cleanup);
it('opens every collection and pair directly while preserving roster bonuses and formation navigation', () => {
  const m = new DepthModel(true, true, true, true);
  render(<BondBookA6 m={m}/>);
  expect(screen.getByText('All cats +0.5% HP & attack')).toBeTruthy();
  expect(within(screen.getByRole('navigation', {name:'Collection bonds index'})).getAllByRole('button')).toHaveLength(9);
  fireEvent.click(screen.getByRole('button', {name:/Warm Kitchen/}));
  expect(screen.getByText('Missing: Panko, Mallow, Biscuit')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', {name:'Pair combos 8'}));
  expect(within(screen.getByRole('navigation', {name:'Pair combos index'})).getAllByRole('button')).toHaveLength(8);
  expect(screen.getByRole('region', {name:'Lantern Pledge'}).textContent).toContain('Ready');
  fireEvent.click(screen.getByRole('button', {name:'Build a bonded team'}));
  expect(m.screen).toBe('team');
});
it('keeps missing, owned and team-ready pair states distinct without changing account state when browsing', () => {
  const m = new DepthModel(true, true, true, true), before=JSON.stringify(m.state);
  const {rerender}=render(<BondBookA6 m={m}/>);
  fireEvent.click(screen.getByRole('button', {name:'Pair combos 8'}));
  fireEvent.click(screen.getByRole('button', {name:/Ink and Ember/}));
  expect(screen.getByRole('region', {name:'Ink and Ember'}).textContent).toContain('1 missing');
  expect(JSON.stringify(m.state)).toBe(before);
  fireEvent.click(screen.getByRole('button', {name:'Inkcap: missing'}));
  expect(m.cardId).toBe('inkcap');expect(m.screen).toBe('collection');
  m.shortcut('unlock');m.state.team=['mochi','soot','clover'];rerender(<BondBookA6 m={m}/>);
  expect(screen.getByRole('region', {name:'Ink and Ember'}).textContent).toContain('Pair up');
  m.state.team=['mochi','soot','inkcap'];rerender(<BondBookA6 m={m}/>);
  expect(screen.getByRole('region', {name:'Ink and Ember'}).textContent).toContain('Ready');
  fireEvent.click(screen.getByRole('button', {name:'Collection bonds 9'}));
  expect(screen.getByText('All cats +4.5% HP & attack')).toBeTruthy();
});
it('keeps bond affordances absent from flag-OFF companion cards', () => {
  const m = new DepthModel(true, true, true, false);
  const { rerender } = render(<CompanionCard id="mochi" m={m}/>);
  expect(screen.queryByText('∞ Bonds')).toBeNull();
  rerender(<CompanionCard id="mochi" m={new DepthModel(true, true, true, true)}/>);
  expect(screen.getByText('∞ Combo ready')).toBeTruthy();
});

it('explains the selected cat’s pair effects, missing partners and automatic trigger without changing the crew', () => {
  const m = new DepthModel(true, true, true, true), before = JSON.stringify(m.state);
  const {rerender} = render(<BondSummaryA6 m={m} catId="clover"/>);
  expect(screen.getByRole('article', {name:'Lantern Pledge'}).textContent).toContain('Strike the weakest foe and shield the team.');
  expect(screen.getByRole('article', {name:'Lantern Pledge'}).textContent).toContain('Both in your crew');
  expect(screen.getByRole('article', {name:'Garden Afterglow'}).textContent).toContain('Missing: Inkcap');
  expect(screen.getByText('Completed collections help all cats, even from the bench.')).toBeTruthy();
  expect(screen.getByText('Once per battle, from round 3. Both partners must still be standing.')).toBeTruthy();
  expect(JSON.stringify(m.state)).toBe(before);
  m.shortcut('unlock'); rerender(<BondSummaryA6 m={m} catId="clover"/>);
  expect(screen.getByRole('article', {name:'Garden Afterglow'}).textContent).toContain('Place both in your team');
  m.state.team=['mochi','clover','inkcap']; rerender(<BondSummaryA6 m={m} catId="clover"/>);
  expect(screen.getByRole('article', {name:'Garden Afterglow'}).textContent).toContain('Both in your crew');
  const equipped = JSON.stringify(m.state);
  fireEvent.click(screen.getByRole('button', {name:'Open Bond Book'}));
  expect(m.screen).toBe('bonds');expect(JSON.stringify(m.state)).toBe(equipped);
});
