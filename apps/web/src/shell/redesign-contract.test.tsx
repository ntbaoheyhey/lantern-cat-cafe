import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { RAIL_SCREENS, SCREEN_REGISTRY, TABS, tabNameToScreenId } from '../nav/screens';
import { sampleServerStateV2 } from '../layout/a11y/fixtures';
import { Rail } from './Rail';
import { ScreenFrame } from './ScreenFrame';
import { Hud } from './Hud';

vi.mock('../wallet/WalletButton', () => ({ WalletButton: () => <button>Wallet fixture</button> }));
afterEach(cleanup);

it('every registered destination has one rail item or is an entry screen', () => {
  expect(new Set(SCREEN_REGISTRY.map(s => s.id)).size).toBe(SCREEN_REGISTRY.length);
  expect(SCREEN_REGISTRY.filter(s => !s.rail).map(s => s.id).sort()).toEqual(['class', 'landing']);
  render(<Rail activeScreen="home" onSelectScreen={vi.fn()} />);
  expect(screen.getAllByRole('tab')).toHaveLength(RAIL_SCREENS.length);
  for (const entry of SCREEN_REGISTRY) {
    const items = screen.queryAllByTestId(`nav-${entry.id}`);
    expect(items).toHaveLength(entry.rail ? 1 : 0);
    if (entry.rail) expect(items[0]!.getAttribute('aria-controls')).toBe(`panel-${entry.id}`);
  }
});

it('every legacy tab and onboarding destination resolves to its intended rail screen', () => {
  const expected = { Hero: 'hero', Inventory: 'bag', Boss: 'map', Forge: 'forge', Market: 'market' };
  const onboarding = readFileSync(resolve('src/onboarding/nextStep.ts'), 'utf8');
  const used = [...onboarding.matchAll(/\btab:\s*(['"])([^'"]+)\1/g)].map(m => m[2]!);
  expect(used.length).toBeGreaterThan(0);
  for (const name of [...TABS.map(tab => tab.id), ...used]) {
    expect(expected).toHaveProperty(name);
    const destination = tabNameToScreenId(name);
    expect(destination).toBe(expected[name as keyof typeof expected]);
    expect(RAIL_SCREENS.some(screen => screen.id === destination)).toBe(true);
  }
});

for (const entry of RAIL_SCREENS) it(`${entry.label} frame keeps one heading and one current rail destination`, () => {
  render(<ScreenFrame activeScreen={entry.id} onSelectScreen={vi.fn()} hudProps={{ state: sampleServerStateV2(), power: 42 }}>
    <section id={`panel-${entry.id}`} role="tabpanel" aria-label={entry.label}>Screen content fixture</section>
  </ScreenFrame>);
  expect(screen.getAllByRole('heading', { level: 1, name: 'Taskbar Hero' })).toHaveLength(1);
  expect(screen.getByTestId('rail').querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  expect(screen.getByTestId(`nav-${entry.id}`).getAttribute('aria-current')).toBe('page');
  expect(within(screen.getByRole('main')).getByRole('tabpanel', { name: entry.label })).toBeTruthy();
  expect(screen.getByRole('main').tabIndex).toBe(-1);
  expect(screen.getByTestId('hud')).toBeTruthy();
});

for (const id of ['landing', 'class'] as const) it(`${id} frame remains named without HUD or rail`, () => {
  render(<ScreenFrame activeScreen={id} onSelectScreen={vi.fn()} hudProps={null}>Entry fixture</ScreenFrame>);
  expect(screen.queryByTestId('rail')).toBeNull();
  expect(screen.queryByTestId('hud')).toBeNull();
  expect(screen.getAllByRole('heading', { level: 1, name: 'Taskbar Hero' })).toHaveLength(1);
  expect(screen.getByRole('main')).toBeTruthy();
});

it('HUD accessible currency values update with the authoritative snapshot', () => {
  const state = sampleServerStateV2({ level: 14, keys: 1 });
  const view = render(<Hud state={state} power={42} />);
  const next = { ...state, currencies: { ...state.currencies, fish: 9876, yarn: 543, keys: 4 } };
  view.rerender(<Hud state={next} power={1234} />);
  expect(screen.getByRole('listitem', { name: 'Fish 9,876' })).toBeTruthy();
  expect(screen.getByRole('listitem', { name: 'Yarn 543' })).toBeTruthy();
  expect(screen.getByRole('listitem', { name: 'Cat Keys 4 of 5' })).toBeTruthy();
  expect(screen.getByTestId('hud-power').textContent).toContain('1,234');
});
