import { useState, useId } from 'react';
import type {
  GearSlotId,
  ItemV2,
  RecipeId,
  WeaponType,
  ForgeBlockV2,
} from '../../api/GameApiV2';
import type { RelicVoucher, TodayRelic } from '@taskbar-hero/api-contract';
import { v2 } from '@taskbar-hero/game-rules';
import { PixelIcon } from '../../art/pixelIcons';
import { V2PixelIcon, type V2IconName } from '../../art/v2Icons';
import { V2PixelFrame, type V2FrameName } from '../../art/v2Frames';
import { ItemIcon } from '../ItemIcon';
import { TodayRelicCard } from '../../forge/TodayRelicCard';
import { relicName, capitalize, oddsRows } from '../../forge/forgeText';
import { relicImageUrl } from '../../market/marketText';
import { LABELS } from '../../theme/labels';
import './ForgePanel.css';

export interface ForgePanelRelic {
  today: TodayRelic | null;
  pending: RelicVoucher | null;
  blockedReason: ForgeBlockV2 | null;
}

export interface ForgePanelProps {
  stacks: Partial<Record<v2.MaterialId | 'fish', number>>;
  items: ItemV2[];
  relic: ForgePanelRelic;
  classWeaponType: WeaponType;
  onCraft: (recipeId: RecipeId, slot: GearSlotId) => void | Promise<void>;
  onSalvage: (itemIds: string[]) => void | Promise<void>;
  onRelic: () => void | Promise<void>;
  defaultTab?: ForgeTabId;
  defaultSlot?: GearSlotId;
  defaultRarity?: v2.GearRarityId;
  defaultSelectedItems?: string[];
  defaultConfirm?: boolean;
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
  onCraft,
  onSalvage,
  onRelic,
  defaultTab = 'craft',
  defaultSlot = 'weapon',
  defaultRarity = 'common',
  defaultSelectedItems = [],
  defaultConfirm = false,
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

  // Craft calculations
  const recipeId: RecipeId = `rcp.${selectedRarity}`;
  const recipe = v2.RECIPES.find((r) => r.id === recipeId) ?? v2.RECIPES[0]!;
  const rarityDef = v2.GEAR_RARITIES.find((r) => r.id === selectedRarity) ?? v2.GEAR_RARITIES[0]!;

  const craftBlockReason = v2.craftBlock({ stacks, lastRelicDay: 0 }, recipeId, selectedSlot);
  let disabledCraftReason: string | null = null;
  if (craftBlockReason) {
    if (craftBlockReason.startsWith('not_enough_')) {
      const missingId = craftBlockReason.replace('not_enough_', '') as v2.MaterialId | 'fish';
      const required = missingId === 'fish' ? recipe.fish : (recipe.materials[missingId] ?? 0);
      const current = stacks[missingId] ?? 0;
      const diff = Math.max(0, required - current);
      const matDef = v2.MATERIALS.find((m) => m.id === missingId);
      const matName = matDef ? matDef.name : (missingId === 'fish' ? 'Fish' : missingId);
      disabledCraftReason = `Needs ${diff} more ${matName}`;
    } else if (craftBlockReason === 'unknown_slot') {
      disabledCraftReason = 'Unknown slot';
    } else if (craftBlockReason === 'unknown_recipe') {
      disabledCraftReason = 'Unknown recipe';
    }
  }

  const slotLabel =
    selectedSlot === 'weapon'
      ? `Weapon (${capitalize(classWeaponType)})`
      : capitalize(selectedSlot);

  // Salvage calculations
  const eligibleItems = items.filter((item) => !item.equipped && !item.locked);
  const salvageYieldTotals: v2.MaterialCost = {};
  for (const id of selectedItemIds) {
    const item = items.find((i) => i.id === id);
    if (item && !item.equipped && !item.locked) {
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
  const relicBlockedReason = relic.blockedReason;
  let relicBlockedText: string | null = null;
  let relicButtonText = 'Forge Relic';
  if (relicBlockedReason === 'daily_limit') {
    relicBlockedText = "Daily limit reached: you already forged today's Relic. Come back tomorrow.";
    relicButtonText = 'Daily limit reached';
  } else if (relicBlockedReason === 'not_enough_yarn') {
    relicBlockedText = `Not enough Yarn (needs 30 Yarn, you have ${stacks.yarn ?? 0}).`;
    relicButtonText = 'Not enough Yarn';
  } else if (relicBlockedReason === 'no_moon_pearl') {
    relicBlockedText = `No Moon Pearl (needs 1 Moon Pearl, you have ${stacks.moonPearl ?? 0}).`;
    relicButtonText = 'No Moon Pearl';
  }

  const handleCraftConfirm = async () => {
    await onCraft(recipeId, selectedSlot);
    setConfirmCraft(false);
  };

  const handleSalvageConfirm = async () => {
    const ids = Array.from(selectedItemIds);
    await onSalvage(ids);
    setSelectedItemIds(new Set());
    setConfirmSalvage(false);
  };

  const handleRelicConfirm = async () => {
    await onRelic();
    setConfirmRelic(false);
  };

  return (
    <div className="forge-panel" data-testid="forge-panel">
      {/* Tab Navigation */}
      <nav className="forge-nav" role="tablist" aria-label="Forge sections">
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

      {/* CRAFT TAB */}
      {activeTab === 'craft' && (
        <section
          role="tabpanel"
          id={`${panelId}-panel-craft`}
          aria-labelledby={`${panelId}-tab-craft`}
          className="forge-content forge-craft-tab"
          data-testid="craft-panel"
        >
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

          {/* Recipe Details & Balance */}
          <div className="forge-craft-details">
            <div className="forge-preview-card">
              <div className="forge-preview-icon-wrap">
                <V2PixelIcon
                  name={getSlotIconName(selectedSlot, classWeaponType)}
                  size={3}
                  title={slotLabel}
                />
                <V2PixelFrame
                  name={`frame${capitalize(selectedRarity)}` as V2FrameName}
                  size={3.5}
                  className="forge-frame"
                />
              </div>
              <div className="forge-preview-info">
                <h3 className={`forge-preview-name rarity-${selectedRarity}`}>
                  {capitalize(selectedRarity)} {slotLabel}
                </h3>
                <p className="forge-preview-meta">
                  Guaranteed {capitalize(selectedRarity)} • Bonus lines: {rarityDef.bonusLines} • Max Lv. {rarityDef.maxLevel}
                </p>
              </div>
            </div>

            <div className="forge-costs">
              <h4 className="forge-cost-title">Recipe Cost & Balance</h4>
              <ul className="forge-cost-list" aria-label="Required materials">
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
                      <span className={`forge-cost-ratio ${met ? 'met' : 'unmet'}`}>
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
                    className={`forge-cost-ratio ${
                      (stacks.fish ?? 0) >= recipe.fish ? 'met' : 'unmet'
                    }`}
                  >
                    {stacks.fish ?? 0} / {recipe.fish}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Action & Confirm Area */}
          <div className="forge-action-area">
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
                  {disabledCraftReason}
                </p>
              </>
            ) : confirmCraft ? (
              <div className="forge-confirm-box" data-testid="craft-confirm-box" role="alert">
                <p className="forge-confirm-text">
                  Confirm crafting <strong>{capitalize(selectedRarity)} {slotLabel}</strong>?
                </p>
                <div className="forge-confirm-actions">
                  <button
                    type="button"
                    className="forge-btn forge-btn-confirm"
                    onClick={() => void handleCraftConfirm()}
                    data-testid="craft-confirm-btn"
                  >
                    Confirm Craft
                  </button>
                  <button
                    type="button"
                    className="forge-btn forge-btn-cancel"
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
                className="forge-btn"
                onClick={() => setConfirmCraft(true)}
                data-testid="craft-btn"
              >
                Craft {capitalize(selectedRarity)} {slotLabel}
              </button>
            )}
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
          <div className="forge-salvage-summary">
            <div className="forge-salvage-yield-wrap">
              <span className="forge-salvage-yield-lead">
                Yield ({selectedItemIds.size} selected):
              </span>
              <div className="forge-salvage-yield-tokens" data-testid="salvage-yield-summary">
                {selectedItemIds.size === 0 ? (
                  <span className="forge-note">Select items below to preview salvage returns</span>
                ) : (
                  COST_ORDER.map((id) => {
                    const amt = salvageYieldTotals[id];
                    if (!amt || amt <= 0) return null;
                    const def = v2.MATERIALS.find((m) => m.id === id);
                    const name = def ? def.name : id;
                    return (
                      <span key={id} className="forge-yield-token" data-testid={`yield-${id}`}>
                        <MaterialOrCurrencyIcon id={id} size={2} title={name} />
                        +{amt} {name}
                      </span>
                    );
                  })
                )}
              </div>
            </div>

            <div className="forge-salvage-controls">
              <button
                type="button"
                className="forge-mini-btn"
                onClick={selectAllEligible}
                disabled={eligibleItems.length === 0}
                data-testid="salvage-select-all"
              >
                Select All Eligible
              </button>
              <button
                type="button"
                className="forge-mini-btn"
                onClick={deselectAll}
                disabled={selectedItemIds.size === 0}
                data-testid="salvage-deselect-all"
              >
                Deselect All
              </button>
            </div>
          </div>

          {/* Items List */}
          {items.length === 0 ? (
            <p className="forge-empty-note">No items in inventory.</p>
          ) : (
            <ul className="forge-items-list" aria-label="Owned items">
              {items.map((item) => {
                const isEquipped = !!item.equipped;
                const isLocked = !!item.locked;
                const isEligible = !isEquipped && !isLocked;
                const disabledReason = isEquipped ? 'Equipped' : isLocked ? 'Locked' : null;
                const isSelected = selectedItemIds.has(item.id);

                const itemDef = v2.ITEMS.find((c) => c.id === item.itemKey);
                const itemName = itemDef ? itemDef.name : item.itemKey;
                const itemYield = v2.salvage(item);
                const yieldString = formatYieldSummary(itemYield);

                return (
                  <li
                    key={item.id}
                    className={`forge-item-row ${isEligible ? 'selectable' : 'disabled'} ${
                      isSelected ? 'selected' : ''
                    }`}
                    data-testid={`salvage-item-${item.id}`}
                  >
                    <input
                      type="checkbox"
                      id={`check-${item.id}`}
                      checked={isSelected}
                      disabled={!isEligible}
                      onChange={() => toggleItem(item.id)}
                      className="forge-item-check"
                      aria-label={`Select ${itemName} for salvage`}
                      data-testid={`salvage-check-${item.id}`}
                    />

                    <div className="forge-item-icon-box">
                      <ItemIcon
                        item={{ ...item, weaponType: item.weaponType ?? classWeaponType }}
                        size={2}
                      />
                      <V2PixelFrame
                        name={`frame${capitalize(item.rarity)}` as V2FrameName}
                        size={2.7}
                        className="forge-frame"
                      />
                    </div>

                    <div className="forge-item-info">
                      <label htmlFor={`check-${item.id}`} className="forge-item-name">
                        {itemName}
                      </label>
                      <div className="forge-item-meta">
                        <span className={`rarity-${item.rarity}`}>{capitalize(item.rarity)}</span>
                        <span>Lv. {item.level}</span>
                        <span>{capitalize(item.slot)}</span>
                        {isEligible && (
                          <span className="forge-item-salvage-preview">
                            Yield: {yieldString}
                          </span>
                        )}
                      </div>
                    </div>

                    {disabledReason && (
                      <span
                        className={`forge-item-status-tag tag-${disabledReason.toLowerCase()}`}
                        data-testid={`disabled-reason-${item.id}`}
                      >
                        {disabledReason}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {/* Salvage Action / Confirm */}
          <div className="forge-action-area">
            {confirmSalvage ? (
              <div className="forge-confirm-box" data-testid="salvage-confirm-box" role="alert">
                <p className="forge-confirm-text">
                  Permanently dismantle <strong>{selectedItemIds.size} item{selectedItemIds.size > 1 ? 's' : ''}</strong>?
                </p>
                <div className="forge-confirm-yield">
                  Returns: {formatYieldSummary(salvageYieldTotals)}
                </div>
                <div className="forge-confirm-actions">
                  <button
                    type="button"
                    className="forge-btn forge-btn-confirm"
                    onClick={() => void handleSalvageConfirm()}
                    data-testid="salvage-confirm-btn"
                  >
                    Confirm Salvage
                  </button>
                  <button
                    type="button"
                    className="forge-btn forge-btn-cancel"
                    onClick={() => setConfirmSalvage(false)}
                    data-testid="salvage-cancel-btn"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="forge-btn"
                disabled={selectedItemIds.size === 0}
                onClick={() => setConfirmSalvage(true)}
                data-testid="salvage-btn"
              >
                {selectedItemIds.size === 0
                  ? 'Select items to salvage'
                  : `Salvage (${selectedItemIds.size})`}
              </button>
            )}
          </div>
        </section>
      )}

      {/* RELIC TAB */}
      {activeTab === 'relic' && (
        <section
          role="tabpanel"
          id={`${panelId}-panel-relic`}
          aria-labelledby={`${panelId}-tab-relic`}
          className="forge-content forge-relic-tab"
          data-testid="relic-panel"
        >
          {/* Pending voucher state if unminted */}
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
                Your daily Relic voucher is forged and ready to be minted to your wallet.
              </p>
            </div>
          ) : relic.today ? (
            <TodayRelicCard
              today={relic.today}
              mintable={false}
              canReissue={relicBlockedReason === null}
            />
          ) : null}

          {/* Relic Forge Card */}
          <div className="forge-relic-card">
            <div className="forge-relic-header">
              <div className="forge-relic-icon-wrap">
                <MaterialOrCurrencyIcon id="moonPearl" size={4} title="Moon Pearl" />
              </div>
              <div className="forge-relic-info">
                <h3 className="forge-section-title">Daily Relic Forge</h3>
                <p className="forge-section-desc">
                  Forge a unique on-chain Relic NFT with randomized rarity. Strictly 1 craft per day across v1 and v2.
                </p>
              </div>
            </div>

            <div className="forge-relic-cost-box">
              <span className="forge-cost-title">Cost:</span>
              <span className="chip" data-testid="relic-cost-yarn">
                <MaterialOrCurrencyIcon id="yarn" size={2} title="Yarn" />
                30 Yarn (You have {stacks.yarn ?? 0})
              </span>
              <span className="chip" data-testid="relic-cost-pearl">
                <MaterialOrCurrencyIcon id="moonPearl" size={2} title="Moon Pearl" />
                1 Moon Pearl (You have {stacks.moonPearl ?? 0})
              </span>
            </div>

            <div className="forge-selector-group">
              <span className="forge-selector-label">Relic Odds</span>
              <ul className="forge-odds-list" aria-label="Relic drop probabilities">
                {oddsRows().map(({ rarity, percent }) => (
                  <li key={rarity} className="forge-odds-item">
                    <span className={`rarity-${rarity}`}>{LABELS.rarities[rarity]}</span>
                    <span>{percent}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action / Confirmation Area */}
          <div className="forge-action-area">
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
                  {relicBlockedText}
                </p>
              </>
            ) : relic.pending ? (
              <button
                type="button"
                className="forge-btn"
                disabled
                aria-disabled="true"
                data-testid="relic-forge-btn"
              >
                Voucher Pending Mint
              </button>
            ) : confirmRelic ? (
              <div className="forge-confirm-box" data-testid="relic-confirm-box" role="alert">
                <p className="forge-confirm-text">
                  Confirm forging daily Relic for <strong>30 Yarn + 1 Moon Pearl</strong>?
                </p>
                <div className="forge-confirm-actions">
                  <button
                    type="button"
                    className="forge-btn forge-btn-confirm"
                    onClick={() => void handleRelicConfirm()}
                    data-testid="relic-confirm-btn"
                  >
                    Confirm Forge
                  </button>
                  <button
                    type="button"
                    className="forge-btn forge-btn-cancel"
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
                className="forge-btn"
                onClick={() => setConfirmRelic(true)}
                data-testid="relic-forge-btn"
              >
                Forge Relic
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
