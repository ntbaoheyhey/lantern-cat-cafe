import { createManagedGame } from '../managedGame';
import { useEffect, useRef, useState } from 'react';
import type Phaser from 'phaser';
import type { ServerStateV2 } from '../../api/GameApiV2';
import { backdropFor } from '../../art/backdrops';
import { BackdropView } from '../../art/backdrops/BackdropView';
import type { StageScene } from './StageScene';
import './stage.css';
import { v2 } from '@taskbar-hero/game-rules';
import { bossReady } from './choreography';

export function StageCanvas({
  state,
  zoom,
  width,
  reducedMotion,
  onSelectTab,
}: {
  state: ServerStateV2;
  zoom: number;
  width: number;
  reducedMotion: boolean;
  onSelectTab?: (tab: 'Character' | 'Bag' | 'Boss' | 'Forge' | 'Market' | 'Help') => void;
}) {
  const host = useRef<HTMLDivElement>(null), scene = useRef<StageScene | null>(null);
  const latest = useRef({ state, reducedMotion, logicalWidth: Math.max(160, Math.floor(width / zoom)) });
  latest.current = { state, reducedMotion, logicalWidth: Math.max(160, Math.floor(width / zoom)) };
  const gameRef = useRef<Phaser.Game | null>(null);
  const [error, setError] = useState(false);
  const previous = useRef(state.progress);
  const [moment, setMoment] = useState('Round start');
  const complete = state.progress.kills === state.progress.killsPerRound;
  useEffect(() => {
    const before = previous.current, next = state.progress;
    previous.current = next;
    if (before.chapter !== next.chapter || before.round !== next.round ||
      (before.kills < next.killsPerRound && next.kills === next.killsPerRound)) {
      setMoment('Round cleared');
      const start = setTimeout(() => setMoment('Round start'), 1400);
      const end = setTimeout(() => setMoment(''), 2800);
      return () => { clearTimeout(start); clearTimeout(end); };
    }
    setMoment('Round start');
    const end = setTimeout(() => setMoment(''), 2800);
    return () => clearTimeout(end);
  }, [state.progress.chapter, state.progress.round, complete]);
  const progress = state.progress;
  const logicalWidth = Math.max(160, Math.floor(width / zoom));
  // Keep one game for this mount. Phaser already pauses its render loop on visibilitychange.
  useEffect(() => {
    let cancelled = false, game: Phaser.Game | null = null;
    void Promise.all([import('phaser'), import('./StageScene')]).then(([{ default: Phaser }, { StageScene }]) => {
      if (cancelled) return;
      const stage = new StageScene(); scene.current = stage;
      game = createManagedGame(Phaser, { type: Phaser.CANVAS, parent: host.current!, width: latest.current.logicalWidth, height: 96, transparent: true, pixelArt: true, banner: false, audio: { noAudio: true }, scene: [] });
      gameRef.current = game;
      game.scene.add('v2-stage', stage, true);
      stage.show(latest.current.state, latest.current.reducedMotion);
    }).catch(() => { if (!cancelled) setError(true); });
    return () => {
      cancelled = true; scene.current = null; gameRef.current = null;
      if (!game) return;
      const retiring = game;
      retiring.destroy(true);
      // destroy() only sets pendingDestroy; a hidden/paused loop may never step again.
      // The public step consumes pendingDestroy before updating or rendering anything.
      // Game.isBooted becomes true before textures and SceneManager are ready.
      // runDestroy needs SceneManager's systemScene, created during READY.
      if (retiring.scene.isBooted) retiring.step(performance.now(), 0);
      else retiring.events.once('ready', () => queueMicrotask(() => retiring.step(performance.now(), 0)));
    };
  }, []);
  useEffect(() => {
    gameRef.current?.scale.resize(logicalWidth, 96);
    scene.current?.relayout();
  }, [logicalWidth]);
  useEffect(() => { scene.current?.show(state, reducedMotion); }, [state, reducedMotion]);
  return <div className="v2-stage-art" style={{ width: logicalWidth * zoom, height: 96 * zoom }}>
    <BackdropView art={backdropFor(state.progress.chapter)} width={logicalWidth} scale={zoom} />
    <div ref={host} className="v2-stage-canvas" role="img" aria-label="Cat exploring the chapter" />
    <div className="stage-progress" aria-label="Stage progress">
      <span>Chapter {progress.chapter} · Round {progress.round} / {v2.CHAPTERS.find(c => c.index === progress.chapter)!.roundsPerChapter}</span>
      <span className="stage-kills" aria-label={`${progress.kills} / ${progress.killsPerRound} kills; last kill is elite`}>
        {Array.from({ length: progress.killsPerRound }, (_, i) => <span key={i} className={`stage-pip${i < progress.kills ? ' is-cleared' : ''}${i === progress.killsPerRound - 1 ? ' is-elite' : ''}`} aria-hidden="true">{i === progress.killsPerRound - 1 ? '◆' : '●'}</span>)}
        <span>{progress.kills} / {progress.killsPerRound}</span>
      </span>
    </div>
    <div className={`stage-moment${progress.gated || bossReady(state) ? ' is-actionable' : ''}`} role="status">
      {progress.gated ? (
        <>
          <span className="stage-banner-text">Too strong — equip better gear</span>
          <button
            type="button"
            className="stage-banner-btn pixel-btn"
            onClick={() => onSelectTab?.('Bag')}
            aria-label="Open Bag"
          >
            Open Bag
          </button>
        </>
      ) : bossReady(state) ? (
        <button
          type="button"
          className="stage-banner-btn pixel-btn"
          onClick={() => onSelectTab?.('Boss')}
        >
          Fight the boss
        </button>
      ) : (
        moment
      )}
    </div>
    <span className="stage-preview">{progress.gated ? 'Frontier blocked' : bossReady(state) ? 'Boss ready' : 'Fight preview · rewards on claim'}</span>
    {error && <p role="status">The stage could not load. Your progress is still available below.</p>}
  </div>;
}
