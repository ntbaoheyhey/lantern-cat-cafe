import React from 'react';
import { v2 } from '@taskbar-hero/game-rules';
import { PixelIcon } from '../../art/pixelIcons';
import { formatAmount } from '../loot/lootLines';

export interface StacksBarProps {
  fish: number;
  yarn: number;
  keys: number;
}

export function StacksBar({ fish, yarn, keys }: StacksBarProps) {
  const catKeyDef = v2.MATERIALS.find((m) => m.id === 'catKey');
  const maxKeys = catKeyDef ? catKeyDef.maxStack : 5;

  return (
    <ul className="hud-stacks-list" role="list" aria-label="Currencies and keys">
      <li className="hud-stack-item" role="listitem" aria-label={`Fish ${formatAmount(fish)}`}>
        <PixelIcon name="fish" />
        <span className="hud-stack-label" aria-hidden="true">Fish</span>
        <span className="hud-stack-amount" aria-hidden="true">{formatAmount(fish)}</span>
      </li>
      <li className="hud-stack-item" role="listitem" aria-label={`Yarn ${formatAmount(yarn)}`}>
        <PixelIcon name="yarn" />
        <span className="hud-stack-label" aria-hidden="true">Yarn</span>
        <span className="hud-stack-amount" aria-hidden="true">{formatAmount(yarn)}</span>
      </li>
      <li className="hud-stack-item" role="listitem" aria-label={`Cat Keys ${keys} of ${maxKeys}`}>
        <PixelIcon name="key" />
        <span className="hud-stack-label" aria-hidden="true">Cat Keys</span>
        <span className="hud-stack-amount" aria-hidden="true">{keys}/{maxKeys}</span>
      </li>
    </ul>
  );
}
