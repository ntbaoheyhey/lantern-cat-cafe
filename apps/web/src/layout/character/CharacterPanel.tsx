import { v2 } from '@taskbar-hero/game-rules';
import { CatPortrait } from '../../CatPortrait';
import type { GearSlotId, ServerStateV2 } from '../../api/GameApiV2';
import { V2PixelFrame, type V2FrameName } from '../../art/v2Frames';
import { ItemIcon } from '../ItemIcon';
import {
  EMPTY_FRAME,
  LOCKED_FRAME,
  SLOT_LABEL,
  formatStat,
  frameFor,
  itemName,
  rarityLabel,
  statLabel,
} from '../itemView';
import './character.css';

export interface CharacterPanelProps {
  state: ServerStateV2;
  onSelectSlot?: (slot: GearSlotId) => void;
}

const MS_PER_SECOND = 1000;

/** Derived stats and power of the cat with its equipped gear, from the shared rules. */
function deriveFor(state: ServerStateV2, classId: v2.ClassId) {
  const worn = state.inventory
    .filter((i) => i.equipped)
    .map((i) => ({ itemId: i.itemKey, level: i.level, bonusLines: i.bonus }));
  const stats = v2.deriveStats({ classId, level: state.cat.level }, worn);
  return { stats, power: Math.round(v2.powerRating(stats)) };
}

function statRows(stats: v2.CatStats): [string, string][] {
  return [
    [statLabel('hp'), formatStat('hp', stats.hp)],
    [statLabel('atk'), formatStat('atk', stats.atk)],
    [statLabel('def'), formatStat('def', stats.def)],
    [statLabel('attackSpeed'), `${(MS_PER_SECOND / stats.attackIntervalMs).toFixed(2)}/s`],
    [statLabel('critChance'), formatStat('critChance', stats.critChance)],
    [statLabel('critDamage'), formatStat('critDamage', stats.critDamage)],
    [statLabel('dodge'), formatStat('dodge', stats.dodge)],
  ];
}

function SlotArt({ frame, children }: { frame: V2FrameName; children?: React.ReactNode }) {
  return (
    <span className="slot-art">
      <V2PixelFrame name={frame} size={2} />
      {children && (
        <span className="slot-icon">
          {children}
        </span>
      )}
    </span>
  );
}

function SlotButton({
  slot,
  state,
  onSelectSlot,
}: {
  slot: v2.GearSlotDef;
  state: ServerStateV2;
  onSelectSlot?: (slot: GearSlotId) => void;
}) {
  const label = SLOT_LABEL[slot.id];
  if (!state.unlockedSlots.includes(slot.id)) {
    return (
      <button
        type="button"
        className="slot-btn locked"
        disabled
        aria-label={`${label}: locked until level ${slot.unlockLevel}`}
      >
        <SlotArt frame={LOCKED_FRAME} />
        <span className="slot-level">Lv {slot.unlockLevel}</span>
      </button>
    );
  }
  const wornId = state.equipped[slot.id];
  const item = state.inventory.find((i) => i.id === wornId);
  if (!item) {
    return (
      <button type="button" className="slot-btn" aria-label={`${label}: empty`} onClick={() => onSelectSlot?.(slot.id)}>
        <SlotArt frame={EMPTY_FRAME[slot.id]} />
      </button>
    );
  }
  return (
    <button
      type="button"
      className="slot-btn"
      aria-label={`${label}: ${itemName(item.itemKey)}, ${rarityLabel(item.rarity)}`}
      onClick={() => onSelectSlot?.(slot.id)}
    >
      <SlotArt frame={frameFor(item.rarity)}>
        <ItemIcon item={item} size={2} />
      </SlotArt>
    </button>
  );
}

function SlotGroup({
  label,
  group,
  slots,
  state,
  onSelectSlot,
}: {
  label: string;
  group: 'main' | 'accessory';
  slots: readonly v2.GearSlotDef[];
  state: ServerStateV2;
  onSelectSlot?: (slot: GearSlotId) => void;
}) {
  return (
    <div role="group" aria-label={label} className={`slot-row slot-row-${group}`}>
      {slots.map((slot) => (
        <SlotButton key={slot.id} slot={slot} state={state} onSelectSlot={onSelectSlot} />
      ))}
    </div>
  );
}

export function CharacterPanel({ state, onSelectSlot }: CharacterPanelProps) {
  const { cat } = state;
  const cls = v2.CLASSES.find((c) => c.id === cat.classId) ?? null;
  const derived = cls ? deriveFor(state, cls.id) : null;
  const xpMax = Math.max(1, cat.xpToNext);
  const xpPct = Math.min(100, Math.max(0, (cat.xp / xpMax) * 100));

  return (
    <section aria-label="Character" className="v2-character pixel-card">
      <div className="v2-character-head">
        <div className="cat-portrait-wrap">
          <CatPortrait size={64} />
        </div>
        <div className="character-title">
          <h2 className="v2-character-name">Mochi the cat</h2>
          <p className="character-meta">
            <span>{cls ? cls.name : 'No class yet'}</span>
            <span>Lv {cat.level}</span>
          </p>
        </div>
      </div>

      <div className="xp">
        <div
          className="xp-bar"
          role="progressbar"
          aria-label="Experience"
          aria-valuemin={0}
          aria-valuemax={xpMax}
          aria-valuenow={cat.xp}
          aria-valuetext={`${cat.xp} of ${xpMax} XP`}
        >
          <span className="xp-fill" style={{ width: `${xpPct}%` }} />
        </div>
        <p className="xp-text">
          {cat.xp} / {xpMax} XP
        </p>
      </div>

      <div className="slot-grid">
        <SlotGroup
          label="Main gear"
          group="main"
          slots={v2.GEAR_SLOTS.filter((s) => s.group === 'main')}
          state={state}
          onSelectSlot={onSelectSlot}
        />
        <SlotGroup
          label="Accessories"
          group="accessory"
          slots={v2.GEAR_SLOTS.filter((s) => s.group === 'accessory')}
          state={state}
          onSelectSlot={onSelectSlot}
        />
      </div>

      {derived ? (
        <dl className="stats">
          {statRows(derived.stats).map(([term, value]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>{value}</dd>
            </div>
          ))}
          <div className="power">
            <dt>Power</dt>
            <dd data-testid="character-power">{derived.power}</dd>
          </div>
        </dl>
      ) : (
        <p className="stats-hint">Choose a class to see stats.</p>
      )}
    </section>
  );
}
