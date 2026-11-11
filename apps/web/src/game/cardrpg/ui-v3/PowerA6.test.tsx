import { CatsSheet } from './SheetsV3';
import { useSyncExternalStore } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { DepthModel } from '../depth/model';
import { QuickUpgradeA6 } from './PowerA6';

afterEach(cleanup);
function Harness({ m }: { m: DepthModel }) {
  useSyncExternalStore(m.subscribe, m.snapshot);
  return <QuickUpgradeA6 m={m}/>;
}
it('buys the named upgrade and updates the visible team Power using the real price', () => {
  const m = new DepthModel(true, true, true, true);
  m.state.account.currencies.fish = 5000;
  m.state.settings.reducedMotion = true;
  const before = m.state.account.currencies.fish;
  const option = R.upgradeOptionsA6(m.state)[0]!;
  render(<Harness m={m}/>);
  expect(screen.getByText(new RegExp(option.label))).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Quick upgrade' }));
  expect(m.error).toBe(false);
  expect(m.state.account.currencies.fish).toBe(before - (option.cost.fish ?? 0));
  expect(screen.getByLabelText(`Team Power ${option.after}`)).toBeTruthy();
});
it('locks both quick actions during a route and explains when they return', () => {
  const m = new DepthModel(true, true, true, true);
  m.state = R.startRun(m.state, 1, 13).state;
  render(<Harness m={m}/>);
  expect((screen.getByRole('button', { name: 'Quick upgrade' }) as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByRole('button', { name: 'Auto-equip best gear' }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByText('Finish this route to train your crew.')).toBeTruthy();
});

it('keeps cat level details and its next price in sync after a quick upgrade', () => {
  const m = new DepthModel(true, true, true, true);
  m.state.settings.reducedMotion=true;
  m.state.account.currencies.fish=5000;
  const option=R.upgradeOptionsA6(m.state)[0]!;
  if(option.change.kind!=='level')throw Error('Expected a starter level upgrade');
  const change=option.change;
  const card=m.state.account.cards.find(c=>c.id===change.cardId)!;
  m.cardId=card.cardId;
  render(<CatsSheet m={m}/>);
  fireEvent.click(screen.getByRole('button',{name:'Quick upgrade'}));
  expect(screen.getByText(`Level ${card.level+1} · ${card.stars} stars`)).toBeTruthy();
});
