import { useEffect, useRef, useState } from 'react';
import type { BossFightResultV2 } from '../../api/GameApiV2';
import { backdropFor } from '../../art/backdrops';
import { BackdropView } from '../../art/backdrops/BackdropView';
import { prefersReducedMotion } from '../combat';
import type { ArenaCueOptions } from './cues';
import './arena.css';

export interface PlayBossOptions extends ArenaCueOptions {
  parent: HTMLElement;
  signal?: AbortSignal;
  onReady?(skip: () => void): void;
  onHp?(catHp: number, bossHp: number): void;
}
/** Resolve once the replay ends or is skipped; the owner aborts to release the canvas. */
export async function playBossFight(result: BossFightResultV2, opts: PlayBossOptions): Promise<void> {
  const [{ default: Phaser }, { ArenaScene }] = await Promise.all([import('phaser'), import('./ArenaScene')]);
  if (opts.signal?.aborted) return;
  return new Promise<void>(resolve => {
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    const game = new Phaser.Game({ type: Phaser.CANVAS, parent: opts.parent, width: 512, height: 192, transparent: true, pixelArt: true, banner: false, audio: { noAudio: true }, scene: [] });
    opts.signal?.addEventListener('abort', () => { game.destroy(true); finish(); }, { once: true });
    game.scene.add('boss-arena', ArenaScene, true, { ...opts, result, ready: opts.onReady ?? (() => {}), hp: opts.onHp ?? (() => {}), done: finish });
  });
}
export interface BossArenaProps extends ArenaCueOptions { result: BossFightResultV2; onDone(): void }
export function BossArena({ result, onDone, chapter, classId, catMaxHp, reducedMotion = prefersReducedMotion() }: BossArenaProps) {
  const host = useRef<HTMLDivElement>(null);
  const skip = useRef<(() => void) | null>(null);
  const callback = useRef(onDone); callback.current = onDone;
  const [hp, setHp] = useState({ cat: catMaxHp, boss: 0 });
  const [ended, setEnded] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setEnded(false); setError(''); skip.current = null;
    void playBossFight(result, { parent: host.current!, signal: controller.signal, chapter, classId, catMaxHp, reducedMotion,
      onReady: action => { skip.current = action; }, onHp: (cat, boss) => setHp({ cat, boss }),
    }).then(() => { if (!controller.signal.aborted) { setEnded(true); callback.current(); } }).catch(() => {
      if (!controller.signal.aborted) setError('The arena could not load. Show the fight result to continue.');
    });
    return () => controller.abort();
  }, [result, chapter, classId, catMaxHp, reducedMotion]);
  return <section className="boss-arena" aria-label="Boss arena">
    <div className="boss-arena-stage"><BackdropView art={backdropFor(chapter)} width={256} scale={2} /><div ref={host} className="boss-arena-canvas" /></div>
    <p aria-label="Fight health">Cat HP {Math.round(hp.cat)} · Boss HP {Math.round(hp.boss)}</p>
    <p role="status">{ended ? result.won ? 'Victory — boss defeated' : 'Defeat — rest and try again' : 'Boss fight in progress'}</p>
    {error && <p role="alert">{error}</p>}
    <button type="button" disabled={ended} onClick={() => error ? (setEnded(true), callback.current()) : skip.current?.()}>{error ? 'Show fight result' : 'Skip fight'}</button>
  </section>;
}
