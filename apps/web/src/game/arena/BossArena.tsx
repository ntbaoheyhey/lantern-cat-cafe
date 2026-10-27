import { useEffect, useRef, useState } from 'react';
import type { BossFightResultV2 } from '../../api/GameApiV2';
import { backdropFor } from '../../art/backdrops';
import { BackdropView } from '../../art/backdrops/BackdropView';
import { prefersReducedMotion } from '../combat';
import type { ArenaCueOptions } from './cues';
import './arena.css';

import { playBossFight } from './playBossFight';
export { playBossFight } from './playBossFight';
export type { PlayBossOptions } from './playBossFight';

export interface BossArenaProps extends ArenaCueOptions { result: BossFightResultV2; onDone(): void }
export function BossArena({ result, onDone, chapter, classId, catMaxHp, reducedMotion = prefersReducedMotion() }: BossArenaProps) {
  const host = useRef<HTMLDivElement>(null);
  const skipButton = useRef<HTMLButtonElement>(null);
  const skipRequested = useRef(false);
  const skip = useRef<(() => void) | null>(null);
  const callback = useRef(onDone); callback.current = onDone;
  const [hp, setHp] = useState({ cat: catMaxHp, boss: 0 });
  const [ended, setEnded] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setEnded(false); setError(''); skip.current = null; skipRequested.current = false;
    skipButton.current?.focus();
    void playBossFight(result, { parent: host.current!, signal: controller.signal, chapter, classId, catMaxHp, reducedMotion,
      onReady: action => { skip.current = action; if (skipRequested.current) action(); }, onHp: (cat, boss) => setHp({ cat, boss }),
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
    <button ref={skipButton} type="button" aria-disabled={ended} onClick={() => { if (ended) return; if (error) { setEnded(true); callback.current(); } else { skipRequested.current = true; skip.current?.(); } }}>{error ? 'Show fight result' : 'Skip fight'}</button>
  </section>;
}
