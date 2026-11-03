import { CONFIG, v2 } from '@taskbar-hero/game-rules';
import { useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import type { IconName } from '../art/pixelIcons';
import { PixelIcon } from '../art/pixelIcons';
import { LABELS } from '../theme/labels';
import { closeHelp, getHelpOpen, openHelp, subscribeHelp } from './helpStore';
import { Modal } from '../ui';
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
    text: `Forge a Relic with ${CONFIG.relic.shardCost} ${LABELS.shards} and ${CONFIG.relic.bossKeyCost} ${LABELS.bossKey}, and mint it to your wallet on Avalanche Fuji (free testnet, costs no real money).`,
  },
  {
    icon: 'shop',
    text: `Trade your minted Relics with other players in Market.`,
  },
];

/** Initial v2 guidance uses the same current rules as the in-game Help screen. */
export const V2_STEPS: StepItem[] = [
  { icon: 'paw', text: 'Choose a starter class. Mochi earns Fish, Yarn, XP and materials while exploring.' },
  { icon: 'sword', text: `Your first claim each day grants ${v2.V2_CONFIG.idle.dailyKeys} Cat Key. A boss win spends ${v2.V2_CONFIG.boss.keyCost}; a loss keeps your key.` },
  { icon: 'bag', text: `Equip drops in Bag (capacity ${v2.V2_CONFIG.bag.limit}); craft or salvage gear in Forge.` },
  { icon: 'flask', text: `Forge a Relic with ${v2.RELIC_RECIPE.materials.yarn ?? 0} Yarn and ${v2.RELIC_RECIPE.materials.moonPearl ?? 0} Moon Pearl, up to ${v2.RELIC_RECIPE.perDay} per day. Minting uses free Fuji test AVAX.` },
  { icon: 'shop', text: 'Only minted Relics can be traded in Market. Ordinary gear stays in your game.' },
];

let lastOpener: HTMLElement | null = null;

export function setOpener(el: HTMLElement | null): void {
  lastOpener = el;
}

/** The How to play dialog. Opens on the first visit and from the "?" button. */
export function HowToPlay({ mode = 'classic' }: { mode?: 'classic' | 'v2' } = {}) {
  const steps = mode === 'v2' ? V2_STEPS : STEPS;
  const open = useSyncExternalStore(subscribeHelp, getHelpOpen);
  const returnFocus = useRef<HTMLElement | null>(null);
  const start = useRef<HTMLButtonElement>(null);

  // Resolve the first-visit menu after the DOM commits. Reopens use the actual Help button.
  useLayoutEffect(() => {
    if (!open) return;
    returnFocus.current = lastOpener ?? document.querySelector<HTMLElement>('button.toggle, [aria-controls="game-panel"], [data-testid="landing-start"], [data-testid="class-picker-choose-button"], [data-testid="nav-home"]');
    lastOpener = null;
  }, [open]);

  return (
    <Modal open={open} title="How to play" onClose={closeHelp} initialFocusRef={start}
      returnFocusRef={returnFocus} className="help-dialog pixel-card fx-pop"
      backdropClassName="help-backdrop" closeLabel="Close help">
        <ol className="help-steps">
          {steps.map((step, i) => (
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
          Demo mode works without a wallet; sign in to save progress and mint Relics on the Avalanche Fuji testnet (free testnet, costs no real money). Wallet sign-in needs Chrome,
          Brave or Edge.
        </p>
        <button ref={start} type="button" className="help-start pixel-btn" onClick={closeHelp}>
          Start playing
        </button>
    </Modal>
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
