// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { ICON_NAMES, PixelIcon } from './pixelIcons';

afterEach(cleanup);

it('has the 14 icons', () => {
  expect(ICON_NAMES).toEqual([
    'paw', 'bag', 'sword', 'flask', 'shop', 'fish', 'yarn', 'key', 'wand', 'ears', 'collar', 'bell', 'moon', 'heart',
  ]);
});

it.each(ICON_NAMES)('renders %s as a crisp inline SVG sized by `size`', (name) => {
  const { container } = render(<PixelIcon name={name} size={5} />);
  const svg = container.querySelector('svg')!;
  expect(svg).toBeTruthy();
  expect(svg.getAttribute('shape-rendering')).toBe('crispEdges');
  const [, , w, h] = svg.getAttribute('viewBox')!.split(' ').map(Number);
  expect(w).toBeGreaterThanOrEqual(5);
  expect(w).toBeLessThanOrEqual(12);
  expect(h).toBeGreaterThanOrEqual(4);
  expect(h).toBeLessThanOrEqual(12);
  expect(svg.getAttribute('width')).toBe(String(w! * 5));
  expect(svg.getAttribute('height')).toBe(String(h! * 5));
  expect(svg.style.display).toBe('block');
  expect(svg.querySelectorAll('path').length).toBeGreaterThan(0);
});

it('is decorative by default', () => {
  const { container } = render(<PixelIcon name="fish" />);
  const svg = container.querySelector('svg')!;
  expect(svg.getAttribute('aria-hidden')).toBe('true');
  expect(svg.getAttribute('role')).toBeNull();
  expect(screen.queryByRole('img')).toBeNull();
});

it('a title gives role="img" and an accessible name', () => {
  render(<PixelIcon name="key" title="Cat Key" />);
  const img = screen.getByRole('img', { name: 'Cat Key' });
  expect(img.getAttribute('aria-hidden')).toBeNull();
});

it('uses theme variables with hex fallbacks', () => {
  const { container } = render(<PixelIcon name="key" />);
  expect(container.querySelector('path')!.getAttribute('style')).toContain('var(--gold, #ffd34e)');
});
