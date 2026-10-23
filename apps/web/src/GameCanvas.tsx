import { useEffect, useRef } from 'react';
import type Phaser from 'phaser';

/**
 * Mounts the Phaser strip. The game is created in an effect and destroyed in
 * its cleanup, so React StrictMode's mount/unmount/mount cycle leaves exactly
 * one live game (and one canvas) behind.
 */
export function GameCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let game: Phaser.Game | null = null;
    let cancelled = false;

    // Dynamic import keeps Phaser out of the initial HTML parse and out of tests.
    void import('./game/createGame').then(({ createGame }) => {
      if (cancelled) return;
      game = createGame(host);
      if (document.hidden) game.pause();
    });

    const onVisibility = () => {
      if (!game) return;
      if (document.hidden) game.pause();
      else game.resume();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      game?.destroy(true);
      game = null;
      host.replaceChildren();
    };
  }, []);

  return <div ref={hostRef} className="game-host" data-testid="game-host" />;
}
