import { useEffect, useState } from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { QUESTS } from '@taskbar-hero/game-rules/cardrpg';
import { CostView, PageTitle } from '../shared';
import type { DepthModel, Screen } from './model';

export function CafeBoardV4({ m }: { m: DepthModel }) {
  const [, tick] = useState(0);
  useEffect(() => { const timer = window.setInterval(() => { const now=m.cafeNow,previous=m.state.idle.dayKey??Math.floor(m.state.idle.lastAt/86400000); if(Math.floor(now/86400000)>previous){const refreshed=R.syncCalendarDay(m.state,now);if(refreshed.ok)m.apply(refreshed,'A new cafe day is ready.');} tick(n => n + 1); }, 1000); return () => clearInterval(timer); }, [m]);
  const active = !!m.state.run && !m.state.run.complete;
  const shift = R.cafeShiftV4(m.state, m.cafeNow);
  const useful = !shift.rollback && shift.claims > 0 && Object.values(shift.reward).some(n => n > 0);
  const lesson = R.currentLessonV4(m.state);
  const claimable = QUESTS.map(q => R.boardPreviewV4(m.state, q.id)).find(p => !p.reason);
  const next = active ? { text: 'Your route is waiting.', button: 'Continue your route', screen: 'map' }
    : claimable ? { text: `${claimable.quest.name} is ready to collect.`, button: 'Collect board reward', screen: 'hub' }
    : useful ? { text: 'The kettle has a service ready.', button: 'Collect cafe service', screen: 'hub' }
    : { text: 'Your crew has a new route to explore.', button: 'Prepare your crew', screen: 'team' };
  const nextAction = () => {
    if (!active && claimable) m.command({ type: 'claimQuest', questId: claimable.quest.id });
    else if (!active && useful) m.apply(R.claimCafeShiftV4(m.state, m.cafeNow), 'Service collected. Your board is up to date.');
    else m.go(next.screen as Screen);
  };
  return <section className="dp-v4-cafe" aria-label="Today's cafe board">
    <div className="dp-v4-meta-heading"><div><small>YOUR NEXT STEP</small><h2>Today at the cafe</h2><p>{next.text}</p></div><button onClick={nextAction}>{next.button}</button></div>
    {lesson && <article className="dp-v4-lesson"><h3>{lesson.title}</h3><p>{lesson.text}</p><div className="cr-actions"><button onClick={() => m.go(lesson.screen)}>{lesson.action}</button><button disabled={active} onClick={() => m.apply(R.finishLessonV4(m.state, lesson.id), 'Ready for the next cafe tip.')}>Understood · next tip</button></div></article>}
    <div className="dp-v4-meta-grid"><article><h3>Cafe shift</h3><p>{shift.claims} ready · {shift.remaining}/2 daily services remaining</p><p>Available now: <CostView cost={shift.reward} /></p><p>{shift.rollback ? 'The clock moved backwards. Wait until it catches up.' : useful ? 'Ready when you are.' : shift.remaining === 0 ? 'Both shifts are collected. Come back after midnight UTC.' : `Next useful service in ${Math.max(1, Math.ceil((shift.readyAt - shift.now) / 60000))} minutes.`}</p><small>Up to {shift.capHours} hours count toward your next service.</small><button disabled={active || !useful} onClick={() => m.apply(R.claimCafeShiftV4(m.state, m.cafeNow), 'A warm shift, collected.')}>Claim cafe service</button>{shift.claims > 0 && !useful && !shift.rollback && <p>You’ve earned today’s limit. Your service can wait.</p>}</article>
    <article><h3>Today's board</h3>{QUESTS.map(q => { const p = R.boardPreviewV4(m.state, q.id); return <div className="dp-v4-board-task" key={q.id}><b>{q.name}</b><small>{q.id === 'daily-patrol' ? 'Complete two rewarded routes.' : q.id === 'weekly-wins' ? 'Win three rewarded routes this week.' : q.description} · {q.cadence}</small><progress aria-label={`${q.name} progress`} value={p.progress.progress} max={q.target} /><span>{p.progress.progress}/{q.target} · available <CostView cost={p.reward} />{Object.entries(p.stacks).map(([id,n]) => <span key={id}> · {n} {id}</span>)}</span><button aria-label={`Claim ${q.name}`} disabled={active || !!p.reason} onClick={() => m.command({ type: 'claimQuest', questId: q.id })}>{p.progress.claimed ? 'Collected' : 'Claim reward'}</button>{p.reason && !p.progress.claimed && <small>{p.reason}</small>}</div>; })}</article></div>
    <div className="dp-v4-meta-heading"><p>Every discovery stays in your journal.</p><button onClick={() => m.go('journal')}>Open collection journal</button></div>
  </section>;
}

export function CollectionJournalV4({ m }: { m: DepthModel }) {
  const journal = R.journalV4(m.state);
  const next = R.MILESTONES_V4.map(x => R.milestonePreviewV4(m.state, x.id)).filter(p => !p.claimed).sort((a,b) => Number(!!a.reason) - Number(!!b.reason) || b.progress/b.target - a.progress/a.target)[0];
  return <><PageTitle eyebrow="Every discovery stays" title="Your collection journal" /><section className="dp-v4-journal"><p>{journal.cats.length}/12 companions · {journal.gear.length}/{R.GEAR.length} gear designs · {journal.sets.length}/{R.SETS.length} complete sets · {journal.rewardedRoutes} rewarded routes</p><p>{next ? `Next milestone: ${next.name} · ${next.progress}/${next.target}.` : 'All milestones collected. Try a new crew tonight.'}</p><div className="dp-v4-meta-grid">{R.MILESTONES_V4.map(x => { const p = R.milestonePreviewV4(m.state, x.id); return <article key={x.id}><h2>{x.name}</h2><progress aria-label={`${x.name} progress`} value={p.progress} max={p.target} /><p>{p.progress}/{p.target} · {p.ribbon ? 'Cosmetic Cafe Ribbon' : <CostView cost={p.reward} />}</p><button aria-label={`Claim ${x.name}`} disabled={!!p.reason} onClick={() => m.apply(R.claimMilestoneV4(m.state, x.id), `${x.name} collected.`)}>{p.claimed ? 'Collected' : 'Claim milestone'}</button>{p.reason && <p>{p.reason}</p>}</article>; })}</div><h2>Discoveries</h2><details><summary>Companions · {journal.cats.length}</summary><p>{journal.cats.map(id => R.CAT_BY_ID[id]!.name).join(' · ') || 'No discoveries yet.'}</p></details><details><summary>Gear designs · {journal.gear.length}</summary><p>{journal.gear.map(id => R.GEAR_BY_ID[id]!.name).join(' · ') || 'No discoveries yet.'}</p></details><h2>Chapter mastery</h2><p>{R.CHAPTERS.map(c => `${c.name}: ${m.state.masteries.includes(c.id) ? 'mastered' : m.state.cleared.includes(c.id) ? 'cleared' : 'still to explore'}`).join(' · ')}</p><h2>Battle observations</h2><p>Read the field guide for enemy tricks. Find your last battle in Save & settings.</p><div className="cr-actions"><button onClick={() => m.go('codex')}>Open field guide</button><button onClick={() => m.go('save')}>Review last battle</button></div></section></>;
}
