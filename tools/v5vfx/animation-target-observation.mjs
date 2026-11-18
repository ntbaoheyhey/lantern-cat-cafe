/** Read animation identity and attribution without changing its clocks or target. */
export function installAnimationTargetReader(){
 if(window.__cxvAnimationTargets)throw Error('Animation target reader already installed');
 const animationIds=new WeakMap(),nodeIds=new WeakMap();let nextAnimation=0,nextNode=0;
 const id=(map,object,kind)=>{if(!object)return null;if(!map.has(object))map.set(object,kind==='animation'?++nextAnimation:++nextNode);return map.get(object);};
 const ancestry=node=>{const out=[];for(let n=node;n instanceof Element;n=n.parentElement)out.push({tag:n.tagName,id:n.id,class:n.getAttribute('class'),actor:n.getAttribute('data-actor'),index:n.parentElement?[...n.parentElement.children].indexOf(n):null});return out;};
 const target=node=>{
  if(!(node instanceof Element))return{nodeId:id(nodeIds,node,'node'),kind:node?.constructor?.name??null};
  const css=getComputedStyle(node),owner=node.closest('.b3-cxv-identity,.b3-world,.b3-portrait');
  return{nodeId:id(nodeIds,node,'node'),connected:node.isConnected,ancestry:ancestry(node),owner:owner?{class:owner.getAttribute('class'),actor:owner.getAttribute('data-actor')}:null,
   rect:node.getBoundingClientRect().toJSON(),inlineStyle:node.getAttribute('style'),computed:{width:css.width,transform:css.transform,opacity:css.opacity,visibility:css.visibility,transitionProperty:css.transitionProperty,transitionDuration:css.transitionDuration,transitionDelay:css.transitionDelay},
   meter:node.parentElement?.matches('.b3-hp,.b3-rage')?{class:node.parentElement.className,name:node.parentElement.getAttribute('aria-label'),value:node.parentElement.getAttribute('aria-valuenow')}:null};
 };
 window.__cxvAnimationTargets={read(){return{
  animations:document.getAnimations().map(a=>({observerId:id(animationIds,a,'animation'),kind:a.constructor.name,transitionProperty:a.transitionProperty??null,animationName:a.animationName??null,
   target:target(a.effect?.target),playState:a.playState,pending:a.pending,currentTime:a.currentTime,startTime:a.startTime,playbackRate:a.playbackRate,timing:a.effect?.getComputedTiming()??null,keyframes:a.effect?.getKeyframes?.()??null})),
  meters:[...document.querySelectorAll('.b3-world .b3-hp>i,.b3-world .b3-rage>i,.b3-portrait .b3-hp>i,.b3-portrait .b3-rage>i,.b3-cxv-identity .b3-hp>i,.b3-cxv-identity .b3-rage>i')].map(target)
 };},dispose(){delete window.__cxvAnimationTargets;}};
}
