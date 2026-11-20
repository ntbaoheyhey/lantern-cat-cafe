import {TaskProgressC2} from './CompactLabelsC2';
import {GameIcon} from '../../../ui/GameIcon';
import {RewardOddsC2} from './OddsC2';
import {HelpC2} from './TextDietC2';
import { useId, useRef, useState, useSyncExternalStore } from 'react';
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

export function DailyA6({ m, initialPage='login' }: { m: DepthModel; initialPage?: 'login'|'weekly' }) {
  useSyncExternalStore(m.subscribe, m.snapshot);
  const [section, setSection] = useState<'board' | 'gifts'>('board');
  const panelId = useId();
  const [compactPage,setCompactPage]=useState<string>(initialPage);
  const taskHeading = useRef<HTMLHeadingElement>(null);
  const board = R.dailyBoardA6(m.state, m.cafeNow), badges = badgesA6(m.state, m.cafeNow);
  const reducedLogin = !board.login.reason && giftReducedA6(board.login.requested, board.login.reward);
  const reducedWeekly = board.weekly.some(w => !w.reason && giftReducedA6(w.requested, w.reward));
  const reducedTasks = board.tasks.some(t => !t.reason && giftReducedA6(t.requested, t.reward));
  const weeklyReset = board.weekDaysLeft === 1 ? 'Weekly gifts reset tomorrow.' : `Weekly gifts reset in ${board.weekDaysLeft} days.`;
  const loginLabel = board.progress.loginGifts >= 7 ? 'All seven gifts collected' : board.progress.loginDay === board.state.account.day ? 'Next gift tomorrow' : 'Collect login gift';
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
  if(m.state.formationC2)return <div className="a6-daily-book c2-reward-book">
    <nav className="a6-daily-sections" aria-label="Daily gift sections">{[['login','Login'],['weekly','Weekly'],['tasks','Tasks'],['gifts','Gifts']].map(([id,label])=><button key={id} aria-pressed={compactPage===id} onClick={()=>setCompactPage(id!)}><GameIcon name={({login:'chest',weekly:'season',tasks:'quest',gifts:'bag'} as Record<string,string>)[id!]!} size={32}/>{label}</button>)}<HelpC2 label="Cafe gifts"><p>{weeklyReset}</p><p>{REDUCED_GIFT_NOTE_A6}</p><p>{waitingReasons.join(' ')||'Missed login days keep your place. Each daily task adds one weekly point.'}</p></HelpC2></nav>
    {compactPage==='login'&&<section className="a6-login" aria-label="Seven day welcome gifts"><div className="a6-login-days">{R.LOGIN_GIFTS_A6.map((reward,i)=><div key={i} data-current={i===board.progress.loginGifts} data-collected={i<board.progress.loginGifts}><small aria-label={'Day '+(i+1)}>{i+1}</small><GiftArtA6 variant={i}/><DailyReward cost={reward}/><b aria-label={i<board.progress.loginGifts?'Collected':'Pending'}>{i<board.progress.loginGifts?'Done':i===board.progress.loginGifts?'Collect':'·'}</b></div>)}</div><GiftAmountsA6 requested={board.login.requested} reward={board.login.reward}/><button className="cr-primary" disabled={!!board.login.reason} title={board.login.reason??loginLabel} aria-label={loginLabel} onClick={()=>claim('login')}><GameIcon name="bag" size={18}/> {board.login.claimed?'Collected':reducedLogin?'Collect less':'Collect'}</button><RewardOddsC2 source="Login gift" reward={board.login.reward}/><HelpC2 label="Login gift"><p>{board.login.reason??'Collect once each day. Missed days keep your place.'}</p>{reducedLogin&&<p>{REDUCED_GIFT_NOTE_A6}</p>}</HelpC2></section>}
    {compactPage==='weekly'&&<section className="a6-weekly" aria-label="Weekly activity"><b>{board.progress.weeklyPoints}/30 · <GameIcon name="clock" size={18}/> {board.weekDaysLeft}</b><progress max={30} value={Math.min(30,board.progress.weeklyPoints)} aria-label="Weekly activity progress"/><div className="a6-weekly-chests">{board.weekly.map(w=><article key={w.points} data-collected={w.claimed}><GiftArtA6 variant={w.points/10}/><b>{board.progress.weeklyPoints}/{w.points}</b><GiftAmountsA6 requested={w.requested} reward={w.reward}/><RewardOddsC2 source={w.points+'-task gift'} reward={w.reward}/><button aria-label={'Collect '+w.points+'-task weekly gift'} title={w.reason??'Collect'} disabled={!!w.reason} onClick={()=>claim('weekly',w.points)}><GameIcon name={w.claimed?'check':'bag'} size={24}/> {w.claimed?'Collected':giftReducedA6(w.requested,w.reward)?'Collect less':'Collect'}</button></article>)}</div></section>}
    {compactPage==='tasks'&&<div className="a6-daily-tasks">{board.tasks.map((t,i)=><article key={t.id} data-ready={!t.reason} data-collected={t.claimed}><h3 aria-label={t.name}><TaskProgressC2 icon={['fight','upgrade','invitations','bag','home'][i]!} detail={t.detail} complete={t.complete}/></h3><GiftAmountsA6 requested={t.requested} reward={t.reward}/><RewardOddsC2 source={t.name} reward={t.reward}/><HelpC2 label={t.name}><p>{t.detail}</p><p>{t.reason??'Each claim adds one weekly point.'}</p>{giftReducedA6(t.requested,t.reward)&&<p>{REDUCED_GIFT_NOTE_A6}</p>}</HelpC2><button aria-label={t.claimed?t.name+': collected':'Collect '+t.name} disabled={!!t.reason} onClick={()=>claim('task',t.id)}><GameIcon name={t.claimed?'check':'bag'} size={24}/> {t.claimed?'Collected':giftReducedA6(t.requested,t.reward)?'Collect less':'Collect'}</button></article>)}</div>}
    {compactPage==='gifts'&&<div className="a6-gift-shelves">{groups.map((group,i)=><section key={group.id} className="a6-gift-shelf" aria-label={group.name}><header><h3>{group.name}</h3></header><div className="a6-gift-tickets">{group.gifts.map(g=><article key={g.id} data-ready={g.ready} data-collected={g.claimed}><GiftArtA6 variant={i}/><div><b aria-label={g.detail}>{g.detail.replace(/[^0-9/]/g,'')}</b>{!g.claimed&&!g.ribbon&&<GiftAmountsA6 requested={g.requested} reward={g.reward}/>}<RewardOddsC2 source={g.name} reward={g.ribbon?{ribbon:1}:g.reward}/><HelpC2 label={g.name}><p>{g.detail}</p><p>{g.reason??'Ready to collect.'}</p>{giftReducedA6(g.requested,g.reward)&&<p>{REDUCED_GIFT_NOTE_A6}</p>}</HelpC2></div><button aria-label={'Collect '+g.name} disabled={!g.ready} title={g.reason??g.name} onClick={g.collect}><GameIcon name={g.claimed?'check':g.ready?'bag':'lock'} size={24}/>{g.claimed?'Done':g.ready?'Collect':'Locked'}</button></article>)}</div></section>)}</div>}
  </div>;
  return <div className="a6-daily-book">
    <nav className="a6-daily-sections" aria-label="Daily gift sections">
      <button aria-pressed={section === 'board'} aria-controls={panelId} onClick={() => setSection('board')}>Daily board <span data-ready={boardCount > 0}>{boardCount}</span></button>
      <button aria-pressed={section === 'gifts'} aria-controls={panelId} onClick={() => setSection('gifts')}>Ready gifts <span data-ready={readyCount > 0}>{readyCount}</span></button>
      {section==='board'&&<button className="a6-daily-tasks-link" onClick={()=>{taskHeading.current?.focus({preventScroll:true});taskHeading.current?.scrollIntoView({block:'start'});}}>Tonight’s tasks <GameIcon name="download" size={18}/></button>}
      <p id={panelId+'-availability'} role="status">{section === 'board' && waitingReasons.length ? waitingReasons.join(' ') : 'Daily treats & adventure keepsakes'}</p>
    </nav>
    <div id={panelId}>
    {section === 'board' ? <div className="a6-daily">

    <section className="a6-login" aria-label="Seven day welcome gifts">
      <div><small>A SEAT SAVED FOR YOU</small><h2>Seven evenings, seven gifts</h2><p>Come back on a new day. Missed days keep your place.</p></div>
      <div className="a6-login-days">{R.LOGIN_GIFTS_A6.map((reward, i) => <div key={i} data-current={i === board.progress.loginGifts} data-collected={i < board.progress.loginGifts}>
        <small>Day {i + 1}</small><GiftArtA6 variant={i}/><DailyReward cost={reward}/><b>{i < board.progress.loginGifts ? 'Collected' : i === board.progress.loginGifts ? board.login.reason && !board.login.claimed ? 'Waiting' : 'Next gift' : 'Later'}</b>
      </div>)}</div>
      {!board.login.claimed&&<div className="a6-login-claim" id={panelId+'-login-claim'}><b>Day {board.login.gift} gift</b><GiftAmountsA6 requested={board.login.requested} reward={board.login.reward}/><p className="a6-daily-gift-note">{reducedLogin?REDUCED_GIFT_NOTE_A6:board.login.reason??'Missed days keep your place.'}</p></div>}
      <button className="cr-primary" disabled={!!board.login.reason} title={board.login.reason ?? 'Collect your welcome gift'} aria-label={loginLabel} aria-describedby={panelId+'-availability'+(!board.login.claimed?' '+panelId+'-login-claim':'')} onClick={() => claim('login')}>
        {reducedLogin?'Collect reduced gift':loginLabel}
      </button>
    </section>
    <section className="a6-weekly" aria-label="Weekly activity"><img className="a6-gift-host" {...artPropsA6('brioche')} alt=""/><div><h2>This week</h2><span>{board.progress.weeklyPoints}/30 daily tasks collected</span></div>
      <progress max={30} value={Math.min(30, board.progress.weeklyPoints)} aria-label="Weekly activity progress"/>
      <p className="a6-weekly-reset" id={panelId+'-weekly-reset'}>{weeklyReset}{reducedWeekly&&<> Collecting a reduced gift uses the whole gift.{board.weekDaysLeft>1&&' Wait for a new day this week for the full amount.'}</>}</p>
      <div className="a6-weekly-chests">{board.weekly.map(w => {const partial=!w.reason&&giftReducedA6(w.requested,w.reward),detailId=panelId+'-weekly-'+w.points;return <article key={w.points} data-collected={w.claimed}><GiftArtA6 variant={w.points/10}/><b>{w.points} tasks</b><div id={detailId}>{!w.claimed&&<GiftAmountsA6 requested={w.requested} reward={w.reward}/>}<span className="a6-daily-gift-note">{w.claimed?'Collected':partial?'Uses the whole gift.':w.reason?board.progress.weeklyPoints>=w.points?'Gift waiting':`${board.progress.weeklyPoints}/${w.points}`:'Ready to collect'}</span></div>
        <button aria-label={`Collect ${w.points}-task weekly gift`} aria-describedby={`${detailId} ${panelId}-weekly-reset ${panelId}-availability`} disabled={!!w.reason} title={w.reason??'Collect weekly chest'} onClick={()=>claim('weekly',w.points)}>{w.claimed?'Collected':partial?'Collect reduced gift':'Collect gift'}</button></article>;})}</div>
    </section>
    <div className="a6-task-heading"><h2 ref={taskHeading} tabIndex={-1}>Tonight’s five tasks</h2><p id={panelId+'-task-reset'}>Task gifts reset tomorrow. {board.taskWeeklyPointGain?'Each claim adds 1 weekly point.':'Weekly points are full.'}{reducedTasks&&' Collecting a reduced gift uses the whole gift.'}</p></div>
    <div className="a6-daily-tasks">{board.tasks.map(t => {const partial=!t.reason&&giftReducedA6(t.requested,t.reward),detailId=panelId+'-task-'+t.id;return <article key={t.id} data-ready={!t.reason} data-collected={t.claimed}><h3>{t.name}</h3><p>{t.detail}</p><span className="a6-task-state"><span aria-hidden="true">{t.complete?'Done':'Pending'}</span> {t.claimed?'Gift collected':!t.complete?'In progress':t.reason?'Gift waiting':'Ready to collect'}</span><div id={detailId}>{!t.claimed&&<GiftAmountsA6 requested={t.requested} reward={t.reward}/>} {partial&&<span className="a6-daily-gift-note">Uses the whole gift.</span>}</div><button aria-label={t.claimed ? `${t.name}: collected` : `Collect ${t.name}`} aria-describedby={`${detailId} ${panelId}-task-reset ${panelId}-availability`} disabled={!!t.reason} title={t.reason ?? 'Collect task reward'} onClick={() => claim('task', t.id)}>{t.claimed ? 'Collected' : partial?'Collect reduced gift':'Collect gift'}</button></article>;})}</div>
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
