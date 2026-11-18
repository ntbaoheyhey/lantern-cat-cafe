/** Frozen DOM/media observation, shared by the legal-action diagnostic only. */
export const sample=()=>{
 const s=window.__depthScene,m=window.__depthReview,canvas=s.renderer.domElement.getBoundingClientRect();
 const measure=node=>{if(!node||node.hidden)return null;const rr=[node,...node.querySelectorAll('*')].map(n=>n.getBoundingClientRect()).filter(r=>r.width&&r.height);if(!rr.length)return null;const x=Math.min(...rr.map(r=>r.left)),y=Math.min(...rr.map(r=>r.top));return{x,y,width:Math.max(...rr.map(r=>r.right))-x,height:Math.max(...rr.map(r=>r.bottom))-y};};
 const total=document.querySelector('.b3-total');
 return{totalBadge:{hidden:total?.hidden??true,text:total?.textContent??null,rect:total?.getBoundingClientRect().toJSON()??null},url:location.href,screen:m.screen,paused:m.paused,plan:m.plan,battle:JSON.stringify(m.battle),sceneTime:s.time,renderTime:s.renderTime,host:canvas.toJSON(),anchors:JSON.parse(JSON.stringify(s.anchors)),hud:[...document.querySelectorAll('.b3-top,.b3-boss,.b3-bottom,.th-audio')].filter(n=>!n.hidden&&getComputedStyle(n).visibility!=='hidden').map(n=>({class:n.className,rect:n.getBoundingClientRect().toJSON()})),labelTargetShift:window.__cxvLabelTargetShift?.dy??0,media:Object.fromEntries(['mochi','clover'].map(cat=>{const actor=[...s.actors.values()].find(e=>e.asset===cat).actor,media=actor.designerMedia.media;return[cat,{state:{...media.state},decoded:window.__cxvMediaAudits[cat].decoded.at(-1),planeVisible:media.plane.visible,rootVisible:actor.root.visible,body:s.anchors.find(x=>x.id===cat)?.body,face:s.anchors.find(x=>x.id===cat)?.face}];})),labelPaintState:[...document.querySelectorAll('.b3-world,.b3-world *')].map(n=>{const c=getComputedStyle(n);return{actor:n.closest('.b3-world').dataset.actor,tag:n.tagName,class:n.className,rect:n.getBoundingClientRect().toJSON(),width:c.width,opacity:c.opacity,filter:c.filter,transform:c.transform,shadow:c.boxShadow};}),animations:document.getAnimations().map(a=>({target:a.effect?.target?.className,playState:a.playState,currentTime:a.currentTime,timing:a.effect?.getComputedTiming()})),labels:[...document.querySelectorAll('.b3-world')].map(node=>({id:node.dataset.actor,rect:measure(node),text:node.textContent,regions:Object.fromEntries([['hp','.b3-hp'],['rage','.b3-rage'],['name','.b3-world-name'],['status','.b3-marker-row']].map(([name,selector])=>[name,measure(node.querySelector(selector))]))})).filter(x=>x.rect)};
};
export const installLabelTargetShift=({dx,dy})=>{
 const s=window.__depthScene,original=s.projectAnchors;
 if(typeof original!=='function')throw Error('Missing projectAnchors diagnostic boundary');
 globalThis.__cxvLabelTargetShift={dx,dy,original};
 s.projectAnchors=function(...args){const result=original.apply(this,args),anchor=this.anchors.find(a=>a.id==='clover');if(anchor?.labelTarget){anchor.labelTarget.x+=dx;anchor.labelTarget.y+=dy;}return result;};
};

/** Diagnostic only: place the complete Mochi label below its rendered body. */
export const installLowerBodyLabel=()=>{
 const s=window.__depthScene,original=s.projectAnchors;
 if(typeof original!=='function')throw Error('Missing projectAnchors diagnostic boundary');
 window.__cxvLowerBodyLabel={original,skipped:0,last:null};
 s.projectAnchors=function(...args){
  const result=original.apply(this,args),anchor=this.anchors.find(a=>a.id==='mochi');
  const node=document.querySelector('.b3-world[data-actor="mochi"]');
  if(!anchor?.labelTarget||!node){window.__cxvLowerBodyLabel.skipped++;return result;}
  const boxes=[node,...node.querySelectorAll('*')].map(n=>n.getBoundingClientRect()).filter(r=>r.width&&r.height);
  if(!boxes.length){window.__cxvLowerBodyLabel.skipped++;return result;}
  const offsetY=Math.min(...boxes.map(r=>r.top))-node.getBoundingClientRect().y+new DOMMatrix(getComputedStyle(node).transform).m42;
  const bodyBottom=anchor.body.y+anchor.body.height,top=Math.max(bodyBottom,anchor.footY)+6;
  anchor.labelTarget.y=top-offsetY;
  window.__cxvLowerBodyLabel.last={bodyBottom,footY:anchor.footY,top,offsetY,targetY:anchor.labelTarget.y};
  return result;
 };
};
