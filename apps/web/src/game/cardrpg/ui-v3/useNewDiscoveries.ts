import {useEffect,useState} from 'react';
import type {DepthModel} from '../depth/model';
/** A local viewing preference, separate from the exported gameplay save. */
export function useNewDiscoveries(m:DepthModel){
 const key=`lantern-ui-v3-seen-${m.state.account.seed}`;
 const cats=m.state.account.cards.map(c=>c.cardId),gear=m.state.gear.map(g=>g.id);
 const [seen,setSeen]=useState<{cats:string[];gear:string[]}>(()=>{try{const saved=JSON.parse(localStorage.getItem(key)??'null');if(Array.isArray(saved?.cats)&&Array.isArray(saved?.gear))return saved}catch{/* Viewing hints are optional. */}return {cats,gear}});
 const signature=JSON.stringify([cats,gear]);
 useEffect(()=>{let next=seen;if(m.screen==='collection'||m.screen==='journal')next={...next,cats};if(m.screen==='inventory')next={...next,gear};if(JSON.stringify(next)!==JSON.stringify(seen))setSeen(next);try{localStorage.setItem(key,JSON.stringify(next))}catch{/* No gameplay write depends on this. */}},[key,m.screen,signature,seen]);
 const active=!!m.state.run&&!m.state.run.complete;
 return {cats:!active&&cats.some(id=>!seen.cats.includes(id)),gear:!active&&gear.some(id=>!seen.gear.includes(id))};
}
