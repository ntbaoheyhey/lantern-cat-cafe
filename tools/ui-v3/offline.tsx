import {lazy,Suspense,useEffect,useState,useSyncExternalStore} from 'react';
import {createRoot} from 'react-dom/client';
import {createPortal} from 'react-dom';
import App from '../../apps/web/src/game/cardrpg/depth/App';
import {showReviewTools} from '../../apps/web/src/game/cardrpg/depth/player-mode';
import {isLookV2,setLookV2,subscribeLookV2} from '../../apps/web/src/game/squad/turn3d/look-v2';
import '../cardrpg-big/demo-tools.css';
import './offline.css';
const Mechanics=lazy(()=>import('../cardrpg-big2/MechanicsLab').then(m=>({default:m.MechanicsLab})));
const Studio=lazy(()=>import('../cardrpg-big2/ReviewStudio').then(m=>({default:m.ReviewStudio})));
const Meter=lazy(()=>import('../cardrpg-big2/ReviewStudio').then(m=>({default:m.FrameMeter})));
function Demo(){
 const dev=showReviewTools(true),look=useSyncExternalStore(subscribeLookV2,isLookV2);
 const [host,setHost]=useState<HTMLElement|null>(null),[panel,setPanel]=useState<'studio'|'mechanics'|null>(null),[meter,setMeter]=useState(false);
 useEffect(()=>{if(!dev)return;const find=()=>setHost(document.querySelector<HTMLElement>('.uv-demo-tools,.cr-topbar'));const watch=new MutationObserver(find);watch.observe(document.getElementById('root')!,{childList:true,subtree:true});find();return()=>watch.disconnect()},[dev]);
 useEffect(()=>{if(!panel)return;const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.stopImmediatePropagation();setPanel(null)}};window.addEventListener('keydown',key,true);return()=>window.removeEventListener('keydown',key,true)},[panel]);
 return <><App offline gameplayV4 skillsV5/>{dev&&host&&createPortal(<><button onClick={()=>setPanel('studio')}>Review studio</button><button onClick={()=>setPanel('mechanics')}>Mechanics lab</button><button aria-pressed={meter} onClick={()=>setMeter(!meter)}>Frame meter</button><button aria-pressed={look} onClick={()=>setLookV2(!look)}>Look A/B</button></>,host)}{dev&&meter&&<Suspense fallback={null}><Meter/></Suspense>}{dev&&panel&&<section className="uv-demo-overlay" role="dialog" aria-label="Review tools"><Suspense fallback={<p>Opening…</p>}>{panel==='mechanics'?<Mechanics close={()=>setPanel(null)}/>:<Studio close={()=>setPanel(null)} openMechanics={()=>setPanel('mechanics')} go={screen=>{setPanel(null);window.__depthReview?.go(screen)}}/>}</Suspense></section>}</>
}
setLookV2(new URLSearchParams(location.search).get('look')!=='off');createRoot(document.getElementById('root')!).render(<Demo/>);
