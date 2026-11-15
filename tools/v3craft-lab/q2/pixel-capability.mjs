// Optional measurement must not change accepted art selection. LEARN/Q2.md.
import {readFile,writeFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
import {chromium,openFixture,config} from '../../../scripts/v3feel/browser-fixture.mjs';
const original=await readFile('apps/web/src/game/cardrpg/stage/opaque-pose-bounds.ts','utf8');
const guarded=original.replace("function pixels(texture:T.Texture):Pixels {","function pixels(texture:T.Texture):Pixels|undefined {")
 .replace("const context=canvas.getContext('2d',{willReadFrequently:true})!;context.drawImage(source,0,0);","const context=canvas.getContext('2d',{willReadFrequently:true});if(!context)return undefined;context.drawImage(source,0,0);")
 .replace('const {width,height,rgba}=pixels(texture),result:Sample[]=[];','const data=pixels(texture);if(!data)return [];const {width,height,rgba}=data,result:Sample[]=[];');
const bodies={current:original,broadCatch:original,narrowGuard:guarded};
for(const key of Object.keys(bodies))bodies[key]=stripTypeScriptTypes(bodies[key]).replace('export function opaqueWorldBounds','function opaqueWorldBounds');
const browser=await chromium.launch({headless:true});
try{
 const {page,errors}=await openFixture(browser,config.fixtures[0]);
 const result=await page.evaluate(async(bodies)=>{
  const {loadSpineActor}=await import('/src/game/cardrpg/spine/assets.ts');
  const {SPINE_UNITS}=await import('/src/game/cardrpg/spine/config.ts');
  const actors=await Promise.all(SPINE_UNITS.map(u=>loadSpineActor(u.id))),rows=[];
  for(const [method,body] of Object.entries(bodies))for(const mode of ['available','unavailable','corrupt']){
   const proxy={createElement(tag){const canvas=document.createElement(tag);if(mode!=='available')canvas.getContext=()=>mode==='unavailable'?null:{drawImage(){throw Error('Corrupt image sentinel');}};return canvas;}};
   const fn=new Function('document',body+';return opaqueWorldBounds;')(proxy);
   let defined=0,missing=0,thrown=0;
   for(const actor of actors){try{let bound;if(method==='broadCatch'){try{bound=fn(actor.root);}catch{bound=undefined;}}else bound=fn(actor.root);if(bound)defined++;else missing++;}catch{thrown++;}}
   rows.push({method,mode,actors:actors.length,defined,missing,thrown});
  }
  actors.forEach(a=>a.dispose());return rows;
 },bodies);
 await writeFile('tools/v3craft-lab/q2/pixel-capability.json',JSON.stringify({at:new Date().toISOString(),rows:result,pageErrors:errors},null,2)+'\n');
 console.log(JSON.stringify({rows:result,pageErrors:errors}));
}finally{await browser.close();}
