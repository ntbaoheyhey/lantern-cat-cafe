// REFERENCE: reports/cardrpg-big2/INTEGRATION-HOOKS.md; apps/web/src/game/cardrpg/depth/App.tsx
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import DepthApp from '../../apps/web/src/game/cardrpg/depth/App';
import type { Screen } from '../../apps/web/src/game/cardrpg/depth/model';
import { MechanicsLab } from '../cardrpg-big2/MechanicsLab';
import { ReviewStudio, FrameMeter } from '../cardrpg-big2/ReviewStudio';
import './demo-tools.css';

type Panel = { host: HTMLElement; kind: 'mechanics' | 'studio'; close: () => void };

function Demo() {
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
    <DepthApp offline />
    {header && createPortal(<div className="dp-demo-tools" aria-label="Demo tools">
      {!panel && <><button onClick={() => open('studio')}>Review studio</button>
        <button onClick={() => open('mechanics')}>Mechanics lab</button></>}
      <button aria-pressed={meter} onClick={() => setMeter(!meter)}>Frame meter</button>
    </div>, header)}
    {meter && <FrameMeter />}
    {panel && createPortal(panel.kind === 'mechanics'
      ? <MechanicsLab close={panel.close} />
      : <ReviewStudio close={panel.close} openMechanics={() => setPanel({ ...panel, kind: 'mechanics' })}
        go={(screen: Screen) => { panel.close(); window.__depthReview?.go(screen); }} />, panel.host)}
  </div>;
}

createRoot(document.getElementById('root')!).render(<Demo />);
