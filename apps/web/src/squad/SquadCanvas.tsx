import { useEffect, useRef, useState } from 'react';
import { createManagedGame } from '../game/managedGame';
import type { SquadBridge } from './SquadScene';

export function SquadCanvas({ bridge }: { bridge: SquadBridge }) {
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let disposed = false, game: import('phaser').Game | undefined, observer: ResizeObserver | undefined;
    void Promise.all([import('phaser'), import('./SquadScene')]).then(([{ default: Phaser }, { SquadScene }]) => {
      if (disposed || !host.current) return;
      game = createManagedGame(Phaser, { type: Phaser.CANVAS, parent: host.current, width: host.current.clientWidth, height: host.current.clientHeight, pixelArt: true, banner: false, audio: { noAudio: true }, fps: { target: 30, forceSetTimeOut: true }, scene: [] });
      game.scene.add('squad-combat', SquadScene, true, bridge);
      observer = new ResizeObserver(() => { if (host.current && game?.isBooted) game.scale.resize(host.current.clientWidth, host.current.clientHeight); });
      observer.observe(host.current);
    }).catch(() => { if (!disposed) setError(true); });
    return () => {
      disposed = true; observer?.disconnect();
      if (game) { game.destroy(true); if (game.isBooted) game.step(performance.now(), 0); else game.events.once('ready', () => queueMicrotask(() => game?.step(performance.now(), 0))); }
    };
  }, [bridge]);
  return <div className="squad-canvas" ref={host} role="img" aria-label="Squad battlefield. Select an enemy using the target buttons beside the arena.">{error && <p role="alert">The battlefield could not load. Reload to retry.</p>}</div>;
}
