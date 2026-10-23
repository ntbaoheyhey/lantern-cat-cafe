import { gearStat, heroPower, upgradeCost, type Gear } from '@taskbar-hero/game-rules';
import { GameApiError } from '../api/GameApi';
import { formatPower } from './gearView';

export type UpgradeView =
  | { kind: 'ready'; cost: number }
  | { kind: 'poor'; cost: number }
  | { kind: 'max' };

/** What the Upgrade button shows for an item, given the gold the player sees. */
export function upgradeView(item: Gear, gold: number): UpgradeView {
  const cost = upgradeCost(item);
  if (cost === null) return { kind: 'max' };
  return gold >= cost ? { kind: 'ready', cost } : { kind: 'poor', cost };
}

export function upgradeLabel(v: UpgradeView): string {
  if (v.kind === 'max') return 'Max level';
  const cost = v.cost.toLocaleString('en-US');
  return v.kind === 'ready' ? `Upgrade (${cost} gold)` : `Need ${cost} gold`;
}

/** "+12 power" for an equipped item (hero power), "+3 item power" for a spare one. */
export function gainText(item: Gear, equipped: readonly Gear[], isEquipped: boolean): string {
  const next = { ...item, level: item.level + 1 };
  if (isEquipped) {
    const others = equipped.filter((g) => g.slot !== item.slot);
    return `+${formatPower(heroPower([...others, next]) - heroPower([...others, item]))} power`;
  }
  return `+${formatPower(gearStat(next) - gearStat(item))} item power`;
}

export function upgradeErrorText(e: unknown): string {
  if (e instanceof GameApiError && e.code === 'not_enough_gold') return 'Not enough gold for that upgrade yet.';
  if (e instanceof GameApiError && e.code === 'max_level') return 'That item is already at max level.';
  return 'Upgrade failed, try again.';
}
