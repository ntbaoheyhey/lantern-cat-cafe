import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import DepthApp from '../../../apps/web/src/game/cardrpg/depth/App';
import { setLookV2 } from '../../../apps/web/src/game/squad/turn3d/look-v2';
import { caseNames, mountFixture, selectedFixture, startFixtureFilm, fixtureSource } from './v3-playback';
import '../../../apps/web/src/game/cardrpg/look-tokens.css';
import './review.css';
setLookV2(true);
function Demo(){
 const [host,setHost]=useState<HTMLElement|null>(null),[active,setActive]=useState(false),[selected,setSelected]=useState<string>('bleed');
 const stop=useRef<(()=>void)|undefined>(undefined);
 const show=(name:string,play=false)=>{stop.current?.();const m=window.__depthReview;if(m){mountFixture(m,name,play);setSelected(name);setActive(true)}};
 useEffect(()=>{setHost(document.querySelector('.cr-topbar'));Object.assign(window,{__v5Fixtures:{select:show,frame:selectedFixture,names:caseNames,source:fixtureSource,film:(id='spread')=>{stop.current?.();stop.current=startFixtureFilm(window.__depthReview!,id);setActive(true)}}});return()=>stop.current?.();},[]);
 return <><DepthApp offline />{host&&createPortal(<button className="v5-guide-button" onClick={()=>show('bleed')}>Skills V5 preview</button>,host)}
 {active&&<div className="v5-preview" aria-label="Skills V5 fixture controls"><b>Recorded Skills V5 preview</b><label>Cue <select value={selected} onChange={e=>show(e.target.value)}>{caseNames.map(n=><option key={n} value={n}>{n.replaceAll('-',' ')}</option>)}</select></label><button onClick={()=>show(selected,true)}>Play cue</button><button onClick={()=>{stop.current?.();stop.current=startFixtureFilm(window.__depthReview!);}}>Play recorded battle</button><button onClick={()=>{stop.current?.();window.__depthReview?.closeGallery();setActive(false)}}>Back to cafe</button><small>Published battle recording · live Skills V5 play comes later</small></div>}
 </>;
}
createRoot(document.getElementById('root')!).render(<Demo/>);
