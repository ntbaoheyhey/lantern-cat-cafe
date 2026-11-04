import { createManagedGame } from '../managedGame';
import type { BossFightResultV2 } from '../../api/GameApiV2';
import type { ArenaCueOptions } from './cues';

export interface PlayBossOptions extends ArenaCueOptions {
  parent: HTMLElement;
  signal?: AbortSignal;
  onReady?(skip: () => void): void;
  onHp?(catHp: number, bossHp: number): void;
  onPhase?(phase: string): void;
}
/** Resolve once the replay ends or is skipped; the owner aborts to release the canvas. */
export async function playBossFight(result: BossFightResultV2, opts: PlayBossOptions): Promise<void> {
  const [{ default: Phaser }, { ArenaScene }] = await Promise.all([import('phaser'), import('./ArenaScene')]);
  if (opts.signal?.aborted) return;
  return new Promise<void>(resolve => {
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    const game = createManagedGame(Phaser, { type: Phaser.CANVAS, parent: opts.parent, width: 512, height: 192, transparent: true, pixelArt: true, banner: false, audio: { noAudio: true }, scene: [] });
    opts.signal?.addEventListener('abort', () => {
      game.destroy(true);
      // Consume pendingDestroy even if Phaser's hidden-tab loop is asleep.
      if (game.isBooted) game.step(performance.now(), 0);
      else game.events.once('ready', () => queueMicrotask(() => game.step(performance.now(), 0)));
      finish();
    }, { once: true });
    game.scene.add('boss-arena', ArenaScene, true, { ...opts, result, ready: opts.onReady ?? (() => {}), hp: opts.onHp ?? (() => {}), phase: opts.onPhase, done: finish });
  });
}
