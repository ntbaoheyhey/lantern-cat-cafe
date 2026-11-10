import { useSyncExternalStore } from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type { DepthModel } from '../depth/model';
import { CostView } from '../shared';
import { Icon } from './Icon';
import { badgesA6 } from './badges-a6';

export function DailyA6({ m }: { m: DepthModel }) {
  useSyncExternalStore(m.subscribe, m.snapshot);
  const board = R.dailyBoardA6(m.state, m.cafeNow), badges = badgesA6(m.state, m.cafeNow);
  const claim = (kind: 'task' | 'weekly' | 'login', id?: string | number) => m.apply(R.claimDailyA6(m.state, m.cafeNow, kind, id), 'Cafe gift collected.');
  return <div className="a6-daily">
    <section className="a6-login" aria-label="Seven day welcome gifts">
      <div><small>A SEAT SAVED FOR YOU</small><h2>Seven evenings, seven gifts</h2><p>Come back on a new day. Missed days keep your place.</p></div>
      <div className="a6-login-days">{R.LOGIN_GIFTS_A6.map((reward, i) => <div key={i} data-current={i === board.progress.loginGifts} data-collected={i < board.progress.loginGifts}>
        <small>Day {i + 1}</small><Icon name="chest"/><CostView cost={reward}/><b>{i < board.progress.loginGifts ? 'Collected' : i === board.progress.loginGifts ? 'Your next gift' : 'Coming soon'}</b>
      </div>)}</div>
      <button className="cr-primary" disabled={!!board.login.reason} title={board.login.reason ?? 'Collect your welcome gift'} onClick={() => claim('login')}>
        {board.progress.loginGifts >= 7 ? 'All seven gifts collected' : board.progress.loginDay === board.state.account.day ? 'Next gift tomorrow' : 'Collect login gift'}
      </button>
    </section>
    <section className="a6-weekly" aria-label="Weekly activity"><div><h2>This week</h2><span>{board.progress.weeklyPoints}/30 daily tasks collected</span></div>
      <progress max={30} value={Math.min(30, board.progress.weeklyPoints)} aria-label="Weekly activity progress"/>
      <div className="a6-weekly-chests">{board.weekly.map(w => <button key={w.points} disabled={!!w.reason} title={w.reason ?? 'Collect weekly chest'} onClick={() => claim('weekly', w.points)}><Icon name="chest"/><b>{w.points} tasks</b><span>{w.claimed ? 'Collected' : !w.reason ? 'Collect' : `${board.progress.weeklyPoints}/${w.points}`}</span></button>)}</div>
    </section>
    <h2>Tonight’s five tasks</h2>
    <div className="a6-daily-tasks">{board.tasks.map(t => <article key={t.id}><h3>{t.name}</h3><p>{t.detail}</p><progress value={Number(t.complete)} max={1} aria-label={`${t.name} progress`}/><CostView cost={t.reward}/><button disabled={!!t.reason} title={t.reason ?? 'Collect task reward'} onClick={() => claim('task', t.id)}>{t.claimed ? 'Collected' : `Collect ${t.name}`}</button></article>)}</div>
    {(badges.stars.length + badges.tower.length + badges.journal.length > 0) && <section className="a6-earned-chests" aria-label="Earned milestone gifts"><h2>Your earned chests</h2>
      {badges.stars.map(c => <button key={c.id} onClick={() => m.apply(R.claimStarRewardV4(m.state, c.id), 'Star chest collected.')}><Icon name="chest"/>Collect {c.target}-star chest</button>)}
      {badges.tower.map(f => <button key={f} onClick={() => m.apply(R.claimTowerChestA6(m.state, f), 'Tower chest collected.')}><Icon name="chest"/>Collect floor {f} chest</button>)}
      {badges.journal.map(c => <button key={c.id} onClick={() => m.apply(R.claimMilestoneV4(m.state, c.id), 'Journal gift collected.')}><Icon name="chest"/>Collect {c.name}</button>)}
    </section>}
  </div>;
}
