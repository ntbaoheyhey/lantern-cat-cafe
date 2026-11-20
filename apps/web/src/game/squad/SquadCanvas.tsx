import { useEffect, useRef, useState } from 'react';
import type Phaser from 'phaser';
import { SQUAD_CONFIG as C } from '@taskbar-hero/game-rules/src/squad/config';
import type { BattleEvent } from '@taskbar-hero/game-rules/src/squad/types';
import type { SquadScene } from './SquadScene';
import type { SquadController } from './controller';
import { createManagedGame } from '../managedGame';

export function SquadCanvas({ controller, calm, onTarget }: { controller: SquadController; calm: boolean; onTarget: (id: string) => void }) {
  const host = useRef<HTMLDivElement>(null), scene = useRef<SquadScene | null>(null);
  const latest = useRef({ calm, onTarget }); latest.current = { calm, onTarget };
  const [error, setError] = useState(false);
  useEffect(() => {
    let canceled = false, game: Phaser.Game | undefined;
    let unsubscribe: (() => void) | undefined, unsubscribeState: (() => void) | undefined;
    void Promise.all([import('phaser'), import('./SquadScene')]).then(([{ default: P }, { SquadScene }]) => {
      if (canceled || !host.current) return;
      const s = new SquadScene(); scene.current = s;
      s.onTarget = id => latest.current.onTarget(id);
      game = createManagedGame(P, { type: P.CANVAS, parent: host.current, width: C.presentation.width,
        height: C.presentation.height, transparent: true, pixelArt: true, antialias: false,
        banner: false, audio: { noAudio: true }, fps: { target: C.presentation.fps, forceSetTimeOut: true }, scene: [] });
      s.calm = latest.current.calm;
      game.scene.add('squad', s, true);
      s.reset(controller.battle.events);
      unsubscribe = controller.subscribeEvents((events: readonly BattleEvent[], reset: boolean) => {
        if (reset) s.reset(events); else s.consume(events);
      });
      s.clock = () => ({ time: controller.battle.time, running: controller.running, speed: controller.speed, priority: controller.priority });
      // Opt-in local review hook; Vite removes this branch from production builds.
      if (import.meta.env.DEV && new URLSearchParams(location.search).get('squadDebug') === '1') {
        Object.assign(window, { __squadReview: { controller, scene: s, game } });
      }
      unsubscribeState = controller.subscribe(() => s.invalidate());
      game.events.on(P.Core.Events.POST_RENDER, () => { if (s.loaded && !controller.running) game?.loop.sleep(); });
    }).catch(() => { if (!canceled) setError(true); });
    return () => {
      canceled = true; unsubscribe?.(); unsubscribeState?.(); scene.current = null;
      if (import.meta.env.DEV) Reflect.deleteProperty(window, '__squadReview');
      if (!game) return;
      const retiring = game; retiring.destroy(true);
      if (retiring.scene.isBooted) retiring.step(performance.now(), 0);
      else retiring.events.once('ready', () => queueMicrotask(() => retiring.step(performance.now(), 0)));
    };
  }, [controller]);
  useEffect(() => { if (scene.current) { scene.current.calm = calm; scene.current.invalidate(); } }, [calm]);
  return <div className="sq-canvas" ref={host} role="img" aria-label="Three cats fighting independent enemies. Use the target buttons to select a foe.">
    {error && <p role="alert">The battlefield could not load. Retry the encounter or reload this local build.</p>}
  </div>;
}
