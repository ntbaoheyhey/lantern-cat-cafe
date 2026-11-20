/** Compare actual own-asset formations, changing only in-memory layout contracts. */
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
const dir='reports/v4-art/REVIEW/A2';await mkdir(dir,{recursive:true});
const variants={production:null};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});const rows=[];
try{
for(const [width,height] of [[1280,720],[1440,900]])for(const fixture of config.fixtures){
 const {page,errors}=await openFixture(browser,fixture,{width,height});
 for(const [variant,settings] of Object.entries(variants)){
  const result=await page.evaluate(async({settings})=>{
   const {SLOTS_C2}=await import('/src/game/cardrpg/stage/layout-c2.ts');
   window.__v4OriginalSlots??=structuredClone(SLOTS_C2);
   Object.assign(SLOTS_C2,structuredClone(window.__v4OriginalSlots));
   if(settings){SLOTS_C2.unitHeight=settings.unitHeight;settings.slots.forEach((s,i)=>Object.assign(SLOTS_C2.slots[i],s));Object.assign(SLOTS_C2.boss,settings.boss);SLOTS_C2.bossHelpers=settings.bossHelpers;settings.enemySix?.forEach((p,i)=>Object.assign(SLOTS_C2.enemySix[i],p));}
   const s=window.__depthScene;s.render({...s.view(),fixedTime:10,paused:true},0);
   const audit=s.sizeAudit();
   const T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
   const isolated=new T.Scene(),target=new T.WebGLRenderTarget(s.width,s.height),renderer=s.renderer;
   const oldColor=renderer.getClearColor(new T.Color()).clone(),oldAlpha=renderer.getClearAlpha(),masks=[];
   for(const u of audit.units){
    const root=s.actors.get(u.id).actor.root,parent=root.parent,pixels=new Uint8Array(s.width*s.height*4),mask=new Uint8Array(s.width*s.height);
    isolated.add(root);renderer.setRenderTarget(target);renderer.setClearColor(0,0);renderer.clear();renderer.render(isolated,s.camera);
    renderer.readRenderTargetPixels(target,0,0,s.width,s.height,pixels);parent.add(root);
    let count=0;for(let i=0;i<mask.length;i++)if(pixels[i*4+3]>=128){mask[i]=1;count++;}
    masks.push({id:u.id,asset:u.asset,order:u.drawOrder,count,mask});
   }
   masks.sort((a,b)=>b.order-a.order);const union=new Uint8Array(s.width*s.height),occlusion=[];
   for(const m of masks){let hidden=0;for(let i=0;i<union.length;i++)if(m.mask[i]){if(union[i])hidden++;union[i]=1;}occlusion.push({id:m.id,asset:m.asset,count:m.count,hidden,fraction:hidden/m.count});}
   renderer.setRenderTarget(null);renderer.setClearColor(oldColor,oldAlpha);target.dispose();s.render({...s.view(),fixedTime:10,paused:true},0);
   return {audit,camera:s.audit().camera,innerHeight,innerWidth,occlusion};
  },{settings});
  rows.push({fixture:fixture.id,variant,width,height,...result,errors});
  if(width===1280)await page.screenshot({path:`${dir}/drill-${variant}-${fixture.id}.png`});
 }
 await page.close();
}
}finally{await browser.close();}
await writeFile('tools/v3craft-lab/v4-frame/production.json',JSON.stringify(rows,null,2)+'\n');
console.log(JSON.stringify(rows.map(r=>({fixture:r.fixture,variant:r.variant,size:[r.width,r.height],cats:r.audit.units.filter(u=>u.side==='party').map(u=>+(u.box.height/r.height).toFixed(3)),boss:r.audit.units.find(u=>u.kind==='boss')?.box})),null,2));
