// REFERENCE: reports/cardrpg-big2/INTEGRATION-HOOKS.md; apps/web/src/game/cardrpg/depth/App.tsx
import { useEffect, useState, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import DepthApp from '../../apps/web/src/game/cardrpg/depth/App';
import type { Screen } from '../../apps/web/src/game/cardrpg/depth/model';
import { MechanicsLab } from '../cardrpg-big2/MechanicsLab';
import { ReviewStudio, FrameMeter } from '../cardrpg-big2/ReviewStudio';
import '../cardrpg-big/demo-tools.css';
import '../../apps/web/src/game/cardrpg/look-tokens.css';
import { isLookV2, setLookV2, subscribeLookV2 } from '../../apps/web/src/game/squad/turn3d/look-v2';
import { isReadableBattle, setReadableBattle, subscribeReadableBattle } from '../../apps/web/src/game/squad/turn3d/look-b2';
import { installLiveProbe } from './skills-v5/full/live-dev';
import { B2Gallery } from './b2-gallery';
import { LiveGuide } from './skills-v5/full/LiveGuide';
import { LookAtelier } from './LookAtelier';
declare const __LOOK_LIVE__: boolean;
const live=typeof __LOOK_LIVE__!=='undefined'&&__LOOK_LIVE__;
setLookV2(true);
if(live)installLiveProbe();
const developer = new URLSearchParams(location.search).get('dev') === '1';

type Panel = { host: HTMLElement; kind: 'mechanics' | 'studio' | 'atelier'; close: () => void };

function DemoTools({ open }: { open: (kind: Panel['kind']) => void }) {
  const model = window.__depthReview;
  useSyncExternalStore(model?.subscribe ?? (() => () => {}), model?.snapshot ?? (() => 0));
  return <><button disabled={model?.showBattle} onClick={() => open('atelier')}>Look atelier</button>
    <button disabled={model?.showBattle} onClick={() => open('studio')}>Review studio</button>
    <button disabled={model?.showBattle} onClick={() => open('mechanics')}>Mechanics lab</button></>;
}

function Demo() {
  const readable = useSyncExternalStore(subscribeReadableBattle, isReadableBattle);
  const look = useSyncExternalStore(subscribeLookV2, isLookV2);
  const [header, setHeader] = useState<HTMLElement | null>(null);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [meter, setMeter] = useState(false);
  useEffect(() => { setHeader(document.querySelector<HTMLElement>('.cr-topbar')); }, []);
  useEffect(() => {
    if (!panel) return;
    const sidebar = document.querySelector<HTMLElement>('.cr-sidebar');
    const previous = sidebar?.inert;
    if (sidebar) sidebar.inert = true;
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') panel.close();
    };
    window.addEventListener('keydown', escape);
    return () => {
      if (sidebar) sidebar.inert = previous ?? false;
      window.removeEventListener('keydown', escape);
    };
  }, [panel]);
  const open = (kind: Panel['kind']) => {
    const model = window.__depthReview;
    const host = document.querySelector<HTMLElement>('.cr-content');
    if (!model || !host || model.showBattle || panel) return;
    const screen = model.screen, sceneStarted = model.sceneStarted;
    model.labOpen = false;
    model.sceneStarted = false;
    model.go('evidence');
    setPanel({ host, kind, close: () => {
      setPanel(null);
      model.sceneStarted = sceneStarted;
      model.go(screen);
    } });
  };
  return <div className={`dp-offline-demo ${panel ? 'b2-demo-lab-open' : ''}`}>
    <DepthApp offline gameplayV4={live} skillsV5={live} /><aside className="look-b2-reference" aria-label="Demo references">REFERENCE: {live ? 'reports/cardrpg-look/skills-v5/full/V5FULL-REPORT.md' : 'reports/cardrpg-look/b2/B2-REPORT.md'} · docs/design/cardrpg/LOOK-BIBLE.md · tools/cardrpg-look/build.mjs</aside>
    {header && createPortal(<div className="dp-demo-tools" aria-label="Demo tools">
      {developer && !panel && <DemoTools open={open} />}
      {live ? <LiveGuide /> : <B2Gallery />}
      <button aria-label="B2 before/after" aria-pressed={readable} onClick={() => setReadableBattle(!readable)}>B2: {readable ? 'After' : 'Before'}</button>
      {developer && <button aria-label="Look A/B" aria-pressed={look} onClick={() => setLookV2(!look)}>Look: {look ? 'Atelier' : 'Classic'}</button>}
      {developer && <button aria-pressed={meter} onClick={() => setMeter(!meter)}>Frame meter</button>}
    </div>, header)}
    {developer && meter && <FrameMeter />}
    {panel && createPortal(panel.kind === 'mechanics'
      ? <MechanicsLab close={panel.close} />
      : panel.kind === 'atelier' ? <LookAtelier close={panel.close} openSkills={() => setPanel({ ...panel, kind: 'studio' })} />
      : <ReviewStudio close={panel.close} openMechanics={() => setPanel({ ...panel, kind: 'mechanics' })}
        go={(screen: Screen) => { panel.close(); window.__depthReview?.go(screen); }} />, panel.host)}
  </div>;
}

createRoot(document.getElementById('root')!).render(<Demo />);
