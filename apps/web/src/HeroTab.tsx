import { useGameSnapshot } from './game/store';

export function HeroTab() {
  const s = useGameSnapshot();
  return (
    <dl className="stats">
      <dt>Gold</dt><dd data-testid="hero-gold">{s.gold.toLocaleString('en-US')}</dd>
      <dt>Shards</dt><dd data-testid="hero-shards">{s.shards.toLocaleString('en-US')}</dd>
      <dt>Gold/sec</dt><dd data-testid="hero-gps">{s.goldPerSecond.toFixed(1)}</dd>
      <dt>Hero power</dt><dd data-testid="hero-power">{Math.round(s.power)}</dd>
    </dl>
  );
}
