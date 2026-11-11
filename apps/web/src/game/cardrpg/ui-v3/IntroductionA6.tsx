import { useEffect, useRef, useState } from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type { DepthModel } from '../depth/model';

const seenByModel = new WeakMap<DepthModel, Set<string>>();

export function IntroductionA6({ m }: { m: DepthModel }) {
  const intro = R.introductionA6(m.state);
  const prior = useRef(seenByModel.get(m) ?? new Set(intro.features.filter(f => f.open).map(f => f.id)));
  seenByModel.set(m, prior.current);
  const [pending, setPending] = useState<{ name: string; hint: string }[]>([]);
  const discoveryVisible = m.screen !== 'gacha' && !!m.state.v4?.journey?.pending.length;
  const celebration = discoveryVisible ? undefined : pending[0];
  const dismiss = () => setPending(queue => queue.slice(1));
  const opened = intro.features.filter(f => f.open).map(f => f.id).join(',');
  useEffect(() => {
    const next = R.introductionA6(m.state).features.filter(f => f.open && !prior.current.has(f.id));
    for (const feature of R.introductionA6(m.state).features.filter(f => f.open)) prior.current.add(feature.id);
    if (next.length) setPending(queue => [...queue, ...next]);
  }, [m, opened]);
  useEffect(() => { if (!celebration) return; m.audio.ui(); const timer = setTimeout(() => setPending(queue => queue.slice(1)), 5000); return () => clearTimeout(timer); }, [m, celebration]);
  if (!R.gameplayA6(m.state)) return null;
  return <>{m.screen === 'hub' && <aside className="a6-next-goal" aria-label="Your next goal"><small>NEXT LITTLE ADVENTURE</small><p>{intro.goal}</p></aside>}
    {celebration && <aside className="a6-unlock-toast" role="status"><span aria-hidden="true">✦</span><div><small>NOW OPEN</small><strong>{celebration.name}</strong><p>{celebration.hint}</p></div><button aria-label="Dismiss celebration" onClick={dismiss}>×</button></aside>}
  </>;
}
