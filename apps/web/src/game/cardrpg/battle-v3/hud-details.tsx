import type {Intent} from '@taskbar-hero/game-rules/src/cardrpg/depth/contract';
import type {DepthModel} from '../depth/model';
import {GameIcon} from '../../../ui/GameIcon';

/** Route branches are alternatives, so count a remaining path, never all nodes. */
export function battleWave(m:DepthModel){
 const run=m.replay||m.tutorialBattle?null:m.state.run;
 if(!run)return {current:1,total:1};
 const combat=(kind:string)=>['battle','elite','boss'].includes(kind),current=run.nodes.find(n=>n.id===run.current);
 const cleared=run.nodes.filter(n=>n.id!==run.current&&run.visited.includes(n.id)&&combat(n.kind)).length;
 const remaining=(id:string,seen=new Set<string>()):number=>{
  const node=run.nodes.find(n=>n.id===id);if(!node||seen.has(id))return 0;
  const path=new Set(seen).add(id);
  return Number(combat(node.kind))+Math.max(0,...node.next.map(next=>remaining(next,path)));
 };
 return {current:cleared+1,total:Math.max(cleared+1,cleared+(current?remaining(current.id):1))};
}
export function IntentMark({intent}:{intent:Intent|undefined}){
 if(!intent)return null;
 const label=intent.interrupted?'Interrupted':`${intent.label} ${intent.counter}`;
 return <span className="b3-intent" tabIndex={0} role="img" aria-label={label} title={label} data-interrupted={intent.interrupted} data-signature={intent.signature}>
  <GameIcon name={intent.interrupted?'close':intent.signature?'boss-seal':intent.power?'fight':'shield'} size={16}/>
 </span>;
}
