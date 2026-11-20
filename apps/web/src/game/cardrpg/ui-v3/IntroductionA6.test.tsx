import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { DepthModel } from '../depth/model';
import { FirstStepsA6, IntroductionA6 } from './IntroductionA6';
afterEach(() => { cleanup(); vi.useRealTimers(); });
it('announces each newly opened feature separately and keeps the next goal short', () => {
  vi.useFakeTimers();
  const m = new DepthModel(true, true, true, true); m.state.tutorial = 3;
  const view = render(<IntroductionA6 m={m}/>);
  expect(screen.getByLabelText('Your next goal').textContent).toContain('free friend');
  m.state.freeInvite = true; m.state.account.cards.push({ ...m.state.account.cards[0]!, id:'new-card', cardId:'panko' });
  view.rerender(<IntroductionA6 m={m}/>);
  expect(screen.getByRole('status').textContent).toContain('Cat gear');
  act(() => vi.advanceTimersByTime(5000));
  expect(screen.getByRole('status').textContent).toContain('Bond Book');
  fireEvent.click(screen.getByRole('button', { name:'Dismiss celebration' }));
  expect(screen.queryByRole('status')).toBeNull();
});
it('remembers pre-battle unlocks across a remount and stays hidden with A6 OFF', () => {
  const m = new DepthModel(true, true, true, true);
  const view = render(<IntroductionA6 m={m}/>); view.unmount();
  m.state.tutorial = 3;
  const after = render(<IntroductionA6 m={m}/>);
  expect(screen.getByRole('status').textContent).toContain('Team formation');
  m.state = R.setGameplayA6(m.state, false); after.rerender(<IntroductionA6 m={m}/>);
  expect(screen.queryByLabelText('Your next goal')).toBeNull();
  expect(screen.queryByRole('status')).toBeNull();
});

it('keeps unlocks queued while an existing discovery celebration is visible', () => {
  const m = new DepthModel(true, true, true, true);
  const view = render(<IntroductionA6 m={m}/>);
  m.state = R.metaCommand(m.state, {type:'level', cardId:'mochi'}).state;
  expect(m.state.v4!.journey!.pending.length).toBeGreaterThan(0);
  view.rerender(<IntroductionA6 m={m}/>);
  expect(screen.queryByRole('status')).toBeNull();
  while (m.state.v4!.journey!.pending.length) m.state = R.acknowledgeDiscoveryV4(m.state, m.state.v4!.journey!.pending[0]!.sequence).state;
  view.rerender(<IntroductionA6 m={m}/>);
  expect(screen.getByRole('status').textContent).toContain('Cafe gifts');
});

it('follows the saved first three actions and shows guidance only on the matching sheet', () => {
  const m = new DepthModel(true, true, true, true);
  m.screen = 'prepare';
  const view = render(<><IntroductionA6 m={m}/><FirstStepsA6 m={m}/></>);
  expect(screen.getByLabelText('Your next action').textContent).toContain('Tap Fight');
  m.state.tutorial = 3; m.screen = 'gacha';
  view.rerender(<><IntroductionA6 m={m}/><FirstStepsA6 m={m}/></>);
  expect(screen.getByLabelText('Your next action').textContent).toContain('costs no stamps');
  m.state.freeInvite = true; m.screen = 'collection';
  view.rerender(<><IntroductionA6 m={m}/><FirstStepsA6 m={m}/></>);
  expect(screen.getByLabelText('Your next action').textContent).toContain('3 / 3');
  m.screen = 'inventory';
  view.rerender(<><IntroductionA6 m={m}/><FirstStepsA6 m={m}/></>);
  expect(screen.queryByLabelText('Your next action')).toBeNull();
  m.state.account.cards[0]!.level = 2; m.screen = 'collection';
  view.rerender(<><IntroductionA6 m={m}/><FirstStepsA6 m={m}/></>);
  expect(screen.queryByLabelText('Your next action')).toBeNull();
});
