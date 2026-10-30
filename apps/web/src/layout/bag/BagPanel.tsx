import { useId, useState } from 'react';
import type { GearSlotId, ItemV2, ServerStateV2 } from '../../api/GameApiV2';
import { ItemIcon } from '../ItemIcon';
import {
  RARITY_LABEL,
  SLOT_LABEL,
  formatStat,
  itemName,
  statLabel,
} from '../itemView';
import { compareItems, itemLines } from './compare';
import { BAG_SORTS, sortBag, type BagSort } from './bagSort';
import { equipBest, equipBlock } from './equipRules';
import './bag.css';

/** The counter turns into a warning from this share of the bag limit. */
const BAG_WARN_SHARE = 0.9;

export interface BagPanelProps {
  state: ServerStateV2;
  busy?: string | null;
  onEquip: (itemId: string, slot: GearSlotId) => void;
  onToggleLock: (itemId: string, locked: boolean) => void;
}

function cardLabel(item: ItemV2): string {
  return `${itemName(item.itemKey)}, ${RARITY_LABEL[item.rarity]}, level ${item.level}${item.locked ? ', locked' : ''}`;
}

export function BagPanel({ state, busy, onEquip, onToggleLock }: BagPanelProps) {
  const [sort, setSort] = useState<BagSort>('rarity');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Equipped items do not use bag space.
  const bag = state.inventory.filter((i) => !i.equipped);
  const warn = state.bagLimit > 0 && bag.length / state.bagLimit >= BAG_WARN_SHARE;
  const selected = bag.find((i) => i.id === selectedId) ?? null;
  const upgrades = equipBest(state);
  const isBusyEquip = busy === 'equip';
  const isLoopBusy = Boolean(busy);

  return (
    <div className="bag">
      <div className="bag-scroll">
        <div className="bag-toolbar">
          <p className={`bag-count${warn ? ' warn' : ''}`} data-testid="bag-count">
            Bag {bag.length} / {state.bagLimit}
          </p>
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
        </div>
        <p role="status" className="bag-status">
          {warn ? 'Bag almost full' : ''}
        </p>

        {bag.length === 0 ? (
          <div className="bag-empty" data-testid="bag-empty">
            <p>Your bag is empty.</p>
            <p className="bag-empty-hint">Explore chapters to find loot from monster drops.</p>
          </div>
        ) : (
          <ul className="bag-grid" aria-label="Bag items">
            {sortBag(bag, sort).map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`bag-card${item.id === selectedId ? ' selected' : ''}`}
                  data-rarity={item.rarity}
                  aria-label={cardLabel(item)}
                  aria-pressed={item.id === selectedId}
                  onClick={() => setSelectedId(item.id)}
                >
                  <span
                    className="bag-tile"
                    data-rarity={item.rarity}
                    style={{ borderColor: `var(--rarity-${item.rarity}, #b9b6c9)` }}
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
                  <span className="bag-name">{itemName(item.itemKey)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <section aria-label="Item detail" className="bag-detail pixel-card">
          {selected ? (
            <ItemDetail item={selected} state={state} busy={busy} onEquip={onEquip} onToggleLock={onToggleLock} />
          ) : (
            <p className="detail-note">Select an item to compare it with what you wear.</p>
          )}
        </section>
      </div>

      <div className="bag-footer">
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
        {upgrades.length === 0 && (
          <span className="bag-equip-best-note" data-testid="block-reason-equip-best">
            Best gear already equipped
          </span>
        )}
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
}: {
  item: ItemV2;
  state: ServerStateV2;
  busy?: string | null;
  onEquip: (itemId: string, slot: GearSlotId) => void;
  onToggleLock: (itemId: string, locked: boolean) => void;
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
          style={{ borderColor: `var(--rarity-${item.rarity}, #b9b6c9)` }}
        >
          <ItemIcon item={item} size={2} />
        </span>
        <div className="detail-title">
          <h3>{itemName(item.itemKey)}</h3>
          <p className="detail-meta">
            {RARITY_LABEL[item.rarity]} · Lv {item.level} · {SLOT_LABEL[item.slot]}
          </p>
        </div>
      </div>

      <ul className="detail-lines" aria-label="Item lines">
        {base.map((line) => (
          <li key={`base-${line.stat}`}>
            {statLabel(line.stat)} {formatStat(line.stat, line.value)}
          </li>
        ))}
        {bonus.map((line) => (
          <li key={`bonus-${line.stat}`} className="bonus">
            {statLabel(line.stat)} +{formatStat(line.stat, line.value)} (bonus)
          </li>
        ))}
      </ul>

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
          className="pixel-btn"
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
          className="bag-btn-secondary"
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
