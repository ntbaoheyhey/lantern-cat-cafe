import { useRef } from 'react';
import { CONFIG } from '@taskbar-hero/game-rules';
import type { GainsV2 } from '../../api/GameApiV2';
import { LootSummary } from './LootSummary';
import { isEmptyLoot } from './lootLines';
import { Modal } from '../../ui';
import './loot.css';

export interface WelcomeBackProps {
  gains: GainsV2;
  awaySeconds: number;
  onClose: () => void;
}

/**
 * Formats away duration in plain English:
 * - over offlineCapSeconds -> "H h (the most a claim counts)"
 * - under 1 h -> "N min"
 * - otherwise -> "H h M min"
 */
export function formatAwayTime(awaySeconds: number, capSeconds = CONFIG.idle.offlineCapSeconds): string {
  const capHours = Math.round(capSeconds / 3600);
  if (awaySeconds > capSeconds) {
    return `${capHours} h (the most a claim counts)`;
  }
  const minutes = Math.floor(awaySeconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return `${hours} h ${remMinutes} min`;
}

export function WelcomeBack({ gains, awaySeconds, onClose }: WelcomeBackProps) {
  const isVisible = !isEmptyLoot(gains) && awaySeconds >= CONFIG.idle.onlineWindowSeconds;
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <Modal open={isVisible} title="Welcome back!" onClose={onClose} initialFocusRef={buttonRef}
      className="loot-dialog welcome-back-dialog" backdropClassName="loot-backdrop"
      closeOnBackdrop={false} showCloseButton={false}>
        <p className="welcome-back-duration">
          Your cat kept going for {formatAwayTime(awaySeconds)}.
        </p>

        <p className="welcome-back-rule">
          The first {CONFIG.idle.onlineWindowSeconds / 60} minutes count in full; after that the cat earns at {CONFIG.idle.offlineEfficiency === 0.5 ? 'half speed' : `${CONFIG.idle.offlineEfficiency * 100}% speed`}, up to {CONFIG.idle.offlineCapSeconds / 3600} hours.
        </p>
        <LootSummary loot={gains} heading="While you were away" headingLevel={3} />

        <div className="welcome-back-actions">
          <button
            ref={buttonRef}
            type="button"
            className="pixel-btn welcome-back-btn"
            onClick={onClose}
          >
            OK
          </button>
        </div>
    </Modal>
  );
}
