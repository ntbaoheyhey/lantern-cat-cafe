// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const enabled = vi.hoisted(() => ({ value: false }));
vi.mock('@taskbar-hero/game-rules', async importOriginal => {
  const original = await importOriginal<typeof import('@taskbar-hero/game-rules')>();
  return { ...original, CONFIG: { ...original.CONFIG, features: { ...original.CONFIG.features, get originalEconomy() { return enabled.value; } } } };
});
import { Art2Frame, Art2Image } from './Art2';
import Art2Preview from './Art2Preview';
afterEach(() => { cleanup(); enabled.value = false; });
it('adds no nodes or resource requests while the existing flag is off', () => {
  const { container } = render(<><Art2Image id="landing" /><Art2Frame id="rune-frame-rare">Sample</Art2Frame><Art2Preview /></>);
  expect(container.childElementCount).toBe(0);
});
it('reserves integer image dimensions and labels sample content when the existing flag is on', () => {
  enabled.value = true;
  const { container } = render(<Art2Preview />);
  expect(screen.getByRole('region', { name: 'Original art samples' })).not.toBeNull();
  expect(container.querySelectorAll('[data-art2]')).toHaveLength(23);
  expect(container.querySelectorAll('figure')).toHaveLength(23);
  for (const figure of container.querySelectorAll('figure')) expect(figure.textContent).toContain('Sample');
  for (const image of container.querySelectorAll('img')) {
    expect(image.getAttribute('alt')).toBe(''); expect(image.getAttribute('aria-hidden')).toBe('true');
    expect(image.getAttribute('width')).toBe('96'); expect(image.getAttribute('height')).toBe('96');
    expect(image.getAttribute('loading')).toBe('lazy');
  }
  expect(container.querySelectorAll('[data-original-art]')).toHaveLength(7);
});
