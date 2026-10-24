import type { Rarity } from '@taskbar-hero/game-rules';
import { CatPortrait } from './CatPortrait';
import { PixelIcon, type IconName } from './art/pixelIcons';
import { useGameSnapshot } from './game/store';
import type { GameSnapshot } from './game/gameState';
import { NextStepHint } from './onboarding/NextStepHint';
import type { HintTab } from './onboarding/nextStep';
import { LABELS } from './theme/labels';
import './cafe.css';

export interface CafeBoardProps {
  onGo: (tab: HintTab) => void;
  snapshot?: GameSnapshot;
}

function getRelicIcon(rarity: string): IconName {
  switch (rarity) {
    case 'rare':
      return 'bell';
    case 'epic':
      return 'moon';
    case 'legendary':
      return 'heart';
    case 'common':
    default:
      return 'paw';
  }
}

export function CafeBoard({ onGo, snapshot: propSnapshot }: CafeBoardProps) {
  const hookSnapshot = useGameSnapshot();
  const snapshot = propSnapshot ?? hookSnapshot;
  const server = snapshot.server;
  const bossLevel = server?.bossLevel ?? 1;

  // Boss progress data from snapshot if available
  const boss = server?.boss;
  const attemptsToday = boss?.attemptsToday ?? 0;
  const attemptsLeft = boss?.attemptsLeft ?? 0;
  const maxBossFights = attemptsToday + attemptsLeft;
  const bossProgressPct =
    maxBossFights > 0
      ? Math.min(100, Math.round((attemptsToday / maxBossFights) * 100))
      : 0;

  // Relic shelf data from snapshot
  const todayRelic = server?.forge?.today;
  const pendingVoucher = server?.forge?.pending;
  const activeRelic =
    todayRelic ??
    (pendingVoucher
      ? {
          relicId: pendingVoucher.relicId,
          rarityName: pendingVoucher.rarityName,
          minted: false,
          txHash: null,
        }
      : null);

  const relicRarity = activeRelic?.rarityName as Rarity | undefined;
  const nextTargetName = LABELS.relics.common ?? 'Paw Charm';

  return (
    <div className="cafe-board" role="region" aria-label="Café board">
      {/* 1. Mochi the cat card */}
      <section className="cat-card pixel-card cafe-card" aria-label="Mochi the cat">
        <div className="cat-portrait-wrap">
          <CatPortrait size={72} />
        </div>
        <div className="cat-info">
          <h2 className="cat-name cafe-heading">
            <PixelIcon name="paw" size={3} />
            <span>Mochi the cat</span>
          </h2>
          <div className="cat-stats">
            <span className="chip cat-chip">
              <span className="cat-stat-label">Cat power:</span>{' '}
              <strong className="cat-stat-val" data-testid="cat-card-power">
                {Math.round(snapshot.power)}
              </strong>
            </span>
            <span className="chip cat-chip">
              <span className="cat-stat-label">Boss level:</span>{' '}
              <strong className="cat-stat-val" data-testid="cat-card-boss-level">
                {bossLevel}
              </strong>
            </span>
          </div>
        </div>
      </section>

      {/* 2. Today's quest card */}
      <section className="cafe-card pixel-card cafe-quest-card" aria-label="Today's quest">
        <div className="cafe-card-header">
          <h2 className="cafe-card-title cafe-heading">
            <PixelIcon name="sword" size={3} />
            <span>Today's Quest</span>
          </h2>
        </div>

        <div className="cafe-quest-body">
          <NextStepHint onGo={onGo} />

          {boss && (
            <div className="cafe-boss-progress" data-testid="cafe-boss-progress">
              <div className="cafe-boss-progress-meta">
                <span className="cafe-boss-progress-label">Boss fights today:</span>
                <strong className="cafe-boss-progress-val">
                  {attemptsToday} / {maxBossFights}
                </strong>
              </div>
              <div
                className="cafe-progress-bar"
                role="progressbar"
                aria-label="Boss fights used today"
                aria-valuenow={attemptsToday}
                aria-valuemin={0}
                aria-valuemax={maxBossFights}
              >
                <div
                  className="cafe-progress-fill"
                  style={{ width: `${bossProgressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. Relic shelf card */}
      <section className="cafe-card pixel-card cafe-relic-card" aria-label="Relic shelf">
        <div className="cafe-card-header">
          <h2 className="cafe-card-title cafe-heading">
            <PixelIcon name="moon" size={3} />
            <span>Relic Shelf</span>
          </h2>
        </div>

        <div className="cafe-relic-body">
          {activeRelic && relicRarity ? (
            <div
              className={`cafe-relic-slot filled rarity-${relicRarity}`}
              data-testid="relic-shelf-slot"
            >
              <div className={`cafe-relic-icon-wrap rarity-${relicRarity}`}>
                <PixelIcon name={getRelicIcon(relicRarity)} size={3} />
              </div>
              <div className="cafe-relic-info">
                <div className="cafe-relic-name-row">
                  <span className={`cafe-relic-name rarity-${relicRarity}`}>
                    {LABELS.relics[relicRarity] ?? relicRarity}
                  </span>
                  <span className={`chip rarity-${relicRarity}`}>
                    {LABELS.rarities[relicRarity] ?? relicRarity}
                  </span>
                </div>
                <div className="cafe-relic-meta">
                  <span className="cafe-relic-status-label">Today's Relic: </span>
                  <strong className="cafe-relic-status-badge">
                    {activeRelic.minted ? 'Minted' : 'Forged (ready to mint)'}
                  </strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="cafe-relic-slot empty" data-testid="relic-shelf-slot">
              <div className="cafe-relic-icon-wrap empty-icon">
                <PixelIcon name="moon" size={3} />
              </div>
              <div className="cafe-relic-info">
                <div className="cafe-relic-empty-title">Empty Slot</div>
                <div className="cafe-relic-target">
                  Next target:{' '}
                  <strong className="cafe-target-name rarity-common">
                    {nextTargetName}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
