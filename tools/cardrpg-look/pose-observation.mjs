// Runs inside the page on the actual AnimationMixer pose. Bounds cover the
// exported mesh vertices, not post-processing glow or labels.
export function observePose({cat,id,progress}) {
  const s=window.__depthScene;
  const view={...s.view(),frame:null,paused:true,fixedTime:3.2,currentId:null};
  const actor=view.actors.find(a=>view.models[a.id]===cat);
  if(!actor)throw Error(`Missing actor: ${cat}`);
  view.actors=[actor];view.model={role:actor.role,clip:id,angle:-.12};view.modelProgress=progress;
  s.render(view,0);s.dirty=false;
  const puppet=s.puppets.get(actor.id);
  if(!puppet.actions.has(id)||puppet.clip!==id)throw Error(`Clip did not play: ${id}`);
  if(puppet.model.userData.lookV2!==true)throw Error(`Missing Look model: ${cat}`);
  const bounds=[Infinity,Infinity,-Infinity,-Infinity];
  const point=puppet.model.position.clone();let vertices=0;
  puppet.model.updateWorldMatrix(true,true);
  puppet.model.traverse(node=>{
    const positions=node.geometry?.attributes?.position;
    if(!positions)return;
    for(let parent=node;parent;parent=parent.parent)if(parent.visible===false)return;
    for(let i=0;i<positions.count;i++){
      point.fromBufferAttribute(positions,i).applyMatrix4(node.matrixWorld).project(s.camera);
      const x=(point.x+1)/2,y=(1-point.y)/2;
      bounds[0]=Math.min(bounds[0],x);bounds[1]=Math.min(bounds[1],y);
      bounds[2]=Math.max(bounds[2],x);bounds[3]=Math.max(bounds[3],y);vertices++;
    }
  });
  if(!vertices||!bounds.every(Number.isFinite))throw Error(`No finite mesh bounds: ${cat}`);
  const r=s.renderer.domElement.getBoundingClientRect();
  return {canvas:{x:r.x,y:r.y,width:r.width,height:r.height},stats:{...s.stats},
    model:puppet.model.userData,actualClip:puppet.clip,
    clipDuration:puppet.actions.get(id).getClip().duration,
    projectedBounds:bounds,projectedVertices:vertices,
    framingPass:bounds[0]>=.01&&bounds[1]>=.01&&bounds[2]<=.99&&bounds[3]<=.99};
}
