import type {DepthAccount} from '@taskbar-hero/game-rules/src/cardrpg/depth/contract';

/** Only the next reachable encounter layer; never warm the whole campaign. */
export function nextEncounterUnits(state:Pick<DepthAccount,'run'|'team'>):string[]{
 const run=state.run;if(!run||run.complete)return [];
 const origin=run.nodes.find(node=>node.id===(run.current??run.visited.at(-1)));
 let next=origin?.next??run.nodes.filter(node=>node.depth===0).map(node=>node.id);
 const visited=new Set<string>();
 while(next.length){
  const nodes=next.filter(id=>!visited.has(id)).map(id=>run.nodes.find(node=>node.id===id)).filter(node=>!!node);
  if(!nodes.length)return [];
  nodes.forEach(node=>visited.add(node.id));
  const enemies=nodes.flatMap(node=>node.enemies);
  if(enemies.length)return [...new Set([...state.team,...enemies])];
  next=[...new Set(nodes.flatMap(node=>node.next))];
 }
 return [];
}

/** Wait until the result screen has painted, then reuse the actor/pose caches. */
export function queueEncounterPreload(units:readonly string[]):()=>void{
 if(!units.length||typeof window==='undefined')return()=>{};
 let cancelled=false,first=0,second=0,idle=0,timer=0;
 const warm=async()=>{
  if(cancelled)return;
  const [{loadSpineActor},{loadDrawnPoseSet},{isCraftOwner}]=await Promise.all([
   import('../spine/assets'),import('../vfx-craft/drawn-poses'),import('../vfx-craft/encounter'),
  ]);
  for(const id of new Set(units)){
   if(cancelled)return;
   try{
    const actor=await loadSpineActor(id);
    try{if(isCraftOwner(id)&&actor.source!=='designer'&&actor.source!=='sequence')await loadDrawnPoseSet(id);}
    finally{actor.dispose();}
   }catch{/* The foreground loader can retry without blocking the result screen. */}
  }
 };
 first=requestAnimationFrame(()=>{second=requestAnimationFrame(()=>{
  if(window.requestIdleCallback)idle=window.requestIdleCallback(()=>{void warm().catch(()=>{});},{timeout:2000});
  else timer=window.setTimeout(()=>{void warm().catch(()=>{});},32);
 });});
 return()=>{cancelled=true;cancelAnimationFrame(first);cancelAnimationFrame(second);if(idle)window.cancelIdleCallback?.(idle);clearTimeout(timer);};
}
