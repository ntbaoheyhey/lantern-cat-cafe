import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../motion/reducedMotion';
import { useTickNumber } from '../motion/useTickNumber';
import { LABELS } from '../theme/labels';
import { useGameSnapshot } from './store';

/** Fired on window when a fish from the strip reaches the Fish chip. Keep in sync with StripScene. */
export const FISH_EVENT = 'taskbar-hero:fish';

/** Fish, Yarn and Cat Key counters shown on the strip. */
export function Hud() {
  const { gold, shards, server } = useGameSnapshot();
  const reduced = usePrefersReducedMotion();
  const fish = useTickNumber(gold);
  const yarn = useTickNumber(shards);
  const keys = useTickNumber(server?.bossKeys ?? 0);
  const goldChip = useRef<HTMLSpanElement>(null);

  // A fish landing bumps the Fish chip down 2px (restart the CSS animation if it is still running).
  useEffect(() => {
    if (reduced) return;
    const bump = () => {
      const el = goldChip.current;
      if (!el) return;
      el.classList.remove('chip-bump');
      void el.offsetWidth;
      el.classList.add('chip-bump');
    };
    window.addEventListener(FISH_EVENT, bump);
    return () => window.removeEventListener(FISH_EVENT, bump);
  }, [reduced]);

  return (
    <div className="hud" aria-label="Resources">
      <span ref={goldChip} className="chip chip-gold" data-testid="gold-counter" aria-label={LABELS.gold}>
        <i className="chip-icon" aria-hidden="true" />
        {fish.toLocaleString('en-US')}
        <span className="chip-label">{LABELS.gold}</span>
      </span>
      <span className="chip chip-shard" data-testid="shard-counter" aria-label={LABELS.shards}>
        <i className="chip-icon" aria-hidden="true" />
        {yarn.toLocaleString('en-US')}
        <span className="chip-label">{LABELS.shards}</span>
      </span>
      <span className="chip chip-key" data-testid="key-counter" aria-label={LABELS.bossKey}>
        <i className="chip-icon" aria-hidden="true" />
        {keys.toLocaleString('en-US')}
        <span className="chip-label">{LABELS.bossKey}</span>
      </span>
    </div>
  );
}
