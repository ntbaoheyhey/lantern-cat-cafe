import { useId, useState, useSyncExternalStore } from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type { DepthModel } from '../depth/model';
import type { Cost } from '@taskbar-hero/game-rules/cardrpg';
import { currencyIconA6 } from './CountUpA6';
import {GiftArtA6} from './KeepsakeArtA6';
import {artPropsA6} from './art-a6';
import { badgesA6 } from './badges-a6';
import {GiftAmountsA6,giftReducedA6,REDUCED_GIFT_NOTE_A6} from './GiftAmountsA6';

function DailyReward({ cost }: { cost: Cost }) {
  const rewards = Object.entries(cost).filter(([, count]) => count > 0);
  return rewards.length ? <span className="a6-daily-rewards">{rewards.map(([id, count]) => <span key={id} title={`${count} ${id}`} role="img" aria-label={`${count} ${id}`}><i aria-hidden="true">{currencyIconA6(id)}</i><b aria-hidden="true">{count}</b></span>)}</span> : <span className="a6-daily-reward-empty">At daily limit</span>;
}

export function DailyA6({ m }: { m: DepthModel }) {
  useSyncExternalStore(m.subscribe, m.snapshot);
  const [section, setSection] = useState<'board' | 'gifts'>('board');
  const panelId = useId();
  const board = R.dailyBoardA6(m.state, m.cafeNow), badges = badgesA6(m.state, m.cafeNow);
  const waitingReasons = [...new Set([
    ...(!board.login.claimed ? [board.login.reason] : []),
    ...board.tasks.filter(t => t.complete && !t.claimed).map(t => t.reason),
    ...board.weekly.filter(w => board.progress.weeklyPoints >= w.points && !w.claimed).map(w => w.reason),
  ].filter(Boolean))];
  const claim = (kind: 'task' | 'weekly' | 'login', id?: string | number) => m.apply(R.claimDailyA6(m.state, m.cafeNow, kind, id), 'Cafe gift collected.');
  const groups = [
    { id: 'stars', name: 'Route stars', note: 'Little lights along your path', gifts: R.STAR_REWARDS_V4.map(c => {
      const p = R.starRewardPreviewV4(m.state, c.id);
      return { ...p, name: `${c.target}-star chest`, ready: badges.stars.some(b => b.id === c.id), earned: p.progress >= c.target,
        detail: `${p.progress}/${c.target} stars`, ribbon: false,
        collect: () => m.apply(R.claimStarRewardV4(m.state, c.id), 'Star chest collected.') };
    }) },
    { id: 'tower', name: 'Yarn Tower', note: 'A parcel every five floors', gifts: R.TOWER_CHESTS_A6.map(floor => {
      const p = R.towerChestA6(m.state, floor);
      return { ...p, name: `Floor ${floor} chest`, ready: badges.tower.includes(floor), earned: m.state.towerBest >= floor,
        detail: `Floor ${Math.min(m.state.towerBest, floor)}/${floor}`, ribbon: false,
        collect: () => m.apply(R.claimTowerChestA6(m.state, floor), 'Tower chest collected.') };
    }) },
    { id: 'journal', name: 'Cafe journal', note: 'Keepsakes from your collection', gifts: R.MILESTONES_V4.map(c => {
      const p = R.milestonePreviewV4(m.state, c.id);
      return { ...p, ready: badges.journal.some(b => b.id === c.id), earned: p.progress >= c.target,
        detail: `${Math.min(p.progress, c.target)}/${c.target} ${c.kind}`,
        collect: () => m.apply(R.claimMilestoneV4(m.state, c.id), 'Journal gift collected.') };
    }) },
  ];
  const readyCount = badges.stars.length + badges.tower.length + badges.journal.length;
  const boardCount = badges.tasks.length + badges.weekly.length + Number(badges.login);
  const allCollected = groups.every(group => group.gifts.every(g => g.claimed));
  const waiting = groups.some(group => group.gifts.some(g => g.earned && !g.claimed && !g.ready));
  return <div className="a6-daily-book">
    <nav className="a6-daily-sections" aria-label="Daily gift sections">
      <button aria-pressed={section === 'board'} aria-controls={panelId} onClick={() => setSection('board')}>Daily board <span data-ready={boardCount > 0}>{boardCount}</span></button>
      <button aria-pressed={section === 'gifts'} aria-controls={panelId} onClick={() => setSection('gifts')}>Ready gifts <span data-ready={readyCount > 0}>{readyCount}</span></button>
      <p id={panelId+'-availability'} role="status">{section === 'board' && waitingReasons.length ? waitingReasons.join(' ') : 'Daily treats & adventure keepsakes'}</p>
    </nav>
    <div id={panelId}>
    {section === 'board' ? <div className="a6-daily">

    <section className="a6-login" aria-label="Seven day welcome gifts">
      <div><small>A SEAT SAVED FOR YOU</small><h2>Seven evenings, seven gifts</h2><p>Come back on a new day. Missed days keep your place.</p></div>
      <div className="a6-login-days">{R.LOGIN_GIFTS_A6.map((reward, i) => <div key={i} data-current={i === board.progress.loginGifts} data-collected={i < board.progress.loginGifts}>
        <small>Day {i + 1}</small><GiftArtA6 variant={i}/><DailyReward cost={i === board.progress.loginGifts && !board.login.claimed ? board.login.reward : reward}/><b>{i < board.progress.loginGifts ? 'Collected' : i === board.progress.loginGifts ? board.login.reason && !board.login.claimed ? 'Waiting' : 'Next gift' : 'Later'}</b>
      </div>)}</div>
      <button className="cr-primary" disabled={!!board.login.reason} title={board.login.reason ?? 'Collect your welcome gift'} aria-describedby={panelId+'-availability'} onClick={() => claim('login')}>
        {board.progress.loginGifts >= 7 ? 'All seven gifts collected' : board.progress.loginDay === board.state.account.day ? 'Next gift tomorrow' : 'Collect login gift'}
      </button>
    </section>
    <section className="a6-weekly" aria-label="Weekly activity"><img className="a6-gift-host" {...artPropsA6('brioche')} alt=""/><div><h2>This week</h2><span>{board.progress.weeklyPoints}/30 daily tasks collected</span></div>
      <progress max={30} value={Math.min(30, board.progress.weeklyPoints)} aria-label="Weekly activity progress"/>
      <div className="a6-weekly-chests">{board.weekly.map(w => <button key={w.points} aria-label={`Collect ${w.points}-task weekly gift`} aria-describedby={panelId+'-availability'} disabled={!!w.reason} title={w.reason ?? 'Collect weekly chest'} onClick={() => claim('weekly', w.points)}><GiftArtA6 variant={w.points/10}/><b>{w.points} tasks</b>{!w.claimed&&<DailyReward cost={w.reward}/>}<span>{w.claimed ? 'Collected' : !w.reason ? 'Collect' : board.progress.weeklyPoints >= w.points ? 'Gift waiting' : `${board.progress.weeklyPoints}/${w.points}`}</span></button>)}</div>
    </section>
    <h2>Tonight’s five tasks</h2>
    <div className="a6-daily-tasks">{board.tasks.map(t => <article key={t.id} data-ready={!t.reason} data-collected={t.claimed}><h3>{t.name}</h3><p>{t.detail}</p><span className="a6-task-state"><span aria-hidden="true">{t.complete?'✓':'○'}</span> {t.claimed?'Gift collected':!t.complete?'In progress':t.reason?'Gift waiting':'Ready to collect'}</span><DailyReward cost={t.reward}/><button aria-label={t.claimed ? `${t.name}: collected` : `Collect ${t.name}`} aria-describedby={panelId+'-availability'} disabled={!!t.reason} title={t.reason ?? 'Collect task reward'} onClick={() => claim('task', t.id)}>{t.claimed ? 'Collected' : 'Collect gift'}</button></article>)}</div>
    </div> : <section className="a6-earned-gifts" aria-label="Adventure milestone gifts">
      <header className="a6-gifts-intro"><GiftArtA6 variant={2}/><div>
        <h2>{readyCount ? 'Your adventures brought gifts' : allCollected ? 'Every keepsake collected' : waiting ? 'Your gifts are safely waiting' : 'More adventures, more keepsakes'}</h2>
        <p role="status">{readyCount ? `${readyCount} ready to collect · route stars, Tower & cafe journal` : allCollected ? 'All milestone gifts collected. Your daily board has tonight’s treats.' : waiting ? 'Earned gifts stay here. Finish your route or return when daily supplies have room.' : 'No milestone gifts ready yet. Each step below shows what comes next.'}</p>
      </div></header>
      <div className="a6-gift-shelves">{groups.map((group, index) => <section key={group.id} aria-label={group.name} className="a6-gift-shelf">
        <header><h3>{group.name}</h3><p>{group.note}</p>{group.gifts.some(g=>g.ready&&giftReducedA6(g.requested,g.reward))&&<p className="a6-gift-cap-note" id={panelId+'-'+group.id+'-cap'}>{REDUCED_GIFT_NOTE_A6}</p>}</header>
        <div className="a6-gift-tickets">{group.gifts.map(g => <article key={g.id} data-ready={g.ready} data-collected={g.claimed}>
          <GiftArtA6 variant={index}/><div id={panelId+'-'+g.id}><h4>{g.name}</h4>
            {g.claimed ? <span className="a6-gift-note">Collected</span> : <>{g.ribbon?<span className="a6-gift-note">Cafe ribbon</span>:<GiftAmountsA6 requested={g.requested} reward={g.reward}/>}<span className="a6-gift-note">{g.ready?giftReducedA6(g.requested,g.reward)?'Uses the whole gift.':null:g.earned?g.reason:g.detail}</span></>}
          </div>
          <button aria-label={`Collect ${g.name}`} aria-describedby={panelId+'-'+g.id+(g.ready&&giftReducedA6(g.requested,g.reward)?' '+panelId+'-'+group.id+'-cap':'')} disabled={!g.ready} title={g.reason ?? `Collect ${g.name}`} onClick={g.collect}>{g.claimed ? 'Done' : g.ready ? giftReducedA6(g.requested,g.reward)?'Collect reduced gift':'Collect' : 'Later'}</button>
        </article>)}</div>
      </section>)}</div>
    </section>}
    </div>
  </div>;
}
