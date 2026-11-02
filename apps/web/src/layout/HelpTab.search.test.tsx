// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { withConfigV2 } from '../../../../packages/game-rules/src/v2/sim/config';
import { HelpTab } from './HelpTab';
const inventory = JSON.parse(readFileSync('../../reports/redesign/CXU4/help-strings.json', 'utf8')) as Record<string, string[]>;
beforeEach(() => vi.stubEnv('VITE_GAME_V2', '1'));
afterEach(() => { cleanup(); vi.unstubAllEnvs(); });
const compact = (value: string) => value.replace(/\s+/g, ' ').trim();
it('preserves every old answer string, including first-clear configuration and classic content', () => {
  for (const [value, key] of [[0, 'base'], [1, 'firstClear']] as const) {
    withConfigV2({ boss: { firstClearKeys: value } }, () => {
      const { container, unmount } = render(<HelpTab />);
      expect(Array.from(container.querySelectorAll('.help-v2-section')).map(node => compact(node.textContent!))).toEqual(inventory[key]);
      unmount();
    });
  }
  vi.stubEnv('VITE_GAME_V2', '0'); const { container } = render(<HelpTab />);
  expect(Array.from(container.querySelectorAll('.help-step-item')).map(node => compact(node.textContent!))).toEqual(inventory.classic);
});
it('searches answer content, selects visible answers and recovers from an empty result', () => {
  render(<HelpTab />); expect(screen.getAllByRole('heading', { level: 3 }).map(el => el.textContent)).toEqual(['Getting started']);
  fireEvent.click(screen.getByRole('button', { name: 'Forge' })); expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('Forge');
  fireEvent.change(screen.getByLabelText('Search help'), { target: { value: '  cAtNaP  ' } });
  expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('Cat Keys and bosses'); expect(screen.getByRole('button', { name: 'Cat Keys and bosses' }).getAttribute('aria-current')).toBe('true');
  expect(screen.queryByRole('button', { name: 'Forge' })).toBeNull();
  fireEvent.change(screen.getByLabelText('Search help'), { target: { value: 'zz-no-match' } }); expect(screen.getByRole('heading', { name: 'No matching topics' })).toBeTruthy();
  fireEvent.click(screen.getByText('Clear search')); expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('Forge');
});
it('supports future Help tabs with independent keyboard navigation', () => {
  render(<HelpTab additionalTabs={[{ id: 'proof', label: 'On-chain proof', content: 'Proof panel' }]} />);
  fireEvent.keyDown(screen.getByRole('tab', { name: 'Guide' }), { key: 'ArrowRight' });
  expect(screen.getByRole('tabpanel').textContent).toBe('Proof panel');
});
it('finds visible phrases across inline configuration values and punctuation', () => {
  render(<HelpTab />);
  const search = screen.getByLabelText('Search help');
  fireEvent.change(search, { target: { value: '30 Yarn' } });
  expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('Forge');
  fireEvent.change(search, { target: { value: 'Warrior: sword' } });
  expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('Classes');
  fireEvent.change(search, { target: { value: '  first   claim each day  ' } });
  expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('Cat Keys and bosses');
});
