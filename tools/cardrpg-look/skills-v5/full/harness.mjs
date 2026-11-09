export async function open(page,artifact){
 await page.goto('file://'+artifact+'?dev=1');await page.waitForFunction(()=>window.__depthReview||document.getElementById('loading')?.textContent?.startsWith('The demo could not open.'));
 const loaderError=await page.evaluate(()=>document.getElementById('loading')?.textContent);if(loaderError?.startsWith('The demo could not open.'))throw Error(loaderError);
 await page.evaluate(()=>{const m=window.__depthReview;m.watchNow();m.paused=true;m.camera='wide';m.notify(false)});
 await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});
}
export async function apply(page,row){
 if(row.bossTransition){
  await page.evaluate(row=>{const m=window.__depthReview;m.galleryBattle=structuredClone(row.frame.battle);m.plan=null;m.galleryBattle.v4={version:1,plan:{focus:'support',care:'protect'},events:[]};const a=m.galleryBattle.actors.find(a=>a.id===row.bossTransition.actorId);a.phase=row.bossTransition.from;m.paused=true;m.camera='wide';m.notify(false)},row);
  await page.waitForFunction(()=>window.__depthReview.battle.actors.every(a=>window.__depthScene.puppets.get(a.id)?.asset===a.catalogId));
  await page.evaluate(async row=>{await new Promise(requestAnimationFrame);const m=window.__depthReview,s=window.__depthScene;s.render({...s.view(),fixedTime:2.9,paused:true},0);m.galleryBattle.actors.find(a=>a.id===row.bossTransition.actorId).phase=row.bossTransition.to;m.galleryBattle.v4.events=[row.bossTransition];m.plan=structuredClone(row.frame.plan);m.animationAt=row.frame.at;m.notify(false);await new Promise(requestAnimationFrame);s.render({...s.view(),fixedTime:3.05,paused:true},0);s.puppets.get(row.bossTransition.actorId).phaseAt=3.05;s.render({...s.view(),fixedTime:3.2,paused:true},0);s.dirty=false;await new Promise(requestAnimationFrame)},row);
  return;
 }
 await page.evaluate(row=>{const m=window.__depthReview;
 if(row.gallery){m.inspect(row.gallery,row.progress);m.animationAt=m.plan?m.plan.duration*row.progress:0;}
 else{m.galleryBattle=structuredClone(row.frame.battle);m.plan=structuredClone(row.frame.plan);m.animationAt=row.frame.at;}
 m.paused=true;m.gallerySpeed=1;m.camera='wide';m.state.settings.reducedMotion=false;m.notify(false);
 },row);
 await page.waitForFunction(()=>window.__depthReview.battle.actors.every(a=>window.__depthScene.puppets.get(a.id)?.asset===a.catalogId));
 await page.evaluate(async()=>{await new Promise(requestAnimationFrame);const s=window.__depthScene;s.render({...s.view(),fixedTime:3.2,paused:true},0);s.dirty=false;await new Promise(requestAnimationFrame)});
}
// Serializable browser function, also used on every rendered frame by collide.
export function audit(){
 const visible=e=>!e.hidden&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden'&&Number(getComputedStyle(e).opacity)>0&&e.getBoundingClientRect().width>0;
 const rect=e=>({name:e.dataset.numberTarget||e.dataset.comboTarget||e.textContent?.slice(0,45),...e.getBoundingClientRect().toJSON()});
 const all=s=>[...document.querySelectorAll(s)].filter(visible);
 const plates=all('.dp-world-plate'),badges=all('.dp-status-badge,.dp-status-more');
 const words=all('.dp-combo-callout'),numbers=all('.dp-float-number');
 const liveStrip=all('.dp-v5-status-strip');
 const fixed=all('.dp-ultimate-moment,.dp-party,.dp-battle-top,.dp-roundbar,.dp-v5-status-strip');
 const hit=(a,b)=>a.left<b.right-.5&&a.right>b.left+.5&&a.top<b.bottom-.5&&a.bottom>b.top+.5;
 const overlaps=[];const text=[...words,...numbers];
 for(let i=0;i<text.length;i++)for(const b of [...text.slice(i+1),...plates,...fixed])if(hit(rect(text[i]),rect(b)))overlaps.push([rect(text[i]),rect(b)]);
 for(const plate of plates)for(const strip of liveStrip)if(hit(rect(plate),rect(strip)))overlaps.push([rect(plate),rect(strip)]);
 for(let i=0;i<badges.length;i++)for(const b of [...badges.slice(i+1),...badges[i].closest('[data-hp-plate]').querySelectorAll('progress,.dp-party-health>span strong,.dp-world-plate>div>small')])if(hit(rect(badges[i]),rect(b)))overlaps.push([rect(badges[i]),rect(b)]);
 const stage=rect(document.querySelector('.dp-arena'));
 const outside=text.map(rect).filter(r=>r.left<stage.left-.5||r.right>stage.right+.5||r.top<stage.top-.5||r.bottom>stage.bottom+.5);
 const lum=color=>{const rgb=color.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>n/255<=.04045?n/255/12.92:((n/255+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722};
 const contrasts=[...badges,...words,...all('.dp-number')].map(e=>{const c=getComputedStyle(e),a=lum(c.color),b=lum(c.backgroundColor);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05)});
 const unplaced=[...document.querySelectorAll('[data-placed="false"]')];
 return {at:window.__depthReview.animationAt,words:words.map(rect),numbers:numbers.map(rect),badges:badges.length,overlaps,outside,unplaced:unplaced.map(e=>e.className),unplacedDetails:unplaced.map(e=>({target:e.dataset.numberTarget||e.dataset.comboTarget,text:e.textContent,width:getComputedStyle(e).width})),contrast:Math.min(...contrasts),overflow:document.documentElement.scrollWidth>innerWidth,stats:{...window.__depthScene.stats}};
}
