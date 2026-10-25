import React from 'react';
import { formatAmount } from '../loot/lootLines';

export interface PowerChipProps {
  power: number;
  gated: boolean;
  neededPower: number;
}

export function PowerChip({ power, gated, neededPower }: PowerChipProps) {
  return (
    <div className="hud-chip hud-power-chip" data-testid="hud-power-chip">
      <span className="hud-power-value">Power {formatAmount(power)}</span>
      {gated && (
        <span role="status" className="hud-power-hint">
          Needs about {formatAmount(neededPower)} power: upgrade your weapon
        </span>
      )}
    </div>
  );
}
