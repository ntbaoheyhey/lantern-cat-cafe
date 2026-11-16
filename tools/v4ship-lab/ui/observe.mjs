/** Browser-side observation; uncertainty remains explicit. LEARN/S11-ui.md. */
export function observeDocument(){
  const visible=e=>e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})&&!e.closest('[aria-hidden="true"],[inert]');
  const box=r=>({x:r.x,y:r.y,width:r.width,height:r.height});
  const parse=s=>{if(!/^rgba?\(/.test(s))return null;const v=s.match(/[\d.]+/g)?.map(Number);return v?.length>=3?[...v.slice(0,3),v[3]??1]:null;};
  const lum=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
  const blend=(fg,bg)=>fg.slice(0,3).map((v,i)=>v*fg[3]+bg[i]*(1-fg[3]));
  function backgrounds(e,rects){
   // An opaque child background does not exempt an ancestor's group effect.
   for(let n=e;n;n=n.parentElement){
    const s=getComputedStyle(n);
    if(Number(s.opacity)!==1||s.filter!=='none'||s.mixBlendMode!=='normal')return {reason:'opacity/filter/blend',effect:{tag:n.tagName,class:n.className?.toString().slice(0,120),opacity:s.opacity,filter:s.filter,blend:s.mixBlendMode}};
   }
   const layers=[];
   for(let n=e;n;n=n.parentElement){
    const s=getComputedStyle(n);
    if(s.borderImageSource!=='none'&&s.borderImageSlice.includes('fill'))return {reason:'border-image-fill'};
    let colors;
    if(s.backgroundImage!=='none'){
     if(!/^(?:linear|radial)-gradient\(/.test(s.backgroundImage)||s.backgroundImage.includes('url('))return {reason:'image'};
     colors=(s.backgroundImage.match(/rgba?\([^)]*\)/g)??[]).map(parse);
     if(!colors.length||colors.some(c=>!c))return {reason:'unparsed-gradient'};
    }else{const c=parse(s.backgroundColor);if(!c)return {reason:'unparsed-color'};colors=[c];}
    layers.push(colors);
    if(colors.every(c=>c[3]===1)){
     const media=[...n.querySelectorAll('img,canvas,video')].filter(visible);
     if(media.some(m=>{const b=m.getBoundingClientRect();return rects.some(r=>r.left<b.right&&r.right>b.left&&r.top<b.bottom&&r.bottom>b.top);}))return {reason:'overlapping-media'};
     let surfaces=colors.map(c=>c.slice(0,3));
     for(const overlays of layers.slice(0,-1).reverse()){
      surfaces=overlays.flatMap(fg=>surfaces.map(bg=>blend(fg,bg)));
      if(surfaces.length>128)return {reason:'complex-gradient'};
     }
     return {surfaces};
    }
   }
   return {reason:'no-opaque-background'};
  }
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),texts=[];let node;
  while(node=walker.nextNode()){
   const e=node.parentElement,text=node.textContent?.trim();
   if(!e||!text||!visible(e)||e.closest('script,style,svg'))continue;
   const range=document.createRange();range.selectNodeContents(node);
   const rects=[...range.getClientRects()].filter(r=>r.width>0&&r.height>0&&r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight);
   if(!rects.length)continue;
   const style=getComputedStyle(e),back=backgrounds(e,rects),fg=parse(style.color),fontSize=parseFloat(style.fontSize),fontWeight=parseInt(style.fontWeight)||400;
   const minimum=fontSize>=24||fontSize>=18.666&&fontWeight>=700?3:4.5;
   // Endpoint-only comparison can miss a gradient crossing the text colour.
   // A component-wise envelope gives a conservative bound across the gradient.
   let ratio=null;
   if(back.surfaces&&fg){
    const lo=[0,1,2].map(i=>Math.min(...back.surfaces.map(c=>c[i]))),hi=[0,1,2].map(i=>Math.max(...back.surfaces.map(c=>c[i])));
    const b0=lum(lo),b1=lum(hi),f0=lum(blend(fg,lo)),f1=lum(blend(fg,hi));
    ratio=f0>b1?(f0+.05)/(b1+.05):b0>f1?(b0+.05)/(f1+.05):1;
   }
   const clipping=[],rootStyle=getComputedStyle(document.documentElement);
   for(let p=e;p;p=p.parentElement){
    const s=getComputedStyle(p);
    // CSS Overflow 3 section 3.3: a propagated root/body overflow clips the
    // viewport, not the body's (possibly zero-height) normal-flow rectangle.
    const viewport=p===document.documentElement||p===document.body&&rootStyle.overflowX==='visible'&&rootStyle.overflowY==='visible'&&rootStyle.contain==='none'&&s.contain==='none';
    const r=viewport?{x:0,y:0,left:0,top:0,right:innerWidth,bottom:innerHeight,width:innerWidth,height:innerHeight}:p.getBoundingClientRect();
    if(['hidden','clip'].includes(s.overflowX)&&rects.some(t=>t.left<r.left-1.5||t.right>r.right+1.5))clipping.push({axis:'x',tag:p.tagName,class:p.className?.toString().slice(0,120),bounds:box(r)});
    if(['hidden','clip'].includes(s.overflowY)&&rects.some(t=>t.top<r.top-1.5||t.bottom>r.bottom+1.5))clipping.push({axis:'y',tag:p.tagName,class:p.className?.toString().slice(0,120),bounds:box(r)});
   }
   const inactive=Boolean(e.closest(':disabled,[aria-disabled="true"]'));
   // Include descriptive copy outside paragraphs. Receipt fields remain in
   // the raw visible count, but are labelled transaction data, not body copy.
   const prose=Boolean(e.closest('p,[role="status"],[role="alert"],.b-landing-top>span,.ship-journey>header>span'))&&!e.closest('button,a,nav,h1,h2,h3,dl');
   texts.push({text:text.slice(0,160),tag:e.tagName,class:e.className?.toString().slice(0,120),rects:rects.map(box),fontSize,fontWeight,foreground:style.color,
    ratio:ratio===null?null:+ratio.toFixed(3),minimum,inactive,contrast:inactive?'inactive-exempt':ratio===null?'unknown':ratio>=minimum?'pass':'fail',unknownReason:back.reason??null,effect:back.effect??null,clipping,prose});
  }
  const words=xs=>xs.join(' ').trim().split(/\s+/).filter(Boolean).length;
  const brokenImages=[...document.images].filter(e=>visible(e)&&e.complete&&e.naturalWidth===0).map(e=>({alt:e.alt,src:new URL(e.src).pathname}));
  return {texts,allVisibleWords:words(texts.map(t=>t.text)),proseWords:words(texts.filter(t=>t.prose).map(t=>t.text)),horizontalOverflow:document.documentElement.scrollWidth>innerWidth,brokenImages};
}
