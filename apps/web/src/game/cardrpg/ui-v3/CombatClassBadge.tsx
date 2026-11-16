import type { CombatClass } from '@taskbar-hero/game-rules/src/cardrpg/depth/contract';
import { COMBAT_CLASS_LABELS, COMBAT_CLASS_DESCRIPTIONS } from '@taskbar-hero/game-rules/src/cardrpg/depth/combat-class';
import { GameIcon } from '../../../ui/GameIcon';
import './combat-class.css';

const icons: Record<CombatClass, string> = { melee: 'fight', ranged: 'arrow', healer: 'heart' };
export function CombatClassBadge({ combatClass }: { combatClass: CombatClass }) {
  return <span className="combat-class-badge" data-combat-class={combatClass} title={COMBAT_CLASS_DESCRIPTIONS[combatClass]}>
    <GameIcon name={icons[combatClass]} size={14}/>{COMBAT_CLASS_LABELS[combatClass]}
  </span>;
}
