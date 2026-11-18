/** Development-only DOM presentation prototype. Never replaces the production renderer. */
export function installFooterIdentity(){
 if(window.__cxvFooterIdentity)throw Error('Footer prototype already installed');
 const footer=document.querySelector('.b3-bottom'),speed=footer?.querySelector('.b3-speed'),party=footer?.querySelector('.b3-party');
 if(!footer||!speed||!party)throw Error('Missing original footer');
 const style=document.createElement('style');style.dataset.cxvFooterPrototype='true';style.textContent=`
 .b3-cxv-identity{position:absolute;box-sizing:border-box;width:160px;height:72px;border:1px solid #ad8a58;border-radius:8px;background:#241c2b;color:#fff0ce;pointer-events:none;font-family:var(--font-body);font-weight:800}
 .b3-cxv-identity[hidden]{display:none}
 .b3-cxv-identity-name{position:absolute;left:8px;top:4px;font-size:14px;line-height:16px;white-space:nowrap}
 .b3-cxv-identity-meters{position:absolute;left:8px;top:28px;width:64px}
 .b3-cxv-identity-meters .b3-hp,.b3-cxv-identity-meters .b3-rage{width:64px}
 .b3-cxv-identity .b3-statuses{position:absolute;left:92px;top:23px;width:60px;min-width:0;min-height:0;margin:0;display:grid;grid-template-columns:repeat(3,18px);gap:7px 3px;justify-content:start}
 .b3-cxv-identity .b3-statuses span{width:18px;height:18px}
 .b3-cxv-identity .b3-statuses [tabindex]:focus-visible{outline:3px solid #9de6ff;outline-offset:-3px}
 .b3-cxv-no-effects{position:absolute;left:92px;top:23px;width:60px;font-size:12px;line-height:16px}
 .b3-world[data-cxv-footer-identity=true]{visibility:hidden}
 .b3-cinema-occludes .b3-cxv-identity{visibility:hidden}
 `;document.head.append(style);
 const panels=new Map(),originals=new Map();
 function sync(){
  const s=window.__depthScene,m=window.__depthReview,battle=m.visualBattle,eligible=[];
  for(const cat of ['mochi','clover']){
   const entry=[...s.actors.values()].find(e=>e.asset===cat),media=entry?.actor?.designerMedia?.media.state;
   const actor=battle.actors.find(a=>a.side==='party'&&a.catalogId===cat),world=actor?document.querySelector('.b3-world[data-actor="'+actor.id+'"]'):null;
   if(actor&&world&&entry.actor.designerIdle===true&&media?.ready&&!media.failure&&!media.disposed)eligible.push({cat,actor,world});
  }
  for(const [id,node] of originals)if(!eligible.some(x=>x.actor.id===id)){delete node.dataset.cxvFooterIdentity;originals.delete(id);panels.get(id)?.node.remove();panels.delete(id);}
  const bounds=footer.getBoundingClientRect(),left=speed.getBoundingClientRect().right-bounds.left+12;
  eligible.forEach(({cat,actor,world},i)=>{
   let record=panels.get(actor.id);
   if(!record){const node=document.createElement('section');node.className='b3-cxv-identity';node.dataset.actor=actor.id;node.setAttribute('role','group');node.setAttribute('aria-labelledby','cxv-identity-name-'+cat);footer.append(node);record={node,markup:null};panels.set(actor.id,record);originals.set(actor.id,world);}
   const {node}=record;node.style.left=(left+i*168)+'px';node.style.top='7px';node.hidden=world.hidden;
   const markup=world.innerHTML;
   if(record.markup!==markup){
    const title=document.createElement('strong');title.className='b3-cxv-identity-name';title.id='cxv-identity-name-'+cat;title.textContent=actor.name;
    const meters=document.createElement('div');meters.className='b3-cxv-identity-meters';
    for(const selector of ['.b3-hp','.b3-rage']){const meter=world.querySelector(selector);if(!meter)throw Error('Missing transferred meter '+selector);meters.append(meter.cloneNode(true));}
    node.replaceChildren(title,meters);const sourceBadges=world.querySelector('.b3-statuses');if(!sourceBadges)throw Error('Missing original statuses');
    if(sourceBadges.children.length)node.append(sourceBadges.cloneNode(true));else{const none=document.createElement('span');none.className='b3-cxv-no-effects';none.textContent='No effects';node.append(none);}
    for(const child of node.querySelectorAll('[data-tutorial-id]'))child.removeAttribute('data-tutorial-id');record.markup=markup;
   }
   world.dataset.cxvFooterIdentity='true';
  });
  return eligible.map(x=>x.actor.id);
 }
 const result={sync,dispose(){for(const node of originals.values())delete node.dataset.cxvFooterIdentity;for(const p of panels.values())p.node.remove();style.remove();delete window.__cxvFooterIdentity;}};
 window.__cxvFooterIdentity=result;sync();return true;
}

export function observeFooterIdentity(){
 const rect=n=>n.getBoundingClientRect().toJSON();
 return [...document.querySelectorAll('.b3-cxv-identity')].map(n=>({actor:n.dataset.actor,rect:rect(n),hidden:n.hidden,visibility:getComputedStyle(n).visibility,name:n.querySelector('.b3-cxv-identity-name')?.textContent,groupRole:n.getAttribute('role'),groupLabel:n.getAttribute('aria-labelledby'),children:[...n.querySelectorAll('*')].map(c=>{const s=getComputedStyle(c);const range=document.createRange();range.selectNodeContents(c);return{tag:c.tagName,class:c.getAttribute('class'),visibility:s.visibility,display:s.display,textRects:c.childElementCount?[]:[...range.getClientRects()].map(r=>r.toJSON()),text:c.childElementCount?null:c.textContent,rect:rect(c),title:c.getAttribute('title'),ariaLabel:c.getAttribute('aria-label'),value:c.getAttribute('aria-valuenow'),max:c.getAttribute('aria-valuemax'),tabIndex:c.getAttribute('tabindex'),font:s.font,outlineWidth:s.outlineWidth,outlineOffset:s.outlineOffset,outlineStyle:s.outlineStyle,focus:c===document.activeElement};})}));
}
