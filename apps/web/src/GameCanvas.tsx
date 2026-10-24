import { useEffect, useRef } from 'react';
import type Phaser from 'phaser';
import { Hud } from './game/Hud';
import { getGameLoop } from './game/store';

export interface GameCanvasProps {
  /** Whole-number zoom of the 96 px scene (stage-first layout). Omit for the classic strip that fills its parent. */
  zoom?: number;
  /** Render the Fish/Yarn/Key counters over the canvas. The stage layout shows them in its top bar instead. */
  hud?: boolean;
}

/**
 * Mounts the Phaser strip. The game is created in an effect and destroyed in
 * its cleanup, so React StrictMode's mount/unmount/mount cycle leaves exactly
 * one live game (and one canvas) behind.
 */
export function GameCanvas({ zoom, hud = true }: GameCanvasProps = {}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const fitRef = useRef<(() => void) | null>(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let game: Phaser.Game | null = null;
    let cancelled = false;
    const loop = getGameLoop();
    void loop.start();

    // Dynamic import keeps Phaser out of the initial HTML parse and out of tests.
    void import('./game/createGame').then(({ createGame, fitStage }) => {
      if (cancelled) return;
      game = createGame(host, loop, zoomRef.current);
      gameRef.current = game;
      fitRef.current = () => {
        if (game && zoomRef.current) fitStage(game, host, zoomRef.current);
      };
      if (document.hidden) game.pause();
    });

    const onVisibility = () => {
      if (!game) return;
      if (document.hidden) game.pause();
      else game.resume();
    };
    document.addEventListener('visibilitychange', onVisibility);

    // The stage width changes with the window; the scene's width is host width / zoom.
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => fitRef.current?.()) : null;
    observer?.observe(host);

    return () => {
      cancelled = true;
      observer?.disconnect();
      loop.stop();
      document.removeEventListener('visibilitychange', onVisibility);
      game?.destroy(true);
      game = null;
      gameRef.current = null;
      fitRef.current = null;
      host.replaceChildren();
    };
  }, []);

  useEffect(() => {
    fitRef.current?.();
  }, [zoom]);

  return (
    <>
      <div ref={hostRef} className="game-host" data-testid="game-host" />
      {hud && <Hud />}
    </>
  );
}
