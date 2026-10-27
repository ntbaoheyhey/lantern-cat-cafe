import { useCallback, useEffect, useId, useRef } from 'react';
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
  const isVisible = !isEmptyLoot(gains) && awaySeconds >= CONFIG.idle.onlineWindowSeconds;
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const priorFocused = useRef<HTMLElement | null>(
    typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null,
  );

  const restoreFocus = useCallback(() => {
    if (priorFocused.current && document.contains(priorFocused.current)) {
      priorFocused.current.focus();
    }
  }, []);

  const handleClose = useCallback(() => {
    restoreFocus();
    onClose();
  }, [onClose, restoreFocus]);

  // Focus the OK button on open & restore focus on unmount
  useEffect(() => {
    if (!isVisible) return;
    buttonRef.current?.focus();
    return () => {
      restoreFocus();
    };
  }, [isVisible, restoreFocus]);

  // Escape to close & Tab trap
  useEffect(() => {
    if (!isVisible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
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
  }, [isVisible, handleClose]);

  if (!isVisible) {
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

        <p className="welcome-back-rule">
          The first {CONFIG.idle.onlineWindowSeconds / 60} minutes count in full; after that the cat earns at {CONFIG.idle.offlineEfficiency === 0.5 ? 'half speed' : `${CONFIG.idle.offlineEfficiency * 100}% speed`}, up to {CONFIG.idle.offlineCapSeconds / 3600} hours.
        </p>
        <LootSummary loot={gains} heading="While you were away" headingLevel={3} />

        <div className="welcome-back-actions">
          <button
            ref={buttonRef}
            type="button"
            className="pixel-btn welcome-back-btn"
            onClick={handleClose}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
