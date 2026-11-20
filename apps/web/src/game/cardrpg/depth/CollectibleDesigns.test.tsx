// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { CollectibleDesigns } from './CollectibleDesigns';
import { DepthModel } from './model';

afterEach(cleanup);

it('shows source caps, local counters, effort and zero reservation power for both designs', () => {
  const model = new DepthModel(true);
  render(<CollectibleDesigns m={model} />);
  const moon = within(screen.getByRole('article', { name: 'Moon Collar' }));
  const maneki = within(screen.getByRole('article', { name: 'Golden Maneki' }));
  expect(moon.getByText('0 / 2400')).toBeTruthy();
  expect(moon.getByText('0 / 400')).toBeTruthy();
  expect(maneki.getByText('0 / 360')).toBeTruthy();
  expect(maneki.getByText('0 / 60')).toBeTruthy();
  expect(moon.getByText('0 battle stats')).toBeTruthy();
  expect(maneki.getByText('0 battle stats')).toBeTruthy();
  expect((moon.getByRole('button') as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByText(/Invitation results, equipment, random drops/).textContent).toContain('account-bound');
  expect(screen.getByText(/The prototype tracks these counters/).textContent).toContain('in this save');
});

it('reserves through the existing rule command and displays both incremented counters', () => {
  const model = new DepthModel(true);
  model.state.seals = 3;
  model.state.cleared = [1];
  const { rerender } = render(<CollectibleDesigns m={model} />);
  fireEvent.click(screen.getByRole('button', { name: 'Reserve with 3 seals' }));
  rerender(<CollectibleDesigns m={model} />);
  const moon = within(screen.getByRole('article', { name: 'Moon Collar' }));
  expect(model.state.seals).toBe(0);
  expect(model.state.designClaims).toEqual(['moon-collar']);
  expect(moon.getByText('1 / 2400')).toBeTruthy();
  expect(moon.getByText('1 / 400')).toBeTruthy();
  expect((moon.getByRole('button', { name: 'Design reserved' }) as HTMLButtonElement).disabled).toBe(true);
  expect(model.notice).toContain('Design only - not minted');
});
