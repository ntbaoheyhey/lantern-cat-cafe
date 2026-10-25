// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { GainsV2, ItemV2, LootV2 } from '../../api/GameApiV2';
import { LootSummary } from './LootSummary';

const EMPTY_LOOT: LootV2 = {
  fish: 0,
  yarn: 0,
  keys: 0,
  materials: {},
  items: [],
  autoSalvaged: [],
};

const SAMPLE_SWORD: ItemV2 = {
  id: 'sword-1',
  itemKey: 'wpn.sword.twig',
  slot: 'weapon',
  weaponType: 'sword',
  rarity: 'common',
  level: 3,
  bonus: [],
  locked: false,
  equipped: false,
};

describe('LootSummary', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders "+1,234 Fish" correctly', () => {
    const loot: LootV2 = {
      ...EMPTY_LOOT,
      fish: 1234,
    };

    render(<LootSummary loot={loot} heading="Battle Rewards" />);

    expect(screen.getByText('+1,234 Fish')).toBeTruthy();
  });

  it('renders an item tile with the item name from the registry', () => {
    const loot: LootV2 = {
      ...EMPTY_LOOT,
      items: [SAMPLE_SWORD],
    };

    render(<LootSummary loot={loot} heading="Equipment Found" />);

    // 'wpn.sword.twig' resolves to 'Twig Sword' in v2.ITEMS registry
    expect(screen.getByText('Twig Sword')).toBeTruthy();
    expect(screen.getByText('Common')).toBeTruthy();
    expect(screen.getByText('Lv 3')).toBeTruthy();
  });

  it('renders singular autoSalvaged note when exactly 1 item did not fit', () => {
    const loot: LootV2 = {
      ...EMPTY_LOOT,
      autoSalvaged: [
        {
          itemKey: 'hlm.leather.cap',
          slot: 'helmet',
          rarity: 'common',
          level: 1,
        },
      ],
    };

    render(<LootSummary loot={loot} heading="Rewards" />);

    expect(
      screen.getByText('1 item did not fit in your bag and was salvaged.'),
    ).toBeTruthy();
  });

  it('renders plural autoSalvaged note when multiple items did not fit', () => {
    const loot: LootV2 = {
      ...EMPTY_LOOT,
      autoSalvaged: [
        {
          itemKey: 'hlm.leather.cap',
          slot: 'helmet',
          rarity: 'common',
          level: 1,
        },
        {
          itemKey: 'arm.cozy.boots.common',
          slot: 'boots',
          rarity: 'common',
          level: 2,
        },
      ],
    };

    render(<LootSummary loot={loot} heading="Rewards" />);

    expect(
      screen.getByText('2 items did not fit in your bag and were salvaged.'),
    ).toBeTruthy();
  });

  it('renders "Level up!" only when levelsGained > 0', () => {
    const gainsNoLevel: GainsV2 = {
      ...EMPTY_LOOT,
      fish: 50,
      xp: 200,
      levelsGained: 0,
    };

    const { rerender } = render(<LootSummary loot={gainsNoLevel} heading="Claim Gains" />);

    expect(screen.queryByText(/Level up!/)).toBeNull();
    expect(screen.getByText('+200 XP')).toBeTruthy();

    const gainsWithLevel: GainsV2 = {
      ...EMPTY_LOOT,
      fish: 50,
      xp: 450,
      levelsGained: 2,
    };

    rerender(<LootSummary loot={gainsWithLevel} heading="Claim Gains" />);

    expect(screen.getByText('Level up! +2')).toBeTruthy();
    expect(screen.getByText('+450 XP')).toBeTruthy();
  });

  it('renders empty loot text when nothing was received', () => {
    render(<LootSummary loot={EMPTY_LOOT} heading="Empty Chest" />);

    expect(screen.getByText('Nothing new this time.')).toBeTruthy();
  });

  it('supports headingLevel 3 and links section via aria-labelledby', () => {
    const { container } = render(<LootSummary loot={EMPTY_LOOT} heading="Small Loot" headingLevel={3} />);

    const heading = screen.getByRole('heading', { level: 3, name: 'Small Loot' });
    expect(heading).toBeTruthy();

    const section = container.querySelector('section');
    expect(section).toBeTruthy();
    expect(section?.getAttribute('aria-labelledby')).toBe(heading.id);
  });

  it('renders specific item icons for armor, accessory, and weapon with aria-hidden', () => {
    const armorItem: ItemV2 = {
      id: 'armor-1',
      itemKey: 'arm.ranger.armor.rare',
      slot: 'armor',
      rarity: 'rare',
      level: 5,
      bonus: [],
      locked: false,
      equipped: false,
    };
    const accessoryItem: ItemV2 = {
      id: 'acc-1',
      itemKey: 'acc.charm.star.epic',
      slot: 'charm',
      rarity: 'epic',
      level: 8,
      bonus: [],
      locked: false,
      equipped: false,
    };
    const weaponItem: ItemV2 = {
      id: 'weapon-1',
      itemKey: 'wpn.sword.twig',
      slot: 'weapon',
      weaponType: 'sword',
      rarity: 'common',
      level: 3,
      bonus: [],
      locked: false,
      equipped: false,
    };

    const loot: LootV2 = {
      ...EMPTY_LOOT,
      items: [armorItem, accessoryItem, weaponItem],
    };

    const { container } = render(<LootSummary loot={loot} heading="Specific Items" />);

    // Armor-set item renders data-icon "arm.ranger.armor"
    const armorSvg = container.querySelector('svg[data-icon="arm.ranger.armor"]');
    expect(armorSvg).toBeTruthy();
    expect(armorSvg?.getAttribute('aria-hidden')).toBe('true');

    // Accessory renders data-icon "acc.star"
    const accSvg = container.querySelector('svg[data-icon="acc.star"]');
    expect(accSvg).toBeTruthy();
    expect(accSvg?.getAttribute('aria-hidden')).toBe('true');

    // Weapon renders data-icon "sword"
    const weaponSvg = container.querySelector('svg[data-icon="sword"]');
    expect(weaponSvg).toBeTruthy();
    expect(weaponSvg?.getAttribute('aria-hidden')).toBe('true');

    // Every item icon is aria-hidden
    const itemIcons = container.querySelectorAll('.loot-item-art-icon svg');
    expect(itemIcons).toHaveLength(3);
    itemIcons.forEach((svg) => {
      expect(svg.getAttribute('aria-hidden')).toBe('true');
    });

    // Accessible names / text content of the list items are unchanged from before
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(3);
    expect(listItems[0]?.textContent).toContain('Pathfinder Ranger Vest');
    expect(listItems[0]?.textContent).toContain('Rare · Lv 5');
    expect(listItems[1]?.textContent).toContain('Star Charm');
    expect(listItems[1]?.textContent).toContain('Epic · Lv 8');
    expect(listItems[2]?.textContent).toContain('Twig Sword');
    expect(listItems[2]?.textContent).toContain('Common · Lv 3');
  });
});
