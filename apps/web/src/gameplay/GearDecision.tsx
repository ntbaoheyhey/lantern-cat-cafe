import { CONFIG, v2 } from '@taskbar-hero/game-rules';
import type { ItemV2, ServerStateV2 } from '../api/GameApiV2';
import { effectiveStats } from '../layout/bag/compare';
import { formatStat, statLabel } from '../layout/itemView';

/** Whole-cat before/after stats, including class multipliers, slot locks and caps. No ranking guess. */
export function gearComparison(state: ServerStateV2, item: ItemV2) {
  if (!state.cat.classId) return null;
  const cat = { classId: state.cat.classId, level: state.cat.level };
  const worn = state.inventory.filter(i => i.equipped);
  const derive = (items: ItemV2[]) => v2.deriveStats(cat, items.map(i => ({ itemId: i.itemKey, level: i.level, bonusLines: i.bonus })));
  return { before: derive(worn), after: derive([...worn.filter(i => i.slot !== item.slot), item]) };
}

export function GearDecision({ state, item }: { state: ServerStateV2; item: ItemV2 }) {
  const comparison = gearComparison(state, item);
  if (!comparison) return null;
  const { before, after } = comparison;
  const arrow = (a: number, b: number) => b > a ? '▲' : b < a ? '▼' : '=';
  return <section className="gear-decision" aria-label="Build comparison">
    <p className="gear-decision__title">Choose your trade-off</p>
    <div><b>Offence</b><span>ATK {Math.round(before.atk)} → {Math.round(after.atk)} {arrow(before.atk, after.atk)}</span><small>Attack every {(before.attackIntervalMs / 1000).toFixed(2)}s → {(after.attackIntervalMs / 1000).toFixed(2)}s</small></div>
    <div><b>Survival</b><span>HP {Math.round(before.hp)} → {Math.round(after.hp)} {arrow(before.hp, after.hp)}</span><small>DEF {Math.round(before.def)} → {Math.round(after.def)} {arrow(before.def, after.def)}</small></div>
    <p className="gear-decision__hint">Offence speeds up ordinary fights. HP and DEF help survive bosses. Compare bonus lines for your class.</p>
  </section>;
}

export function KeyItemStats({ item }: { item: ItemV2 }) {
  const stats = effectiveStats(item);
  const keys = v2.STATS.filter(s => (stats[s.id] ?? 0) > 0).slice(0, CONFIG.gameplay.keyStats);
  return <dl className="key-item-stats" aria-label="Key item stats">{keys.map(({ id }) => <div key={id}><dt>{statLabel(id)}</dt><dd>{formatStat(id, stats[id]!)}</dd></div>)}</dl>;
}
