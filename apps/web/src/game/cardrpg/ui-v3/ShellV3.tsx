import {GameIcon} from '../../../ui/GameIcon';
import {HomeExtras,WalletChip,openPage} from '../shell/HomeExtras';
import {audioEngine} from '../../../audio/engine';
import {soundScene,ambienceScene} from '../../../audio/scene';
import '../shell/shell.css';
import {TextDietContext,HelpC2} from './TextDietC2';
import {chainFlags} from '../chain/flags';
import {ReceiptToast} from '../chain/ReceiptToast';
import './text-diet-c2.css';
import { FirstStepsA6, IntroductionA6, firstStepViewA6 } from './IntroductionA6';
import type { EIP1193Provider } from 'viem';
import { PowerA6, PatrolGearA6 } from './PowerA6';
import {lazy,Suspense,useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type {DepthModel,Screen} from '../depth/model';
import {artPropsA6 as portraitProps} from './art-a6';
import {showReviewTools} from '../depth/player-mode';
import {homeView,patrolDefaults} from './selectors';
import {Icon,type IconName} from './Icon';
import './ui-v3.css';
import './lantern-a6.css';
import './keepsakes-a6.css';
import './journal-a6.css';
import './guide-settings-a6.css';
import './formation-desk-a6.css';
import './bond-album-a6.css';
import './cat-skills-a6.css';
import './cat-preview-a6.css';
import './bag-workbench-a6.css';
import './tower-gifts-a6.css';
import './home-signs-a6.css';
import './cafe-menu-a6.css';
import './first-steps-c.css';
import './supplies-c.css';
import '../shell/screen-skin.css';
import '../shell/motion-b2.css';
import {openPanelB2,useMenuClose} from '../shell/motion-b2';
import {CountUpA6} from './CountUpA6';
import {SheetBoundary,SheetLoading} from './SheetRecovery';
import {useNewDiscoveries} from './useNewDiscoveries';
import {RewardFly} from './RewardFly';
import {HomeScene} from './HomeScene';
const Tower=lazy(()=>import('./TowerA6').then(m=>({default:m.TowerA6})));
const BondBook=lazy(()=>import('./BondsA6').then(m=>({default:m.BondBookA6})));
const CatsSheet=lazy(()=>import('./SheetsV3').then(m=>({default:m.CatsSheet})));
const TeamSheet=lazy(()=>import('./SheetsV3').then(m=>({default:m.TeamSheet})));
const BagSheet=lazy(()=>import('./SheetsV3').then(m=>({default:m.BagSheet})));
const EventsSheet=lazy(()=>import('./SheetsV3').then(m=>({default:m.EventsSheet})));
const RouteMap=lazy(()=>import('./EncounterV3').then(m=>({default:m.RouteV3})));
const Prepare=lazy(()=>import('./EncounterV3').then(m=>({default:m.PrepareV3})));
const Result=lazy(()=>import('./EncounterV3').then(m=>({default:m.ResultV3})));
const Recruit=lazy(()=>import('./RecruitV3'));
const FeelLab=lazy(()=>import('../depth/FeelLab').then(m=>({default:m.FeelLab})));
const labels:Partial<Record<Screen,string>>={tower:'Yarn Tower',bonds:'Bond Book',collection:'Cats',journal:'Cats',team:'Team',inventory:'Bag',relics:'Bag',gacha:'Recruit',codex:'Field guide',save:'Settings',evidence:'Before / after',map:'Night route',prepare:'Prepare',result:'Tonight’s story'};
const dock:[Screen,string,IconName][]=[['team','Team','team'],['collection','Cats','cats'],['inventory','Bag','bag']];
export default function ShellV3(props:{m:DepthModel;children:ReactNode}) {
 return <><ReceiptToast/><CafeShellV3 {...props}/></>;
}
function CafeShellV3({m,children}:{m:DepthModel;children:ReactNode}) {
 const isBoss=m.battle?.initial.enemies.some(id=>R.ENEMY_BY_ID[id]?.tier==='boss')??false;
 const musicScene=soundScene(m.screen,m.showBattle,isBoss),ambientScene=ambienceScene(m.screen,m.showBattle,isBoss,m.battle?.initial.chapter??m.state.run?.chapter??1);
 const audioRoster=m.showBattle?m.battle?.actors.map(actor=>actor.catalogId).join('|'):undefined;
 useEffect(()=>{audioEngine.setBattleRoster(audioRoster?.split('|'));},[audioRoster]);
 useEffect(()=>{audioEngine.music(musicScene);},[musicScene]);
 useEffect(()=>{audioEngine.ambience(ambientScene);},[ambientScene]);
 const seasonSnapshot=m.snapshot();
 useEffect(()=>{
  const publish=()=>{const b=R.dailyBoardA6(m.state,m.cafeNow);window.dispatchEvent(new CustomEvent('shell:season-progress',{detail:{points:b.progress.weeklyPoints,days:b.weekDaysLeft,rewards:b.weekly.map(r=>({points:r.points,claimed:r.claimed,reason:r.reason,reward:r.reward}))}}));};
  const claim=(e:Event)=>{const points=(e as CustomEvent<unknown>).detail;if(typeof points==='number'&&[10,20,30].includes(points)){m.apply(R.claimDailyA6(m.state,m.cafeNow,'weekly',points),'Collected.');publish();}};
  window.addEventListener('shell:season-request',publish);window.addEventListener('shell:season-claim',claim);publish();
  return()=>{window.removeEventListener('shell:season-request',publish);window.removeEventListener('shell:season-claim',claim);};
 },[m,seasonSnapshot,m.cafeNow]);
 const [eventPage,setEventPage]=useState<'login'|'weekly'>('login');
 const [menu,setMenu]=useState(false),[events,setEvents]=useState(false),[bagTab,setBagTab]=useState('gear'),[route,setRoute]=useState(false);
 const view=useMemo(()=>homeView(m.state,m.cafeNow),[m,m.state,m.snapshot()]);
 const newItems=useNewDiscoveries(m);
 const walletProvider=(window as unknown as {ethereum?:EIP1193Provider}).ethereum;
 useEffect(()=>{
  if(m.offline||!R.gameplayA6(m.state))return;
  const provider=walletProvider;
  const clear=()=>m.apply(R.acceptRelicSnapshot(m.state,43113,[]));
  provider?.on?.('accountsChanged',clear);provider?.on?.('chainChanged',clear);provider?.on?.('disconnect',clear);
  return()=>{provider?.removeListener?.('accountsChanged',clear);provider?.removeListener?.('chainChanged',clear);provider?.removeListener?.('disconnect',clear);};
 },[m,walletProvider]);
 const dialog=useRef<HTMLElement>(null),returnFocus=useRef<HTMLElement|null>(null),menuNav=useRef<HTMLElement>(null),menuTrigger=useRef<HTMLButtonElement>(null),patrolButton=useRef<HTMLButtonElement>(null);
 const introduction=R.introductionA6(m.state),introduced=(id:string)=>!R.gameplayA6(m.state)||introduction.features.some(f=>f.id===id&&f.open);
 const sheet=m.screen!=='hub'||events;
 const closeMenu=()=>{setMenu(false);menuTrigger.current?.focus();};
 const headerCat=events?'brioche':({team:'mochi',inventory:'panko',relics:'sorrel',tower:'yarn-giant',bonds:'clover',gacha:'marigold',prepare:'mochi',result:'mochi'} as Partial<Record<Screen,string>>)[m.screen]??m.cardId;
 const close=useMenuClose(dialog,()=>{setEvents(false);setMenu(false);if(m.replay){m.finish();return;}m.go('hub');requestAnimationFrame(()=>{const target=returnFocus.current;if(target?.isConnected)target.focus();else (document.querySelector<HTMLElement>(`[data-home-destination="${target?.dataset.homeDestination??''}"]`)??document.querySelector<HTMLElement>('.uv-menu-button'))?.focus();});});
 const go=(screen:Screen)=>{const origin=document.activeElement as HTMLElement;if(!dialog.current?.contains(origin))returnFocus.current=origin;setEvents(false);setMenu(false);setRoute(false);m.go(screen);};
 const openEvents=()=>{returnFocus.current=document.activeElement as HTMLElement;m.go('hub');setEventPage('login');setEvents(true);setMenu(false);};
 useEffect(()=>{const act=(e:Event)=>{const action=(e as CustomEvent<string>).detail;if(action==='Collect')openEvents();else go(action==='Grow'?'team':'hub');};window.addEventListener('shell:season-action',act);return()=>window.removeEventListener('shell:season-action',act);},[m]);
 useEffect(()=>{if(m.screen!=='hub')setEvents(false);if(m.screen==='prepare'&&R.gameplayA6(m.state))setRoute(false);},[m.screen,m.battle?.initial.seed]);
 useEffect(()=>{if(!sheet)return;dialog.current?.focus();const animation=openPanelB2(dialog.current);return()=>animation?.cancel();},[sheet,m.screen]);
 useEffect(()=>{if(menu&&R.gameplayA6(m.state))menuNav.current?.querySelector<HTMLButtonElement>('.a6-menu-link')?.focus();},[menu,m]);
 useEffect(()=>{
  if(!menu||!R.gameplayA6(m.state))return;
  const outside=(e:PointerEvent)=>{if(e.target instanceof Node&&!menuNav.current?.contains(e.target)&&!menuTrigger.current?.contains(e.target))setMenu(false);};
  document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);
 },[menu,m]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(m.showBattle)return;if(e.key==='Escape'){if(menu){e.preventDefault();closeMenu();}else if(sheet)close();}if(e.key==='Tab'&&(sheet||menu&&R.gameplayA6(m.state))){const surface=menu&&R.gameplayA6(m.state)?menuNav.current:dialog.current;const nodes=Array.from(surface?.querySelectorAll<HTMLElement>('button:not(:disabled),[href],input,select,textarea,summary,[tabindex="0"]')??[]).filter(n=>n.getClientRects().length);const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===surface)){e.preventDefault();last?.focus();}else if(!e.shiftKey&&(document.activeElement===last||!surface?.contains(document.activeElement))){e.preventDefault();first?.focus();}}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);});
 const patrol=()=>{setEvents(false);if(m.battle){go(m.battle.result?'result':'prepare');return;}if(m.state.tutorial<3){m.tutorial();return;}if(!m.state.run||m.state.run.complete)m.start(patrolDefaults(m.state).chapter,'campaign',patrolDefaults(m.state).band);const run=m.state.run;if(run&&!run.complete&&!run.rewardChoices.length){const next=R.availableNodes(run)[0];if(next)m.enter(next.id);}if(!m.battle)m.go('map');};
 if(m.showBattle)return null;
 return <TextDietContext.Provider value={!!m.state.formationC2}><div className={`uv-shell ${m.state.formationC2?'c2-text':''}`} data-ui-v3="true" data-a6-guide={R.gameplayA6(m.state)?firstStepViewA6(m)?.target:undefined}>
  {R.gameplayA6(m.state)&&<IntroductionA6 m={m}/>}
  {(!sheet||!m.state.formationC2)&&<HomeScene key={sheet?'sheet':'home'} m={m} onRecruit={()=>go('gacha')} onTasks={openEvents} onTower={()=>go('tower')}/>}
  <RewardFly values={m.state.account.currencies} reducedMotion={m.state.settings.reducedMotion}/><header className="uv-hud"><div className="uv-identity"><div className="uv-avatar"><img {...portraitProps(m.state.team[0]!,'face')} alt=""/><span>Lv. {m.state.account.accountLevel}</span></div><div>{!m.state.formationC2&&<b>The Lantern</b>}<small>{R.gameplayA6(m.state)?<PowerA6 value={view.power} label="Team Power" reducedMotion={m.state.settings.reducedMotion}/>:<>Team power {view.power}</>}</small></div></div>
   <div className="uv-currencies">{(['fish','stamps','threads'] as const).filter(id=>(!chainFlags().economyV3||id!=='threads')&&(R.gameplayA6(m.state)||m.state.account.currencies[id]>0||id==='fish')).slice(0,3).map(id=><span key={id} data-currency={id} className="uv-currency" aria-label={`${id}: ${m.state.account.currencies[id]}`}><GameIcon name={id==='fish'?'fish':id==='stamps'?'bell':'thread'} size={26}/>{<CountUpA6 value={m.state.account.currencies[id]} reducedMotion={m.state.settings.reducedMotion}/>}<button aria-label={`Get ${id}`} onClick={()=>go(id==='stamps'?'gacha':'inventory')}>+</button></span>)}</div>
   <WalletChip/>
   <button className="uv-menu-button" ref={menuTrigger} aria-label="Open menu" aria-expanded={menu} aria-controls={menu?'cafe-menu':undefined} onClick={()=>menu?closeMenu():setMenu(true)}><Icon name="menu"/></button>
  </header>
  {!sheet&&<><HomeExtras onForge={()=>{setBagTab('gear');go('inventory');}} onInvite={()=>go('gacha')} onTasks={openEvents} onEvents={()=>{openEvents();setEventPage('weekly');}}/><aside className="uv-events" aria-label="Ready to collect">{view.tasks>0&&<button onClick={openEvents}><Icon name="events"/><span>{m.state.formationC2?'Gifts':'Today’s tasks'}</span><i className="uv-dot"/></button>}{view.tasks===0&&view.free&&<button onClick={()=>go('gacha')}><Icon name="recruit"/><span>Free recruit</span><i className="uv-dot"/></button>}{view.tasks===0&&!view.free&&view.milestones>0&&<button onClick={()=>go('journal')}><Icon name="cats"/><span>Journal reward</span><i className="uv-dot"/></button>}</aside>
  <footer className="uv-dock"><nav aria-label="Cafe dock">{dock.map(([screen,label,icon])=><button key={screen} data-home-destination={label} disabled={screen==='team'&&!introduced('team')||screen==='inventory'&&!introduced('gear')||screen==='gacha'&&R.gameplayA6(m.state)&&m.state.tutorial<3} title={screen==='team'&&!introduced('team')?'After your first patrol':screen==='inventory'&&!introduced('gear')?'After welcoming your first friend':undefined} onClick={()=>go(screen)}><span><Icon name={icon}/>{((screen==='collection'&&(view.cats||!R.gameplayA6(m.state)&&newItems.cats))||(screen==='inventory'&&(view.gear||!R.gameplayA6(m.state)&&newItems.gear))||(screen==='gacha'&&view.recruit))&&<i className="uv-dot"/>}</span>{label}</button>)}<button data-home-destination="Forge" onClick={()=>{setBagTab('gear');go('inventory');}}><span><Icon name="forge"/></span>Forge</button><button data-home-destination="Market" onClick={()=>chainFlags().chainLoop?window.dispatchEvent(new CustomEvent('chain:open',{detail:'Market'})):openPage('economy')}><span><Icon name="market"/></span>Market</button><button data-home-destination="Season" onClick={()=>openPage('season')}><span><Icon name="season"/></span>Season</button><button data-home-destination="Guide" onClick={()=>go('codex')}><span><Icon name="guide"/></span>Guide</button></nav>
   {R.gameplayA6(m.state)&&<PatrolGearA6 m={m} onEquipped={()=>patrolButton.current?.focus()}/>}
   <div className="uv-patrol-group"><button className="uv-map-button" aria-label="Open route map" onClick={()=>{go('map');setRoute(true);}}><Icon name="arrow"/></button><button className="uv-patrol" ref={patrolButton} data-home-destination="Patrol" onClick={patrol}><Icon name="fight"/><span>Fight<small aria-label={view.subline}>{m.state.formationC2?view.subline.replace(/^Chapter (\d+) · Stop (\d+) · /,'$1/$2 · '):view.subline}</small></span><Icon name="arrow"/></button></div></footer></>}
  {menu&&<nav className="uv-menu" id="cafe-menu" ref={menuNav} aria-label="Cafe menu">
   {R.gameplayA6(m.state)&&<header className="a6-menu-heading"><Icon name="cats"/><div><small>The Lantern</small><h2>Cafe notes</h2></div><button aria-label="Close menu" onClick={closeMenu}><Icon name="close"/></button></header>}
   {R.gameplayA6(m.state)&&introduced('tower')&&<button className="a6-menu-link" aria-label="Yarn Tower" onClick={()=>go('tower')}><span>{m.state.formationC2?'Tower':'Yarn Tower'}</span><small>Floors &amp; milestone gifts</small></button>}
   <button className="a6-menu-link" aria-label="Open settings" onClick={()=>go('save')}><span>{m.state.formationC2?'Settings':'Open settings'}</span>{R.gameplayA6(m.state)&&<small>Sound, speed &amp; comfort</small>}</button>
   {Object.values(chainFlags()).some(Boolean)&&<button className="a6-menu-link" aria-label="Open Fuji wallet" onClick={()=>{closeMenu();window.dispatchEvent(new Event('chain:wallet'));}}><span>Wallet</span></button>}
   <button className="a6-menu-link" aria-label="Export / import" onClick={()=>go('save')}><span>{m.state.formationC2?'Saves':'Export / import'}</span>{R.gameplayA6(m.state)&&<small>Keep or restore your save</small>}</button>
   <button className="a6-menu-link" aria-label="Read Field guide" onClick={()=>go('codex')}><span>{m.state.formationC2?'? Guide':'Read Field guide'}</span>{R.gameplayA6(m.state)&&<small>Cats, foes &amp; battle notes</small>}</button>
   <details><summary aria-label="Read credits">{m.state.formationC2?'Credits':'Read credits'}</summary><p>The Lantern · original cats, music and cafe. Built for Taskbar Hero.</p></details>{showReviewTools(true)&&<><button onClick={()=>go('evidence')}>Before / after</button><Suspense fallback={null}><FeelLab m={m} home/></Suspense><div className="uv-demo-tools"/></>}
  </nav>}
  {sheet&&<><button className="uv-dim" tabIndex={-1} aria-label="Close sheet" onClick={close}/><section className="uv-sheet" data-sheet={events?'daily':m.screen} role="dialog" aria-label={events?'Events':labels[m.screen]} ref={dialog} tabIndex={-1}>
   <header className="uv-sheet-heading">{R.gameplayA6(m.state)&&<img className="a6-heading-art" {...portraitProps(headerCat,'art','compact')} alt=""/>}<div>{R.gameplayA6(m.state)&&<small className="a6-heading-kicker">THE LANTERN · EVENING ADVENTURES</small>}<h1>{events?(eventPage==='weekly'?'Weekly events':'Daily gifts'):labels[m.screen]}</h1></div>{m.state.formationC2&&<HelpC2 label="How to play"><p>{firstStepViewA6(m)?.detail??'Choose a portrait, compare the numbers, then use the highlighted action.'}</p><p>Shields mark the front row; bows mark the back. Keep two cats in each row and at least one living cat in front.</p><button onClick={()=>go('codex')}>Field guide</button></HelpC2>}<button className="uv-close" aria-label="Close" onClick={close}><Icon name="close"/></button></header>
   {m.screen==='prepare'&&<nav className="uv-tabs" aria-label="Patrol tabs"><button aria-current={!route?'page':undefined} onClick={()=>setRoute(false)}><GameIcon name="team" size={24}/>Prepare</button><button aria-current={route?'page':undefined} onClick={()=>setRoute(true)}><GameIcon name="chapter" size={24}/>Route</button><button onClick={()=>go('codex')} aria-label="Read Field guide">?</button></nav>}
   {['collection','journal','bonds'].includes(m.screen)&&<nav className="uv-tabs" aria-label="Cats tabs"><button aria-current={m.screen==='collection'?'page':undefined} onClick={()=>go('collection')}><GameIcon name="cats" size={24}/>My cats</button><button aria-current={m.screen==='journal'?'page':undefined} onClick={()=>go('journal')}><GameIcon name="guide" size={24}/>Journal</button>{R.gameplayA6(m.state)&&introduced('bonds')&&<button className="a6-bond-tab" aria-current={m.screen==='bonds'?'page':undefined} onClick={()=>go('bonds')}><GameIcon name="bonds" size={24}/>Bond Book</button>}</nav>}
   {['inventory','relics'].includes(m.screen)&&<nav className="uv-tabs" aria-label="Bag tabs"><button aria-current={m.screen==='inventory'&&bagTab==='gear'?'page':undefined} onClick={()=>{setBagTab('gear');go('inventory')}}><GameIcon name="gear" size={24}/>Gear</button><button aria-current={m.screen==='inventory'&&bagTab==='materials'?'page':undefined} onClick={()=>{setBagTab('materials');go('inventory')}}><GameIcon name="thread" size={24}/>Materials</button>{introduced('relic')&&<button onClick={()=>go('relics')} aria-current={m.screen==='relics'?'page':undefined}><GameIcon name="relic" size={24}/>Relics</button>}</nav>}
   <main className="uv-sheet-content cr-content" id="depth-main" data-screen={events?'events':m.screen}>{!events&&!m.state.formationC2&&<FirstStepsA6 m={m}/>}<SheetBoundary key={events?'events:'+eventPage:m.screen+':'+(route?'route':'main')} title={events?'Events':labels[m.screen]??'this page'} onClose={close}><Suspense fallback={<SheetLoading illustrated={R.gameplayA6(m.state)} title={events?'Events':labels[m.screen]??'this page'} onClose={close}/>}>{events?<EventsSheet key={eventPage} m={m} initialPage={eventPage}/>:m.screen==='tower'&&R.gameplayA6(m.state)?<Tower m={m}/>:m.screen==='bonds'&&R.gameplayA6(m.state)?<BondBook m={m}/>:m.screen==='prepare'&&route?<RouteMap m={m} onReturn={()=>setRoute(false)}/>:m.screen==='prepare'?<Prepare m={m}/>:m.screen==='result'?<Result m={m}/>:m.screen==='map'?<RouteMap m={m}/>:m.screen==='gacha'?<Recruit m={m}/>:m.screen==='collection'?<CatsSheet m={m}/>:m.screen==='team'?<TeamSheet m={m}/>:m.screen==='inventory'?<BagSheet key={bagTab} m={m} materials={bagTab==='materials'}/>:m.screen==='evidence'&&!showReviewTools(true)?null:children}</Suspense></SheetBoundary></main>
  </section></>}
  <div className={`uv-notice ${m.error?'uv-error':''}`} role={m.error?'alert':'status'}>{m.error?<><svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 22 21H2Z" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M12 9v5" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="18" r="1" fill="currentColor"/></svg><span>{m.notice}</span><button aria-label="Dismiss error" onClick={()=>{m.error=false;m.notice='';m.notify(false);}}><svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2"/></svg></button></>:''}</div>
 </div></TextDietContext.Provider>;
}
