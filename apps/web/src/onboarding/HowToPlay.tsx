import { CONFIG } from '@taskbar-hero/game-rules';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { closeHelp, getHelpOpen, openHelp, subscribeHelp } from './helpStore';
import './onboarding.css';

const hours = CONFIG.idle.offlineCapSeconds / 3600;

export const STEPS = [
  `Your hero fights on the strip and earns gold and shards, even while you're away (up to ${hours} h).`,
  'Spend gold on gear upgrades in Inventory, and equip better drops.',
  `Beat the boss to earn one Boss Key per day (${CONFIG.boss.maxAttemptsPerDay} fights a day).`,
  `Forge a Relic with ${CONFIG.relic.shardCost} shards and ${CONFIG.relic.bossKeyCost} Boss Key, mint it to your wallet on Avalanche Fuji, and trade it in Market.`,
];

/** The How to play dialog. Opens on the first visit and from the "?" button. */
export function HowToPlay() {
  const open = useSyncExternalStore(subscribeHelp, getHelpOpen);
  const dialog = useRef<HTMLDivElement>(null);
  const start = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const before = document.activeElement as HTMLElement | null;
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
      before?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="help-backdrop" onClick={(e) => e.target === e.currentTarget && closeHelp()}>
      <div ref={dialog} className="help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-title">
        <button type="button" className="help-x" aria-label="Close help" onClick={closeHelp}>×</button>
        <h2 id="help-title">How to play</h2>
        <ol>
          {STEPS.map((s) => <li key={s}>{s}</li>)}
        </ol>
        <p className="help-note">Demo mode works without a wallet; sign in with Core to save progress and mint.</p>
        <button ref={start} type="button" className="help-start" onClick={closeHelp}>Start playing</button>
      </div>
    </div>
  );
}

/** The small "?" button that reopens the dialog. */
export function HelpButton() {
  return (
    <button type="button" className="help-btn" aria-label="How to play" onClick={openHelp}>?</button>
  );
}
