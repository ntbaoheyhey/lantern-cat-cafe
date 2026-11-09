import {lazy,Suspense,useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type {DepthModel,Screen} from '../depth/model';
import {portraitProps} from '../depth/assets';
import {showReviewTools} from '../depth/player-mode';
import {homeView,patrolDefaults} from './selectors';
import {Icon,type IconName} from './Icon';
import './ui-v3.css';
import {HomeScene} from './HomeScene';
const CatsSheet=lazy(()=>import('./SheetsV3').then(m=>({default:m.CatsSheet})));
const TeamSheet=lazy(()=>import('./SheetsV3').then(m=>({default:m.TeamSheet})));
const BagSheet=lazy(()=>import('./SheetsV3').then(m=>({default:m.BagSheet})));
const EventsSheet=lazy(()=>import('./SheetsV3').then(m=>({default:m.EventsSheet})));
const RouteMap=lazy(()=>import('./EncounterV3').then(m=>({default:m.RouteV3})));
const Prepare=lazy(()=>import('./EncounterV3').then(m=>({default:m.PrepareV3})));
const Result=lazy(()=>import('./EncounterV3').then(m=>({default:m.ResultV3})));
const FeelLab=lazy(()=>import('../depth/FeelLab').then(m=>({default:m.FeelLab})));
const labels:Partial<Record<Screen,string>>={collection:'Cats',journal:'Cats',team:'Team',inventory:'Bag',relics:'Bag',gacha:'Recruit',codex:'Field guide',save:'Settings',evidence:'Before / after',map:'Night route',prepare:'Prepare',result:'Tonight’s story'};
const dock:[Screen,string,IconName][]=[['collection','Cats','cats'],['team','Team','team'],['inventory','Bag','bag'],['gacha','Recruit','recruit']];
export default function ShellV3({m,children}:{m:DepthModel;children:ReactNode}) {
 const [menu,setMenu]=useState(false),[events,setEvents]=useState(false),[bagTab,setBagTab]=useState('gear'),[route,setRoute]=useState(false);
 const view=useMemo(()=>homeView(m.state,m.cafeNow),[m,m.state]);
 const dialog=useRef<HTMLElement>(null),returnFocus=useRef<HTMLElement|null>(null);
 const sheet=m.screen!=='hub'||events;
 const close=()=>{setEvents(false);setMenu(false);m.go('hub');requestAnimationFrame(()=>{const target=returnFocus.current;if(target?.isConnected)target.focus();else (document.querySelector<HTMLElement>(`[data-home-destination="${target?.dataset.homeDestination??''}"]`)??document.querySelector<HTMLElement>('.uv-menu-button'))?.focus();});};
 const go=(screen:Screen)=>{returnFocus.current=document.activeElement as HTMLElement;setEvents(false);setMenu(false);setRoute(false);m.go(screen);};
 const openEvents=()=>{returnFocus.current=document.activeElement as HTMLElement;m.go('hub');setEvents(true);setMenu(false);};
 useEffect(()=>{if(m.screen!=='hub')setEvents(false);},[m.screen]);
 useEffect(()=>{if(sheet)dialog.current?.focus();},[sheet,m.screen]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(m.showBattle)return;if(e.key==='Escape'){if(menu)setMenu(false);else if(sheet)close();}if(e.key==='Tab'&&sheet){const nodes=Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),[href],input,select,textarea,summary,[tabindex="0"]')??[]).filter(n=>n.getClientRects().length);const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===dialog.current)){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);});
 const patrol=()=>{setEvents(false);if(m.battle){go(m.battle.result?'result':'prepare');return;}if(m.state.tutorial<3){m.tutorial();return;}if(!m.state.run||m.state.run.complete)m.start(patrolDefaults(m.state).chapter,'campaign',patrolDefaults(m.state).band);const run=m.state.run;if(run&&!run.complete&&!run.rewardChoices.length){const next=R.availableNodes(run)[0];if(next)m.enter(next.id);}if(!m.battle)m.go('map');};
 if(m.showBattle)return null;
 return <div className="uv-shell" data-ui-v3="true">
  <HomeScene m={m} onRecruit={()=>go('gacha')} onTasks={openEvents}/>
  <header className="uv-hud"><div className="uv-identity"><div className="uv-avatar"><img {...portraitProps(m.state.team[0]!)} alt=""/><span>Lv. {m.state.account.accountLevel}</span></div><div><b>The Lantern</b><small>Team power {view.power}</small></div></div>
   <div className="uv-currencies">{(['fish','stamps','threads'] as const).filter(id=>m.state.account.currencies[id]>0||id==='fish').slice(0,3).map(id=><span key={id} className="uv-currency" aria-label={`${id}: ${m.state.account.currencies[id]}`}><i aria-hidden="true">{id==='fish'?'◈':id==='stamps'?'✉':'⌁'}</i>{m.state.account.currencies[id].toLocaleString('en-US')}<small>{id}</small></span>)}</div>
   <button className="uv-relic" onClick={()=>go('relics')}><Icon name="relic"/>Relic · Fuji</button>
   <button className="uv-menu-button" aria-label="Open menu" aria-expanded={menu} onClick={()=>setMenu(!menu)}><Icon name="menu"/></button>
  </header>
  {!sheet&&<><aside className="uv-events" aria-label="Ready to collect">{view.tasks>0&&<button onClick={openEvents}><Icon name="events"/><span>Today’s tasks</span><i className="uv-dot"/></button>}{view.free&&<button onClick={()=>go('gacha')}><Icon name="recruit"/><span>Free recruit</span><i className="uv-dot"/></button>}</aside>
  <footer className="uv-dock"><nav aria-label="Cafe dock">{dock.map(([screen,label,icon])=><button key={screen} data-home-destination={label} onClick={()=>go(screen)}><span><Icon name={icon}/>{((screen==='collection'&&view.cats)||(screen==='inventory'&&view.gear)||(screen==='gacha'&&view.recruit))&&<i className="uv-dot"/>}</span>{label}</button>)}<button data-home-destination="Events" onClick={openEvents}><span><Icon name="events"/>{view.tasks>0&&<i className="uv-dot"/>}</span>Events</button></nav>
   <div className="uv-patrol-group"><button className="uv-map-button" aria-label="Open route map" onClick={()=>{go('map');setRoute(true);}}>⌁</button><button className="uv-patrol" data-home-destination="Patrol" onClick={patrol}><Icon name="fight"/><span>Night Patrol<small>{view.subline}</small></span><b aria-hidden="true">→</b></button></div></footer></>}
  {menu&&<nav className="uv-menu" aria-label="Cafe menu"><button onClick={()=>go('save')}>Open settings</button><button onClick={()=>go('save')}>Export / import</button><button onClick={()=>go('codex')}>Read Field guide</button><details><summary>Read credits</summary><p>The Lantern · original cats, music and cafe. Built for Taskbar Hero.</p></details>{showReviewTools(true)&&<><button onClick={()=>go('evidence')}>Before / after</button><Suspense fallback={null}><FeelLab m={m} home/></Suspense></>}</nav>}
  {sheet&&<><button className="uv-dim" tabIndex={-1} aria-label="Close sheet" onClick={close}/><section className="uv-sheet" role="dialog" aria-label={events?'Events':labels[m.screen]} ref={dialog} tabIndex={-1}>
   <header className="uv-sheet-heading"><h1>{events?'Events':labels[m.screen]}</h1><button className="uv-close" aria-label="Close" onClick={close}><Icon name="close"/></button></header>
   {m.screen==='prepare'&&<nav className="uv-tabs" aria-label="Patrol tabs"><button aria-current={!route?'page':undefined} onClick={()=>setRoute(false)}>Prepare</button><button aria-current={route?'page':undefined} onClick={()=>setRoute(true)}>Route</button><button onClick={()=>go('codex')} aria-label="Read Field guide">?</button></nav>}
   {['collection','journal'].includes(m.screen)&&<nav className="uv-tabs" aria-label="Cats tabs"><button aria-current={m.screen==='collection'?'page':undefined} onClick={()=>go('collection')}>My cats</button><button aria-current={m.screen==='journal'?'page':undefined} onClick={()=>go('journal')}>Journal</button></nav>}
   {['inventory','relics'].includes(m.screen)&&<nav className="uv-tabs" aria-label="Bag tabs"><button aria-current={m.screen==='inventory'&&bagTab==='gear'?'page':undefined} onClick={()=>{setBagTab('gear');go('inventory')}}>Gear</button><button aria-current={m.screen==='inventory'&&bagTab==='materials'?'page':undefined} onClick={()=>{setBagTab('materials');go('inventory')}}>Materials</button><button onClick={()=>go('relics')} aria-current={m.screen==='relics'?'page':undefined}>Relics</button></nav>}
   <main className="uv-sheet-content cr-content" id="depth-main" data-screen={events?'events':m.screen}><Suspense fallback={<p role="status">Opening…</p>}>{events?<EventsSheet m={m}/>:m.screen==='prepare'&&route?<RouteMap m={m}/>:m.screen==='prepare'?<Prepare m={m}/>:m.screen==='result'?<Result m={m}/>:m.screen==='map'?<RouteMap m={m}/>:m.screen==='collection'?<CatsSheet m={m}/>:m.screen==='team'?<TeamSheet m={m}/>:m.screen==='inventory'?<BagSheet key={bagTab} m={m} materials={bagTab==='materials'}/>:m.screen==='evidence'&&!showReviewTools(true)?null:children}</Suspense></main>
  </section></>}
  <div className={`uv-notice ${m.error?'uv-error':''}`} role={m.error?'alert':'status'}>{m.error?m.notice:''}</div>
 </div>;
}
