import { useEffect, useMemo, useState } from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type { DepthModel } from './model';
import AdviceWorker from './advice-worker?worker&inline';
export function AdviceV4({ m }: { m: DepthModel }) {
  const battle = m.battle!, state = useMemo(() => R.resultAdviceStateV4(m.state), [m.state]);
  const key = state.ok ? R.adviceBuildKeyV4(state.state) : '';
  const [answer, setAnswer] = useState<{ key: string; advice: R.BuildAdviceV4 | null; error?: boolean } | null>(null);
  useEffect(() => {
    if (!key || !state.ok) return;
    let active = true, worker: Worker | undefined;
    try {
      worker = new AdviceWorker();
      worker.onmessage = event => {
        if (active && event.data.key === key) setAnswer({key, advice:event.data.result ?? null, error:!!event.data.error});
        worker?.terminate();
      };
      worker.onerror = () => { if (active) setAnswer({key, advice:null, error:true}); worker?.terminate(); };
      worker.postMessage({key, state:state.state, setup:battle.initial});
    } catch { setAnswer({key, advice:null, error:true}); worker?.terminate(); }
    return () => { active = false; worker?.terminate(); };
  // The build key binds every state field used by the worker. Encounter is fixed on this result screen.
  }, [key, battle]);
  if (!key || m.replay || m.tutorialBattle) return null;
  const current = answer?.key === key ? answer : null;
  const fallback = R.gameplayA6(m.state) && state.ok ? R.upgradeOptionsA6(state.state).sort((a,b)=>Object.values(a.cost).reduce((n,v)=>n+v,0)-Object.values(b.cost).reduce((n,v)=>n+v,0))[0] : undefined;
  const firstCat = m.state.team[0]!;
  const fallbackChange=fallback?.change;
  const trainingCat=(fallbackChange?.kind==='level'||fallbackChange?.kind==='ascend'?m.state.account.cards.find(c=>c.id===fallbackChange.cardId)?.cardId:undefined)??firstCat;
  const openFix = () => { const change=fallback?.change;m.improveTeam(); if(change?.kind==='level'||change?.kind==='ascend')m.cardId=m.state.account.cards.find(c=>c.id===change.cardId)?.cardId??firstCat;else m.cardId=firstCat;if(change?.kind==='enhance')m.itemId=change.gearId;m.go(change?.kind==='enhance'?'inventory':'collection'); };
  return <section className="cr-panel dp-v4-advice" aria-label="Your next change" aria-live="polite">
    <h2>One change for your next try</h2>
    {!current ? <p>Checking changes your crew can make now…</p> : current.advice ? <>
      <p>{current.advice.label}</p><p>{Object.entries(current.advice.cost).map(([name,n]) => `${n} ${name}`).join(' · ') || 'No currency needed.'}</p>
      <button className={R.gameplayV4(m.state) ? "cr-primary" : undefined} onClick={() => m.applyResultAdvice(current.advice!)}>Apply and retry route</button>
      <small>Your earned rewards stay. A fresh route starts at the first stop.</small>
    </> : <><p>{R.gameplayA6(m.state) ? fallback?.label ?? `Collect patrol supplies, then train ${R.CAT_BY_ID[firstCat]!.name}.` : current.error ? 'The suggestion is unavailable. Review your crew before returning.' : 'No stronger available change stood out in this forecast.'}</p>
      <button className={R.gameplayV4(m.state) ? "cr-primary" : undefined} onClick={() => R.gameplayA6(m.state)?openFix():m.improveTeam()}>{R.gameplayA6(m.state)?fallback?.change.kind==='enhance'?'Open this gear':`Open ${R.CAT_BY_ID[trainingCat]!.name} training`:'Open team preparation'}</button></>}
  </section>;
}
