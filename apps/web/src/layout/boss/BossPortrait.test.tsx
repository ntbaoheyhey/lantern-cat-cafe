// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BossPortrait } from './BossPortrait';

describe('BossPortrait', () => {
  afterEach(cleanup);

  it('chapter 1 renders an svg with role img and the boss name from the registry', () => {
    const { container } = render(<BossPortrait chapter={1} />);
    const img = screen.getByRole('img', { name: 'Yarn Giant' });
    expect(img).toBeTruthy();
    expect(img.tagName.toLowerCase()).toBe('svg');

    // crisp edges and viewBox
    expect(img.getAttribute('viewBox')).toBe('0 0 48 48');
    expect(img.getAttribute('shape-rendering')).toBe('crispEdges');

    // check that paths are rendered inside svg
    const paths = container.querySelectorAll('svg path');
    expect(paths.length).toBeGreaterThan(0);
  });

  it('an unknown chapter 99 renders the fallback box', () => {
    render(<BossPortrait chapter={99} />);
    const fallback = screen.getByRole('img', { name: 'Unknown Boss' });
    expect(fallback).toBeTruthy();
    expect(fallback.tagName.toLowerCase()).not.toBe('svg');
    expect(fallback.className).toContain('boss-portrait-fallback');
  });

  it('respects the zoom prop for scaling dimensions', () => {
    const { container } = render(<BossPortrait chapter={1} zoom={3} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe(String(48 * 3));
    expect(svg?.getAttribute('height')).toBe(String(48 * 3));
  });
});
