// Project actual visible model vertices; excludes contact decals and VFX.
export function coverage() {
 const s=window.__depthScene,rect=s.renderer.domElement.getBoundingClientRect(),units=[];
 s.scene.updateMatrixWorld(true);s.camera.updateMatrixWorld(true);
 for(const [id,p]of s.puppets){
  const box=[Infinity,Infinity,-Infinity,-Infinity],v=p.model.position.clone();let vertices=0;
  p.model.traverse(node=>{const a=node.geometry?.attributes?.position;if(!a)return;
   for(let q=node;q;q=q.parent)if(!q.visible)return;
   for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i).applyMatrix4(node.matrixWorld).project(s.camera);const x=(v.x+1)/2,y=(1-v.y)/2;box[0]=Math.min(box[0],x);box[1]=Math.min(box[1],y);box[2]=Math.max(box[2],x);box[3]=Math.max(box[3],y);vertices++}
  });
  units.push({id,asset:p.asset,side:s.view().actors.find(a=>a.id===id)?.side,box,heightPercent:100*(box[3]-box[1]),pageHeightPercent:100*(box[3]-box[1])*rect.height/innerHeight,vertices});
 }
 return {canvas:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},units,stats:{...s.stats},labels:s.labelAudit,overflow:document.documentElement.scrollWidth>innerWidth};
}
