import { useEffect, useRef } from 'react';
import { TurnScene, type Anchor, type SceneView } from './scene';

export function SceneCanvas({ view, onTarget, onAnchors, onFailure, onReady }: {
  view:()=>SceneView; onTarget:(id:string)=>void; onAnchors:(anchors:Anchor[])=>void;
  onFailure:(message:string)=>void; onReady:(scene:TurnScene|null)=>void;
}) {
  const host=useRef<HTMLDivElement>(null);const callbacks=useRef({view,onTarget,onAnchors,onFailure,onReady});callbacks.current={view,onTarget,onAnchors,onFailure,onReady};
  useEffect(()=>{
    if(!host.current)return;let scene:TurnScene|undefined;
    try{
      scene=new TurnScene(host.current,()=>callbacks.current.view(),a=>callbacks.current.onAnchors(a),id=>callbacks.current.onTarget(id),m=>callbacks.current.onFailure(m));callbacks.current.onReady(scene);
    }catch(error){callbacks.current.onFailure(`3D is unavailable. The turn battlefield remains playable. ${String(error).slice(0,90)}`);}
    return()=>{scene?.dispose();callbacks.current.onReady(null);};
  },[]);
  return <div className="t3-canvas" ref={host}/>;
}
