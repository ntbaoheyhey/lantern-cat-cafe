import { useEffect, useRef, useState } from 'react';
import type Phaser from 'phaser';
import type { ServerStateV2 } from '../../api/GameApiV2';
import { backdropFor } from '../../art/backdrops';
import { BackdropView } from '../../art/backdrops/BackdropView';
import type { StageScene } from './StageScene';

export function StageCanvas({ state, zoom, width, reducedMotion }: { state: ServerStateV2; zoom: number; width: number; reducedMotion: boolean }) {
  const host = useRef<HTMLDivElement>(null), scene = useRef<StageScene | null>(null);
  const latest = useRef({ state, reducedMotion }); latest.current = { state, reducedMotion };
  const [error, setError] = useState(false);
  const logicalWidth = Math.max(160, Math.floor(width / zoom));
  // Mount immediately, then recreate Phaser only after a resize burst settles.
  const [gameWidth, setGameWidth] = useState(logicalWidth);
  useEffect(() => {
    const timer = window.setTimeout(() => setGameWidth(logicalWidth), 150);
    return () => window.clearTimeout(timer);
  }, [logicalWidth]);
  useEffect(() => {
    let cancelled = false, game: Phaser.Game | null = null;
    const onVisibility = () => { if (document.hidden) game?.pause(); else game?.resume(); };
    document.addEventListener('visibilitychange', onVisibility);
    void Promise.all([import('phaser'), import('./StageScene')]).then(([{ default: Phaser }, { StageScene }]) => {
      if (cancelled) return;
      const stage = new StageScene(); scene.current = stage;
      game = new Phaser.Game({ type: Phaser.CANVAS, parent: host.current!, width: gameWidth, height: 96, transparent: true, pixelArt: true, banner: false, audio: { noAudio: true }, scene: [] });
      game.scene.add('v2-stage', stage, true);
      stage.show(latest.current.state, latest.current.reducedMotion);
      onVisibility();
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; scene.current = null; document.removeEventListener('visibilitychange', onVisibility); game?.destroy(true); };
  }, [gameWidth]);
  useEffect(() => { scene.current?.show(state, reducedMotion); }, [state, reducedMotion]);
  return <div className="v2-stage-art" style={{ width: logicalWidth * zoom, height: 96 * zoom }}>
    <BackdropView art={backdropFor(state.progress.chapter)} width={logicalWidth} scale={zoom} />
    <div ref={host} className="v2-stage-canvas" aria-label="Cat exploring the chapter" />
    {error && <p role="status">The stage could not load. Your progress is still available below.</p>}
  </div>;
}
