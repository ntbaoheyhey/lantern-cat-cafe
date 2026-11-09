import {chromium} from '../../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {coverage} from '../b2/coverage.mjs';
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const side=process.argv[2]||'after',artifact=resolve(side==='before'?'docs/cardrpg-look/v5-v0.html':'docs/cardrpg-look/v5.html');
const out=process.env.V5_OUT||'reports/cardrpg-look/skills-v5/v3',raw='/tmp/cardrpg-v5look-v3/marks';await mkdir(`${out}/shots`,{recursive:true});await mkdir(raw,{recursive:true});
const {frames}=JSON.parse(await readFile('/tmp/cardrpg-v5look-v3/frames.json'));
const receipt={side,artifact,sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),shots:[],ui:[],marks:[],cueFaces:[],errors:[],method:'Published S4 exact action snapshots and ordered events, fixed DPR1 time3.2, six cases plus three shapes; CSS number animation held at110ms; no gameplay simulation.'};
async function effectPair(page,key){
 const sample=await page.evaluate(()=>{const s=window.__depthScene,e=s.cardEffects;s.render({...s.view(),fixedTime:3.2,paused:true},0);s.dirty=false;const masks=e.protectedFaces.slice(0,e.material.uniforms.protectedCount.value).map(v=>v.toArray()),headTops=Array.from(e.protectedHeadTops),stats={...s.stats},real=s.renderer.domElement.toDataURL('image/png');e.root.visible=false;e.setLightsEnabled(false);s.post.render(s.scene,s.camera,0,0,'#ffe6d2',true);const without=s.renderer.domElement.toDataURL('image/png');e.root.visible=true;e.setLightsEnabled(true);return {masks,headTops,stats,real,without}});
 for(const field of ['real','without']){await writeFile(`${raw}/${key}-${field}.png`,Buffer.from(sample[field].split(',')[1],'base64'));sample[field]=`${raw}/${key}-${field}.png`;}
 return {id:key,...sample};
}
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{
 for(const [width,height]of side==='before'?[[1440,900]]:[[1440,900],[1280,720],[1024,600]]){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});page.on('pageerror',e=>receipt.errors.push(String(e)));
 await page.goto('file://'+artifact);await page.waitForFunction(()=>window.__depthReview);await page.evaluate(()=>{const m=window.__depthReview;m.watchNow();m.paused=true;m.notify(false)});await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});
 const apply=async(frame)=>{
  await page.evaluate(f=>{const m=window.__depthReview;m.galleryBattle=structuredClone(f.battle);m.plan=structuredClone(f.plan);m.animationAt=f.at;m.paused=true;m.gallerySpeed=1;m.camera='wide';m.state.settings.reducedMotion=false;m.notify(false)},frame);
  await page.waitForFunction(()=>window.__depthReview.battle.actors.every(a=>window.__depthScene.puppets.get(a.id)?.asset===a.catalogId));
  // Match the fixed model beat: CSS otherwise keeps fading numbers while the battle is paused.
  await page.evaluate(()=>document.querySelectorAll('.dp-float-number').forEach(e=>{e.style.animationPlayState='paused';e.style.animationDelay='-0.11s'}));
  await page.evaluate(()=>{const s=window.__depthScene;s.render({...s.view(),fixedTime:3.2,paused:true},0);s.dirty=false});await page.waitForTimeout(100);
 };
 for(const [name,f]of Object.entries(frames)){
  if(side==='before'&&['splash','multi-hit','bounce'].includes(name))continue;
  await apply(f);
  const ui=await page.evaluate(()=>{
   const rect=e=>e.getBoundingClientRect().toJSON(),hit=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
   const words=[...document.querySelectorAll('.dp-combo-callout')].filter(e=>!e.hidden).map(e=>({text:e.textContent,rect:rect(e)}));
   const badges=[...document.querySelectorAll('.dp-status-badge,.dp-status-more')],plates=[...document.querySelectorAll('.dp-world-plate')].filter(e=>!e.hidden).map(rect),stage=rect(document.querySelector('.dp-arena'));
   const reserve=[...document.querySelectorAll('.dp-ultimate-moment,.dp-party,.dp-battle-top')].map(rect);
   const lum=c=>{const rgb=c.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>n/255<=.04045?n/255/12.92:((n/255+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722};
   let badgeOverlap=0;for(let i=0;i<badges.length;i++){const r=rect(badges[i]);for(const hp of badges[i].closest('[data-hp-plate]').querySelectorAll('progress,.dp-party-health>span strong,.dp-world-plate>div>small'))if(hit(r,rect(hp)))badgeOverlap++;for(const b of badges.slice(i+1))if(hit(r,rect(b)))badgeOverlap++;}
   const contrast=[...badges,...document.querySelectorAll('.dp-combo-callout')].map(e=>{const c=getComputedStyle(e),a=lum(c.color),b=lum(c.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)});
   const p=window.__depthScene.view().cardPresentation;
   const numberStyles=[...document.querySelectorAll('.dp-number-bleed,.dp-number-bitter')].map(e=>{const c=getComputedStyle(e);return {text:e.textContent,color:c.color,fontSize:c.fontSize,fontStyle:c.fontStyle,decoration:c.textDecorationLine,visible:!e.closest('.dp-float-number')?.hidden}});
   return {words,badges:badges.length,badgeOverlap,wordOverlap:words.reduce((n,w,i)=>n+words.slice(i+1).filter(v=>hit(w.rect,v.rect)).length,0),reservedOverlap:words.reduce((n,w)=>n+[...reserve,...plates].filter(r=>hit(w.rect,r)).length,0),outside:words.filter(w=>w.rect.left<stage.left||w.rect.right>stage.right||w.rect.top<stage.top||w.rect.bottom>stage.bottom).length,contrast:Math.min(...contrast),overflow:document.documentElement.scrollWidth>innerWidth,bleed:[...document.querySelectorAll('.dp-number-bleed')].map(e=>e.textContent),bitter:[...document.querySelectorAll('.dp-number-bitter')].map(e=>e.textContent),numberStyles,presentation:p?{beats:p.beats,reactions:p.reactions,landings:p.landings}:null};
  });
  receipt.ui.push({name,width,...ui});
  if(width===1440){const file=`shots/${side}-${width}-${name}.webp`;await sharp(await page.screenshot()).webp({quality:80}).toFile(`${out}/${file}`);receipt.shots.push({name,width,file,...await page.evaluate(coverage)});}
  if(width===1440&&side==='after')receipt.cueFaces.push(await effectPair(page,`cue-${name}`));
  if(side==='after'){
   assert.equal(ui.badgeOverlap,0,`${width}/${name} badge`);assert.equal(ui.wordOverlap,0,`${width}/${name} words`);assert.equal(ui.reservedOverlap,0,`${width}/${name} HP/HUD`);assert.equal(ui.outside,0);assert.equal(ui.overflow,false);assert.ok(ui.contrast>=4.5,`${width}/${name} contrast${ui.contrast}`);
   if(['crumb-burst','wildfire','rupture','spread'].includes(name))assert.ok(ui.words.some(w=>w.text===({'crumb-burst':'CRUMB BURST!',wildfire:'WILDFIRE!',rupture:'RUPTURE!',spread:'SPREAD!'})[name]),`${name} word`);
   if(name==='bleed'){assert.ok(ui.bleed.length);assert.ok(ui.numberStyles.some(n=>n.color==='rgb(249, 174, 182)'&&n.fontSize==='16px'&&n.fontStyle==='normal'&&n.visible));}
   if(name==='bitter'){assert.ok(ui.bitter.some(t=>t.includes('50%')));assert.ok(ui.numberStyles.some(n=>n.color==='rgb(229, 223, 233)'&&n.decoration==='line-through'&&n.visible));}
  }
 }
 if(side==='after'){
  await apply(frames.bleed);const badge=page.locator('[data-status="snag"]').first();if(await badge.count()){await badge.focus();await page.getByRole('tooltip').waitFor();receipt.ui.at(-1).focusText=await page.getByRole('tooltip').innerText();await page.keyboard.press('Escape');assert.equal(await page.getByRole('tooltip').count(),0);}
  await page.evaluate(()=>{const m=window.__depthReview;m.state.settings.reducedMotion=true;m.notify(false)});
  const staticSample=async(time)=>page.evaluate(time=>{const s=window.__depthScene;s.render({...s.view(),fixedTime:time,paused:true},0);s.dirty=false;return s.cardEffects.root.children.filter(m=>m.visible).map(m=>Array.from(m.instanceMatrix.array.slice(0,m.count*16)))},time);
  assert.deepEqual(await staticSample(3.2),await staticSample(9.2));receipt.ui.at(-1).reducedMotionStatic=true;
  if(width===1440){
   const old=JSON.parse(await readFile('/tmp/cardrpg-v5look-v3/legacy-fixtures.json'));
   for(const id of ['snag','bitter']){
    const f={battle:structuredClone(old.base),plan:null,at:0};for(const a of f.battle.actors)a.statuses=['mochi','button-guard'].includes(a.catalogId)?[{id,stacks:id==='snag'?5:1,remaining:3,source:a.id,appliedRound:1}]:[];
    await apply(f);const detail=await page.evaluate(coverage);
    const sample=await page.evaluate(()=>{const s=window.__depthScene,e=s.cardEffects;s.render({...s.view(),fixedTime:3.2,paused:true},0);s.dirty=false;const masks=e.protectedFaces.slice(0,e.material.uniforms.protectedCount.value).map(v=>v.toArray()),headTops=Array.from(e.protectedHeadTops),stats={...s.stats},effectStats={...e.stats},real=s.renderer.domElement.toDataURL('image/png');e.root.visible=false;e.setLightsEnabled(false);s.post.render(s.scene,s.camera,0,0,'#ffe6d2',true);const without=s.renderer.domElement.toDataURL('image/png');e.root.visible=true;e.setLightsEnabled(true);return {masks,headTops,stats,effectStats,real,without}});
    for(const key of ['real','without']){await writeFile(`${raw}/${id}-${key}.png`,Buffer.from(sample[key].split(',')[1],'base64'));delete sample[key]}
    receipt.marks.push({id,name:id==='snag'?'Bleed':'Bitter',subtitle:id,...sample,...detail,real:`${raw}/${id}-real.png`,without:`${raw}/${id}-without.png`});
   }
  }
 }
 await page.close();await writeFile(`${out}/${side}-browser.json`,JSON.stringify(receipt,null,2));
 }
 assert.deepEqual(receipt.errors,[]);
}finally{await browser.close();await writeFile(`${out}/${side}-browser.json`,JSON.stringify(receipt,null,2))}
console.log(JSON.stringify({side,shots:receipt.shots.length,checks:receipt.ui.length,marks:receipt.marks.length,errors:receipt.errors}));
