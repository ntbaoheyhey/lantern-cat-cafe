import { useGameSnapshot } from './store';

/** Gold and shard counters shown on the strip. */
export function Hud() {
  const { gold, shards } = useGameSnapshot();
  return (
    <div className="hud" aria-label="Resources">
      <span data-testid="gold-counter" aria-label="Gold">{gold.toLocaleString('en-US')} gold</span>
      <span data-testid="shard-counter" aria-label="Shards">{shards.toLocaleString('en-US')} shards</span>
    </div>
  );
}
