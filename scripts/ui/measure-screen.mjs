/** Measure text actually painted inside the viewport, including open overlays. */
export function measureScreen() {
  const visibleRect = rect => rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.left < innerWidth && rect.top < innerHeight;
  const painted = element => {
    if (!element || !element.getClientRects().length) return false;
    for (let p = element; p; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
      // Native closed details can retain text Range rectangles in Chromium.
      // Only its first summary is painted, even if elementFromPoint lands on
      // that same details ancestor.
      if (p.tagName === 'DETAILS' && !p.open && !p.querySelector(':scope > summary')?.contains(element)) return false;
    }
    return [...element.getClientRects()].some(visibleRect);
  };
  const uncovered = (element, rect) => {
    const x = Math.max(0,Math.min(innerWidth-1,(Math.max(0,rect.left)+Math.min(innerWidth,rect.right))/2));
    const y = Math.max(0,Math.min(innerHeight-1,(Math.max(0,rect.top)+Math.min(innerHeight,rect.bottom))/2));
    const top = document.elementFromPoint(x,y);
    return top && (element.contains(top) || top.contains(element));
  };
  const walker = document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  const texts=[],fonts=new Set();
  for(let node; (node=walker.nextNode());) {
    const parent=node.parentElement;
    if(!painted(parent)||parent.closest('script,style,option,noscript'))continue;
    const range=document.createRange();range.selectNodeContents(node);
    const rectangles=[...range.getClientRects()].filter(visibleRect);
    if(!rectangles.some(r=>uncovered(parent,r)))continue;
    const text=node.textContent.trim();if(!text)continue;
    texts.push(text);fonts.add(getComputedStyle(parent).fontFamily);
  }
  const controls=[...document.querySelectorAll('button,a,summary,input,select,[role="button"]')].filter(e=>painted(e)&&uncovered(e,e.getBoundingClientRect())).map(e=>({
    tag:e.tagName.toLowerCase(),label:e.getAttribute('aria-label')||e.textContent.trim(),text:e.textContent.trim(),
    icon:!!e.querySelector('img,svg,canvas,.uv-icon,.game-icon'),disabled:!!e.disabled,
    bounds:{x:Math.round(e.getBoundingClientRect().x),y:Math.round(e.getBoundingClientRect().y),width:Math.round(e.getBoundingClientRect().width),height:Math.round(e.getBoundingClientRect().height)}
  }));
  return {visibleWords:texts.reduce((n,t)=>n+(t.match(/\p{L}+(?:['’]\p{L}+)*/gu)||[]).length,0),
    plainTextButtons:controls.filter(c=>['button','summary'].includes(c.tag)&&!c.icon&&/\p{L}/u.test(c.text)).length,
    iconTiles:controls.filter(c=>c.icon).length,texts,fonts:[...fonts],controls,
    horizontalOverflow:document.documentElement.scrollWidth>innerWidth};
}
