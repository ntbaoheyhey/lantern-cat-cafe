import { useState, useId, useEffect, type ReactNode } from 'react';
import type {
  GearSlotId,
  ItemV2,
  RecipeId,
  WeaponType,
  ForgeBlockV2,
} from '../../api/GameApiV2';
import type { PendingRelicVoucher, TodayRelic } from '@taskbar-hero/api-contract';
import { v2 } from '@taskbar-hero/game-rules';
import { PixelIcon } from '../../art/pixelIcons';
import { V2PixelIcon, type V2IconName } from '../../art/v2Icons';
import { V2PixelFrame, type V2FrameName } from '../../art/v2Frames';
import { ItemIcon } from '../ItemIcon';
import { TodayRelicCard } from '../../forge/TodayRelicCard';
import { relicName, capitalize, oddsRows, RELIC_WAITING_TEXT } from '../../forge/forgeText';
import { relicImageUrl } from '../../market/marketText';
import { LABELS } from '../../theme/labels';
import {
  getCraftBlockReason,
  getRelicBlockReason,
  getSalvageBlockReason,
} from '../../v2text/blockReasons';
import { ActionNotice } from '../notice/ActionNotice';
import './ForgePanel.css';

export interface ForgePanelRelic {
  today: TodayRelic | null;
  pending: PendingRelicVoucher | null;
  blockedReason: ForgeBlockV2 | null;
}

export interface ForgePanelProps {
  stacks: Partial<Record<v2.MaterialId | 'fish', number>>;
  items: ItemV2[];
  relic: ForgePanelRelic;
  classWeaponType: WeaponType;
  busy?: string | null;
  onCraft: (recipeId: RecipeId, slot: GearSlotId) => void | Promise<void>;
  onSalvage: (itemIds: string[]) => void | Promise<void>;
  onRelic: () => void | Promise<void>;
  defaultTab?: ForgeTabId;
  defaultSlot?: GearSlotId;
  defaultRarity?: v2.GearRarityId;
  defaultSelectedItems?: string[];
  defaultConfirm?: boolean;
  craftResult?: ReactNode;
  relicFooter?: ReactNode;
}

export type ForgeTabId = 'craft' | 'salvage' | 'relic';

const MAIN_SLOTS: readonly GearSlotId[] = ['weapon', 'helmet', 'armor', 'gloves', 'boots'];
const GEAR_RARITIES: readonly v2.GearRarityId[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const COST_ORDER = ['yarn', 'fluffTuft', 'shinyButton', 'catnipCrystal', 'starlightScale', 'moonPearl'] as const;

function MaterialOrCurrencyIcon({
  id,
  size = 3,
  title,
}: {
  id: string;
  size?: number;
  title?: string;
}) {
  if (id === 'yarn' || id === 'fish') {
    return <PixelIcon name={id} size={size} title={title} />;
  }
  return <V2PixelIcon name={id as V2IconName} size={size} title={title} />;
}

function getSlotIconName(slot: GearSlotId, classWeaponType: WeaponType): V2IconName {
  if (slot === 'weapon') return classWeaponType as V2IconName;
  if (slot === 'helmet') return 'slotHelmet';
  if (slot === 'armor') return 'slotArmor';
  if (slot === 'gloves') return 'slotGloves';
  if (slot === 'boots') return 'slotBoots';
  if (slot === 'collar') return 'slotCollar';
  if (slot === 'earring') return 'slotEarring';
  if (slot === 'ring') return 'slotRing';
  return 'slotCharm';
}

function formatYieldSummary(materials: v2.MaterialCost): string {
  const parts: string[] = [];
  for (const id of COST_ORDER) {
    const amt = materials[id];
    if (amt && amt > 0) {
      const def = v2.MATERIALS.find((m) => m.id === id);
      const name = def ? def.name : id;
      parts.push(`+${amt} ${name}`);
    }
  }
  return parts.join(', ');
}

export function ForgePanel({
  stacks,
  items,
  relic,
  classWeaponType,
  busy,
  onCraft,
  onSalvage,
  onRelic,
  defaultTab = 'craft',
  defaultSlot = 'weapon',
  defaultRarity = 'common',
  defaultSelectedItems = [],
  defaultConfirm = false,
  craftResult,
  relicFooter,
}: ForgePanelProps) {
  const panelId = useId();
  const [activeTab, setActiveTab] = useState<ForgeTabId>(defaultTab);

  // Craft tab state
  const [selectedSlot, setSelectedSlot] = useState<GearSlotId>(defaultSlot);
  const [selectedRarity, setSelectedRarity] = useState<v2.GearRarityId>(defaultRarity);
  const [confirmCraft, setConfirmCraft] = useState(defaultConfirm && defaultTab === 'craft');

  // Salvage tab state
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set(defaultSelectedItems));
  const [confirmSalvage, setConfirmSalvage] = useState(defaultConfirm && defaultTab === 'salvage');

  // Relic tab state
  const [confirmRelic, setConfirmRelic] = useState(defaultConfirm && defaultTab === 'relic');

  // Reveal flash state
  const [isRevealing, setIsRevealing] = useState(false);
  useEffect(() => {
    if (craftResult) {
      setIsRevealing(true);
      const timer = setTimeout(() => setIsRevealing(false), 600);
      return () => clearTimeout(timer);
    }
  }, [craftResult]);

  // Craft calculations
  const recipeId: RecipeId = `rcp.${selectedRarity}`;
  const recipe = v2.RECIPES.find((r) => r.id === recipeId) ?? v2.RECIPES[0]!;
  const rarityDef = v2.GEAR_RARITIES.find((r) => r.id === selectedRarity) ?? v2.GEAR_RARITIES[0]!;

  const craftBlockReason = v2.craftBlock({ stacks, lastRelicDay: 0 }, recipeId, selectedSlot);
  let disabledCraftReason: string | null = null;
  if (craftBlockReason) {
    if (craftBlockReason.startsWith('not_enough_')) {
      const missingId = craftBlockReason.replace('not_enough_', '') as v2.MaterialId | 'fish';
      const requiredAmt = missingId === 'fish' ? recipe.fish : recipe.materials[missingId] ?? 0;
      const currentAmt = stacks[missingId] ?? 0;
      disabledCraftReason = getCraftBlockReason(craftBlockReason, {
        materialName: missingId === 'fish' ? 'Fish' : v2.MATERIALS.find((m) => m.id === missingId)?.name ?? missingId,
        missing: Math.max(0, requiredAmt - currentAmt),
        tierName: capitalize(selectedRarity),
      });
    } else {
      disabledCraftReason = getCraftBlockReason(craftBlockReason, {
        tierName: capitalize(selectedRarity),
      });
    }
  }

  const slotLabel =
    selectedSlot === 'weapon'
      ? `Weapon (${capitalize(classWeaponType)})`
      : capitalize(selectedSlot);

  const isBusyCraft = busy === 'craft';
  const isBusySalvage = busy === 'salvage';
  const isBusyRelic = busy === 'forgeRelic';
  const isLoopBusy = Boolean(busy);
  const anyRecipeAffordable = MAIN_SLOTS.some((s) =>
    GEAR_RARITIES.some((r) => !v2.craftBlock({ stacks, lastRelicDay: 0 }, `rcp.${r}`, s))
  );

  // Salvage calculations
  const eligibleItems = items.filter((item) => !item.equipped && !item.locked && item.source !== 'starter');
  const salvageIds = new Set(eligibleItems.filter(item => selectedItemIds.has(item.id)).map(item => item.id));
  const salvageYieldTotals: v2.MaterialCost = {};
  for (const id of salvageIds) {
    const item = items.find((i) => i.id === id);
    if (item && !item.equipped && !item.locked && item.source !== 'starter') {
      const y = v2.salvage(item);
      for (const [matKey, amt] of Object.entries(y) as [v2.MaterialId, number][]) {
        salvageYieldTotals[matKey] = (salvageYieldTotals[matKey] ?? 0) + amt;
      }
    }
  }

  const toggleItem = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllEligible = () => {
    setSelectedItemIds(new Set(eligibleItems.map((i) => i.id)));
  };

  const deselectAll = () => {
    setSelectedItemIds(new Set());
  };

  // Relic calculations
  const relicBlockedReason = relic.pending ? null : relic.blockedReason;
  let relicBlockedText: string | null = null;
  let relicButtonText = 'Forge Relic';
  if (relicBlockedReason === 'daily_limit') {
    relicBlockedText = getRelicBlockReason('daily_limit');
    relicButtonText = 'Daily limit reached';
  } else if (relicBlockedReason === 'not_enough_yarn') {
    relicBlockedText = getRelicBlockReason('not_enough_yarn', { yarnHeld: stacks.yarn ?? 0 });
    relicButtonText = 'Not enough Yarn';
  } else if (relicBlockedReason === 'no_moon_pearl') {
    relicBlockedText = getRelicBlockReason('no_moon_pearl', { pearlsHeld: stacks.moonPearl ?? 0 });
    relicButtonText = 'No Moon Pearl';
  }

  const salvageBlockReason = getSalvageBlockReason({
    selectedCount: salvageIds.size,
    eligibleCount: eligibleItems.length,
    isBusy: isBusySalvage,
  });

  const handleCraftConfirm = async () => {
    setConfirmCraft(false);
    await onCraft(recipeId, selectedSlot);
  };

  const handleSalvageConfirm = async () => {
    setConfirmSalvage(false);
    await onSalvage(Array.from(salvageIds));
  };

  const handleRelicConfirm = async () => {
    setConfirmRelic(false);
    await onRelic();
  };

  return (
    <div className="forge-panel" data-testid="forge-panel">
      {/* Tab Navigation */}
      <nav className="forge-panel-header" aria-label="Forge Modes" role="tablist">
        <button
          type="button"
          role="tab"
          id={`${panelId}-tab-craft`}
          aria-selected={activeTab === 'craft'}
          aria-controls={`${panelId}-panel-craft`}
          className="forge-tab-btn"
          data-testid="tab-craft"
          onClick={() => {
            setActiveTab('craft');
            setConfirmCraft(false);
          }}
        >
          Craft
        </button>
        <button
          type="button"
          role="tab"
          id={`${panelId}-tab-salvage`}
          aria-selected={activeTab === 'salvage'}
          aria-controls={`${panelId}-panel-salvage`}
          className="forge-tab-btn"
          data-testid="tab-salvage"
          onClick={() => {
            setActiveTab('salvage');
            setConfirmSalvage(false);
          }}
        >
          Salvage
        </button>
        <button
          type="button"
          role="tab"
          id={`${panelId}-tab-relic`}
          aria-selected={activeTab === 'relic'}
          aria-controls={`${panelId}-panel-relic`}
          className="forge-tab-btn"
          data-testid="tab-relic"
          onClick={() => {
            setActiveTab('relic');
            setConfirmRelic(false);
          }}
        >
          Relic
        </button>
      </nav>

      {/* CRAFT TAB (Desktop 3-Column: Left gear picker, centre preview with result reveal, right materials & chances) */}
      {activeTab === 'craft' && (
        <section
          role="tabpanel"
          id={`${panelId}-panel-craft`}
          aria-labelledby={`${panelId}-tab-craft`}
          className="forge-content forge-craft-tab"
          data-testid="craft-panel"
        >
          <div className="forge-craft-scroll">
            <div className="forge-cols">
              {/* Left Column: 1 · Pick gear */}
              <div className="forge-col-left">
                <div className="forge-card">
                  <h3 className="forge-section-title">1 · Pick gear</h3>
                  <div className="forge-selector-group">
                    <span className="forge-selector-label" id={`${panelId}-slot-label`}>
                      Choose Slot
                    </span>
                    <div className="forge-options-grid" role="group" aria-labelledby={`${panelId}-slot-label`}>
                      {MAIN_SLOTS.map((slot) => {
                        const isSelected = selectedSlot === slot;
                        const iconName = getSlotIconName(slot, classWeaponType);
                        const title =
                          slot === 'weapon'
                            ? `Weapon (${capitalize(classWeaponType)})`
                            : capitalize(slot);
                        return (
                          <button
                            key={slot}
                            type="button"
                            role="button"
                            aria-pressed={isSelected}
                            className="forge-slot-btn"
                            data-testid={`slot-${slot}`}
                            onClick={() => {
                              setSelectedSlot(slot);
                              setConfirmCraft(false);
                            }}
                          >
                            <V2PixelIcon name={iconName} size={3} title={title} />
                            <span className="forge-option-name">{title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="forge-selector-group">
                    <span className="forge-selector-label" id={`${panelId}-rarity-label`}>
                      Choose Rarity
                    </span>
                    <div className="forge-options-grid" role="group" aria-labelledby={`${panelId}-rarity-label`}>
                      {GEAR_RARITIES.map((rarity) => {
                        const isSelected = selectedRarity === rarity;
                        const frameName = `frame${capitalize(rarity)}` as V2FrameName;
                        return (
                          <button
                            key={rarity}
                            type="button"
                            role="button"
                            aria-pressed={isSelected}
                            className={`forge-rarity-btn rarity-${rarity}`}
                            data-testid={`rarity-${rarity}`}
                            onClick={() => {
                              setSelectedRarity(rarity);
                              setConfirmCraft(false);
                            }}
                          >
                            <V2PixelFrame name={frameName} size={2} title={capitalize(rarity)} />
                            <span className="forge-option-name">{capitalize(rarity)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Centre Column: Preview with in-place reveal (short flash, no modal) */}
              <div className="forge-col-centre" data-testid="forge-centre-card">
                <div
                  className={`forge-preview-slot ${isRevealing ? 'forge-flash' : ''}`}
                  data-testid="forge-centre-preview"
                >
                  <V2PixelFrame
                    name={`frame${capitalize(selectedRarity)}` as V2FrameName}
                    size={4}
                    className="forge-frame"
                  >
                    <V2PixelIcon
                      name={getSlotIconName(selectedSlot, classWeaponType)}
                      size={4}
                      title={slotLabel}
                    />
                  </V2PixelFrame>
                </div>
                <div className="forge-candidate-preview">
                  <h3 className={`forge-preview-name rarity-${selectedRarity}`} style={{ margin: 0 }}>
                    {capitalize(selectedRarity)} {slotLabel}
                  </h3>
                  <div className="num muted" style={{ fontSize: '12px' }}>
                    Success 100% · Break 0%
                  </div>
                  <p className="forge-preview-meta" style={{ margin: '4px 0 0' }}>
                    Guaranteed {capitalize(selectedRarity)} • Bonus lines: {rarityDef.bonusLines} • Max Lv. {rarityDef.maxLevel}
                  </p>
                </div>

                {/* In-place result reveal */}
                {craftResult && (
                  <div
                    className={`forge-result-reveal ${isRevealing ? 'forge-flash' : ''}`}
                    data-testid="forge-in-place-reveal"
                    style={{ marginTop: '12px', width: '100%' }}
                  >
                    {craftResult}
                  </div>
                )}

                {/* Action & Confirm Area */}
                <div className="forge-action-area" style={{ marginTop: '14px', width: '100%' }}>
                  {disabledCraftReason ? (
                    <>
                      <button
                        type="button"
                        className="forge-btn"
                        disabled
                        aria-disabled="true"
                        data-testid="craft-btn"
                      >
                        {disabledCraftReason}
                      </button>
                      <p className="forge-note forge-block-reason" data-testid="craft-block-reason">
                        <span data-testid="block-reason-craft">{disabledCraftReason}</span>
                      </p>
                      {!anyRecipeAffordable && (
                        <p className="forge-note forge-empty-hint" data-testid="forge-empty-hint">
                          No recipe affordable. Defeat monsters and bosses to collect Fish and Yarn.
                        </p>
                      )}
                    </>
                  ) : confirmCraft ? (
                    <div className="forge-confirm-box" data-testid="craft-confirm-box" role="alert">
                      <p className="forge-confirm-text">
                        Confirm crafting <strong>{capitalize(selectedRarity)} {slotLabel}</strong>?
                      </p>
                      <div className="forge-confirm-actions">
                        <button
                          type="button"
                          className="forge-btn forge-btn-confirm pixel-btn"
                          disabled={isLoopBusy}
                          aria-busy={isBusyCraft ? 'true' : 'false'}
                          onClick={() => void handleCraftConfirm()}
                          data-testid="craft-confirm-btn"
                        >
                          {isBusyCraft && <span className="btn-spinner" aria-hidden="true" />}
                          {isBusyCraft ? 'Crafting...' : 'Confirm Craft'}
                        </button>
                        <button
                          type="button"
                          className="forge-btn forge-btn-cancel"
                          disabled={isLoopBusy}
                          onClick={() => setConfirmCraft(false)}
                          data-testid="craft-cancel-btn"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="forge-btn forge-btn-craft forge-btn-primary pixel-btn"
                      disabled={isLoopBusy}
                      aria-busy={isBusyCraft ? 'true' : 'false'}
                      onClick={() => setConfirmCraft(true)}
                      data-testid="craft-btn"
                    >
                      {isBusyCraft && <span className="btn-spinner" aria-hidden="true" />}
                      {isBusyCraft ? 'Crafting...' : `Craft ${capitalize(selectedRarity)} ${slotLabel}`}
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: 2 · Materials & Chances Table */}
              <div className="forge-col-right">
                <div className="forge-card" data-testid="forge-materials-card">
                  <h3 className="forge-section-title">2 · Materials</h3>
                  <ul className="forge-cost-list" aria-label="Required materials" style={{ padding: 0, margin: '8px 0 0', listStyle: 'none' }}>
                    {COST_ORDER.map((matId) => {
                      const req = recipe.materials[matId];
                      if (!req || req <= 0) return null;
                      const current = stacks[matId] ?? 0;
                      const def = v2.MATERIALS.find((m) => m.id === matId);
                      const name = def ? def.name : matId;
                      const met = current >= req;
                      return (
                        <li
                          key={matId}
                          className="forge-cost-item"
                          data-testid={`cost-${matId}`}
                          data-met={met}
                        >
                          <div className="forge-cost-item-left">
                            <MaterialOrCurrencyIcon id={matId} size={2} title={name} />
                            <span className="forge-cost-item-name">{name}</span>
                          </div>
                          <span className={`forge-cost-ratio num ${met ? 'met' : 'unmet'}`}>
                            {current} / {req}
                          </span>
                        </li>
                      );
                    })}
                    <li
                      key="fish"
                      className="forge-cost-item"
                      data-testid="cost-fish"
                      data-met={(stacks.fish ?? 0) >= recipe.fish}
                    >
                      <div className="forge-cost-item-left">
                        <MaterialOrCurrencyIcon id="fish" size={2} title="Fish" />
                        <span className="forge-cost-item-name">Fish</span>
                      </div>
                      <span
                        className={`forge-cost-ratio num ${
                          (stacks.fish ?? 0) >= recipe.fish ? 'met' : 'unmet'
                        }`}
                      >
                        {stacks.fish ?? 0} / {recipe.fish}
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="forge-card" data-testid="forge-chances-card">
                  <h3 className="forge-section-title">Chances</h3>
                  <table className="forge-chances-table" aria-label="Crafting chances">
                    <thead>
                      <tr>
                        <th>Outcome</th>
                        <th style={{ textAlign: 'right' }}>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Success</td>
                        <td className="num" style={{ textAlign: 'right' }}>100</td>
                      </tr>
                      <tr>
                        <td>No change / Break</td>
                        <td className="num muted" style={{ textAlign: 'right' }}>0</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="muted" style={{ fontSize: '11px', margin: '8px 0 0' }}>
                    Crafted gear receives bonus stats scaled to item level.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SALVAGE TAB */}
      {activeTab === 'salvage' && (
        <section
          role="tabpanel"
          id={`${panelId}-panel-salvage`}
          aria-labelledby={`${panelId}-tab-salvage`}
          className="forge-content forge-salvage-tab"
          data-testid="salvage-panel"
        >
          <div className="forge-salvage-scroll">
            <div className="forge-salvage-summary" data-testid="forge-salvage-summary">
              <div className="forge-salvage-yield-wrap">
                <span className="forge-salvage-yield-lead">
                  Yield ({salvageIds.size} selected):
                </span>
                <div className="forge-salvage-yield-tokens" data-testid="salvage-yield-summary">
                  {salvageIds.size === 0 ? (
                    <span className="forge-note">Select items below to preview salvage returns</span>
                  ) : (
                    formatYieldSummary(salvageYieldTotals)
                  )}
                </div>
              </div>

              <div className="forge-salvage-controls">
                <button
                  type="button"
                  className="forge-mini-btn"
                  onClick={selectAllEligible}
                  data-testid="salvage-select-all"
                >
                  Select All Eligible
                </button>
                <button
                  type="button"
                  className="forge-mini-btn"
                  onClick={deselectAll}
                  data-testid="salvage-deselect-all"
                  disabled={salvageIds.size === 0}
                >
                  Deselect All
                </button>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="forge-empty-state" data-testid="salvage-empty-state">
                <p className="forge-empty-note">No items available for salvage.</p>
              </div>
            ) : (
              <ul className="forge-items-list" aria-label="Owned items">
                {items.map((item) => {
                  const isEligible = !item.equipped && !item.locked && item.source !== 'starter';
                  const isSelected = salvageIds.has(item.id);
                  let statusTag: string | null = null;
                  if (item.equipped) statusTag = 'Equipped';
                  else if (item.locked) statusTag = 'Locked';
                  else if (item.source === 'starter') statusTag = "Starter gear can't be salvaged";

                  return (
                    <li
                      key={item.id}
                      className={`forge-item-row ${!isEligible ? 'disabled' : ''} ${
                        isSelected ? 'selected' : ''
                      }`}
                      data-testid={`salvage-item-${item.id}`}
                    >
                      <input
                        type="checkbox"
                        id={`check-${item.id}`}
                        aria-label={`Select ${item.name} for salvage`}
                        checked={isSelected}
                        disabled={!isEligible}
                        onChange={() => toggleItem(item.id)}
                        className="forge-item-check"
                        data-testid={`salvage-check-${item.id}`}
                      />
                      <div className="forge-item-icon-box">
                        <ItemIcon item={item} classWeaponType={classWeaponType} size={22} />
                      </div>
                      <div className="forge-item-info">
                        <span className={`forge-item-name rarity-${item.rarity}`}>
                          {item.name}
                        </span>
                        <span className="forge-item-meta">
                          Lv. {item.level} {capitalize(item.slot)}
                        </span>
                      </div>

                      {statusTag && (
                        <span className="forge-item-status-tag" role="note">
                          {statusTag}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="forge-action-area">
            {confirmSalvage ? (
              <div className="forge-confirm-box" data-testid="salvage-confirm-box" role="alert">
                <p className="forge-confirm-text">
                  Permanently dismantle <strong>{salvageIds.size} item{salvageIds.size > 1 ? 's' : ''}</strong>?
                </p>
                <div className="forge-confirm-yield">
                  Returns: {formatYieldSummary(salvageYieldTotals)}
                </div>
                <div className="forge-confirm-actions">
                  <button
                    type="button"
                    className="forge-btn forge-btn-confirm pixel-btn"
                    onClick={() => void handleSalvageConfirm()}
                    data-testid="salvage-confirm-btn"
                    disabled={salvageIds.size === 0 || isLoopBusy}
                    aria-busy={isBusySalvage ? 'true' : 'false'}
                  >
                    {isBusySalvage && <span className="btn-spinner" aria-hidden="true" />}
                    {isBusySalvage ? 'Salvaging...' : 'Confirm Salvage'}
                  </button>
                  <button
                    type="button"
                    className="forge-btn forge-btn-cancel"
                    disabled={isLoopBusy}
                    onClick={() => setConfirmSalvage(false)}
                    data-testid="salvage-cancel-btn"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="forge-salvage-actions">
                <button
                  type="button"
                  className={`forge-btn ${salvageIds.size === 0 ? '' : 'forge-btn-salvage forge-btn-primary pixel-btn'}`}
                  disabled={salvageIds.size === 0 || isLoopBusy}
                  aria-busy={isBusySalvage ? 'true' : 'false'}
                  onClick={() => setConfirmSalvage(true)}
                  data-testid="salvage-btn"
                >
                  {isBusySalvage && <span className="btn-spinner" aria-hidden="true" />}
                  {isBusySalvage
                    ? 'Salvaging...'
                    : salvageIds.size === 0
                    ? 'Select items to salvage'
                    : `Salvage (${salvageIds.size})`}
                </button>
                {salvageBlockReason && (
                  <p className="forge-note forge-block-reason" data-testid="block-reason-salvage">
                    {salvageBlockReason}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* RELIC TAB (Desktop 3-Column: Left today's relic, centre preview, right materials & chances table) */}
      {activeTab === 'relic' && (
        <section
          role="tabpanel"
          id={`${panelId}-panel-relic`}
          aria-labelledby={`${panelId}-tab-relic`}
          className="forge-content forge-relic-tab"
          data-testid="relic-panel"
        >
          <div className="forge-relic-scroll">
            <div className="forge-cols">
              {/* Left Column: 1 · Today's Relic */}
              <div className="forge-col-left">
                <div className="forge-card">
                  <h3 className="forge-section-title">1 · Today's Relic</h3>
                  {relic.pending ? (
                    <div className="forge-pending-voucher" data-testid="forge-pending" aria-live="polite">
                      <div className={`relic-tile rarity-${relic.pending.rarityName}`}>
                        <img
                          src={relicImageUrl(BigInt(relic.pending.relicId))}
                          alt=""
                          width={64}
                          height={64}
                        />
                      </div>
                      <p>
                        You have an unminted{' '}
                        <strong className={`rarity-${relic.pending.rarityName}`}>
                          {relicName(relic.pending.rarityName)}
                        </strong>
                        .{' '}
                        <span className={`forge-tag rarity-${relic.pending.rarityName}`}>
                          {LABELS.rarities[relic.pending.rarityName]}
                        </span>
                      </p>
                      <p className="forge-note">
                        {relic.pending.signature === null
                          ? 'Your paid Relic can be recovered when the server is ready.'
                          : 'Your daily Relic voucher is forged and ready to be minted to your wallet on the Avalanche Fuji testnet (free testnet, costs no real money).'}
                      </p>
                    </div>
                  ) : relic.today ? (
                    <TodayRelicCard
                      today={relic.today}
                      mintable={false}
                      canReissue={relicBlockedReason === null}
                    />
                  ) : (
                    <div className="forge-empty-state" data-testid="relic-empty-state">
                      <div className="forge-empty-icon" aria-hidden="true">
                        <MaterialOrCurrencyIcon id="moonPearl" size={4} />
                      </div>
                      <p className="forge-empty-note">No Relic voucher forged today yet.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Centre Column: Relic Forge Preview & Actions */}
              <div className="forge-col-centre">
                <div
                  className={`forge-preview-slot ${isRevealing ? 'forge-flash' : ''}`}
                  data-testid="relic-centre-preview"
                >
                  <MaterialOrCurrencyIcon id="moonPearl" size={6} title="Daily Relic" />
                </div>
                <div className="forge-candidate-preview">
                  <h3 className="forge-section-title" style={{ margin: 0 }}>Daily Relic Forge</h3>
                  <p className="num muted" style={{ fontSize: '12px', margin: '4px 0 0' }}>
                    Avalanche Fuji testnet · Limit: 1 per day
                  </p>
                </div>

                {/* Action / Confirmation Area */}
                <div className="forge-action-area" style={{ marginTop: '16px', width: '100%' }}>
                  {relicBlockedReason ? (
                    <>
                      <button
                        type="button"
                        className="forge-btn"
                        disabled
                        aria-disabled="true"
                        data-testid="relic-forge-btn"
                      >
                        {relicButtonText}
                      </button>
                      <p className="forge-note forge-block-reason" data-testid="relic-blocked-reason">
                        <span data-testid="block-reason-relic">{relicBlockedText}</span>
                      </p>
                    </>
                  ) : relic.pending ? (
                    <>
                      <button
                        type="button"
                        className="forge-btn"
                        disabled
                        aria-disabled="true"
                        data-testid="relic-forge-btn"
                      >
                        Voucher Pending Mint
                      </button>
                      <p className="forge-note forge-block-reason" data-testid="block-reason-relic">
                        {RELIC_WAITING_TEXT}
                      </p>
                    </>
                  ) : confirmRelic ? (
                    <div className="forge-confirm-box" data-testid="relic-confirm-box" role="alert">
                      <p className="forge-confirm-text">
                        Confirm forging daily Relic for <strong>30 Yarn + 1 Moon Pearl</strong>?
                      </p>
                      <div className="forge-confirm-actions">
                        <button
                          type="button"
                          className="forge-btn forge-btn-confirm pixel-btn"
                          disabled={isLoopBusy}
                          aria-busy={isBusyRelic ? 'true' : 'false'}
                          onClick={() => void handleRelicConfirm()}
                          data-testid="relic-confirm-btn"
                        >
                          {isBusyRelic && <span className="btn-spinner" aria-hidden="true" />}
                          {isBusyRelic ? 'Forging...' : 'Confirm Forge'}
                        </button>
                        <button
                          type="button"
                          className="forge-btn forge-btn-cancel"
                          disabled={isLoopBusy}
                          onClick={() => setConfirmRelic(false)}
                          data-testid="relic-cancel-btn"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={`forge-btn ${relicBlockedReason || relic.pending ? '' : 'forge-btn-relic forge-btn-primary pixel-btn'}`}
                      disabled={Boolean(relicBlockedReason || relic.pending || isLoopBusy)}
                      aria-busy={isBusyRelic ? 'true' : 'false'}
                      onClick={() => setConfirmRelic(true)}
                      data-testid="relic-forge-btn"
                    >
                      {isBusyRelic && <span className="btn-spinner" aria-hidden="true" />}
                      {isBusyRelic ? 'Forging...' : 'Forge Relic'}
                    </button>
                  )}
                </div>
                {relicFooter}
              </div>

              {/* Right Column: Materials & Plain Chances Table from Game-Rules */}
              <div className="forge-col-right">
                <div className="forge-card" data-testid="relic-materials-card">
                  <h3 className="forge-section-title">2 · Materials</h3>
                  <div className="forge-relic-cost-box" style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '8px 0 0' }}>
                    <span className="chip" data-testid="relic-cost-yarn" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MaterialOrCurrencyIcon id="yarn" size={2} title="Yarn" />
                      30 Yarn (You have {stacks.yarn ?? 0})
                    </span>
                    <span className="chip" data-testid="relic-cost-pearl" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MaterialOrCurrencyIcon id="moonPearl" size={2} title="Moon Pearl" />
                      1 Moon Pearl (You have {stacks.moonPearl ?? 0})
                    </span>
                  </div>
                </div>

                <div className="forge-card" data-testid="relic-chances-card">
                  <h3 className="forge-section-title">Chances</h3>
                  <table className="forge-chances-table" aria-label="Relic drop probabilities">
                    <thead>
                      <tr>
                        <th>Rarity</th>
                        <th style={{ textAlign: 'right' }}>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {oddsRows().map(({ rarity, percent }) => (
                        <tr key={rarity}>
                          <td>
                            <span className={`rarity-pill ${rarity}`}>{LABELS.rarities[rarity]}</span>
                          </td>
                          <td className="num" style={{ textAlign: 'right' }}>{percent}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="muted" style={{ fontSize: '11px', margin: '8px 0 0' }}>
                    Odds read directly from game-rules configuration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
