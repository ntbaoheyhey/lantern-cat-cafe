// All roster entries, actual source and all required facing states; no game mutation.
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import sharp from 'sharp';
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
const root=resolve(import.meta.dirname,'../../..'),dir=resolve(import.meta.dirname,'raw/facing');await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors}=await openFixture(browser,config.fixtures[0]);
 const rows=await page.evaluate(async(root)=>{
  const T=await import('/@fs'+root+'/apps/web/node_modules/three/build/three.module.js');
  const {loadSpineActor}=await import('/src/game/cardrpg/spine/assets.ts'),{SPINE_UNITS}=await import('/src/game/cardrpg/spine/config.ts'),{spriteFacing}=await import('/src/game/cardrpg/stage/core.ts');
  const renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setSize(512,512);renderer.setClearColor(0,0);
  const scene=new T.Scene(),rows=[];
  for(const unit of SPINE_UNITS){
   const actor=await loadSpineActor(unit.id),b=actor.bounds,size=Math.max(b.width,b.height)*1.65,cx=b.x+b.width/2,cy=b.y+b.height/2,sign=spriteFacing(unit.nativeFacing,unit.side);
   const camera=new T.OrthographicCamera(cx*sign-size/2,cx*sign+size/2,cy+size/2,cy-size/2,-1000,1000);camera.position.z=100;
   actor.root.scale.x=sign;scene.add(actor.root);
   for(const [clip,t] of [['idle',0],['attack',.45],['hurt',.3],['ko',.4]]){
    actor.sample(clip,clip,actor.duration(clip)*t,0,camera,false);renderer.render(scene,camera);
    rows.push({id:unit.id,side:unit.side,nativeFacing:unit.nativeFacing,rootSign:sign,screenFacing:(unit.nativeFacing==='left'?-1:1)*sign,clip,time:actor.duration(clip)*t,source:actor.source,png:renderer.domElement.toDataURL('image/png').split(',')[1]});
   }
   actor.dispose();
  }
  renderer.dispose();renderer.forceContextLoss();return rows;
 },root);
 const panels=[];
 for(const r of rows){const b=Buffer.from(r.png,'base64');delete r.png;await writeFile(resolve(dir,`${r.id}-${r.clip}.png`),b);
  const art=await sharp(b).resize(238,238).png().toBuffer();
  const label=Buffer.from(`<svg width="320" height="30"><text x="160" y="18" fill="white" text-anchor="middle" font-family="sans-serif" font-size="15">${r.id} · ${r.clip} · ${r.side==='party'?'RIGHT':'LEFT'}</text></svg>`);
  panels.push(await sharp({create:{width:320,height:268,channels:3,background:'#282c37'}}).composite([{input:art,left:41,top:0},{input:label,left:0,top:238}]).png().toBuffer());
 }
 for(let start=0;start<panels.length;start+=20){await sharp({create:{width:1280,height:1340,channels:3,background:'#282c37'}}).composite(panels.slice(start,start+20).map((input,i)=>({input,left:i%4*320,top:Math.floor(i/4)*268}))).jpeg({quality:89}).toFile(resolve(import.meta.dirname,`facing-${start/20+1}.jpg`));}
 await writeFile(resolve(import.meta.dirname,'facing.json'),JSON.stringify({at:new Date().toISOString(),method:'Actual runtime assets: idle, attack, hurt and KO; desired-side reflection plus manual face/weapon orientation review.',errors,rows},null,2)+'\n');console.log({states:rows.length,wrongSigns:rows.filter(r=>r.screenFacing!==(r.side==='party'?1:-1)).length,errors});
}finally{await browser.close();}
