import { showReviewTools } from "./player-mode";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { isLookV2, setLookV2, subscribeLookV2 } from '../../squad/turn3d/look-v2';
import lookTokens from '../look-tokens.json';
import { CollectionJournalV4 } from './CafeV4';
import { DepthModel, type Screen } from './model';
import { gameplayV4 as activeGameplayV4 } from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { CompanionPreviewProvider } from './CompanionPreview';
import { preloadPreviewModels } from './preview-runtime';
import { BattleView } from './Battle';
import { Hub, Team, Collection, Invitations, Inventory, Codex } from './Pages';
import { RunMap } from './RunMap';
import { Prepare, BattleResult } from './Encounter';
import { Relics, SaveSettings, Evidence } from './Utility';
import { FeelLab } from './FeelLab';
import { FrameOverlay } from './FrameOverlay';
import '../cardrpg.css';
import './depth.css';
import './meta.css';
import '../look-tokens.css';
import './look-meta.css';
const rarityStyle = Object.fromEntries(Object.entries(lookTokens.rarities).flatMap(([rarity, values]) =>
  Object.entries(values).map(([name, value]) => [`--look-${rarity}-${name}`, String(value)]))) as CSSProperties;
const navigation: [Screen, string, string][] = [
  ['hub', '⌂', 'Cafe'], ['team', '♧', 'Team & cards'], ['map', '⌁', 'Night route'], ['collection', '♧', 'Companions'],
  ['journal', '▤', 'Collection journal'], ['inventory', '◇', 'Equipment'], ['gacha', '✉', 'Invitations'], ['codex', '▤', 'Field guide'],
  ['relics', '◈', 'Fuji Relics'], ['save', '⚙', 'Save & settings'], ['evidence', '↔', 'Before / after'],
];
export default function DepthApp({ offline = false, gameplayV4 = false }: { offline?: boolean; gameplayV4?: boolean }) {
  const lookV2 = useSyncExternalStore(subscribeLookV2, isLookV2, () => false);
  const [m] = useState(() => new DepthModel(offline, gameplayV4));
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
    if (offline || import.meta.env.DEV) window.__depthReview = m;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      m.state.settings.reducedMotion = true;
      m.notify(false);
    }
    return () => { document.body.classList.remove('cardrpg-entry'); delete window.__depthReview; m.audio.dispose(); setLookV2(false); };
  }, [m, offline]);
  useEffect(() => {
    content.current?.scrollTo(0, 0);
    content.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
  }, [m.screen]);
  return <CompanionPreviewProvider m={m}><div ref={app} data-player-v4={activeGameplayV4(m.state) && !reviewTools} data-look-v2={lookV2} data-battle-active={m.showBattle} style={lookV2 ? rarityStyle : undefined} className={`cr-app dp-app ${m.state.settings.reducedMotion ? 'dp-reduced-motion' : ''}`}><div className="dp-cafe">
    <a className="cr-skip" href="#depth-main">Skip navigation</a><aside className="cr-sidebar"><button className="cr-brand" disabled={m.showBattle} onClick={() => m.go('hub')}><span>♜</span><b>THE LANTERN<br /><small>CAT CAFE QUEST</small></b></button><p className="cr-sidebar-caption">A little courage, every day.</p><nav aria-label="Cafe screens">{navigation.filter(([id])=>(id!=='journal'||activeGameplayV4(m.state))&&(id!=='evidence'||reviewTools)).map(([id, icon, name]) => <button key={id} disabled={m.showBattle} title={m.showBattle ? 'Finish or leave the table to change screens.' : undefined} aria-current={m.screen === id ? 'page' : undefined} onPointerEnter={() => preloadPreviewModels(id === 'gacha' ? ['clover'] : m.state.team)} onFocus={() => preloadPreviewModels(m.state.team)} onClick={() => m.go(id)}><span aria-hidden="true">{icon}</span>{name}</button>)}</nav><div className="cr-sidebar-bottom"><b>THE FIRST LANTERN</b><p>{offline ? 'Offline preview · keep progress with save codes' : 'Local account · automatic saving'}</p><small>Desktop prototype · 0.7.0</small></div></aside>
    <div className="cr-main-shell"><header className="cr-topbar"><span>THE EVENING SHIFT<small>Three chapters. Your choices.</small></span>{offline && reviewTools && <FeelLab m={m} home />}<div className="cr-wallet">{Object.entries(m.state.account.currencies).map(([id, amount]) => <div key={id}><b>{amount.toLocaleString('en-US')}<small>{id === 'fish' ? 'fish points' : id}</small></b></div>)}</div><span className="cr-account">Lv. {m.state.account.accountLevel}<small>{m.state.materials} materials</small></span></header><div className={`cr-status ${m.error ? 'error' : ''}`} role={m.error ? 'alert' : 'status'}>{m.notice}<span>{m.saveStatus}</span></div>
      <main className="cr-content" id="depth-main" ref={content}><div className="dp-page" data-screen={m.screen} key={m.screen} aria-hidden={m.showBattle} inert={m.showBattle}>
        {m.screen === 'prepare' && m.battle && <Prepare m={m} />}{m.screen === 'result' && m.battle && <BattleResult m={m} />}
        {m.screen === 'journal' && <CollectionJournalV4 m={m} />}{m.screen === 'hub' && <Hub m={m} />}{m.screen === 'team' && <Team m={m} />}{m.screen === 'map' && <RunMap m={m} />}
        {m.screen === 'collection' && <Collection m={m} />}{m.screen === 'inventory' && <Inventory m={m} />}{m.screen === 'gacha' && <Invitations m={m} />}
        {m.screen === 'codex' && <Codex v4={activeGameplayV4(m.state)} />}{m.screen === 'relics' && <Relics m={m} />}{m.screen === 'save' && <SaveSettings m={m} />}{m.screen === 'evidence' && <Evidence />}
      </div></main></div></div>
    {m.sceneStarted && <div className="dp-battle-shell"><BattleView m={m} /></div>}
    {offline && reviewTools && m.labPerformance && <FrameOverlay m={m} />}
  </div></CompanionPreviewProvider>;
}
declare global { interface Window { __depthReview?: DepthModel } }
