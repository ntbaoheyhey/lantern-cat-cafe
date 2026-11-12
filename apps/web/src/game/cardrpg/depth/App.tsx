import {Coach} from '../shell/Coach';
import {chainFlags} from '../chain/flags';
const ChainRoom=lazy(()=>import('../chain/ChainRoom').then(m=>({default:m.ChainRoom})));
import {gameplayA6} from '../gate';
import {OpeningA6} from '../ui-v3/OpeningA6';
import {uiV3Enabled} from '../ui-v3/flag';
import { BattleSkillsV5 } from './SkillsV5';
import { DiscoveryCelebrationV4 } from './JourneyV4';
import { showReviewTools } from "./player-mode";
import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { isLookV2, setLookV2, subscribeLookV2 } from '../../squad/turn3d/look-v2';
import lookTokens from '../look-tokens.json';
const JournalA6 = lazy(() => import('../ui-v3/JournalA6').then(m => ({default:m.JournalA6})));
const CollectionJournalV4 = lazy(() => import('./CafeV4').then(m => ({default:m.CollectionJournalV4})));
import { DepthModel, type Screen } from './model';
import { gameplayV4 as activeGameplayV4, gameplayA6 as activeGameplayA6 } from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { CompanionPreviewProvider } from './CompanionPreview';
import { preloadPreviewModels } from './preview-runtime';
const BattleView = lazy(() => import('./Battle').then(m => ({default:m.BattleView})));
import { Hub } from './Pages';
const Team = lazy(() => import('./TeamCollection').then(m => ({default:m.Team})));
const Collection = lazy(() => import('./TeamCollection').then(m => ({default:m.Collection})));
const Invitations = lazy(() => import('./Invitations').then(m => ({default:m.Invitations})));
const Inventory = lazy(() => import('./Equipment').then(m => ({default:m.Inventory})));
const Codex = lazy(() => import('./Pages').then(m => ({default:m.Codex})));
const RunMap = lazy(() => import('./RunMap').then(m => ({default:m.RunMap})));
const Prepare = lazy(() => import('./Encounter').then(m => ({default:m.Prepare})));
const BattleResult = lazy(() => import('./Encounter').then(m => ({default:m.BattleResult})));
const Relics = lazy(() => import('./Utility').then(m => ({default:m.Relics})));
const SaveSettings = lazy(() => import('./Utility').then(m => ({default:m.SaveSettings})));
const Evidence = lazy(() => import('./Utility').then(m => ({default:m.Evidence})));
const FeelLab = lazy(() => import('./FeelLab').then(m => ({default:m.FeelLab})));
const FrameOverlay = lazy(() => import('./FrameOverlay').then(m => ({default:m.FrameOverlay})));
import '../cardrpg.css';
import './depth.css';
import './meta.css';
import '../look-tokens.css';
import './look-meta.css';
const ShellV3 = lazy(() => import('../ui-v3/ShellV3'));
const BattleHudV3 = lazy(() => import('../ui-v3/BattleHudV3'));
const rarityStyle = Object.fromEntries(Object.entries(lookTokens.rarities).flatMap(([rarity, values]) =>
  Object.entries(values).map(([name, value]) => [`--look-${rarity}-${name}`, String(value)]))) as CSSProperties;
const navigation: [Screen, string, string][] = [
  ['hub', '⌂', 'Cafe'], ['team', '♧', 'Team & cards'], ['map', '⌁', 'Night route'], ['collection', '♧', 'Companions'],
  ['journal', '▤', 'Collection journal'], ['inventory', '◇', 'Equipment'], ['gacha', '✉', 'Invitations'], ['codex', '▤', 'Field guide'],
  ['relics', '◈', 'Fuji Relics'], ['save', '⚙', 'Save & settings'], ['evidence', '↔', 'Before / after'],
];
export default function DepthApp({ offline = false, gameplayV4 = false, skillsV5 = false }: { offline?: boolean; gameplayV4?: boolean; skillsV5?: boolean }) {
  const a6 = gameplayA6();
  const uiV3 = uiV3Enabled() || a6;
  const lookV2 = useSyncExternalStore(subscribeLookV2, isLookV2, () => false);
  const [m] = useState(() => (()=>{const model=new DepthModel(offline, gameplayV4 || a6, skillsV5 || a6, a6, a6);model.state.economyV3=chainFlags().economyV3;return model;})());
  useSyncExternalStore(m.subscribe, m.snapshot);
  const reviewTools = showReviewTools(activeGameplayV4(m.state));
  const app = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const root = app.current, main = content.current;
    if (!root || !main) return;
    const measure = () => {
      const bounds = main.getBoundingClientRect();
      for (const key of ['left', 'top', 'width', 'height'] as const) {
        root.style.setProperty(`--dp-shell-${key}`, `${bounds[key]}px`);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(main);
    observer.observe(main.parentElement!);
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, []);
  useEffect(() => {
    document.body.classList.add('cardrpg-entry');
    // A6 is an explicit opt-in; its illustrated DOM and B's puppets share one art direction.
    const previousArt=window.__LOOK_ART__;
    if(a6){window.__LOOK_ART__='v3';setLookV2(true);}
    if (offline || import.meta.env.DEV || new URLSearchParams(location.search).get('demo') === '1' && new URLSearchParams(location.search).get('dev') === '1') window.__depthReview = m;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      m.state.settings.reducedMotion = true;
      m.notify(false);
    }
    return () => { document.body.classList.remove('cardrpg-entry'); delete window.__depthReview; m.audio.dispose(); if(a6)window.__LOOK_ART__=previousArt; setLookV2(false); };
  }, [m, offline, a6]);
  useEffect(() => {
    content.current?.scrollTo(0, 0);
    content.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
  }, [m.screen]);
  const openingMessage=m.screen==='save'?'Opening your save desk…':m.screen==='codex'?'Opening the field guide…':m.screen==='relics'?'Opening the keepsake cabinet…':'Opening the table…';
  const pageView = <Suspense fallback={a6?<OpeningA6 message={openingMessage}/>:<p role="status">Opening the table…</p>}>{m.screen === 'prepare' && m.battle && <Prepare m={m} />}{m.screen === 'result' && m.battle && <BattleResult m={m} />}
        {m.screen === 'journal' && (activeGameplayA6(m.state)?<JournalA6 m={m}/>:<CollectionJournalV4 m={m}/>)}{m.screen === 'hub' && <Hub m={m} />}{m.screen === 'team' && <Team m={m} />}{m.screen === 'map' && <RunMap m={m} />}
        {m.screen === 'collection' && <Collection m={m} />}{m.screen === 'inventory' && <Inventory m={m} />}{m.screen === 'gacha' && <Invitations m={m} />}
        {m.screen === 'codex' && <Codex v4={activeGameplayV4(m.state)} skillsV5={!!m.state.skillsV5} a6={activeGameplayA6(m.state)} />}{m.screen === 'relics' && (chainFlags().chainLoop ? <ChainRoom/> : <Relics m={m} />)}{m.screen === 'save' && <SaveSettings m={m} />}{m.screen === 'evidence' && <Evidence />}</Suspense>;
  if (uiV3) return <CompanionPreviewProvider m={m}><div ref={app} data-a6={a6} data-look-v2={lookV2} data-battle-active={m.showBattle} style={lookV2 ? rarityStyle : undefined} className={`cr-app dp-app uv-app ${m.state.settings.reducedMotion ? 'dp-reduced-motion' : ''}`}>
    <Suspense fallback={a6?<OpeningA6 message="Opening the cafe…"/>:<p role="status">Opening the cafe…</p>}><ShellV3 m={m}>{pageView}</ShellV3></Suspense>
    <Coach m={m}/><DiscoveryCelebrationV4 m={m}/>
    {m.sceneStarted && <div className="dp-battle-shell"><Suspense fallback={a6?<OpeningA6 message="Preparing the battle…"/>:<p role="status">Preparing the battle…</p>}><BattleView m={m}/></Suspense></div>}
    {m.showBattle && <Suspense fallback={null}><BattleHudV3 m={m}/></Suspense>}
  </div></CompanionPreviewProvider>;
  return <CompanionPreviewProvider m={m}><div ref={app} data-player-v4={activeGameplayV4(m.state) && !reviewTools} data-look-v2={lookV2} data-battle-active={m.showBattle} style={lookV2 ? rarityStyle : undefined} className={`cr-app dp-app ${m.state.settings.reducedMotion ? 'dp-reduced-motion' : ''}`}><div className="dp-cafe">
    <a className="cr-skip" href="#depth-main">Skip navigation</a><aside className="cr-sidebar"><button className="cr-brand" disabled={m.showBattle} onClick={() => m.go('hub')}><span>♜</span><b>THE LANTERN<br /><small>CAT CAFE QUEST</small></b></button><p className="cr-sidebar-caption">A little courage, every day.</p><nav aria-label="Cafe screens">{navigation.filter(([id])=>(id!=='journal'||activeGameplayV4(m.state))&&(id!=='evidence'||reviewTools)).map(([id, icon, name]) => <button key={id} disabled={m.showBattle} title={m.showBattle ? 'Finish or leave the table to change screens.' : undefined} aria-current={m.screen === id ? 'page' : undefined} onPointerEnter={() => preloadPreviewModels(id === 'gacha' ? ['clover'] : m.state.team)} onFocus={() => preloadPreviewModels(m.state.team)} onClick={() => m.go(id)}><span aria-hidden="true">{icon}</span>{name}</button>)}</nav><div className="cr-sidebar-bottom"><b>THE FIRST LANTERN</b><p>{offline ? 'Offline preview · keep progress with save codes' : 'Local account · automatic saving'}</p><small>Desktop prototype · 0.7.0</small></div></aside>
    <div className="cr-main-shell"><header className="cr-topbar"><span>THE EVENING SHIFT<small>Three chapters. Your choices.</small></span>{offline && reviewTools && <Suspense fallback={null}><FeelLab m={m} home /></Suspense>}<div className="cr-wallet">{Object.entries(m.state.account.currencies).map(([id, amount]) => <div key={id}><b>{amount.toLocaleString('en-US')}<small>{id === 'fish' ? 'fish points' : id}</small></b></div>)}</div><span className="cr-account">Lv. {m.state.account.accountLevel}<small>{m.state.materials} materials</small></span></header><div className={`cr-status ${m.error ? 'error' : ''}`} role={m.error ? 'alert' : 'status'}>{m.notice}<span>{m.saveStatus}</span></div>
      <main className="cr-content" id="depth-main" ref={content}><div className="dp-page" data-screen={m.screen} key={m.screen} aria-hidden={m.showBattle} inert={m.showBattle}>
        {pageView}
      </div></main></div></div>
    <DiscoveryCelebrationV4 m={m}/>
    {m.showBattle&&m.visualBattle?.initial.skillsV5&&<BattleSkillsV5 battle={m.visualBattle}/>}
    {m.sceneStarted && <div className="dp-battle-shell"><Suspense fallback={<p role="status">Preparing the battle…</p>}><BattleView m={m} /></Suspense></div>}
    {offline && reviewTools && m.labPerformance && <Suspense fallback={null}><FrameOverlay m={m} /></Suspense>}
  </div></CompanionPreviewProvider>;
}
declare global { interface Window { __depthReview?: DepthModel } }
