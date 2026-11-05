import '../gameplay/gameplay.css';
import { journeyGoals } from '../gameplay/goals';
import React from 'react';
import { ResourceGain } from '../visual/ResourceGain';
import { MotionNumber } from '../motion/MotionNumber';
import type { ServerStateV2 } from '../api/GameApiV2';
import type { SyncStatusV2 } from '../game/v2/syncStatus';
import { v2 } from '@taskbar-hero/game-rules';
import { PixelIcon } from '../art/pixelIcons';
import { LevelXpBar } from '../layout/hud/LevelXpBar';
import { ProgressChip } from '../layout/hud/ProgressChip';
import { PowerChip } from '../layout/hud/PowerChip';
import { SyncStatus } from '../layout/hud/SyncStatus';
import { WalletButton } from '../wallet/WalletButton';
import '../layout/hud/hud.css';

export interface HudProps {
  state: ServerStateV2;
  power: number;
  syncStatus?: SyncStatusV2;
  hintText?: string;
  onHintAction?: () => void;
  mode?: { demo: boolean; notice: string | null };
  sampleAdventure?: boolean;
}

export function Hud({
  state,
  power,
  syncStatus,
  hintText,
  onHintAction,
  mode,
  sampleAdventure = false,
}: HudProps) {
  const goals = sampleAdventure ? { soon: 'Sample: assemble a set', later: 'Sample: finish the journal' } : journeyGoals(state);
  const catKeyDef = v2.MATERIALS.find((m) => m.id === 'catKey');
  const maxKeys = catKeyDef ? catKeyDef.maxStack : 5;
  const title = <h1 className="v2-title">Taskbar Hero</h1>;
  const guidance = (
    <div className="hud-center">
      {hintText && (
        <div className="v2-hint" data-testid="next-hint">
          <span className="v2-hint-lead" aria-hidden="true">Next</span>
          <button type="button" className="v2-hint-btn" onClick={onHintAction ?? undefined}>
            {hintText}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <header data-testid="hud" className="shell-hud v2-topbar">
        <div className="hud-left hud-bar" role="region" aria-label={sampleAdventure ? 'Main game cat status' : 'Cat status'}>
          <div className="hud-bar__layout">
            <div className="hud-currencies hud-stacks-list" role="list" aria-label="Currencies and keys">
              <div
                className="hud-chip hud-stack-item hud-gold"
                data-testid="hud-gold"
                role="listitem"
                aria-label={`Fish ${state.currencies.fish.toLocaleString('en-US')}`}
              >
                <ResourceGain value={state.currencies.fish} /><PixelIcon name="fish" size={2} />
                <span className="hud-chip-label" aria-hidden="true">Fish</span>
                <span className="hud-chip-val num" aria-hidden="true"><MotionNumber value={state.currencies.fish} /></span>
              </div>

              <div
                className="hud-chip hud-stack-item hud-shards"
                data-testid="hud-shards"
                role="listitem"
                aria-label={`Yarn ${state.currencies.yarn.toLocaleString('en-US')}`}
              >
                <ResourceGain value={state.currencies.yarn} /><PixelIcon name="yarn" size={2} />
                <span className="hud-chip-label" aria-hidden="true">Yarn</span>
                <span className="hud-chip-val num" aria-hidden="true"><MotionNumber value={state.currencies.yarn} /></span>
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

            <div className="hud-chip-wrap hud-bar__primary" data-testid="hud-level">
              <LevelXpBar
                level={state.cat.level}
                xp={state.cat.xp}
                xpToNext={state.cat.xpToNext}
              />
            </div>

            <div className="hud-progress-wrap hud-bar__primary" data-testid="hud-progress">
              <ProgressChip
                chapter={state.progress.chapter}
                round={state.progress.round}
                kills={state.progress.kills}
                killsPerRound={state.progress.killsPerRound}
              />
            </div>

            <div className="hud-chip-wrap hud-bar__secondary" data-testid="hud-power">
              <PowerChip
                power={power}
                gated={state.progress.gated}
                neededPower={state.progress.neededPower}
              />
            </div>
          </div>
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
      <div className="shell-context">{title}<span className="visual-build-label">Candidate build, not live.</span><div className="journey-horizons" aria-label="Goal ladder"><span><b>Soon</b>{goals.soon}</span><span><b>Later</b>{goals.later}</span></div>{guidance}</div>
    </>
  );
}
