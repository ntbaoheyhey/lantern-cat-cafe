import { journeyGoals } from '../../gameplay/goals';
import React from 'react';
import type { ServerStateV2 } from '../../api/GameApiV2';

export interface NextGoalCardProps {
  state: ServerStateV2;
  onNavigate: (screen: 'map' | 'bag' | 'home') => void;
}

export function NextGoalCard({ state, onNavigate }: NextGoalCardProps) {
  const { chapter, round, kills, killsPerRound, gated, neededPower } = state.progress;
  const goals = journeyGoals(state);
  const isReady = goals.bossAvailable;
  const pct = Math.min(100, Math.round((kills / Math.max(1, killsPerRound)) * 100));

  return (
    <div className="home-card home-card--goal" data-testid="home-next-goal-card">
      <div className="home-card__header">
        <h2 className="home-card__title">Next Goal</h2>
        <span className="home-card__tag">
          Ch. {chapter} · Round {round}
        </span>
      </div>

      <div className="home-card__body">
        <div className="home-goal-progress">
          <div className="home-goal-progress__labels">
            <span className="home-goal-progress__title">
              {gated ? 'Power wall' : isReady ? 'Boss Encounter Ready!' : goals.journey.bossReached ? 'Chapter cleared' : 'Monster Hunt'}
            </span>
            <span className="home-goal-progress__count">
              {kills} / {killsPerRound}
            </span>
          </div>

          <div
            className="home-goal-bar"
            role="progressbar"
            aria-label="Progress through this round"
            aria-valuenow={kills}
            aria-valuemin={0}
            aria-valuemax={killsPerRound}
          >
            <div
              className={'home-goal-bar__fill ' + (isReady ? 'home-goal-bar__fill--ready' : '')}
              style={{ width: pct + '%' }}
            />
          </div>
        </div>

        <p className="home-goal-desc">
          {gated
            ? 'Power wall. Compare gear; estimated power needed: ' + neededPower.toLocaleString('en-US') + '.'
            : isReady
            ? 'The chapter boss awaits your challenge.'
            : goals.journey.bossReached ? goals.soon : 'Defeat ' + Math.max(0, killsPerRound - kills) + ' more monsters to reach the next stage.'}
        </p>

        <div className="journey-horizons journey-horizons--home"><span><b>Now</b>{goals.now.text}</span><span><b>Soon</b>{goals.soon}</span><span><b>Later</b>{goals.later}</span></div>
        <button
          type="button"
          className="pixel-btn home-goal-action-btn"
          onClick={() => onNavigate(goals.now.screen === 'bag' ? 'bag' : 'map')}
          data-testid="home-goal-map"
        >
          {goals.now.screen === 'bag' ? 'Compare gear' : 'Go to map'}
        </button>
      </div>
    </div>
  );
}
