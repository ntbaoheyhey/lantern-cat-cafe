import { useEffect, useMemo, useState } from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type { DepthModel } from './model';
import AdviceWorker from './advice-worker?worker&inline';
export function AdviceV4({ m }: { m: DepthModel }) {
  const battle = m.battle!, state = useMemo(() => R.resultAdviceStateV4(m.state), [m.state]);
  const a6 = R.gameplayA6(m.state);
  const key = state.ok && !m.replay && !m.tutorialBattle ? R.adviceBuildKeyV4(state.state) : '';
  const [answer, setAnswer] = useState<{ key: string; battle: typeof battle; advice: R.BuildAdviceV4 | null; error?: 'unavailable' | 'timeout' } | null>(null);
  const fallback = useMemo(() => a6 && state.ok ? R.upgradeOptionsA6(state.state)
    .sort((a,b) => Object.values(a.cost).reduce((n,v) => n+v,0)-Object.values(b.cost).reduce((n,v) => n+v,0))[0] : undefined, [a6, state]);
  useEffect(() => {
    if (!key || !state.ok) return;
    let active = true, worker: Worker | undefined;
    const finish = (advice: R.BuildAdviceV4 | null, error?: 'unavailable' | 'timeout') => {
      if (!active) return;
      active = false;
      clearTimeout(timer);
      worker?.terminate();
      setAnswer({key, battle, advice, error});
    };
    const timer = setTimeout(() => finish(null, 'timeout'), 8_000);
    try {
      worker = new AdviceWorker();
      worker.onmessage = event => {
        if (active && event.data?.key === key) finish(event.data.result ?? null, event.data.error ? 'unavailable' : undefined);
      };
      worker.onerror = () => finish(null, 'unavailable');
      worker.postMessage({key, state:state.state, setup:battle.initial});
    } catch { finish(null, 'unavailable'); }
    return () => { active = false; clearTimeout(timer); worker?.terminate(); };
  // The build key binds the advice state; battle identity also prevents an earlier encounter's answer from appearing.
  }, [key, battle]);
  if (!key) return null;
  const current = answer?.key === key && answer.battle === battle ? answer : null;
  const firstCat = m.state.team[0]!;
  const fallbackChange=fallback?.change;
  const trainingCat=(fallbackChange?.kind==='level'||fallbackChange?.kind==='ascend'?m.state.account.cards.find(c=>c.id===fallbackChange.cardId)?.cardId:undefined)??firstCat;
  const openFix = () => {
    const change=fallback?.change;
    m.improveTeam();
    if (!change || m.error) return;
    m.cardId=change.kind==='level'||change.kind==='ascend'?m.state.account.cards.find(c=>c.id===change.cardId)?.cardId??firstCat:firstCat;
    if(change.kind==='enhance')m.itemId=change.gearId;
    m.go(change.kind==='enhance'?'inventory':'collection');
  };
  const costText = (cost: Record<string, number>) => Object.entries(cost).filter(([,n]) => n > 0).map(([name,n]) => `${n} ${name}`).join(' · ') || 'No currency needed.';
  return <section className="cr-panel dp-v4-advice" aria-label="Your next change" aria-live="polite" data-advice-state={!current?'checking':current.error??(current.advice?'ready':'no-change')}>
    <h2>One change for your next try</h2>
    {!current && <p className="a6-advice-status">Comparing crew changes…</p>}
    {current?.advice ? <>
      <p>{current.advice.label}</p><p className="a6-advice-cost">Cost: <b>{costText(current.advice.cost)}</b></p>
      <button className={R.gameplayV4(m.state) ? 'cr-primary' : undefined} onClick={() => m.applyResultAdvice(current.advice!)}>{m.state.run?.towerA6?'Apply and retry floor':'Apply and retry route'}</button>
      <small>{m.state.run?.towerA6?'Your earned rewards stay. Retry this Tower floor with the change.':'Your earned rewards stay. A fresh route starts at the first stop.'}</small>
    </> : a6 ? <>
      {current?.error && <p className="a6-advice-status">The comparison is unavailable. You can still prepare your crew.</p>}
      <p>{fallback?.label ?? 'No affordable upgrade right now. Try a different formation.'}</p>
      <p className="a6-advice-cost">{fallback?<>Cost: <b>{costText(fallback.cost)}</b></>:<b>Formation changes are free.</b>}</p>
      <button className="cr-primary" onClick={openFix}>{fallback?fallback.change.kind==='enhance'?'Review this gear':`Review ${R.CAT_BY_ID[trainingCat]!.name} training`:'Review team formation'}</button>
      <small>Return to the cafe. Your earned rewards stay; {fallback?'review before buying.':'no currency is spent.'}</small>
    </> : current && <>
      <p>{current.error?'The suggestion is unavailable. Review your crew before returning.':'No stronger available change stood out in this forecast.'}</p>
      <button className={R.gameplayV4(m.state)?'cr-primary':undefined} onClick={() => m.improveTeam()}>Open team preparation</button>
    </>}
  </section>;
}
