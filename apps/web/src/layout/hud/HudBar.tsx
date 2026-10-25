import React from 'react';
import type { ServerStateV2 } from '../../api/GameApiV2';
import { LevelXpBar } from './LevelXpBar';
import { ProgressChip } from './ProgressChip';
import { StacksBar } from './StacksBar';
import { PowerChip } from './PowerChip';
import './hud.css';

export interface HudBarProps {
  state: ServerStateV2;
  power: number;
}

export function HudBar({ state, power }: HudBarProps) {
  return (
    <section className="hud-bar" aria-label="Cat status">
      <div className="hud-bar__primary">
        <LevelXpBar
          level={state.cat.level}
          xp={state.cat.xp}
          xpToNext={state.cat.xpToNext}
        />
        <ProgressChip
          chapter={state.progress.chapter}
          round={state.progress.round}
          kills={state.progress.kills}
          killsPerRound={state.progress.killsPerRound}
        />
      </div>
      <div className="hud-bar__secondary">
        <StacksBar
          fish={state.currencies.fish}
          yarn={state.currencies.yarn}
          keys={state.currencies.keys}
        />
        <PowerChip
          power={power}
          gated={state.progress.gated}
          neededPower={state.progress.neededPower}
        />
      </div>
    </section>
  );
}
