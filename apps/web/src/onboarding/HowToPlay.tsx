import { CONFIG } from '@taskbar-hero/game-rules';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import type { IconName } from '../art/pixelIcons';
import { PixelIcon } from '../art/pixelIcons';
import { LABELS } from '../theme/labels';
import { closeHelp, getHelpOpen, openHelp, subscribeHelp } from './helpStore';
import './onboarding.css';

const hours = CONFIG.idle.offlineCapSeconds / 3600;

export interface StepItem {
  icon: IconName;
  text: string;
}

export const STEPS: StepItem[] = [
  {
    icon: 'paw',
    text: `Mochi the cat naps and plays on the strip, earning ${LABELS.gold} and ${LABELS.shards} even while you're away (up to ${hours} h).`,
  },
  {
    icon: 'sword',
    text: `Beat the boss to earn one ${LABELS.bossKey} per day (${CONFIG.boss.maxAttemptsPerDay} fights a day).`,
  },
  {
    icon: 'bag',
    text: `Spend ${LABELS.gold} on gear upgrades in Inventory, and equip better drops.`,
  },
  {
    icon: 'flask',
    text: `Forge a Relic with ${CONFIG.relic.shardCost} ${LABELS.shards} and ${CONFIG.relic.bossKeyCost} ${LABELS.bossKey}, and mint it to your wallet on Avalanche Fuji.`,
  },
  {
    icon: 'shop',
    text: `Trade your minted Relics with other players in Market.`,
  },
];

let lastOpener: HTMLElement | null = null;

export function setOpener(el: HTMLElement | null): void {
  lastOpener = el;
}

/** The How to play dialog. Opens on the first visit and from the "?" button. */
export function HowToPlay() {
  const open = useSyncExternalStore(subscribeHelp, getHelpOpen);
  const dialog = useRef<HTMLDivElement>(null);
  const start = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const active = document.activeElement as HTMLElement | null;
    const opener = lastOpener ?? (active && active !== document.body && document.contains(active) ? active : null);
    lastOpener = null;

    start.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeHelp();
      } else if (e.key === 'Tab') {
        // Keep focus inside the dialog.
        const items = dialog.current?.querySelectorAll<HTMLElement>('button');
        if (!items?.length) return;
        const first = items[0]!;
        const last = items[items.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      const focusTarget = () => {
        if (opener && document.contains(opener) && opener !== document.body) {
          opener.focus();
        } else {
          const toggle = document.querySelector<HTMLElement>('button.toggle, [aria-controls="game-panel"]');
          toggle?.focus();
        }
      };
      focusTarget();
      queueMicrotask?.(focusTarget);
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="help-backdrop" onClick={(e) => e.target === e.currentTarget && closeHelp()}>
      <div
        ref={dialog}
        className="help-dialog pixel-card fx-pop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
      >
        <button type="button" className="help-x" aria-label="Close help" onClick={closeHelp}>
          ×
        </button>
        <h2 id="help-title">How to play</h2>
        <ol className="help-steps">
          {STEPS.map((step, i) => (
            <li key={step.icon} className="help-step-item">
              <div className="help-step-lead">
                <span className="help-step-badge" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="help-step-icon" aria-hidden="true">
                  <PixelIcon name={step.icon} size={3} />
                </span>
              </div>
              <div className="help-step-text">{step.text}</div>
            </li>
          ))}
        </ol>
        <p className="help-note">
          Demo mode works without a wallet; sign in with Core to save progress and mint. Wallet sign-in needs Chrome,
          Brave or Edge.
        </p>
        <button ref={start} type="button" className="help-start pixel-btn" onClick={closeHelp}>
          Start playing
        </button>
      </div>
    </div>
  );
}

/** The button that reopens the How to play dialog. */
export function HelpButton() {
  return (
    <button
      type="button"
      className="help-btn"
      aria-label="How to play"
      title="How to play"
      onClick={(e) => {
        setOpener(e.currentTarget);
        openHelp();
      }}
      style={{
        width: 'auto',
        height: '28px',
        borderRadius: '6px',
        padding: '0 8px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '0.85rem',
      }}
    >
      <span aria-hidden="true">?</span>
      <span>How to play</span>
    </button>
  );
}
