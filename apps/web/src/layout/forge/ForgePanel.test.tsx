// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ItemV2 } from '../../api/GameApiV2';
import type { RelicVoucher, TodayRelic } from '@taskbar-hero/api-contract';
import { ForgePanel, type ForgePanelProps } from './ForgePanel';

const RICH_STACKS = {
  yarn: 10_000,
  fluffTuft: 10_000,
  shinyButton: 1_000,
  catnipCrystal: 1_000,
  starlightScale: 100,
  moonPearl: 50,
  fish: 100_000,
};

const SAMPLE_ITEMS: ItemV2[] = [
  {
    id: 'item-equipped',
    itemKey: 'wpn.sword.twig',
    slot: 'weapon',
    weaponType: 'sword',
    rarity: 'common',
    level: 1,
    bonus: [],
    locked: false,
    equipped: true,
  },
  {
    id: 'item-locked',
    itemKey: 'hlm.leather.cap',
    slot: 'helmet',
    rarity: 'common',
    level: 1,
    bonus: [],
    locked: true,
    equipped: false,
  },
  {
    id: 'item-both',
    itemKey: 'arm.leather.tunic',
    slot: 'armor',
    rarity: 'uncommon',
    level: 5,
    bonus: [],
    locked: true,
    equipped: true,
  },
  {
    id: 'item-free-1',
    itemKey: 'glv.cloth.mitts',
    slot: 'gloves',
    rarity: 'common',
    level: 2,
    bonus: [],
    locked: false,
    equipped: false,
  },
  {
    id: 'item-free-2',
    itemKey: 'bts.cloth.shoes',
    slot: 'boots',
    rarity: 'rare',
    level: 10,
    bonus: [],
    locked: false,
    equipped: false,
  },
];

function createDefaultProps(overrides?: Partial<ForgePanelProps>): ForgePanelProps {
  return {
    stacks: { ...RICH_STACKS },
    items: [...SAMPLE_ITEMS],
    relic: {
      today: null,
      pending: null,
      blockedReason: null,
    },
    classWeaponType: 'bow',
    onCraft: vi.fn(),
    onSalvage: vi.fn(),
    onRelic: vi.fn(),
    ...overrides,
  };
}

describe('ForgePanel', () => {
  afterEach(() => {
    cleanup();
  });

  describe('Craft Tab: disabled reasons for each missing material', () => {
    it('shows exact missing amount for Yarn (rcp.common needs 10 Yarn)', () => {
      const props = createDefaultProps({
        stacks: { yarn: 3, fluffTuft: 10, fish: 100 },
      });
      render(<ForgePanel {...props} />);

      const craftBtn = screen.getByTestId('craft-btn') as HTMLButtonElement;
      expect(craftBtn.disabled).toBe(true);
      expect(craftBtn.textContent).toContain('Needs 7 more Yarn');

      const blockReason = screen.getByTestId('craft-block-reason');
      expect(blockReason.textContent).toContain('Needs 7 more Yarn');
    });

    it('shows exact missing amount for Fluff Tuft (rcp.common needs 4 Fluff Tuft)', () => {
      const props = createDefaultProps({
        stacks: { yarn: 15, fluffTuft: 1, fish: 100 },
      });
      render(<ForgePanel {...props} />);

      const craftBtn = screen.getByTestId('craft-btn') as HTMLButtonElement;
      expect(craftBtn.disabled).toBe(true);
      expect(craftBtn.textContent).toContain('Needs 3 more Fluff Tuft');
    });

    it('shows exact missing amount for Fish (rcp.common needs 50 Fish)', () => {
      const props = createDefaultProps({
        stacks: { yarn: 20, fluffTuft: 10, fish: 35 },
      });
      render(<ForgePanel {...props} />);

      const craftBtn = screen.getByTestId('craft-btn') as HTMLButtonElement;
      expect(craftBtn.disabled).toBe(true);
      expect(craftBtn.textContent).toContain('Needs 15 more Fish');
    });

    it('shows exact missing amount for Shiny Button on Uncommon recipe (needs 1)', () => {
      const props = createDefaultProps({
        stacks: { yarn: 50, fluffTuft: 20, shinyButton: 0, fish: 500 },
      });
      render(<ForgePanel {...props} />);

      // Switch to Uncommon
      fireEvent.click(screen.getByTestId('rarity-uncommon'));

      const craftBtn = screen.getByTestId('craft-btn') as HTMLButtonElement;
      expect(craftBtn.disabled).toBe(true);
      expect(craftBtn.textContent).toContain('Needs 1 more Shiny Button');
    });

    it('shows exact missing amount for Catnip Crystal on Epic recipe (needs 3)', () => {
      const props = createDefaultProps({
        stacks: { yarn: 500, shinyButton: 20, catnipCrystal: 1, fish: 5000 },
      });
      render(<ForgePanel {...props} />);

      // Switch to Epic
      fireEvent.click(screen.getByTestId('rarity-epic'));

      const craftBtn = screen.getByTestId('craft-btn') as HTMLButtonElement;
      expect(craftBtn.disabled).toBe(true);
      expect(craftBtn.textContent).toContain('Needs 2 more Catnip Crystal');
    });

    it('shows exact missing amount for Starlight Scale on Legendary recipe (needs 2)', () => {
      const props = createDefaultProps({
        stacks: { yarn: 1000, catnipCrystal: 10, starlightScale: 0, fish: 10000 },
      });
      render(<ForgePanel {...props} />);

      // Switch to Legendary
      fireEvent.click(screen.getByTestId('rarity-legendary'));

      const craftBtn = screen.getByTestId('craft-btn') as HTMLButtonElement;
      expect(craftBtn.disabled).toBe(true);
      expect(craftBtn.textContent).toContain('Needs 2 more Starlight Scale');
    });
  });

  describe('Craft Tab: slot selection and onCraft called with right ids', () => {
    it('calls onCraft with right recipeId and slot after confirmation', async () => {
      const onCraft = vi.fn();
      const props = createDefaultProps({ onCraft, classWeaponType: 'sword' });
      render(<ForgePanel {...props} />);

      // Default is Common + Weapon
      const craftBtn = screen.getByTestId('craft-btn') as HTMLButtonElement;
      expect(craftBtn.disabled).toBe(false);
      expect(craftBtn.textContent).toContain('Craft Common Weapon');

      // Click to start confirmation
      fireEvent.click(craftBtn);
      expect(onCraft).not.toHaveBeenCalled();

      // Confirm box is shown
      const confirmBox = screen.getByTestId('craft-confirm-box');
      expect(confirmBox).toBeTruthy();

      // Click Confirm Craft
      fireEvent.click(screen.getByTestId('craft-confirm-btn'));
      expect(onCraft).toHaveBeenCalledTimes(1);
      expect(onCraft).toHaveBeenCalledWith('rcp.common', 'weapon');
    });

    it('updates weapon type based on classWeaponType prop', () => {
      const props = createDefaultProps({ classWeaponType: 'flasks' });
      render(<ForgePanel {...props} />);

      const weaponSlotBtn = screen.getByTestId('slot-weapon');
      expect(weaponSlotBtn.textContent).toContain('Weapon (Flasks)');
    });

    it('switches slot to boots and rarity to rare and calls onCraft with right ids', () => {
      const onCraft = vi.fn();
      const props = createDefaultProps({ onCraft });
      render(<ForgePanel {...props} />);

      fireEvent.click(screen.getByTestId('slot-boots'));
      fireEvent.click(screen.getByTestId('rarity-rare'));

      const craftBtn = screen.getByTestId('craft-btn') as HTMLButtonElement;
      expect(craftBtn.textContent).toContain('Craft Rare Boots');

      fireEvent.click(craftBtn);
      fireEvent.click(screen.getByTestId('craft-confirm-btn'));

      expect(onCraft).toHaveBeenCalledWith('rcp.rare', 'boots');
    });

    it('resets craft confirmation if slot or rarity is changed', () => {
      const onCraft = vi.fn();
      const props = createDefaultProps({ onCraft });
      render(<ForgePanel {...props} />);

      fireEvent.click(screen.getByTestId('craft-btn'));
      expect(screen.getByTestId('craft-confirm-box')).toBeTruthy();

      // Change slot
      fireEvent.click(screen.getByTestId('slot-helmet'));
      expect(screen.queryByTestId('craft-confirm-box')).toBeNull();
      expect(screen.getByTestId('craft-btn')).toBeTruthy();

      // Start confirm again, then change rarity
      fireEvent.click(screen.getByTestId('craft-btn'));
      expect(screen.getByTestId('craft-confirm-box')).toBeTruthy();
      fireEvent.click(screen.getByTestId('rarity-uncommon'));
      expect(screen.queryByTestId('craft-confirm-box')).toBeNull();
      expect(screen.getByTestId('craft-btn')).toBeTruthy();
    });
  });

  describe('Salvage Tab: excludes equipped and locked items', () => {
    it('disables equipped and locked items with plain reason and excludes from selection', () => {
      const onSalvage = vi.fn();
      const props = createDefaultProps({ onSalvage });
      render(<ForgePanel {...props} />);

      // Switch to Salvage tab
      fireEvent.click(screen.getByTestId('tab-salvage'));

      // Check item 1 (equipped)
      const checkEquipped = screen.getByTestId('salvage-check-item-equipped') as HTMLInputElement;
      expect(checkEquipped.disabled).toBe(true);
      expect(screen.getByTestId('disabled-reason-item-equipped').textContent).toContain('Equipped');

      // Check item 2 (locked)
      const checkLocked = screen.getByTestId('salvage-check-item-locked') as HTMLInputElement;
      expect(checkLocked.disabled).toBe(true);
      expect(screen.getByTestId('disabled-reason-item-locked').textContent).toContain('Locked');

      // Check item 3 (both)
      const checkBoth = screen.getByTestId('salvage-check-item-both') as HTMLInputElement;
      expect(checkBoth.disabled).toBe(true);

      // Check eligible items
      const checkFree1 = screen.getByTestId('salvage-check-item-free-1') as HTMLInputElement;
      const checkFree2 = screen.getByTestId('salvage-check-item-free-2') as HTMLInputElement;
      expect(checkFree1.disabled).toBe(false);
      expect(checkFree2.disabled).toBe(false);

      // Click Select All Eligible
      fireEvent.click(screen.getByTestId('salvage-select-all'));
      expect(checkFree1.checked).toBe(true);
      expect(checkFree2.checked).toBe(true);
      expect(checkEquipped.checked).toBe(false);
      expect(checkLocked.checked).toBe(false);

      // Salvage button shows count 2
      const salvageBtn = screen.getByTestId('salvage-btn') as HTMLButtonElement;
      expect(salvageBtn.textContent).toContain('Salvage (2)');

      // Confirm step
      fireEvent.click(salvageBtn);
      expect(onSalvage).not.toHaveBeenCalled();

      fireEvent.click(screen.getByTestId('salvage-confirm-btn'));
      expect(onSalvage).toHaveBeenCalledTimes(1);
      expect(onSalvage).toHaveBeenCalledWith(['item-free-1', 'item-free-2']);
    });

    it('toggles individual items and deselect all button clears selection', () => {
      const props = createDefaultProps();
      render(<ForgePanel {...props} />);
      fireEvent.click(screen.getByTestId('tab-salvage'));

      const checkFree1 = screen.getByTestId('salvage-check-item-free-1') as HTMLInputElement;
      const checkFree2 = screen.getByTestId('salvage-check-item-free-2') as HTMLInputElement;

      fireEvent.click(checkFree1);
      expect(checkFree1.checked).toBe(true);
      expect(screen.getByTestId('salvage-btn').textContent).toContain('Salvage (1)');

      fireEvent.click(checkFree2);
      expect(checkFree2.checked).toBe(true);
      expect(screen.getByTestId('salvage-btn').textContent).toContain('Salvage (2)');

      // Toggle off item 1
      fireEvent.click(checkFree1);
      expect(checkFree1.checked).toBe(false);
      expect(screen.getByTestId('salvage-btn').textContent).toContain('Salvage (1)');

      // Deselect all
      fireEvent.click(screen.getByTestId('salvage-deselect-all'));
      expect(checkFree2.checked).toBe(false);
      const salvageBtn = screen.getByTestId('salvage-btn') as HTMLButtonElement;
      expect(salvageBtn.disabled).toBe(true);
      expect(salvageBtn.textContent).toContain('Select items to salvage');
    });

    it('shows empty message when no items are present', () => {
      const props = createDefaultProps({ items: [] });
      render(<ForgePanel {...props} />);
      fireEvent.click(screen.getByTestId('tab-salvage'));
      expect(screen.getByText('No items in inventory.')).toBeTruthy();
    });
  });

  describe('Relic Tab: blocked reasons in plain words and pending voucher', () => {
    it('shows daily limit blocked reason', () => {
      const props = createDefaultProps({
        relic: {
          today: null,
          pending: null,
          blockedReason: 'daily_limit',
        },
      });
      render(<ForgePanel {...props} />);
      fireEvent.click(screen.getByTestId('tab-relic'));

      expect(screen.getByTestId('relic-blocked-reason').textContent).toMatch(/daily limit/i);
      const relicBtn = screen.getByTestId('relic-forge-btn') as HTMLButtonElement;
      expect(relicBtn.disabled).toBe(true);
      expect(relicBtn.textContent).toMatch(/daily limit/i);
    });

    it('shows not enough yarn blocked reason', () => {
      const props = createDefaultProps({
        stacks: { yarn: 12, moonPearl: 5 },
        relic: {
          today: null,
          pending: null,
          blockedReason: 'not_enough_yarn',
        },
      });
      render(<ForgePanel {...props} />);
      fireEvent.click(screen.getByTestId('tab-relic'));

      expect(screen.getByTestId('relic-blocked-reason').textContent).toMatch(/not enough yarn/i);
      const relicBtn = screen.getByTestId('relic-forge-btn') as HTMLButtonElement;
      expect(relicBtn.disabled).toBe(true);
      expect(relicBtn.textContent).toMatch(/not enough yarn/i);
    });

    it('shows no moon pearl blocked reason', () => {
      const props = createDefaultProps({
        stacks: { yarn: 50, moonPearl: 0 },
        relic: {
          today: null,
          pending: null,
          blockedReason: 'no_moon_pearl',
        },
      });
      render(<ForgePanel {...props} />);
      fireEvent.click(screen.getByTestId('tab-relic'));

      expect(screen.getByTestId('relic-blocked-reason').textContent).toMatch(/no moon pearl/i);
      const relicBtn = screen.getByTestId('relic-forge-btn') as HTMLButtonElement;
      expect(relicBtn.disabled).toBe(true);
      expect(relicBtn.textContent).toMatch(/no moon pearl/i);
    });

    it('shows today relic card when today is present and not pending', () => {
      const today: TodayRelic = {
        relicId: '101',
        rarityName: 'common',
        minted: false,
        txHash: null,
      };
      const props = createDefaultProps({
        relic: {
          today,
          pending: null,
          blockedReason: 'daily_limit',
        },
      });
      render(<ForgePanel {...props} />);
      fireEvent.click(screen.getByTestId('tab-relic'));

      expect(screen.getByTestId('forge-today')).toBeTruthy();
      expect(screen.getByTestId('forge-today-status')).toBeTruthy();
    });

    it('shows pending voucher state when unminted voucher exists', () => {
      const pendingVoucher: RelicVoucher = {
        player: '0x1234567890123456789012345678901234567890',
        relicId: '42',
        rarity: 2,
        rarityName: 'rare',
        nonce: '1',
        expiry: 9999999999,
        signature: '0xabc' as `0x${string}`,
      };
      const props = createDefaultProps({
        relic: {
          today: null,
          pending: pendingVoucher,
          blockedReason: null,
        },
      });
      render(<ForgePanel {...props} />);
      fireEvent.click(screen.getByTestId('tab-relic'));

      const pendingBox = screen.getByTestId('forge-pending');
      expect(pendingBox).toBeTruthy();
      expect(pendingBox.textContent).toMatch(/unminted/i);
      expect(pendingBox.textContent).toMatch(/rare/i);
    });
  });

  describe('Confirm step required before any callback', () => {
    it('Craft tab requires confirm step; cancel does not invoke callback', () => {
      const onCraft = vi.fn();
      const props = createDefaultProps({ onCraft });
      render(<ForgePanel {...props} />);

      // Click Craft
      fireEvent.click(screen.getByTestId('craft-btn'));
      expect(onCraft).not.toHaveBeenCalled();

      // Click Cancel
      fireEvent.click(screen.getByTestId('craft-cancel-btn'));
      expect(onCraft).not.toHaveBeenCalled();
      expect(screen.queryByTestId('craft-confirm-box')).toBeNull();
      expect(screen.getByTestId('craft-btn')).toBeTruthy();
    });

    it('Salvage tab requires confirm step; cancel does not invoke callback', () => {
      const onSalvage = vi.fn();
      const props = createDefaultProps({ onSalvage });
      render(<ForgePanel {...props} />);
      fireEvent.click(screen.getByTestId('tab-salvage'));

      // Select an eligible item
      fireEvent.click(screen.getByTestId('salvage-check-item-free-1'));

      // Click Salvage
      fireEvent.click(screen.getByTestId('salvage-btn'));
      expect(onSalvage).not.toHaveBeenCalled();

      // Click Cancel
      fireEvent.click(screen.getByTestId('salvage-cancel-btn'));
      expect(onSalvage).not.toHaveBeenCalled();
      expect(screen.queryByTestId('salvage-confirm-box')).toBeNull();
      expect(screen.getByTestId('salvage-btn')).toBeTruthy();
    });

    it('Relic tab requires confirm step; cancel does not invoke callback', () => {
      const onRelic = vi.fn();
      const props = createDefaultProps({ onRelic });
      render(<ForgePanel {...props} />);
      fireEvent.click(screen.getByTestId('tab-relic'));

      // Click Forge Relic
      fireEvent.click(screen.getByTestId('relic-forge-btn'));
      expect(onRelic).not.toHaveBeenCalled();

      // Click Cancel
      fireEvent.click(screen.getByTestId('relic-cancel-btn'));
      expect(onRelic).not.toHaveBeenCalled();
      expect(screen.queryByTestId('relic-confirm-box')).toBeNull();
      expect(screen.getByTestId('relic-forge-btn')).toBeTruthy();

      // Click Forge Relic and Confirm
      fireEvent.click(screen.getByTestId('relic-forge-btn'));
      fireEvent.click(screen.getByTestId('relic-confirm-btn'));
      expect(onRelic).toHaveBeenCalledTimes(1);
    });
  });
});
