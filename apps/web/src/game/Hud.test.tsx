// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { FISH_EVENT, Hud } from './Hud';

const snap = vi.hoisted(() => ({ value: { gold: 1234, shards: 56, loadFailed: false, server: { bossKeys: 2 } as { bossKeys: number } | null } }));
vi.mock('./store', () => ({ useGameSnapshot: () => snap.value }));

function mockMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduce,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => mockMotion(true));
afterEach(cleanup);

it('shows Fish, Yarn and Cat Key counts', () => {
  render(<Hud />);
  expect(screen.getByTestId('gold-counter').textContent).toContain('1,234');
  expect(screen.getByTestId('shard-counter').textContent).toContain('56');
  expect(screen.getByTestId('key-counter').textContent).toContain('2');
});

it('bumps the Fish chip when a fish lands', () => {
  mockMotion(false);
  render(<Hud />);
  const chip = screen.getByTestId('gold-counter');
  expect(chip.classList.contains('chip-bump')).toBe(false);
  act(() => {
    window.dispatchEvent(new Event(FISH_EVENT));
  });
  expect(chip.classList.contains('chip-bump')).toBe(true);
});

it('does not bump with reduced motion', () => {
  render(<Hud />);
  act(() => {
    window.dispatchEvent(new Event(FISH_EVENT));
  });
  expect(screen.getByTestId('gold-counter').classList.contains('chip-bump')).toBe(false);
});

it('shows an Offline chip only while the first load has failed', () => {
  const { rerender } = render(<Hud />);
  expect(screen.queryByTestId('hud-offline')).toBeNull();
  snap.value = { ...snap.value, loadFailed: true, server: null };
  rerender(<Hud />);
  expect(screen.getByTestId('hud-offline').textContent).toBe('Offline');
  snap.value = { ...snap.value, loadFailed: false, server: { bossKeys: 2 } };
});
