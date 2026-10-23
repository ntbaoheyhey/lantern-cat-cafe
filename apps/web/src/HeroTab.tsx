import { useGameSnapshot } from './game/store';
import { LABELS } from './theme/labels';

export function HeroTab() {
  const s = useGameSnapshot();
  return (
    <dl className="stats">
      <dt>{LABELS.gold}</dt><dd data-testid="hero-gold">{s.gold.toLocaleString('en-US')}</dd>
      <dt>{LABELS.shards}</dt><dd data-testid="hero-shards">{s.shards.toLocaleString('en-US')}</dd>
      <dt>{LABELS.gold}/sec</dt><dd data-testid="hero-gps">{s.goldPerSecond.toFixed(1)}</dd>
      <dt>{LABELS.power}</dt><dd data-testid="hero-power">{Math.round(s.power)}</dd>
    </dl>
  );
}
