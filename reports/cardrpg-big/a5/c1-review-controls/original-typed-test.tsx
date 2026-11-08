import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DepthModel } from './model';
import { SaveSettings } from './Utility';

vi.mock('./relic-reader', () => ({ readConnectedRelics: vi.fn() }));
afterEach(() => { cleanup(); window.history.replaceState(null, '', '/'); });
const grants = ['Unlock all cats and build materials', 'Add 1500 demo stamps', 'Unlock chapters and Tower', 'Advance fixture day'];
it('hides reviewer grants on ordinary GameplayV4 while preserving save and comfort controls', () => {
  const m = new DepthModel(true, true);
  const before = JSON.stringify(m.state);
  render(<SaveSettings m={m} />);
  for (const name of grants) expect(screen.queryByRole('button', { name, exact: true })).toBeNull();
  expect(screen.getByRole('button', { name: 'Export save code', exact: true })).toBeTruthy();
  expect(screen.getByLabelText('Reduced motion')).toBeTruthy();
  expect(JSON.stringify(m.state)).toBe(before);
});
it('keeps reviewer shortcuts reachable under explicit dev=1', () => {
  window.history.replaceState(null, '', '/?dev=1');
  const m = new DepthModel(true, true), day = m.state.account.day;
  render(<SaveSettings m={m} />);
  for (const name of grants) expect(screen.getByRole('button', { name, exact: true })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Advance fixture day', exact: true }));
  expect(m.state.account.day).toBe(day + 1);
});
it('preserves the legacy offline shortcut panel with GameplayV4 off', () => {
  const m = new DepthModel(true, false);
  render(<SaveSettings m={m} />);
  for (const name of grants) expect(screen.getByRole('button', { name, exact: true })).toBeTruthy();
});

it('keeps offline grants absent from the live settings even with reviewer mode', () => {
  window.history.replaceState(null, '', '/?dev=1');
  const m = new DepthModel(false, true);
  render(<SaveSettings m={m} />);
  for (const name of grants) expect(screen.queryByRole('button', { name, exact: true })).toBeNull();
});
