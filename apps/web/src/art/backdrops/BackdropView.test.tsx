import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BACKDROPS } from './index';
import { livingroom } from './livingroom';
import { BackdropView, backdropRects } from './BackdropView';

describe('BackdropView Component and backdropRects', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders data-backdrop="livingroom"', () => {
    const { container } = render(<BackdropView art={livingroom} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('data-backdrop')).toBe('livingroom');
    expect(svg?.getAttribute('shape-rendering')).toBe('crispEdges');
    expect(svg?.getAttribute('viewBox')).toBe(`0 0 ${livingroom.width} 96`);
  });

  it('backdropRects(livingroom, "far") covers every non-\'.\' pixel exactly once for all five backdrops', () => {
    for (const [id, art] of Object.entries(BACKDROPS)) {
      const farRects = backdropRects(art, 'far');

      // Group rects by row y
      const farWidthsByY = new Map<number, number>();
      for (const r of farRects) {
        farWidthsByY.set(r.y, (farWidthsByY.get(r.y) ?? 0) + r.w);
      }

      for (let y = 0; y < art.far.rows.length; y++) {
        const row = art.far.rows[y];
        if (!row) continue;
        const nonDotCount = row.split('').filter((ch) => ch !== '.').length;
        const sumW = farWidthsByY.get(y) ?? 0;
        expect(
          sumW,
          `${id} far row ${y}: expected sum of w (${sumW}) === count of non-'.' chars (${nonDotCount})`,
        ).toBe(nonDotCount);
      }

      // Also verify near layer
      const nearRects = backdropRects(art, 'near');
      const nearWidthsByY = new Map<number, number>();
      for (const r of nearRects) {
        nearWidthsByY.set(r.y, (nearWidthsByY.get(r.y) ?? 0) + r.w);
      }

      for (let r = 0; r < art.near.rows.length; r++) {
        const row = art.near.rows[r];
        if (!row) continue;
        const y = art.near.top + r;
        const nonDotCount = row.split('').filter((ch) => ch !== '.').length;
        const sumW = nearWidthsByY.get(y) ?? 0;
        expect(
          sumW,
          `${id} near row ${r} (y=${y}): expected sum of w (${sumW}) === count of non-'.' chars (${nonDotCount})`,
        ).toBe(nonDotCount);
      }
    }
  });

  it('fills are \'#rrggbb\' strings from the palette', () => {
    for (const [id, art] of Object.entries(BACKDROPS)) {
      const expectedHexColors = new Set(
        Object.values(art.palette).map(
          (num) => '#' + num.toString(16).padStart(6, '0').toLowerCase(),
        ),
      );

      for (const layer of ['far', 'near'] as const) {
        const rects = backdropRects(art, layer);
        for (const r of rects) {
          expect(
            r.fill,
            `${id} ${layer} rect at (${r.x}, ${r.y}) has invalid hex fill format`,
          ).toMatch(/^#[0-9a-f]{6}$/);
          expect(
            expectedHexColors.has(r.fill),
            `${id} ${layer} rect fill ${r.fill} is not in palette colors`,
          ).toBe(true);
        }
      }
    }
  });

  it('width 400 renders ceil((400 + offsetX) / art.width) tiles', () => {
    const testOffsets = [0, 50, 90, 160];

    for (const offsetX of testOffsets) {
      const expectedTiles = Math.ceil((400 + offsetX) / livingroom.width);
      const { container, unmount } = render(
        <BackdropView art={livingroom} width={400} offsetX={offsetX} />,
      );

      const uses = container.querySelectorAll('use');
      expect(
        uses.length,
        `For width=400, offsetX=${offsetX}: expected ${expectedTiles} tiles, got ${uses.length}`,
      ).toBe(expectedTiles);

      // Verify each use element position x = k * art.width - offsetX
      uses.forEach((use, k) => {
        const expectedX = k * livingroom.width - offsetX;
        expect(Number(use.getAttribute('x'))).toBe(expectedX);
        expect(Number(use.getAttribute('y'))).toBe(0);
        expect(Number(use.getAttribute('width'))).toBe(livingroom.width);
        expect(Number(use.getAttribute('height'))).toBe(96);
      });

      unmount();
    }
  });

  it('aria-hidden without title, role img with title', () => {
    // 1. Without title
    const { container: cWithout, unmount: uWithout } = render(
      <BackdropView art={livingroom} />,
    );
    const svgWithout = cWithout.querySelector('svg');
    expect(svgWithout?.getAttribute('aria-hidden')).toBe('true');
    expect(svgWithout?.getAttribute('role')).toBeNull();
    expect(svgWithout?.getAttribute('aria-label')).toBeNull();
    expect(svgWithout?.querySelector('title')).toBeNull();
    uWithout();

    // 2. With title
    const titleText = 'Cozy Living Room Backdrop';
    const { container: cWith, unmount: uWith } = render(
      <BackdropView art={livingroom} title={titleText} />,
    );
    const svgWith = cWith.querySelector('svg');
    expect(svgWith?.getAttribute('aria-hidden')).toBeNull();
    expect(svgWith?.getAttribute('role')).toBe('img');
    expect(svgWith?.getAttribute('aria-label')).toBe(titleText);
    expect(svgWith?.querySelector('title')?.textContent).toBe(titleText);
    uWith();
  });

  it('rect count per backdrop and layer logged and < 4000 (assert)', () => {
    for (const [id, art] of Object.entries(BACKDROPS)) {
      const farRects = backdropRects(art, 'far');
      const nearRects = backdropRects(art, 'near');

      console.log(
        `[BackdropView] ${id.padEnd(12)} -> far rects: ${String(farRects.length).padStart(4)}, near rects: ${String(nearRects.length).padStart(4)}, total: ${farRects.length + nearRects.length}`,
      );

      expect(
        farRects.length,
        `${id} far rects count (${farRects.length}) must be < 4000`,
      ).toBeLessThan(4000);
      expect(
        nearRects.length,
        `${id} near rects count (${nearRects.length}) must be < 4000`,
      ).toBeLessThan(4000);
    }
  });

  it('memoizes backdropRects per art+layer in WeakMap', () => {
    const firstFar = backdropRects(livingroom, 'far');
    const secondFar = backdropRects(livingroom, 'far');
    expect(firstFar).toBe(secondFar);

    const firstNear = backdropRects(livingroom, 'near');
    const secondNear = backdropRects(livingroom, 'near');
    expect(firstNear).toBe(secondNear);
  });
});
