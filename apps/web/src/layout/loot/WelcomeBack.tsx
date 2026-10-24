import { useEffect, useId, useRef } from 'react';
import { CONFIG } from '@taskbar-hero/game-rules';
import type { GainsV2 } from '../../api/GameApiV2';
import { LootSummary } from './LootSummary';
import { isEmptyLoot } from './lootLines';
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
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Focus the OK button on open
  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  // Escape to close & Tab trap
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  if (isEmptyLoot(gains) || awaySeconds < 300) {
    return null;
  }

  return (
    <div className="loot-backdrop">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="loot-dialog welcome-back-dialog"
      >
        <h2 id={titleId} className="welcome-back-title">
          Welcome back!
        </h2>
        <p className="welcome-back-duration">
          Your cat kept going for {formatAwayTime(awaySeconds)}.
        </p>

        <LootSummary loot={gains} heading="Offline gains" headingLevel={3} />

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
      </div>
    </div>
  );
}
