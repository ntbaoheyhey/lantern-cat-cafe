import React from 'react';
import { v2 } from '@taskbar-hero/game-rules';
import type { ServerStateV2 } from '../../api/GameApiV2';
import { MochiPortrait } from '../../visual/MochiPortrait';
import { formatStat, statLabel } from '../itemView';

export interface HeroCardProps {
  state: ServerStateV2;
}

export function HeroCard({ state }: HeroCardProps) {
  const classId = state.cat.classId ?? 'warrior';
  const classDef = v2.CLASSES.find((c) => c.id === classId) ?? v2.CLASSES[0]!;
  const catName = 'Mochi';

  const worn = state.inventory
    .filter((i) => i.equipped)
    .map((i) => ({ itemId: i.itemKey, level: i.level, bonusLines: i.bonus }));
  const stats = v2.deriveStats({ classId, level: state.cat.level }, worn);
  const power = Math.round(v2.powerRating(stats));

  return (
    <div className="home-card home-card--hero" data-testid="home-hero-card">
      <div className="home-card__header">
        <div className="home-hero-card__avatar">
          <MochiPortrait size={96} />
        </div>
        <div className="home-hero-card__meta">
          <h2 className="home-card__title" data-testid="hero-card-name">{catName}</h2>
          <div className="home-hero-card__badges">
            <span className="home-hero-badge home-hero-badge--class">{classDef.name}</span>
            <span className="home-hero-badge home-hero-badge--level">Lv. {state.cat.level}</span>
          </div>
          <div className="home-hero-card__power" data-testid="hero-card-power">
            Power: <strong>{power.toLocaleString('en-US')}</strong>
          </div>
        </div>
      </div>

      <div className="home-card__body">
        <h3 className="home-card__subtitle">Core Stats</h3>
        <dl className="home-hero-stats-grid">
          <div className="home-hero-stat-row">
            <dt>{statLabel('hp')}</dt>
            <dd data-testid="hero-card-hp">{formatStat('hp', stats.hp)}</dd>
          </div>
          <div className="home-hero-stat-row">
            <dt>{statLabel('atk')}</dt>
            <dd data-testid="hero-card-atk">{formatStat('atk', stats.atk)}</dd>
          </div>
          <div className="home-hero-stat-row">
            <dt>{statLabel('critChance')}</dt>
            <dd data-testid="hero-card-crit">{formatStat('critChance', stats.critChance)}</dd>
          </div>
          <div className="home-hero-stat-row">
            <dt>{statLabel('def')}</dt>
            <dd data-testid="hero-card-def">{formatStat('def', stats.def)}</dd>
          </div>
          <div className="home-hero-stat-row">
            <dt>Speed</dt>
            <dd>{(1000 / stats.attackIntervalMs).toFixed(2)}/s</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
