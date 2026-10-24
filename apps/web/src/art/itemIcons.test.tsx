// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { v2 } from '@taskbar-hero/game-rules';
import { PALETTE } from './v2Icons';
import {
  ITEM_ICON_KEYS,
  ITEM_ICON_MAPS,
  itemIconKey,
  ItemPixelIcon,
} from './itemIcons';

afterEach(cleanup);

const EXPECTED_24_KEYS = [
  'arm.cozy.helmet',
  'arm.cozy.armor',
  'arm.cozy.gloves',
  'arm.cozy.boots',
  'arm.ranger.helmet',
  'arm.ranger.armor',
  'arm.ranger.gloves',
  'arm.ranger.boots',
  'arm.moon.helmet',
  'arm.moon.armor',
  'arm.moon.gloves',
  'arm.moon.boots',
  'acc.bell',
  'acc.ribbon',
  'acc.studded',
  'acc.fishhook',
  'acc.feather',
  'acc.pearl',
  'acc.paw',
  'acc.hunter',
  'acc.lucky',
  'acc.catnip',
  'acc.mouse',
  'acc.star',
] as const;

// 1. ITEM_ICON_KEYS equals the 24 keys above in order.
it('ITEM_ICON_KEYS equals the 24 keys in order', () => {
  expect(ITEM_ICON_KEYS).toEqual(EXPECTED_24_KEYS);
  expect(ITEM_ICON_KEYS).toHaveLength(24);
});

// 2. it.each key: rows have equal length; width and height between 10 and 12; every character is '.' or a PALETTE key; there is at least one 'k'; no row or column is fully transparent at the edges on all four sides at once (no wasted border: the bounding box of non-'.' pixels touches at least 3 of the 4 edges).
it.each(ITEM_ICON_KEYS)(
  'icon map %s is valid pixel art meeting all constraints',
  (key) => {
    const rows = ITEM_ICON_MAPS[key];
    const height = rows.length;
    expect(height).toBeGreaterThanOrEqual(10);
    expect(height).toBeLessThanOrEqual(12);

    const width = rows[0]?.length ?? 0;
    expect(width).toBeGreaterThanOrEqual(10);
    expect(width).toBeLessThanOrEqual(12);

    let hasK = false;
    for (const row of rows) {
      expect(row.length).toBe(width);
      for (const ch of row) {
        if (ch === '.') continue;
        if (ch === 'k') hasK = true;
        expect(PALETTE).toHaveProperty(ch);
      }
    }
    expect(hasK).toBe(true);

    const touchesTop = [...rows[0]!].some((ch) => ch !== '.');
    const touchesBottom = [...rows[rows.length - 1]!].some((ch) => ch !== '.');
    const touchesLeft = rows.some((row) => row[0] !== '.');
    const touchesRight = rows.some((row) => row[width - 1] !== '.');

    const touchedEdges = [touchesTop, touchesBottom, touchesLeft, touchesRight].filter(Boolean).length;
    expect(touchedEdges).toBeGreaterThanOrEqual(3);
  },
);

// 3. No two icons have identical maps.
it('no two icons have identical maps', () => {
  const serialized = new Map<string, string>();
  for (const key of ITEM_ICON_KEYS) {
    const content = ITEM_ICON_MAPS[key].join('\n');
    expect(serialized.has(content)).toBe(false);
    serialized.set(content, key);
  }
  expect(serialized.size).toBe(24);
});

// 4. Coverage: for every v2.ITEMS entry whose slot is not 'weapon', itemIconKey(item.id) is non-null and is a key of ITEM_ICON_MAPS; for every weapon item it is null. (import { v2 } from '@taskbar-hero/game-rules').
it('maps all non-weapon items in v2.ITEMS to valid keys and weapons to null', () => {
  for (const item of v2.ITEMS) {
    const iconKey = itemIconKey(item.id);
    if (item.slot === 'weapon') {
      expect(iconKey).toBeNull();
    } else {
      expect(iconKey).not.toBeNull();
      expect(ITEM_ICON_KEYS).toContain(iconKey);
    }
  }
});

// 5. itemIconKey('arm.cozy.helmet.rare') === 'arm.cozy.helmet'; itemIconKey('acc.ring.lucky.legendary') === 'acc.lucky'; itemIconKey('wpn.sword.twig') === null; itemIconKey('nonsense') === null.
it('correctly maps specific test item ids', () => {
  expect(itemIconKey('arm.cozy.helmet.rare')).toBe('arm.cozy.helmet');
  expect(itemIconKey('acc.ring.lucky.legendary')).toBe('acc.lucky');
  expect(itemIconKey('wpn.sword.twig')).toBeNull();
  expect(itemIconKey('nonsense')).toBeNull();
});

// 6. Rendering: <ItemPixelIcon itemKey="acc.collar.bell.common" size={3} /> renders an svg with data-icon="acc.bell", width = 3 x map width, aria-hidden; with title="Bell Collar" it has role img and the label; itemKey "wpn.sword.twig" renders nothing (container empty).
it('renders ItemPixelIcon with expected attributes and role', () => {
  const mapWidth = ITEM_ICON_MAPS['acc.bell'][0]!.length;
  const { container: decorContainer } = render(
    <ItemPixelIcon itemKey="acc.collar.bell.common" size={3} />,
  );
  const decorSvg = decorContainer.querySelector('svg')!;
  expect(decorSvg).toBeTruthy();
  expect(decorSvg.getAttribute('data-icon')).toBe('acc.bell');
  expect(decorSvg.getAttribute('width')).toBe(String(mapWidth * 3));
  expect(decorSvg.getAttribute('aria-hidden')).toBe('true');
  expect(decorSvg.getAttribute('role')).toBeNull();
  expect(decorSvg.querySelector('title')).toBeNull();
  cleanup();

  const { container: titledContainer } = render(
    <ItemPixelIcon
      itemKey="acc.collar.bell.common"
      size={3}
      title="Bell Collar"
    />,
  );
  const titledSvg = titledContainer.querySelector('svg')!;
  expect(titledSvg).toBeTruthy();
  expect(titledSvg.getAttribute('role')).toBe('img');
  expect(titledSvg.getAttribute('aria-label')).toBe('Bell Collar');
  expect(screen.getByRole('img', { name: 'Bell Collar' })).toBe(titledSvg);
  const titleEl = titledSvg.querySelector('title');
  expect(titleEl?.textContent).toBe('Bell Collar');
  cleanup();

  const { container: emptyContainer } = render(
    <ItemPixelIcon itemKey="wpn.sword.twig" />,
  );
  expect(emptyContainer.innerHTML).toBe('');
});
