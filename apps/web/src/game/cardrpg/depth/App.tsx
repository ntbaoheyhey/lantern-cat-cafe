import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { isLookV2, setLookV2, subscribeLookV2 } from '../../squad/turn3d/look-v2';
import lookTokens from '../look-tokens.json';
import { DepthModel, type Screen } from './model';
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
  ['inventory', '◇', 'Equipment'], ['gacha', '✉', 'Invitations'], ['codex', '▤', 'Field guide'],
  ['relics', '◈', 'Fuji Relics'], ['save', '⚙', 'Save & settings'], ['evidence', '↔', 'Before / after'],
];
export default function DepthApp({ offline = false }: { offline?: boolean }) {
  const lookV2 = useSyncExternalStore(subscribeLookV2, isLookV2, () => false);
  const [m] = useState(() => new DepthModel(offline));
  useSyncExternalStore(m.subscribe, m.snapshot);
  const content = useRef<HTMLElement>(null);
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
  return <CompanionPreviewProvider m={m}><div data-look-v2={lookV2} style={lookV2 ? rarityStyle : undefined} className={`cr-app dp-app ${m.state.settings.reducedMotion ? 'dp-reduced-motion' : ''}`}><div className={`dp-cafe ${m.showBattle ? 'dp-hidden' : ''}`} aria-hidden={m.showBattle} inert={m.showBattle}>
    <a className="cr-skip" href="#depth-main">Skip navigation</a><aside className="cr-sidebar"><button className="cr-brand" onClick={() => m.go('hub')}><span>♜</span><b>THE LANTERN<br /><small>CAT CAFE QUEST</small></b></button><p className="cr-sidebar-caption">A little courage, every day.</p><nav aria-label="Cafe screens">{navigation.map(([id, icon, name]) => <button key={id} aria-current={m.screen === id ? 'page' : undefined} onPointerEnter={() => preloadPreviewModels(id === 'gacha' ? ['clover'] : m.state.team)} onFocus={() => preloadPreviewModels(m.state.team)} onClick={() => m.go(id)}><span aria-hidden="true">{icon}</span>{name}</button>)}</nav><div className="cr-sidebar-bottom"><b>THE FIRST LANTERN</b><p>{offline ? 'Offline preview · keep progress with save codes' : 'Local account · automatic saving'}</p><small>Desktop prototype · 0.7.0</small></div></aside>
    <div className="cr-main-shell"><header className="cr-topbar"><span>THE EVENING SHIFT<small>Three chapters. Your choices.</small></span>{offline && <FeelLab m={m} home />}<div className="cr-wallet">{Object.entries(m.state.account.currencies).map(([id, amount]) => <div key={id}><b>{amount.toLocaleString('en-US')}<small>{id === 'fish' ? 'fish points' : id}</small></b></div>)}</div><span className="cr-account">Lv. {m.state.account.accountLevel}<small>{m.state.materials} materials</small></span></header><div className={`cr-status ${m.error ? 'error' : ''}`} role={m.error ? 'alert' : 'status'}>{m.notice}<span>{m.saveStatus}</span></div>
      <main className="cr-content" id="depth-main" ref={content}><div className="dp-page" key={m.screen}>
        {m.screen === 'prepare' && m.battle && <Prepare m={m} />}{m.screen === 'result' && m.battle && <BattleResult m={m} />}
        {m.screen === 'hub' && <Hub m={m} />}{m.screen === 'team' && <Team m={m} />}{m.screen === 'map' && <RunMap m={m} />}
        {m.screen === 'collection' && <Collection m={m} />}{m.screen === 'inventory' && <Inventory m={m} />}{m.screen === 'gacha' && <Invitations m={m} />}
        {m.screen === 'codex' && <Codex />}{m.screen === 'relics' && <Relics m={m} />}{m.screen === 'save' && <SaveSettings m={m} />}{m.screen === 'evidence' && <Evidence />}
      </div></main></div></div>
    {m.sceneStarted && <BattleView m={m} />}
    {offline && m.labPerformance && <FrameOverlay m={m} />}
  </div></CompanionPreviewProvider>;
}
declare global { interface Window { __depthReview?: DepthModel } }
