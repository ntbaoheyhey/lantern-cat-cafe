// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { MAPS, PALETTE, V2_ICON_NAMES, V2PixelIcon } from './v2Icons';

afterEach(cleanup);

it('has all 25 v2 icons', () => {
  expect(V2_ICON_NAMES).toEqual([
    'fluffTuft',
    'shinyButton',
    'catnipCrystal',
    'starlightScale',
    'moonPearl',
    'slotWeapon',
    'slotHelmet',
    'slotArmor',
    'slotGloves',
    'slotBoots',
    'slotCollar',
    'slotEarring',
    'slotRing',
    'slotCharm',
    'sword',
    'hammer',
    'daggers',
    'spear',
    'bow',
    'staff',
    'flasks',
    'chestWood',
    'chestWoodOpen',
    'chestGold',
    'chestGoldOpen',
  ]);
  expect(V2_ICON_NAMES).toHaveLength(25);
});

it.each(V2_ICON_NAMES)(
  'map for %s has equal-length rows, uses only palette characters, and is 8 to 12 pixels wide',
  (name) => {
    const rows = MAPS[name];
    expect(rows.length).toBeGreaterThan(0);
    const width = rows[0]?.length ?? 0;
    expect(width).toBeGreaterThanOrEqual(8);
    expect(width).toBeLessThanOrEqual(12);

    for (const row of rows) {
      expect(row.length).toBe(width);
      for (const ch of row) {
        if (ch === '.') continue;
        expect(PALETTE).toHaveProperty(ch);
      }
    }
  },
);

it.each(V2_ICON_NAMES)(
  'renders %s with non-empty title when given, aria-hidden when not',
  (name) => {
    // 1. Without title: decorative (aria-hidden="true", no role="img")
    const { container: decorContainer } = render(<V2PixelIcon name={name} />);
    const decorSvg = decorContainer.querySelector('svg')!;
    expect(decorSvg).toBeTruthy();
    expect(decorSvg.getAttribute('aria-hidden')).toBe('true');
    expect(decorSvg.getAttribute('role')).toBeNull();
    expect(decorSvg.querySelector('title')).toBeNull();
    cleanup();

    // 2. With title: accessible (role="img", non-empty <title>, aria-label)
    const titleText = `Icon of ${name}`;
    const { container: titledContainer } = render(
      <V2PixelIcon name={name} title={titleText} />,
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

it.each(V2_ICON_NAMES)('renders %s as a crisp inline SVG sized by `size`', (name) => {
  const { container } = render(<V2PixelIcon name={name} size={5} />);
  const svg = container.querySelector('svg')!;
  expect(svg).toBeTruthy();
  expect(svg.getAttribute('shape-rendering')).toBe('crispEdges');
  const [, , w, h] = svg.getAttribute('viewBox')!.split(' ').map(Number);
  expect(w).toBeGreaterThanOrEqual(8);
  expect(w).toBeLessThanOrEqual(12);
  expect(h).toBeGreaterThanOrEqual(8);
  expect(h).toBeLessThanOrEqual(12);
  expect(svg.getAttribute('width')).toBe(String(w! * 5));
  expect(svg.getAttribute('height')).toBe(String(h! * 5));
  expect(svg.style.display).toBe('block');
  expect(svg.querySelectorAll('path').length).toBeGreaterThan(0);
});

it('uses theme variables with hex fallbacks', () => {
  // Check that theme tokens are used in PALETTE
  expect(PALETTE.g).toContain('var(--gold,');
  expect(PALETTE.p).toContain('var(--key,');
  expect(PALETTE.s).toContain('var(--shard,');
  expect(PALETTE.e).toContain('var(--good,');
  expect(PALETTE.r).toContain('var(--bad,');
  expect(PALETTE.v).toContain('var(--rarity-epic,');
  expect(PALETTE.u).toContain('var(--rarity-rare,');
  expect(PALETTE.x).toContain('var(--rarity-common,');
  expect(PALETTE.t).toContain('var(--text,');
});
