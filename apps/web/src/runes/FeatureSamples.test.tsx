// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const enabled = vi.hoisted(() => ({ value: false }));
vi.mock('@taskbar-hero/game-rules', async importOriginal => {
  const original = await importOriginal<typeof import('@taskbar-hero/game-rules')>();
  return { ...original, CONFIG: { ...original.CONFIG, features: { ...original.CONFIG.features, get originalEconomy() { return enabled.value; } } } };
});
import FeatureSamples from './FeatureSamples';
afterEach(() => { cleanup(); enabled.value = false; vi.restoreAllMocks(); });
it('renders nothing under the existing default-off flag', () => {
  const { container } = render(<FeatureSamples />);
  expect(container.childElementCount).toBe(0);
});
it('labels samples and unavailable ownership without touching storage or making requests', () => {
  enabled.value = true;
  const store = vi.spyOn(Storage.prototype, 'setItem');
  const read = vi.spyOn(Storage.prototype, 'getItem');
  const network = vi.spyOn(globalThis, 'fetch');
  render(<FeatureSamples />);
  for (const label of ['Runes', 'Companions', 'Skills']) {
    fireEvent.click(screen.getByRole('tab', { name: label }));
    const entries = screen.getByRole('list').querySelectorAll('button');
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(entry.textContent).toContain('Sample'); fireEvent.click(entry);
      expect(screen.getByText('Unavailable in this run')).toBeTruthy();
    }
  }
  fireEvent.change(screen.getByLabelText('Sample rank'), { target: { value: '3' } });
  expect(screen.getByText('11% of maximum HP')).toBeTruthy();
  expect(store).not.toHaveBeenCalled(); expect(read).not.toHaveBeenCalled(); expect(network).not.toHaveBeenCalled();
});
