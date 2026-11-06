// REFERENCE: tools/cardrpg-big2/MechanicsLab.tsx; apps/web/src/game/cardrpg/depth/App.tsx
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import DepthApp from '../../apps/web/src/game/cardrpg/depth/App';
import { MechanicsLab } from './MechanicsLab';
function Demo() {
 const [panel,setPanel]=useState<{host:HTMLElement; close:()=>void}|null>(null);
 const open=()=>{
  const model=window.__depthReview,host=document.querySelector<HTMLElement>('.cr-content');
  if(!model||!host||model.showBattle)return;
  const screen=model.screen,started=model.sceneStarted;
  model.sceneStarted=false; model.go('evidence');
  setPanel({host,close:()=>{setPanel(null);model.sceneStarted=started;model.go(screen);}});
 };
 return <div className={panel?'b2-demo-lab-open':''}><DepthApp offline />
  {!panel&&<button className="b2-lab-entry" onClick={open}>Mechanics lab</button>}
  {panel&&createPortal(<MechanicsLab close={panel.close}/>,panel.host)}
 </div>;
}
createRoot(document.getElementById('root')!).render(<Demo/>);
