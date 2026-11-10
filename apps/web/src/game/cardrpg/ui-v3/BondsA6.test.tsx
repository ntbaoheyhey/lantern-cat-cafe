import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { DepthModel } from '../depth/model';
import { BondBookA6 } from './BondsA6';
import { CompanionCard } from '../depth/CompanionCard';

afterEach(cleanup);
it('shows collection ownership, missing cats and the roster bonus, then opens formation', () => {
  const m = new DepthModel(true, true, true, true);
  render(<BondBookA6 m={m}/>);
  expect(screen.getByText('All cats +0.5% HP & attack')).toBeTruthy();
  expect(screen.getByText('Missing: Panko, Mallow, Biscuit')).toBeTruthy();
  expect(screen.getByText('Lantern Pledge')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Build a bonded team' }));
  expect(m.screen).toBe('team');
});
it('keeps bond affordances absent from flag-OFF companion cards', () => {
  const m = new DepthModel(true, true, true, false);
  const { rerender } = render(<CompanionCard id="mochi" m={m}/>);
  expect(screen.queryByText('∞ Bonds')).toBeNull();
  rerender(<CompanionCard id="mochi" m={new DepthModel(true, true, true, true)}/>);
  expect(screen.getByText('∞ Combo ready')).toBeTruthy();
});
