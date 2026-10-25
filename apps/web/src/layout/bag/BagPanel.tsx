import { useId, useState } from 'react';
import type { GearSlotId, ItemV2, ServerStateV2 } from '../../api/GameApiV2';
import { V2PixelFrame } from '../../art/v2Frames';
import { ItemIcon } from '../ItemIcon';
import {
  RARITY_LABEL,
  SLOT_LABEL,
  formatStat,
  frameFor,
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
  onEquip: (itemId: string, slot: GearSlotId) => void;
  onToggleLock: (itemId: string, locked: boolean) => void;
}

function cardLabel(item: ItemV2): string {
  return `${itemName(item.itemKey)}, ${RARITY_LABEL[item.rarity]}, level ${item.level}${item.locked ? ', locked' : ''}`;
}

export function BagPanel({ state, onEquip, onToggleLock }: BagPanelProps) {
  const [sort, setSort] = useState<BagSort>('rarity');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Equipped items do not use bag space.
  const bag = state.inventory.filter((i) => !i.equipped);
  const warn = state.bagLimit > 0 && bag.length / state.bagLimit >= BAG_WARN_SHARE;
  const selected = bag.find((i) => i.id === selectedId) ?? null;
  const upgrades = equipBest(state);

  return (
    <div className="bag">
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
        <p className="bag-empty">Your bag is empty.</p>
      ) : (
        <ul className="bag-grid" aria-label="Bag items">
          {sortBag(bag, sort).map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="bag-card"
                aria-label={cardLabel(item)}
                aria-pressed={item.id === selectedId}
                onClick={() => setSelectedId(item.id)}
              >
                <span className="bag-art">
                  <V2PixelFrame name={frameFor(item.rarity)} size={2} />
                  <span className="bag-icon">
                    <ItemIcon item={item} size={2} />
                  </span>
                </span>
                <span className="bag-name">{itemName(item.itemKey)}</span>
                <span className="bag-level">Lv {item.level}</span>
                {item.locked && <span className="bag-lock">Locked</span>}
              </button>
            </li>
          ))}
        </ul>
      )}

      <section aria-label="Item detail" className="bag-detail pixel-card">
        {selected ? (
          <ItemDetail item={selected} state={state} onEquip={onEquip} onToggleLock={onToggleLock} />
        ) : (
          <p className="detail-note">Select an item to compare it with what you wear.</p>
        )}
      </section>

      <div className="bag-footer">
        <button
          type="button"
          className="pixel-btn"
          disabled={upgrades.length === 0}
          title={upgrades.length === 0 ? 'Nothing in the bag is better than what you wear' : undefined}
          onClick={() => upgrades.forEach((u) => onEquip(u.itemId, u.slot))}
        >
          Equip best
        </button>
      </div>
    </div>
  );
}

function ItemDetail({
  item,
  state,
  onEquip,
  onToggleLock,
}: {
  item: ItemV2;
  state: ServerStateV2;
  onEquip: (itemId: string, slot: GearSlotId) => void;
  onToggleLock: (itemId: string, locked: boolean) => void;
}) {
  const noteId = useId();
  const worn = state.inventory.find((i) => i.id === state.equipped[item.slot]) ?? null;
  const deltas = compareItems(item, worn);
  const block = equipBlock(item, state);
  const { base, bonus } = itemLines(item);

  return (
    <div className="detail-body">
      <div className="detail-head">
        <V2PixelFrame name={frameFor(item.rarity)} size={2} />
        <ItemIcon item={item} size={2} />
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
        <p className="detail-meta">
          {worn ? `Worn: ${itemName(worn.itemKey)}, Lv ${worn.level}` : 'Nothing worn in this slot.'}
        </p>
        {deltas.length === 0 ? (
          <p className="detail-meta">No stat change.</p>
        ) : (
          <ul className="deltas">
            {deltas.map(({ stat, delta }) => (
              <li key={stat} className={delta > 0 ? 'delta-up' : 'delta-down'}>
                {delta > 0 ? '+' : '-'}
                {formatStat(stat, Math.abs(delta))} {statLabel(stat)}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="detail-actions">
        <button
          type="button"
          className="pixel-btn"
          disabled={block !== null}
          title={block ?? undefined}
          aria-describedby={block ? noteId : undefined}
          onClick={() => onEquip(item.id, item.slot)}
        >
          Equip
        </button>
        <button type="button" className="bag-btn-secondary" onClick={() => onToggleLock(item.id, !item.locked)}>
          {item.locked ? 'Unlock' : 'Lock'}
        </button>
      </div>
      {block && (
        <p id={noteId} className="detail-note">
          {block}
        </p>
      )}
    </div>
  );
}
