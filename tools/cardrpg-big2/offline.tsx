// REFERENCE: tools/cardrpg-big2/MechanicsLab.tsx; apps/web/src/game/cardrpg/depth/App.tsx
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import DepthApp from '../../apps/web/src/game/cardrpg/depth/App';
import { MechanicsLab } from './MechanicsLab';
import { ReviewStudio, FrameMeter } from './ReviewStudio';
import type { Screen } from '../../apps/web/src/game/cardrpg/depth/model';
function Demo() {
 const [panel,setPanel]=useState<{host:HTMLElement; kind:'mechanics'|'studio'; close:()=>void}|null>(null);
 const [meter,setMeter]=useState(false);
 const open=(kind:'mechanics'|'studio')=>{
  const model=window.__depthReview,host=document.querySelector<HTMLElement>('.cr-content');
  if(!model||!host||model.showBattle)return;
  const screen=model.screen,started=model.sceneStarted;
  model.sceneStarted=false; model.go('evidence');
  setPanel({host,kind,close:()=>{setPanel(null);model.sceneStarted=started;model.go(screen);}});
 };
 return <div className={panel?'b2-demo-lab-open':''}><DepthApp offline />
  <div className="b2-demo-tools">{!panel&&<><button onClick={()=>open('studio')}>Review studio</button><button className="b2-lab-entry" onClick={()=>open('mechanics')}>Mechanics lab</button></>}<button aria-pressed={meter} onClick={()=>setMeter(!meter)}>Frame meter</button></div>
  {meter&&<FrameMeter/>}
  {panel&&createPortal(panel.kind==='mechanics'?<MechanicsLab close={panel.close}/>:<ReviewStudio close={panel.close} openMechanics={()=>setPanel({...panel,kind:'mechanics'})} go={(screen:Screen)=>{panel.close();window.__depthReview?.go(screen);}}/>,panel.host)}
 </div>;
}
createRoot(document.getElementById('root')!).render(<Demo/>);
