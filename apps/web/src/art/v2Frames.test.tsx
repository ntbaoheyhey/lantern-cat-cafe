// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MAPS, PALETTE, V2_FRAME_NAMES, V2PixelFrame } from './v2Frames';

afterEach(cleanup);

describe('v2 equipment frames', () => {
  it('has all 15 v2 frames (5 rarity borders, 9 empty slot outlines, 1 locked slot)', () => {
    expect(V2_FRAME_NAMES).toEqual([
      'frameCommon',
      'frameUncommon',
      'frameRare',
      'frameEpic',
      'frameLegendary',
      'emptyWeapon',
      'emptyHelmet',
      'emptyArmor',
      'emptyGloves',
      'emptyBoots',
      'emptyCollar',
      'emptyEarring',
      'emptyRing',
      'emptyCharm',
      'lockedSlot',
    ]);
    expect(V2_FRAME_NAMES).toHaveLength(15);
  });

  it.each(V2_FRAME_NAMES)(
    'map for %s has equal row lengths, only palette characters, and is 14 to 16 pixels square',
    (name) => {
      const rows = MAPS[name];
      expect(rows.length).toBeGreaterThanOrEqual(14);
      expect(rows.length).toBeLessThanOrEqual(16);
      const height = rows.length;
      const width = rows[0]?.length ?? 0;

      // Must be square
      expect(width).toBe(height);
      expect(width).toBeGreaterThanOrEqual(14);
      expect(width).toBeLessThanOrEqual(16);

      for (const row of rows) {
        expect(row.length).toBe(width);
        for (const ch of row) {
          if (ch === '.') continue;
          expect(PALETTE).toHaveProperty(ch);
        }
      }
    },
  );

  const rarityFrameNames = V2_FRAME_NAMES.filter((name) => name.startsWith('frame'));

  it.each(rarityFrameNames)(
    'rarity frame %s has a fully transparent 8x8 centre (no pixels in the middle block)',
    (name) => {
      const rows = MAPS[name];
      const height = rows.length;
      const width = rows[0]!.length;

      const rStart = Math.floor((height - 8) / 2);
      const cStart = Math.floor((width - 8) / 2);

      for (let y = rStart; y < rStart + 8; y++) {
        for (let x = cStart; x < cStart + 8; x++) {
          const char = rows[y]![x];
          expect(char).toBe('.');
        }
      }
    },
  );

  it.each(V2_FRAME_NAMES)(
    'renders %s with title element when title is given, aria-hidden otherwise',
    (name) => {
      // 1. Without title: decorative (aria-hidden="true", no role="img")
      const { container: decorContainer } = render(<V2PixelFrame name={name} />);
      const decorSvg = decorContainer.querySelector('svg')!;
      expect(decorSvg).toBeTruthy();
      expect(decorSvg.getAttribute('aria-hidden')).toBe('true');
      expect(decorSvg.getAttribute('role')).toBeNull();
      expect(decorSvg.querySelector('title')).toBeNull();
      cleanup();

      // 2. With title: accessible (role="img", non-empty <title>, aria-label)
      const titleText = `Frame of ${name}`;
      const { container: titledContainer } = render(
        <V2PixelFrame name={name} title={titleText} />,
      );
      const titledSvg = titledContainer.querySelector('svg')!;
      expect(titledSvg).toBeTruthy();
      expect(titledSvg.getAttribute('aria-hidden')).toBeNull();
      expect(titledSvg.getAttribute('role')).toBe('img');
      expect(titledSvg.getAttribute('aria-label')).toBe(titleText);
      const titleEl = titledSvg.querySelector('title');
      expect(titleEl).not.toBeNull();
      expect(titleEl?.textContent).toBe(titleText);
      expect(screen.getByRole('img', { name: titleText })).toBe(titledSvg);
    },
  );

  it.each(V2_FRAME_NAMES)('renders %s as a crisp inline SVG sized by `size`', (name) => {
    const { container } = render(<V2PixelFrame name={name} size={5} />);
    const svg = container.querySelector('svg')!;
    expect(svg).toBeTruthy();
    expect(svg.getAttribute('shape-rendering')).toBe('crispEdges');
    const [, , w, h] = svg.getAttribute('viewBox')!.split(' ').map(Number);
    expect(w).toBeGreaterThanOrEqual(14);
    expect(w).toBeLessThanOrEqual(16);
    expect(h).toBeGreaterThanOrEqual(14);
    expect(h).toBeLessThanOrEqual(16);
    expect(w).toBe(h);
    expect(svg.getAttribute('width')).toBe(String(w! * 5));
    expect(svg.getAttribute('height')).toBe(String(h! * 5));
    expect(svg.style.display).toBe('block');
    expect(svg.querySelectorAll('path').length).toBeGreaterThan(0);
  });

  it('uses theme variables with hex fallbacks matching the plan', () => {
    expect(PALETTE.c).toBe('var(--rarity-common, #b9b6c9)');
    expect(PALETTE.u).toBe('var(--good, #6be08a)');
    expect(PALETTE.r).toBe('var(--rarity-rare, #4aa8ff)');
    expect(PALETTE.p).toBe('var(--rarity-epic, #bb74ff)');
    expect(PALETTE.o).toBe('var(--rarity-legendary, #ff9a3c)');
    expect(PALETTE.g).toContain('var(--gold, #ffd34e)');
    expect(PALETTE.y).toContain('var(--focus, #ffd75e)');
    expect(PALETTE.f).toContain('var(--border, #5b4572)');
  });

  it('frameEpic has a one-pixel corner glint', () => {
    const rows = MAPS.frameEpic;
    const whitePixels = rows
      .flatMap((row, y) =>
        [...row].map((char, x) => ({ char, x, y })),
      )
      .filter((p) => p.char === 'w');

    expect(whitePixels).toHaveLength(1);
    // Located at top-left corner
    expect(whitePixels[0]!.x).toBeLessThan(4);
    expect(whitePixels[0]!.y).toBeLessThan(4);
  });

  it('frameLegendary has corner sparkles', () => {
    const rows = MAPS.frameLegendary;
    const sparklePixels = rows
      .flatMap((row, y) =>
        [...row].map((char, x) => ({ char, x, y })),
      )
      .filter((p) => p.char === 'w');

    expect(sparklePixels.length).toBeGreaterThanOrEqual(2);
    // All sparkles are outside the middle 8x8 block
    for (const p of sparklePixels) {
      const inMiddleX = p.x >= 4 && p.x < 12;
      const inMiddleY = p.y >= 4 && p.y < 12;
      expect(inMiddleX && inMiddleY).toBe(false);
    }
  });
});
