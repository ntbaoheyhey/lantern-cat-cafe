import { showReviewTools } from "../../apps/web/src/game/cardrpg/depth/player-mode";
// REFERENCE: reports/cardrpg-big2/INTEGRATION-HOOKS.md; apps/web/src/game/cardrpg/depth/App.tsx
import { lazy, Suspense, useEffect, useState, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import DepthApp from '../../apps/web/src/game/cardrpg/depth/App';
import { isLookV2, setLookV2, subscribeLookV2 } from '../../apps/web/src/game/squad/turn3d/look-v2';
import type { Screen } from '../../apps/web/src/game/cardrpg/depth/model';
const MechanicsLab = lazy(() => import('../cardrpg-big2/MechanicsLab').then(m => ({default:m.MechanicsLab})));
const ReviewStudio = lazy(() => import('../cardrpg-big2/ReviewStudio').then(m => ({default:m.ReviewStudio})));
const FrameMeter = lazy(() => import('../cardrpg-big2/ReviewStudio').then(m => ({default:m.FrameMeter})));
import './demo-tools.css';

declare const __GAMEPLAY_V4__: boolean;
declare const __SKILLS_V5__: boolean;

type Panel = { host: HTMLElement; kind: 'mechanics' | 'studio'; close: () => void };

function DemoTools({ open }: { open: (kind: Panel['kind']) => void }) {
  const model = window.__depthReview;
  useSyncExternalStore(model?.subscribe ?? (() => () => {}), model?.snapshot ?? (() => 0));
  return <><button disabled={model?.showBattle} onClick={() => open('studio')}>Review studio</button>
    <button disabled={model?.showBattle} onClick={() => open('mechanics')}>Mechanics lab</button></>;
}

function Demo() {
  const reviewTools = showReviewTools(typeof __GAMEPLAY_V4__ !== 'undefined' && __GAMEPLAY_V4__);
  const lookV2 = useSyncExternalStore(subscribeLookV2, isLookV2);
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
    <DepthApp offline skillsV5={typeof __SKILLS_V5__ !== 'undefined' && __SKILLS_V5__} gameplayV4={typeof __GAMEPLAY_V4__ !== 'undefined' && __GAMEPLAY_V4__} />
    {reviewTools && header && createPortal(<div className="dp-demo-tools" aria-label="Demo tools">
      {!panel && <DemoTools open={open} />}
      <button aria-pressed={meter} onClick={() => setMeter(!meter)}>Frame meter</button>
      <button aria-pressed={lookV2} title={lookV2 ? 'Showing Look V2. Switch to baseline styling.' : 'Showing baseline styling. Switch to Look V2.'}
        onClick={() => setLookV2(!lookV2)}>Look A/B</button>
    </div>, header)}
    {meter && <Suspense fallback={null}><FrameMeter /></Suspense>}
    {panel && createPortal(<Suspense fallback={<p role="status">Opening the studio…</p>}>{panel.kind === 'mechanics'
      ? <MechanicsLab close={panel.close} />
      : <ReviewStudio close={panel.close} openMechanics={() => setPanel({ ...panel, kind: 'mechanics' })}
        go={(screen: Screen) => { panel.close(); window.__depthReview?.go(screen); }} />}</Suspense>, panel.host)}
  </div>;
}

createRoot(document.getElementById('root')!).render(<Demo />);
