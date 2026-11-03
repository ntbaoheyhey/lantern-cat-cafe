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
  itemName,
  rarityLabel,
  statLabel,
} from '../itemView';
import { ActionNotice } from '../notice/ActionNotice';
import './character.css';

export interface CharacterPanelProps {
  state: ServerStateV2;
  compact?: boolean;
  onSelectSlot?: (slot: GearSlotId) => void;
  onChangeClass?: () => void;
  classBusy?: boolean;
}

const MS_PER_SECOND = 1000;

/** Derived stats and power of the cat with its equipped gear, from the shared rules. */
export function deriveFor(state: ServerStateV2, classId: v2.ClassId) {
  const worn = state.inventory
    .filter((i) => i.equipped)
    .map((i) => ({ itemId: i.itemKey, level: i.level, bonusLines: i.bonus }));
  const stats = v2.deriveStats({ classId, level: state.cat.level }, worn);
  const level = Math.round(v2.powerRating(v2.deriveStats({ classId, level: state.cat.level }, [])));
  const withoutBonus = Math.round(v2.powerRating(v2.deriveStats({ classId, level: state.cat.level }, worn.map(item => ({ ...item, bonusLines: [] })))));
  const power = Math.round(v2.powerRating(stats));
  return { stats, power, level, gear: withoutBonus - level, bonus: power - withoutBonus };
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
      {children && <span className="slot-icon">{children}</span>}
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
        title={`${label}: locked until level ${slot.unlockLevel}`}
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
      <button
        type="button"
        className="slot-btn empty"
        aria-label={`${label}: empty`}
        title={label}
        onClick={() => onSelectSlot?.(slot.id)}
      >
        <SlotArt frame={EMPTY_FRAME[slot.id]} />
      </button>
    );
  }
  return (
    <button
      type="button"
      className="slot-btn equipped"
      data-rarity={item.rarity}
      aria-label={`${label}: ${itemName(item.itemKey)}, ${rarityLabel(item.rarity)}`}
      title={`${label}: ${itemName(item.itemKey)}`}
      onClick={() => onSelectSlot?.(slot.id)}
      style={{
        borderColor: `var(--rarity-${item.rarity}, var(--muted))`,
      }}
    >
      <ItemIcon item={item} size={2} />
    </button>
  );
}

function SlotCell({
  slot,
  state,
  onSelectSlot,
}: {
  slot: v2.GearSlotDef;
  state: ServerStateV2;
  onSelectSlot?: (slot: GearSlotId) => void;
}) {
  const label = SLOT_LABEL[slot.id];
  return (
    <div className="slot-cell" data-slot={slot.id}>
      <SlotButton slot={slot} state={state} onSelectSlot={onSelectSlot} />
      <span className="slot-name" aria-hidden="true">
        {label}
      </span>
    </div>
  );
}

export function CharacterPanel({ state, compact, onSelectSlot, onChangeClass, classBusy }: CharacterPanelProps) {
  const { cat } = state;
  const cls = v2.CLASSES.find((c) => c.id === cat.classId) ?? null;
  const derived = cls ? deriveFor(state, cls.id) : null;
  const xpMax = Math.max(1, cat.xpToNext);
  const xpPct = Math.min(100, Math.max(0, (cat.xp / xpMax) * 100));

  if (compact) {
    return (
      <section aria-label="Character compact" className="v2-character-compact pixel-card">
        <div className="v2-character-compact-row">
          <div className="cat-portrait-wrap compact">
            <CatPortrait size={36} />
          </div>
          <div className="compact-info">
            <span className="compact-name">Mochi</span>
            <span className="compact-meta">{cls ? cls.name : 'No class'} · Lv {cat.level}</span>
          </div>
          {derived && (
            <div className="compact-power" data-testid="character-power-compact">
              <span className="compact-power-label">Power</span>
              <span className="compact-power-val">{derived.power}</span>
            </div>
          )}
          <div className="slot-grid compact" role="group" aria-label="Gear slots">
            {v2.GEAR_SLOTS.map((slot) => (
              <SlotCell key={slot.id} slot={slot} state={state} onSelectSlot={onSelectSlot} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Character" className="v2-character hero-sheet">
      <ActionNotice />
      <div className="hero-paper-doll" role="group" aria-label="Gear slots">
        <div className="hero-cat"><CatPortrait size={160} /><span>Mochi the cat</span></div>
        {v2.GEAR_SLOTS.map(slot => <SlotCell key={slot.id} slot={slot} state={state} onSelectSlot={onSelectSlot} />)}
      </div>
      <div className="hero-stat-card pixel-card">
        <div className="v2-character-name">Mochi the cat</div>
        <p className="character-meta"><span>{cls ? cls.name : 'No class yet'}</span>{cls && <> · <span>Lv {cat.level}</span></>}</p>
        {derived ? <dl className="stats">
          {statRows(derived.stats).map(([term, value]) => <div key={term}><dt>{term}</dt><dd>{value}</dd></div>)}
        </dl> : <p className="stats-hint">Choose a class to see stats.</p>}
      </div>
      <div className="hero-progress pixel-card">
        <h3>Power</h3>
        {derived && <><div className="hero-power" data-testid="character-power">{derived.power}</div>
          <dl className="hero-breakdown" aria-label="Power breakdown">
            <div><dt>Gear</dt><dd data-testid="power-gear">{derived.gear}</dd></div>
            <div><dt>Level</dt><dd data-testid="power-level">{derived.level}</dd></div>
            <div><dt>Bonuses</dt><dd data-testid="power-bonus">{derived.bonus}</dd></div>
          </dl><p className="hero-power-note">Level includes base class stats. Gear adds item stats; bonuses add rolled lines.</p></>}
        <h3>Progress</h3>
        <div className="xp"><div className="xp-bar" role="progressbar" aria-label="Experience" aria-valuemin={0} aria-valuemax={xpMax}
          aria-valuenow={cat.xp} aria-valuetext={`${cat.xp} of ${xpMax} XP`}><span className="xp-fill" style={{ width: `${xpPct}%` }} /></div>
          <p className="xp-text">{cat.xp} / {xpMax} XP</p></div>
        {onChangeClass && <button type="button" className="pixel-btn--secondary" onClick={onChangeClass} disabled={classBusy}>Change class</button>}
      </div>
    </section>
  );
}
