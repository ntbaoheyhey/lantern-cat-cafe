import { useEffect, useRef, useState } from 'react';
import type Phaser from 'phaser';
import type { ServerStateV2 } from '../../api/GameApiV2';
import { backdropFor } from '../../art/backdrops';
import { BackdropView } from '../../art/backdrops/BackdropView';
import type { StageScene } from './StageScene';

export function StageCanvas({ state, zoom, width, reducedMotion }: { state: ServerStateV2; zoom: number; width: number; reducedMotion: boolean }) {
  const host = useRef<HTMLDivElement>(null), scene = useRef<StageScene | null>(null);
  const latest = useRef({ state, reducedMotion, logicalWidth: Math.max(160, Math.floor(width / zoom)) });
  latest.current = { state, reducedMotion, logicalWidth: Math.max(160, Math.floor(width / zoom)) };
  const gameRef = useRef<Phaser.Game | null>(null);
  const [error, setError] = useState(false);
  const logicalWidth = Math.max(160, Math.floor(width / zoom));
  // Keep one game for this mount. Phaser already pauses its render loop on visibilitychange.
  useEffect(() => {
    let cancelled = false, game: Phaser.Game | null = null;
    void Promise.all([import('phaser'), import('./StageScene')]).then(([{ default: Phaser }, { StageScene }]) => {
      if (cancelled) return;
      const stage = new StageScene(); scene.current = stage;
      game = new Phaser.Game({ type: Phaser.CANVAS, parent: host.current!, width: latest.current.logicalWidth, height: 96, transparent: true, pixelArt: true, banner: false, audio: { noAudio: true }, scene: [] });
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
      if (retiring.isBooted) retiring.step(performance.now(), 0);
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
    <div ref={host} className="v2-stage-canvas" aria-label="Cat exploring the chapter" />
    {error && <p role="status">The stage could not load. Your progress is still available below.</p>}
  </div>;
}
