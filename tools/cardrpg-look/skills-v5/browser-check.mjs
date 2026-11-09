import {chromium} from '../../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {coverage} from '../b2/coverage.mjs';
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const side=process.argv[2]||'after',artifact=resolve(side==='before'?'/tmp/cardrpg-v5look-before.html':'docs/cardrpg-look/v5-v0.html');
const out='reports/cardrpg-look/skills-v5',raw='/tmp/cardrpg-v5look-marks';await mkdir(`${out}/shots`,{recursive:true});await mkdir(raw,{recursive:true});
const fixture=JSON.parse(await readFile(`${out}/fixtures.json`));
const receipt={side,artifact,sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),method:'DPR1 fixedTime3.2 presentation fixtures; raw rule-resolved multi/burst casts. No timing claims from screenshots.',shots:[],ui:[],marks:[],errors:[]};
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{
 for(const [width,height]of side==='before'?[[1440,900]]:[[1440,900],[1280,720],[1024,600]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});page.on('pageerror',e=>receipt.errors.push(String(e)));
  await page.goto('file://'+artifact);await page.waitForFunction(()=>window.__depthReview);
  await page.evaluate(()=>{const m=window.__depthReview;m.watchNow();m.paused=true;m.camera='wide';m.notify(false)});
  await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});
  const apply=async(ids,cast=null)=>{
   await page.evaluate(({base,statuses,ids,cast})=>{const m=window.__depthReview;m.galleryBattle=structuredClone(cast?.battle??base);m.plan=cast?structuredClone(cast.plan):null;m.animationAt=cast?.at??0;m.paused=true;m.gallerySpeed=1;m.state.settings.reducedMotion=false;
    if(!cast)for(const a of m.galleryBattle.actors)a.statuses=['mochi','button-guard'].includes(a.catalogId)?statuses.filter(s=>ids.includes(s.id)).map(s=>({id:s.id,stacks:s.cap,remaining:s.duration,source:a.id,appliedRound:1})):[];
    m.notify(false);
   },{base:fixture.base,statuses:fixture.statuses,ids,cast});
   await page.waitForFunction(()=>window.__depthReview.battle.actors.every(a=>window.__depthScene.puppets.get(a.id)?.asset===a.catalogId));
   await page.evaluate(()=>{const s=window.__depthScene;s.render({...s.view(),fixedTime:3.2,paused:true},0);s.dirty=false});
   await page.waitForTimeout(80);
  };
  const shot=async(name)=>{const file=`shots/${side}-${width}-${name}.webp`;await sharp(await page.screenshot()).webp({quality:88}).toFile(`${out}/${file}`);const detail=await page.evaluate(coverage);receipt.shots.push({name,width,height,file,...detail});};
  const cases=[['1-burn',['scald']],['2-mark-daze',['scent','drowsy']],['3-regen-warm',['steep','cozy']],['4-signatures',fixture.statuses.map(s=>s.id)],['5-row',[],fixture.multi],['6-burst',[],fixture.burst]];
  if(width===1440)for(const [name,ids,cast]of cases){await apply(ids,cast);await shot(name);if(side==='after'&&cast){const cues=await page.evaluate(()=>{const p=window.__depthScene.view().cardPresentation;return {offsets:[...p.offsets],beats:p.beats,bursts:p.bursts,callouts:[...document.querySelectorAll('.dp-combo-callout')].map(e=>({text:e.textContent,hidden:e.hidden,rect:e.getBoundingClientRect().toJSON()}))}});receipt.shots.at(-1).cues=cues;assert.deepEqual(cues.offsets.map(v=>v[1]),[0,70,140]);if(name==='6-burst')assert.equal(cues.callouts.filter(c=>!c.hidden).length,3);}}
  if(side==='after'){
   await apply([],fixture.burst);
   const comboLayout=await page.evaluate(()=>{
    const callouts=[...document.querySelectorAll('.dp-combo-callout')].filter(e=>!e.hidden).map(e=>e.getBoundingClientRect().toJSON());
    const plates=[...document.querySelectorAll('.dp-world-plate')].filter(e=>!e.hidden).map(e=>e.getBoundingClientRect().toJSON());
    const hit=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
    return {width:innerWidth,callouts,wordOverlaps:callouts.reduce((n,a,i)=>n+callouts.slice(i+1).filter(b=>hit(a,b)).length,0),plateOverlaps:callouts.reduce((n,a)=>n+plates.filter(b=>hit(a,b)).length,0)};
   });
   receipt.comboLayouts??=[];receipt.comboLayouts.push(comboLayout);
   await shot('combo-layout');
   assert.equal(comboLayout.wordOverlaps,0,'combo words must not overlap');assert.equal(comboLayout.plateOverlaps,0,'combo words must not cover HP plates');
   await apply(fixture.statuses.map(s=>s.id));
   const ui=await page.evaluate(()=>{
    const intersect=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
    let overlap=0,bounds=0;const badges=[...document.querySelectorAll('.dp-status-badge,.dp-status-more')];
    for(let i=0;i<badges.length;i++){
     const a=badges[i].getBoundingClientRect(),card=badges[i].closest('[data-hp-plate]');
     if(a.left<0||a.top<0||a.right>innerWidth||a.bottom>innerHeight)bounds++;
     for(const hp of card.querySelectorAll('progress,.dp-party-health>span strong,.dp-world-plate>div>small'))if(intersect(a,hp.getBoundingClientRect()))overlap++;
     for(let j=i+1;j<badges.length;j++)if(intersect(a,badges[j].getBoundingClientRect()))overlap++;
    }
    const lum=c=>{const rgb=c.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>{const v=n/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722};
    const contrast=badges.map(e=>{const s=getComputedStyle(e),a=lum(s.color),b=lum(s.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)});
    return {width:innerWidth,badges:badges.length,overlap,bounds,contrastMin:Math.min(...contrast),overflow:document.documentElement.scrollWidth>innerWidth,plateAudit:window.__depthScene.labelAudit};
   });
   await page.locator('.dp-status-badge').first().focus();await page.getByRole('tooltip').waitFor();
   ui.focusText=await page.getByRole('tooltip').innerText();assert.match(ui.focusText,/Stacks 5\/5.*3 rounds/);
   await page.keyboard.press('Escape');assert.equal(await page.getByRole('tooltip').count(),0);
   await page.locator('.dp-status-more').first().focus();await page.getByRole('tooltip').waitFor();ui.overflowText=await page.getByRole('tooltip').innerText();assert.match(ui.overflowText,/Second sprout/);
   ui.tooltipBounds=await page.getByRole('tooltip').boundingBox();assert.ok(ui.tooltipBounds.y>=0);
   await page.locator('.dp-status-more').first().blur();
   await shot('badges');
   assert.equal(ui.overlap,0);assert.equal(ui.bounds,0);assert.equal(ui.overflow,false);assert.ok(ui.contrastMin>=4.5);
   await page.evaluate(()=>{const m=window.__depthReview;m.state.settings.reducedMotion=true;m.notify(false)});
   await page.evaluate(()=>{const s=window.__depthScene;s.render({...s.view(),fixedTime:3.2,paused:true},0);s.dirty=false});
   const staticA=await page.evaluate(()=>[...window.__depthScene.cardEffects.root.children].filter(m=>m.visible).map(m=>Array.from(m.instanceMatrix.array.slice(0,m.count*16))));
   await page.evaluate(()=>{const s=window.__depthScene;s.render({...s.view(),fixedTime:9.2,paused:true},0);s.dirty=false});
   const staticB=await page.evaluate(()=>[...window.__depthScene.cardEffects.root.children].filter(m=>m.visible).map(m=>Array.from(m.instanceMatrix.array.slice(0,m.count*16))));
   assert.deepEqual(staticB,staticA);ui.reducedMotionStatic=true;
   receipt.ui.push(ui);
   if(width===1440){
    for(const status of fixture.statuses){
     await apply([status.id]);
     const detail=await page.evaluate(coverage);
     const sample=await page.evaluate(()=>{
      const s=window.__depthScene,e=s.cardEffects;
      s.render({...s.view(),fixedTime:3.2,paused:true},0);s.dirty=false;
      const masks=e.protectedFaces.slice(0,e.material.uniforms.protectedCount.value).map(v=>v.toArray());
      const stats={...s.stats},effectStats={...e.stats},real=s.renderer.domElement.toDataURL('image/png');
      e.root.visible=false;e.setLightsEnabled(false);s.post.render(s.scene,s.camera,0,0,'#ffe6d2',true);
      const without=s.renderer.domElement.toDataURL('image/png');e.root.visible=true;e.setLightsEnabled(true);
      return {masks,stats,effectStats,real,without};
     });
     for(const key of ['real','without']){await writeFile(`${raw}/${status.id}-${key}.png`,Buffer.from(sample[key].split(',')[1],'base64'));delete sample[key]}
     receipt.marks.push({id:status.id,name:fixture.identities[status.id].name,subtitle:status.name,...sample,...detail,real:`${raw}/${status.id}-real.png`,without:`${raw}/${status.id}-without.png`});
    }
   }
  }
  await writeFile(`${out}/${side}-browser.json`,JSON.stringify(receipt,null,2));await page.close();
 }
 assert.deepEqual(receipt.errors,[]);
}finally{await browser.close();await writeFile(`${out}/${side}-browser.json`,JSON.stringify(receipt,null,2))}
console.log(JSON.stringify({side,shots:receipt.shots.length,ui:receipt.ui.map(x=>({width:x.width,overlap:x.overlap,contrast:x.contrastMin})),marks:receipt.marks.length,errors:receipt.errors}));
