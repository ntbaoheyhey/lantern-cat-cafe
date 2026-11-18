import {useEffect,useRef} from 'react';
import * as T from 'three';
import {loadSpineActor,type SpineActor} from '../spine/assets';
import {unitCore} from '../stage/core';
import {DrawnPoses,loadDrawnPoseSet} from '../vfx-craft/drawn-poses';
import {isCraftOwner} from '../vfx-craft/encounter';
import {VICTORY_GESTURES,victoryPose} from './victory';
import {artPropsA6} from '../ui-v3/art-a6';
import './victory.css';
export interface VictoryCat {id:string;name:string;alive:boolean}
export function VictoryCrew({cats,reduced}:{cats:VictoryCat[];reduced:boolean}){
 const host=useRef<HTMLDivElement>(null),key=cats.map(c=>`${c.id}:${c.alive}`).join(',');
 useEffect(()=>{
  const element=host.current!;
  // React retains this host when an effect restarts; construction can fail.
  delete element.dataset.ready;delete element.dataset.drawn;delete element.dataset.loadError;
  let renderer:T.WebGLRenderer;
  try{renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch{return;}
  const scene=new T.Scene(),camera=new T.OrthographicCamera(-1,1,1,0,.1,1000),actors=new Map<number,SpineActor>(),drawings=new Map<number,DrawnPoses>();
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=T.SRGBColorSpace;camera.position.z=100;
  renderer.domElement.setAttribute('aria-hidden','true');element.append(renderer.domElement);
  let disposed=false,raf=0,start=0,width=0,height=0;
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const requestDraw=()=>{if(!disposed&&!raf)raf=requestAnimationFrame(draw);};
  const draw=(now:number)=>{ raf=0;
   if(disposed)return;if(!start)start=now;
   const w=Math.max(1,element.clientWidth),h=Math.max(1,element.clientHeight);
   if(w!==width||h!==height){width=w;height=h;renderer.setSize(w,h);camera.left=-w/2;camera.right=w/2;camera.top=h;camera.bottom=0;camera.updateProjectionMatrix();}
   const calm=reduced||media.matches,seconds=calm?.75:(now-start)/1000;
   for(const [i,actor] of actors){
    const cat=cats[i]!,core=unitCore(cat.id,actor.bounds).world,scale=Math.min(height*.43/core.height,width*.34/actor.bounds.width),pose=victoryPose(cat.id,seconds+i*.12,calm);
    actor.sample(cat.alive?'victory':'idle','result',calm?actor.duration('victory')*.65:seconds%actor.duration(cat.alive?'victory':'idle'),0,camera,calm);
    drawings.get(i)?.deform(cat.alive?'victory':'idle',seconds,calm);
    const b=actor.bounds,footX=(b.x+b.width/2)*scale,footY=core.y*scale;
    const sx=cat.alive?pose.sx:1,sy=cat.alive?pose.sy:1,angle=cat.alive?pose.angle:0,cos=Math.cos(-angle),sin=Math.sin(-angle);
    actor.root.scale.set(scale*sx,scale*sy,1);actor.root.rotation.z=-angle;
    const rear=i<2,x=width*((i%2)*.43+(rear?.22:.35)),y=height*(rear?.46:.09);
    actor.setOrder(rear?10:20);
    actor.root.position.set(x-width/2+(cat.alive?pose.x:0)-(cos*footX*sx-sin*footY*sy),y-(sin*footX*sx+cos*footY*sy)-(cat.alive?pose.y:0),0);
    if(!cat.alive)actor.root.traverse(node=>{if(node instanceof T.Mesh){const m=node.material as T.MeshBasicMaterial;m.opacity=.35;m.color.set('#9b8d9f');}});
   }
   renderer.render(scene,camera);if(!calm)requestDraw();
  };
  cats.forEach((cat,i)=>void loadSpineActor(cat.id,undefined,{deferNativePixels:isCraftOwner(cat.id)}).then(async actor=>{
   try{
    if(disposed){actor.dispose();return;}
    const set=isCraftOwner(cat.id)&&actor.source!=='designer'&&actor.source!=='sequence'?await loadDrawnPoseSet(cat.id):undefined;
    if(disposed){actor.dispose();return;}
    if(set)drawings.set(i,new DrawnPoses(actor,set));
    actors.set(i,actor);scene.add(actor.root);element.dataset.ready=String(actors.size===cats.length);element.dataset.drawn=String(drawings.size);requestDraw();
   }catch(error){actor.dispose();throw error;}
  }).catch(()=>{if(!disposed)element.dataset.loadError='true';}));
  const resizeObserver=new ResizeObserver(requestDraw);resizeObserver.observe(element);
  media.addEventListener("change",requestDraw);renderer.domElement.addEventListener("webglcontextrestored",requestDraw);
  requestDraw();return()=>{disposed=true;resizeObserver.disconnect();media.removeEventListener("change",requestDraw);renderer.domElement.removeEventListener("webglcontextrestored",requestDraw);cancelAnimationFrame(raf);for(const actor of actors.values())actor.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
 // Cat identity, survival and reduced motion are the complete rendering inputs.
 },[key,reduced]);
 return <div className="b3-victory-crew" ref={host} role="img" aria-label={cats.filter(c=>c.alive).map(c=>`${c.name}: ${VICTORY_GESTURES[c.id]?.name??'victory'}`).join(', ')}>
  <div className="b3-victory-fallback" aria-hidden="true">{cats.map(cat=><img key={cat.id} {...artPropsA6(cat.id)} alt=""/>)}</div>
  {!reduced&&<div className="b3-confetti" aria-hidden="true">{Array.from({length:32},(_,i)=><i key={i} style={{left:`${(i*47)%100}%`,background:['#f3cf77','#b8d996','#dba3c9','#a9d9ee'][i%4],animationDelay:`${i%9*-.19}s`,animationDuration:`${1.7+i%5*.13}s`}}/>)}</div>}</div>;
}
