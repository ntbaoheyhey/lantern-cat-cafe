import { useEffect, useId, useMemo, useState } from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type { DepthModel } from './model';
import AdviceWorker from './advice-worker?worker&inline';
export function AdviceV4({ m }: { m: DepthModel }) {
  const battle = m.battle!, state = useMemo(() => R.resultAdviceStateV4(m.state), [m.state]);
  const a6 = R.gameplayA6(m.state);
  const key = state.ok && !m.replay && !m.tutorialBattle ? R.adviceBuildKeyV4(state.state) : '';
  const encounterKey = JSON.stringify([m.state.run?.id, m.state.run?.current, battle.initial]);
  const [answer, setAnswer] = useState<{ key: string; encounterKey: string; advice: R.BuildAdviceV4 | null; error?: 'unavailable' | 'timeout' } | null>(null);
  const quoteId = useId(), retryId = useId();
  const fallback = useMemo(() => a6 && state.ok ? R.upgradeOptionsA6(state.state)
    .sort((a,b) => Object.values(a.cost).reduce((n,v) => n+v,0)-Object.values(b.cost).reduce((n,v) => n+v,0))[0] : undefined, [a6, state]);
  const ownedGear = useMemo(() => a6 && state.ok ? R.autoEquipA6(state.state) : null, [a6, state]);
  useEffect(() => {
    if (!key || !state.ok) return;
    let active = true, worker: Worker | undefined;
    const finish = (advice: R.BuildAdviceV4 | null, error?: 'unavailable' | 'timeout') => {
      if (!active) return;
      active = false;
      clearTimeout(timer);
      worker?.terminate();
      setAnswer({key, encounterKey, advice, error});
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
  // Discovery acknowledgements clone the account. Only a changed build or encounter
  // should restart the comparison; unrelated receipts must not reset its timeout.
  }, [key, encounterKey]);
  if (!key) return null;
  const current = answer?.key === key && answer.encounterKey === encounterKey ? answer : null;
  const powerBefore = Math.round(R.teamPowerV4(state.state));
  const gearPower = ownedGear?.ok ? Math.round(R.teamPowerV4(ownedGear.state)) : powerBefore;
  const reviewGear = !current?.advice && gearPower > powerBefore;
  const applied = current?.advice ? R.applyAdviceV4(state.state, current.advice) : null;
  const powerAfter = applied?.ok ? Math.round(R.teamPowerV4(applied.state)) : reviewGear ? gearPower : fallback?.after;
  const firstCat = m.state.team[0]!;
  const fallbackChange=fallback?.change;
  const trainingCat=(fallbackChange?.kind==='level'||fallbackChange?.kind==='ascend'?m.state.account.cards.find(c=>c.id===fallbackChange.cardId)?.cardId:undefined)??firstCat;
  const openFix = () => {
    const change=fallback?.change;
    m.improveTeam();
    if (reviewGear || !change || m.error) return;
    m.cardId=change.kind==='level'||change.kind==='ascend'?m.state.account.cards.find(c=>c.id===change.cardId)?.cardId??firstCat:firstCat;
    if(change.kind==='enhance')m.itemId=change.gearId;
    m.go(change.kind==='enhance'?'inventory':'collection');
  };
  const costText = (cost: Record<string, number>) => Object.entries(cost).filter(([,n]) => n > 0).map(([name,n]) => `${n} ${name}`).join(' · ') || 'No currency needed.';
  const powerText = powerAfter === undefined ? '' : powerAfter === powerBefore ? `Crew Power stays ${powerBefore.toLocaleString('en-US')}.` :
    `Crew Power ${powerBefore.toLocaleString('en-US')} to ${powerAfter.toLocaleString('en-US')} (${powerAfter > powerBefore ? '+' : '−'}${Math.abs(powerAfter-powerBefore).toLocaleString('en-US')}).`;
  const retryText = m.state.run?.towerA6 ? `Retry Tower floor ${m.state.run.floor} with full crew HP.` : `Restart chapter ${m.state.run?.chapter ?? battle.chapter} at its first stop with full crew HP.`;
  return <section className="cr-panel dp-v4-advice" aria-label="Your next change" aria-live="polite" aria-busy={!current} data-advice-state={!current?'checking':current.error??(current.advice?'ready':'no-change')}>
    <h2>One change for your next try</h2>
    {!current && <p className="a6-advice-status">Comparing crew changes…</p>}
    {current?.advice ? <>
      <p>{current.advice.label}</p><p id={quoteId} className="a6-advice-cost">Cost: <b>{costText(current.advice.cost)}</b>{a6&&<small>{powerText}</small>}</p>
      <button aria-describedby={`${quoteId} ${retryId}`} className={R.gameplayV4(m.state) ? 'cr-primary' : undefined} onClick={() => m.applyResultAdvice(current.advice!)}>{m.state.run?.towerA6?'Apply and retry floor':'Apply and retry route'}</button>
      <small id={retryId}>{a6?`Your earned rewards stay. ${retryText}`:m.state.run?.towerA6?'Your earned rewards stay. Retry this Tower floor with the change.':'Your earned rewards stay. A fresh route starts at the first stop.'}</small>
    </> : a6 ? <>
      {current?.error && <p className="a6-advice-status">The comparison is unavailable. You can still prepare your crew.</p>}
      <p>{reviewGear?'Equip stronger gear you already own.':fallback?.label ?? 'No affordable upgrade right now. Try a different formation.'}</p>
      <p id={quoteId} className="a6-advice-cost">{reviewGear||fallback?<>Cost: <b>{costText(reviewGear?{}:fallback!.cost)}</b><small>{powerText}</small></>:<b>Formation changes are free.</b>}</p>
      <button aria-describedby={`${quoteId} ${retryId}`} className="cr-primary" disabled={!current} onClick={openFix}>{!current?'Finding your next change…':reviewGear?'Review owned gear':fallback?fallback.change.kind==='enhance'?'Review this gear':`Review ${R.CAT_BY_ID[trainingCat]!.name} training`:'Review team formation'}</button>
      <small id={retryId}>{!current?'The suggestion will be ready in a few seconds. Your earned rewards stay.':reviewGear?'Your earned rewards stay. In Team, choose Auto-equip best gear. No currency is spent.':<>Return to the cafe. Your earned rewards stay; {fallback?'review before buying.':'no currency is spent.'}</>}</small>
    </> : current && <>
      <p>{current.error?'The suggestion is unavailable. Review your crew before returning.':'No stronger available change stood out in this forecast.'}</p>
      <button className={R.gameplayV4(m.state)?'cr-primary':undefined} onClick={() => m.improveTeam()}>Open team preparation</button>
    </>}
  </section>;
}
