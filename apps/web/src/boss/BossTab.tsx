import { useEffect, useRef, useState, type ReactNode } from 'react';
import { GameApiError, type BossFightResult, type GameApi } from '../api/GameApi';
import type { GameLoop } from '../game/gameState';
import { getGameApi, getGameLoop, useGameSnapshot } from '../game/store';
import { frameAt, stepMs, REPLAY_MS } from './replay';
import './boss.css';

export interface BossTabProps {
  api?: GameApi;
  loop?: GameLoop;
  /** Replay length in ms (tests shorten it). */
  replayMs?: number;
}

interface Fight {
  level: number;
  fight: BossFightResult;
}

/** Boss status, a Fight button, and a replay of the server's fight log. */
export function BossTab({ api = getGameApi(), loop = getGameLoop(), replayMs = REPLAY_MS }: BossTabProps) {
  const { server } = useGameSnapshot(loop);
  const [fight, setFight] = useState<Fight | null>(null);
  const [shown, setShown] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The fight's new state waits until the replay ends, so keys and level don't spoil the outcome.
  const unapplied = useRef<BossFightResult | null>(null);

  const apply = () => {
    if (unapplied.current) loop.adopt(unapplied.current.state);
    unapplied.current = null;
  };

  const replaying = fight !== null && shown < fight.fight.result.log.length;

  // Depends on `shown`, not every render: the idle loop re-renders this tab several times a second.
  useEffect(() => {
    if (!fight) return;
    if (!replaying) {
      apply();
      return;
    }
    const t = setTimeout(() => setShown((s) => s + 1), stepMs(fight.fight.result, replayMs));
    return () => clearTimeout(t);
  }, [fight, shown, replaying, replayMs]);

  useEffect(() => apply, []); // leaving the tab mid-replay still applies the result

  if (!server) return <p>Loading the boss…</p>;
  const { boss, bossKeys } = server;
  const outOfAttempts = boss.attemptsLeft === 0;

  const start = async () => {
    setPending(true);
    setError(null);
    try {
      const result = await api.fightBoss();
      unapplied.current = result;
      setFight({ level: boss.level, fight: result });
      setShown(0);
    } catch (e) {
      setError(
        e instanceof GameApiError && e.code === 'no_attempts_left'
          ? 'No attempts left today.'
          : 'The fight could not start. Please try again.',
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="boss">
      <div className="boss-top">
        <dl className="stats boss-stats">
          <dt>Boss level</dt><dd data-testid="boss-level">{boss.level}</dd>
          <dt>Attempts left today</dt><dd data-testid="boss-attempts">{boss.attemptsLeft}</dd>
          <dt>Boss Keys</dt><dd data-testid="boss-keys">{bossKeys}</dd>
        </dl>
        <div className="boss-actions">
          <button
            type="button"
            className="boss-fight"
            disabled={pending || replaying || outOfAttempts}
            onClick={() => void start()}
          >
            {pending ? 'Starting…' : replaying ? 'Fighting…' : 'Fight'}
          </button>
          {replaying && (
            <button type="button" className="boss-skip" onClick={() => setShown(fight.fight.result.log.length)}>
              Skip
            </button>
          )}
        </div>
      </div>
      {outOfAttempts && !replaying && (
        <p className="boss-note" data-testid="boss-limit">
          No attempts left today. They reset at midnight Vietnam time (UTC+7).
        </p>
      )}
      {error && <p role="alert" className="boss-error">{error}</p>}

      {fight && <Replay fight={fight} shown={shown} attemptsLeft={fight.fight.state.boss.attemptsLeft} />}
    </div>
  );
}

function Replay({ fight, shown, attemptsLeft }: { fight: Fight; shown: number; attemptsLeft: number }) {
  const { result, keyGranted } = fight.fight;
  const f = frameAt(result, shown);
  const hit = f.last && f.last.type !== 'end' ? f.last : null;
  return (
    <div className="boss-arena" data-testid="boss-replay">
      <div aria-live="polite">
        {f.done && (
          <div className={`boss-outcome ${result.won ? 'won' : 'lost'}`} data-testid="boss-outcome">
            {result.won ? (
              <p>Victory! You beat the level {fight.level} boss.</p>
            ) : (
              <p>Defeated. {attemptsLeft} {attemptsLeft === 1 ? 'attempt' : 'attempts'} left today.</p>
            )}
            {keyGranted && <p className="boss-key" data-testid="boss-key">Boss Key earned!</p>}
          </div>
        )}
      </div>
      <HpBar label="Hero" hp={f.heroHp} max={result.heroMaxHp} side="hero"
        hit={hit?.type === 'boss_hit' ? <HitNumber key={shown} damage={hit.damage} crit={false} /> : null} />
      <HpBar label={`Boss level ${fight.level}`} hp={f.bossHp} max={result.bossMaxHp} side="boss"
        hit={hit?.type === 'hero_hit' ? <HitNumber key={shown} damage={hit.damage} crit={hit.crit} /> : null} />
    </div>
  );
}

function HitNumber({ damage, crit }: { damage: number; crit: boolean }) {
  return (
    <span className={`hit${crit ? ' crit' : ''}`} aria-hidden="true">
      -{damage.toLocaleString('en-US')}{crit ? ' CRIT!' : ''}
    </span>
  );
}

interface HpBarProps {
  label: string;
  hp: number;
  max: number;
  side: 'hero' | 'boss';
  /** Damage number for the hit this bar just took. */
  hit: ReactNode;
}

function HpBar({ label, hp, max, side, hit }: HpBarProps) {
  const pct = max > 0 ? (hp / max) * 100 : 0;
  return (
    <div className={`hp hp-${side}`}>
      <div className="hp-label">
        <span>{label} {hit}</span>
        <span>{hp.toLocaleString('en-US')} / {max.toLocaleString('en-US')}</span>
      </div>
      <div
        className="hp-track"
        role="progressbar"
        aria-label={`${label} health`}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={hp}
      >
        <div className="hp-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
