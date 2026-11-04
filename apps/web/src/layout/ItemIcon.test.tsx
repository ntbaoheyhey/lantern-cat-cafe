// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ItemIcon } from './ItemIcon';
import { itemArtOf } from './itemView';

afterEach(cleanup);

describe('ItemIcon', () => {
  it('renders specific icon for armor item arm.ranger.armor.rare', () => {
    const { container } = render(
      <ItemIcon item={{ itemKey: 'arm.ranger.armor.rare', slot: 'armor' }} />,
    );
    const svg = container.querySelector('img');
    expect(svg?.getAttribute('data-icon')).toBe('arm.ranger.armor');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders specific icon for accessory acc.charm.star.epic', () => {
    const { container } = render(
      <ItemIcon item={{ itemKey: 'acc.charm.star.epic', slot: 'charm' }} />,
    );
    const svg = container.querySelector('img');
    expect(svg?.getAttribute('data-icon')).toBe('acc.star');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders weapon-type icon for weapon wpn.sword.twig', () => {
    const { container } = render(
      <ItemIcon item={{ itemKey: 'wpn.sword.twig', slot: 'weapon', weaponType: 'sword' }} />,
    );
    const svg = container.querySelector('img');
    expect(svg?.getAttribute('data-icon')).toBe('sword');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('passes size and title props correctly', () => {
    const { container } = render(
      <ItemIcon
        item={{ itemKey: 'arm.ranger.armor.rare', slot: 'armor' }}
        size={4}
        title="Ranger Armor"
      />
    );
    const svg = container.querySelector('img');
    expect(svg?.tagName).toBe('IMG');
    expect(svg?.getAttribute('alt')).toBe('Ranger Armor');
    expect(svg?.getAttribute('title')).toBe('Ranger Armor');
    expect(svg?.getAttribute('width')).toBe(String(16 * 4));
  });

  it('falls back to slot icon when item has no specific icon', () => {
    const { container } = render(
      <ItemIcon item={{ itemKey: 'custom.unknown.item', slot: 'ring' }} />,
    );
    const svg = container.querySelector('img');
    expect(svg?.getAttribute('data-icon')).toBe('slotRing');
  });
});

describe('itemArtOf', () => {
  it('returns kind: item for known armor piece', () => {
    expect(itemArtOf({ itemKey: 'arm.cozy.boots.common', slot: 'boots' })).toEqual({
      kind: 'item',
      key: 'arm.cozy.boots',
    });
  });

  it('returns kind: item for known accessory', () => {
    expect(itemArtOf({ itemKey: 'acc.collar.bell.common', slot: 'collar' })).toEqual({
      kind: 'item',
      key: 'acc.bell',
    });
  });

  it('returns kind: icon for weapon', () => {
    expect(itemArtOf({ itemKey: 'wpn.hammer.cork', slot: 'weapon', weaponType: 'hammer' })).toEqual({
      kind: 'icon',
      name: 'hammer',
    });
  });

  it('returns kind: icon for unknown item fallback', () => {
    expect(itemArtOf({ itemKey: 'unknown.item', slot: 'helmet' })).toEqual({
      kind: 'icon',
      name: 'slotHelmet',
    });
  });
});
