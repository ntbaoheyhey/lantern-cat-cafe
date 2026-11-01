import { useId, useRef, useState } from 'react';
import type { GearSlotId, ItemV2, ServerStateV2 } from '../../api/GameApiV2';
import type { ScreenId } from '../../nav/screens';
import { ItemIcon } from '../ItemIcon';
import {
  RARITY_LABEL,
  SLOT_LABEL,
  formatStat,
  itemName,
  rarityColor,
  statLabel,
} from '../itemView';
import { compareItems, itemLines } from './compare';
import { BAG_SORTS, sortBag, type BagSort } from './bagSort';
import { equipBest, equipBlock } from './equipRules';
import { ActionNotice } from '../notice/ActionNotice';
import './bag.css';

/** The counter turns into a warning from this share of the bag limit. */
const BAG_WARN_SHARE = 0.9;

export type BagFilter = 'all' | 'weapons' | 'armor' | 'materials' | 'relics';

export const BAG_FILTERS: { id: BagFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'weapons', label: 'Weapons' },
  { id: 'armor', label: 'Armor' },
  { id: 'materials', label: 'Materials' },
  { id: 'relics', label: 'Relics' },
];

export function matchesFilter(item: ItemV2, filter: BagFilter): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'weapons':
      return item.slot === 'weapon';
    case 'armor':
      return (
        item.slot !== 'weapon' &&
        (item.slot as string) !== 'material' &&
        (item.slot as string) !== 'relic' &&
        !item.itemKey.startsWith('mat.') &&
        !item.itemKey.startsWith('relic.')
      );
    case 'materials':
      return (
        (item.slot as string) === 'material' ||
        item.itemKey.startsWith('mat.') ||
        item.itemKey.includes('material')
      );
    case 'relics':
      return (
        (item.slot as string) === 'relic' ||
        (item.rarity as string) === 'relic' ||
        item.itemKey.startsWith('relic.') ||
        item.itemKey.includes('relic')
      );
  }
}

export interface BagPanelProps {
  state: ServerStateV2;
  busy?: string | null;
  onEquip: (itemId: string, slot: GearSlotId) => void;
  onToggleLock: (itemId: string, locked: boolean) => void;
  onForge?: (item?: ItemV2) => void;
  onList?: (item?: ItemV2) => void;
  onNavigate?: (screen: ScreenId) => void;
}

function cardLabel(item: ItemV2): string {
  return `${itemName(item.itemKey)}, ${RARITY_LABEL[item.rarity] ?? item.rarity}, level ${item.level}${item.locked ? ', locked' : ''}`;
}

export function BagPanel({
  state,
  busy,
  onEquip,
  onToggleLock,
  onForge,
  onList,
  onNavigate,
}: BagPanelProps) {
  const [sort, setSort] = useState<BagSort>('rarity');
  const [filter, setFilter] = useState<BagFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const slotRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Equipped items do not use bag space.
  const bag = state.inventory.filter((i) => !i.equipped);
  const warn = state.bagLimit > 0 && bag.length / state.bagLimit >= BAG_WARN_SHARE;

  // Filter and sort items for the grid
  const filteredItems = sortBag(
    bag.filter((i) => matchesFilter(i, filter)),
    sort,
  );

  const selected = filteredItems.find((i) => i.id === selectedId) ?? bag.find((i) => i.id === selectedId) ?? null;
  const upgrades = equipBest(state);
  const isBusyEquip = busy === 'equip';
  const isLoopBusy = Boolean(busy);

  // Visible empty slots up to capacity (bagLimit or fallback to 40)
  const capacity = state.bagLimit > 0 ? state.bagLimit : 40;
  const emptySlotsCount = Math.max(0, capacity - filteredItems.length);

  const handleSlotKeyDown = (e: React.KeyboardEvent, index: number) => {
    const count = filteredItems.length;
    if (count === 0) return;
    const numColumns = 8;
    let nextIndex = -1;

    switch (e.key) {
      case 'ArrowRight':
        nextIndex = (index + 1) % count;
        break;
      case 'ArrowLeft':
        nextIndex = (index - 1 + count) % count;
        break;
      case 'ArrowDown':
        nextIndex = index + numColumns < count ? index + numColumns : index;
        break;
      case 'ArrowUp':
        nextIndex = index - numColumns >= 0 ? index - numColumns : index;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = count - 1;
        break;
      case 'Enter':
      case ' ': {
        e.preventDefault();
        const currentItem = filteredItems[index];
        if (currentItem) setSelectedId(currentItem.id);
        return;
      }
      default:
        return;
    }

    if (nextIndex >= 0 && nextIndex < count && nextIndex !== index) {
      e.preventDefault();
      slotRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="bag" data-testid="bag-screen">
      <ActionNotice />
      <div className="bag-layout">
        {/* Main Column: Toolbar, Filters, and 8-Column Slot Grid */}
        <div className="bag-main">
          <div className="bag-toolbar">
            <div className="bag-toolbar-stats">
              <p className={`bag-count${warn ? ' warn' : ''}`} data-testid="bag-count">
                Bag {bag.length} / {state.bagLimit}
              </p>
              <p role="status" className="bag-status">
                {warn ? 'Bag almost full' : ''}
              </p>
            </div>

            {/* Filter chips (All, Weapons, Armor, Materials, Relics) */}
            <div className="bag-filters" role="group" aria-label="Item filters">
              {BAG_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`bag-filter-chip${filter === f.id ? ' active' : ''}`}
                  aria-pressed={filter === f.id}
                  onClick={() => setFilter(f.id)}
                  data-filter={f.id}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="bag-toolbar-actions">
              <select
                aria-label="Sort bag"
                className="sort-select"
                value={sort}
                onChange={(e) => setSort(e.target.value as BagSort)}
              >
                {BAG_SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="pixel-btn bag-equip-best"
                disabled={upgrades.length === 0 || isLoopBusy}
                aria-busy={isBusyEquip ? 'true' : 'false'}
                title={upgrades.length === 0 ? 'Nothing in the bag is better than what you wear' : undefined}
                onClick={() => upgrades.forEach((u) => onEquip(u.itemId, u.slot))}
              >
                {isBusyEquip && <span className="btn-spinner" aria-hidden="true" />}
                {isBusyEquip ? 'Equipping...' : 'Equip best'}
              </button>
            </div>
          </div>

          {upgrades.length === 0 && (
            <div className="bag-equip-note-row">
              <span className="bag-equip-best-note" data-testid="block-reason-equip-best">
                Best gear already equipped
              </span>
            </div>
          )}

          {/* Grid Area */}
          <div className="bag-grid-container">
            {bag.length === 0 && (
              <div className="bag-empty" data-testid="bag-empty">
                <p>Your bag is empty.</p>
                <p className="bag-empty-hint">Defeat monsters or visit the Forge to obtain gear.</p>
              </div>
            )}
            {bag.length > 0 && filteredItems.length === 0 && (
              <div className="bag-empty bag-filter-empty" data-testid="bag-filter-empty">
                <p>No items matching this filter.</p>
              </div>
            )}
            <ul className="bag-grid" aria-label="Bag items">
              {filteredItems.map((item, index) => (
                <li key={item.id} className="bag-slot filled">
                  <button
                    type="button"
                    className={`bag-card${item.id === selected?.id ? ' selected' : ''}`}
                    data-rarity={item.rarity}
                    aria-label={cardLabel(item)}
                    aria-pressed={item.id === selected?.id}
                    onClick={() => setSelectedId(item.id)}
                    onKeyDown={(e) => handleSlotKeyDown(e, index)}
                    ref={(el) => {
                      slotRefs.current[index] = el;
                    }}
                    title={cardLabel(item)}
                  >
                    <span
                      className="bag-tile"
                      data-rarity={item.rarity}
                      style={{ borderColor: rarityColor(item.rarity) }}
                    >
                      <span className="bag-icon">
                        <ItemIcon item={item} size={2} />
                      </span>
                      {item.locked && (
                        <span className="bag-lock" title="Locked" aria-label="Locked">
                          <svg width="10" height="12" viewBox="0 0 10 12" fill="none" aria-hidden="true">
                            <path
                              d="M2 5V3a3 3 0 0 1 6 0v2h1v7H1V5h1zm2 0h2V3a1 1 0 0 0-2 0v2z"
                              fill="var(--gold, #ffb86b)"
                            />
                          </svg>
                        </span>
                      )}
                      <span className="bag-level">Lv {item.level}</span>
                    </span>
                  </button>
                </li>
              ))}
              {/* Visible empty slots up to capacity */}
              {Array.from({ length: emptySlotsCount }).map((_, i) => (
                <li key={`empty-${i}`} className="bag-slot empty" aria-hidden="true">
                  <span className="bag-tile empty-tile" />
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Detail Panel */}
        <aside className="bag-sidebar">
          <section aria-label="Item detail" className={`bag-detail pixel-card${selected ? '' : ' is-empty'}`}>
            {selected ? (
              <ItemDetail
                item={selected}
                state={state}
                busy={busy}
                onEquip={onEquip}
                onToggleLock={onToggleLock}
                onForge={onForge}
                onList={onList}
                onNavigate={onNavigate}
              />
            ) : (
              <div className="detail-hint-body">
                <div className="detail-hint-card">
                  <h3 className="detail-hint-title">Item Details</h3>
                  <p className="detail-note">Select an item to compare it with what you wear.</p>
                </div>
                <div className="compare-skeleton" aria-hidden="true">
                  <h4 className="compare-skeleton-heading">Compare</h4>
                  <div className="compare-skeleton-row">
                    <span>Attack vs equipped</span>
                    <span className="skeleton-placeholder">--</span>
                  </div>
                  <div className="compare-skeleton-row">
                    <span>Crit vs equipped</span>
                    <span className="skeleton-placeholder">--</span>
                  </div>
                </div>
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function ItemDetail({
  item,
  state,
  busy,
  onEquip,
  onToggleLock,
  onForge,
  onList,
  onNavigate,
}: {
  item: ItemV2;
  state: ServerStateV2;
  busy?: string | null;
  onEquip: (itemId: string, slot: GearSlotId) => void;
  onToggleLock: (itemId: string, locked: boolean) => void;
  onForge?: (item?: ItemV2) => void;
  onList?: (item?: ItemV2) => void;
  onNavigate?: (screen: ScreenId) => void;
}) {
  const noteId = useId();
  const worn = state.inventory.find((i) => i.id === state.equipped[item.slot]) ?? null;
  const deltas = compareItems(item, worn);
  const block = equipBlock(item, state);
  const { base, bonus } = itemLines(item);
  const isBusyEquip = busy === 'equip';
  const isBusyLock = busy === 'setLocked';
  const isLoopBusy = Boolean(busy);

  return (
    <div className="detail-body">
      <div className="detail-head">
        <span
          className="detail-art"
          data-rarity={item.rarity}
          style={{ borderColor: rarityColor(item.rarity) }}
        >
          <ItemIcon item={item} size={2} />
        </span>
        <div className="detail-title">
          <h3>{itemName(item.itemKey)}</h3>
          <div className="detail-pills">
            <span
              className="rarity-pill"
              data-rarity={item.rarity}
              style={{ borderColor: rarityColor(item.rarity) }}
            >
              {RARITY_LABEL[item.rarity] ?? item.rarity}
            </span>
            <span className="detail-meta">
              Lv {item.level} · {SLOT_LABEL[item.slot] ?? item.slot}
            </span>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <h4 className="detail-section-heading">Stats</h4>
        <ul className="detail-lines" aria-label="Item lines">
          {base.map((line) => (
            <li key={`base-${line.stat}`} className="detail-stat-row">
              <span className="stat-label">{statLabel(line.stat)}</span>
              <span className="stat-value">{formatStat(line.stat, line.value)}</span>
            </li>
          ))}
          {bonus.map((line) => (
            <li key={`bonus-${line.stat}`} className="detail-stat-row bonus">
              <span className="stat-label">{statLabel(line.stat)}</span>
              <span className="stat-value">+{formatStat(line.stat, line.value)} (bonus)</span>
            </li>
          ))}
          {((item.slot as string) === 'relic' || (item.rarity as string) === 'relic' || item.itemKey.startsWith('relic.') || ('relicId' in item && Boolean(item.relicId))) && (
            <li className="detail-stat-row relic-stat">
              <span className="stat-label">Relic</span>
              <span className="stat-value">#1042 · minted</span>
            </li>
          )}
        </ul>
      </div>

      <div className="compare">
        <h4>Compare with equipped</h4>
        <div className="compare-cols">
          <div className="compare-col current">
            <span className="compare-col-heading">Current</span>
            {worn ? (
              <div className="compare-card">
                <span className="compare-name">{itemName(worn.itemKey)}</span>
                <span className="compare-sub">
                  Lv {worn.level} · {RARITY_LABEL[worn.rarity]}
                </span>
              </div>
            ) : (
              <span className="compare-empty">Nothing worn</span>
            )}
          </div>
          <div className="compare-col selected">
            <span className="compare-col-heading">Selected</span>
            <div className="compare-card">
              <span className="compare-name">{itemName(item.itemKey)}</span>
              <span className="compare-sub">
                Lv {item.level} · {RARITY_LABEL[item.rarity]}
              </span>
            </div>
          </div>
        </div>
        <p className="detail-meta">
          {worn ? `Worn: ${itemName(worn.itemKey)}, Lv ${worn.level}` : 'Nothing worn in this slot.'}
        </p>
        {deltas.length === 0 ? (
          <p className="detail-meta">No stat change.</p>
        ) : (
          <ul className="deltas">
            {deltas.map(({ stat, delta }) => (
              <li key={stat} className={delta > 0 ? 'delta-up' : 'delta-down'}>
                {delta > 0
                  ? `+${formatStat(stat, Math.abs(delta))} ${statLabel(stat)} ▲`
                  : `-${formatStat(stat, Math.abs(delta))} ${statLabel(stat)} ▼`}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="detail-actions">
        <button
          type="button"
          className="pixel-btn bag-btn-equip"
          disabled={block !== null || isLoopBusy}
          aria-busy={isBusyEquip ? 'true' : 'false'}
          title={block ?? undefined}
          aria-describedby={block ? noteId : undefined}
          onClick={() => onEquip(item.id, item.slot)}
        >
          {isBusyEquip && <span className="btn-spinner" aria-hidden="true" />}
          {isBusyEquip ? 'Equipping...' : 'Equip'}
        </button>

        <button
          type="button"
          className="bag-btn-secondary bag-btn-forge"
          disabled={isLoopBusy}
          onClick={() => (onForge ? onForge(item) : onNavigate?.('forge'))}
        >
          Forge
        </button>

        <button
          type="button"
          className="bag-btn-secondary bag-btn-list"
          disabled={isLoopBusy}
          onClick={() => (onList ? onList(item) : onNavigate?.('market'))}
        >
          List
        </button>

        <button
          type="button"
          className="bag-btn-secondary bag-btn-lock"
          disabled={isLoopBusy}
          aria-busy={isBusyLock ? 'true' : 'false'}
          onClick={() => onToggleLock(item.id, !item.locked)}
        >
          {isBusyLock && <span className="btn-spinner" aria-hidden="true" />}
          {isBusyLock ? 'Saving...' : item.locked ? 'Unlock' : 'Lock'}
        </button>
      </div>

      {block && (
        <p id={noteId} className="detail-note" data-testid="block-reason-equip">
          {block}
        </p>
      )}
    </div>
  );
}
