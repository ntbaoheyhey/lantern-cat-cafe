import React from 'react';
import type { ServerStateV2 } from '../api/GameApiV2';
import type { SyncStatusV2 } from '../game/v2/syncStatus';
import { v2 } from '@taskbar-hero/game-rules';
import { PixelIcon } from '../art/pixelIcons';
import { LevelXpBar } from '../layout/hud/LevelXpBar';
import { ProgressChip } from '../layout/hud/ProgressChip';
import { PowerChip } from '../layout/hud/PowerChip';
import { SyncStatus } from '../layout/hud/SyncStatus';
import { formatAmount } from '../layout/loot/lootLines';
import { WalletButton } from '../wallet/WalletButton';

export interface HudProps {
  state: ServerStateV2;
  power: number;
  syncStatus?: SyncStatusV2;
  hintText?: string;
  onHintAction?: () => void;
  mode?: { demo: boolean; notice: string | null };
}

export function Hud({
  state,
  power,
  syncStatus,
  hintText,
  onHintAction,
  mode,
}: HudProps) {
  const catKeyDef = v2.MATERIALS.find((m) => m.id === 'catKey');
  const maxKeys = catKeyDef ? catKeyDef.maxStack : 5;

  return (
    <header data-testid="hud" className="shell-hud v2-topbar">
      <h1 className="v2-title">Taskbar Hero</h1>
      <div className="hud-left hud-bar" role="region" aria-label="Cat status">
        <div className="hud-chip-wrap" data-testid="hud-level">
          <LevelXpBar
            level={state.cat.level}
            xp={state.cat.xp}
            xpToNext={state.cat.xpToNext}
          />
        </div>

        <div className="hud-progress-wrap" data-testid="hud-progress">
          <ProgressChip
            chapter={state.progress.chapter}
            round={state.progress.round}
            kills={state.progress.kills}
            killsPerRound={state.progress.killsPerRound}
          />
        </div>

        <div className="hud-currencies" role="list" aria-label="Currencies and keys">
          <div
            className="hud-chip hud-stack-item hud-gold"
            data-testid="hud-gold"
            role="listitem"
            aria-label={`Fish ${formatAmount(state.currencies.fish)}`}
          >
            <PixelIcon name="fish" size={2} />
            <span className="hud-chip-label" aria-hidden="true">Fish</span>
            <span className="hud-chip-val num" aria-hidden="true">{formatAmount(state.currencies.fish)}</span>
          </div>

          <div
            className="hud-chip hud-stack-item hud-shards"
            data-testid="hud-shards"
            role="listitem"
            aria-label={`Yarn ${formatAmount(state.currencies.yarn)}`}
          >
            <PixelIcon name="yarn" size={2} />
            <span className="hud-chip-label" aria-hidden="true">Yarn</span>
            <span className="hud-chip-val num" aria-hidden="true">{formatAmount(state.currencies.yarn)}</span>
          </div>

          <div
            className="hud-chip hud-stack-item hud-keys"
            data-testid="hud-keys"
            role="listitem"
            aria-label={`Cat Keys ${state.currencies.keys} of ${maxKeys}`}
          >
            <PixelIcon name="key" size={2} />
            <span className="hud-chip-label" aria-hidden="true">Cat Keys</span>
            <span className="hud-chip-val num" aria-hidden="true">{state.currencies.keys}/{maxKeys}</span>
          </div>
        </div>

        <div className="hud-chip-wrap" data-testid="hud-power">
          <PowerChip
            power={power}
            gated={state.progress.gated}
            neededPower={state.progress.neededPower}
          />
        </div>
      </div>

      <div className="hud-center">
        {hintText && (
          <div className="v2-hint" data-testid="next-hint">
            <span className="v2-hint-lead" aria-hidden="true">Next</span>
            <button
              type="button"
              className="v2-hint-btn"
              onClick={onHintAction ?? undefined}
            >
              {hintText}
            </button>
          </div>
        )}
      </div>

      <div className="hud-right">
        {syncStatus && (
          <div data-slot="sync-status" className="v2-sync-status-slot">
            <SyncStatus status={syncStatus} />
          </div>
        )}

        <div className="hud-wallet-slot v2-wallet" data-testid="hud-wallet">
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
