import { LABELS } from '../theme/labels';
import { useGameSnapshot } from './store';

/** Fish, Yarn and Cat Key counters shown on the strip. */
export function Hud() {
  const { gold, shards, server } = useGameSnapshot();
  const keys = server?.bossKeys ?? 0;
  return (
    <div className="hud" aria-label="Resources">
      <span className="chip chip-gold" data-testid="gold-counter" aria-label={LABELS.gold}>
        <i className="chip-icon" aria-hidden="true" />
        {gold.toLocaleString('en-US')}
        <span className="chip-label">{LABELS.gold}</span>
      </span>
      <span className="chip chip-shard" data-testid="shard-counter" aria-label={LABELS.shards}>
        <i className="chip-icon" aria-hidden="true" />
        {shards.toLocaleString('en-US')}
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
