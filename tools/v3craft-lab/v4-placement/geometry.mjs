/** DOM measurement used only by private placement experiments. */
export function measureLabels() {
 const rect=r=>({x:r.x,y:r.y,width:r.width,height:r.height});
 const visible=n=>getComputedStyle(n).display!=='none'&&getComputedStyle(n).visibility!=='hidden'&&!n.hidden;
 const labels=[...document.querySelectorAll('.b3-world')].filter(visible).map(node=>{
  const boxes=[node,...node.querySelectorAll('*')].filter(visible).map(n=>n.getBoundingClientRect()).filter(r=>r.width&&r.height);
  const x=Math.min(...boxes.map(r=>r.left)),y=Math.min(...boxes.map(r=>r.top));
  return {id:node.dataset.actor,text:node.textContent,styleLeft:node.style.left,styleTop:node.style.top,
   rect:{x,y,width:Math.max(...boxes.map(r=>r.right))-x,height:Math.max(...boxes.map(r=>r.bottom))-y}};
 });
 const obstacles=[...document.querySelectorAll('.b3-top,.b3-boss,.b3-bottom,.th-audio')].filter(visible)
  .map(node=>({...rect(node.getBoundingClientRect()),kind:node.className})).filter(r=>r.width&&r.height);
 const canvas=document.querySelector('.dp-canvas').getBoundingClientRect(),scene=window.__depthScene;
 const faces=scene.anchors.filter(a=>a.visible&&a.face).map(a=>({...a.face,x:a.face.x+canvas.left,y:a.face.y+canvas.top,id:a.id}));
 const overlap=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
 const clipped=labels.filter(l=>l.rect.x<0||l.rect.y<0||l.rect.x+l.rect.width>innerWidth||l.rect.y+l.rect.height>innerHeight).map(l=>l.id);
 const hud=labels.flatMap(l=>obstacles.filter(o=>overlap(l.rect,o)).map(o=>({id:l.id,obstacle:o.kind})));
 const faceHits=labels.flatMap(l=>faces.filter(f=>overlap(l.rect,f)).map(f=>({id:l.id,face:f.id})));
 const pairs=labels.flatMap((l,i)=>labels.slice(i+1).filter(other=>overlap(l.rect,other.rect)).map(other=>[l.id,other.id]));
 return {width:innerWidth,height:innerHeight,labels,obstacles,faces,clipped,hud,faceHits,pairs,canvas:rect(canvas),
  action:window.__depthReview.plan?.id??null,elapsed:window.__depthReview.animationAt};
}
