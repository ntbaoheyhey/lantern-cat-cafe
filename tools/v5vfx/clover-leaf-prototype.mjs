/** Candidate-Vite instance study; no application/loader changes. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
export async function installCloverLeafPrototype(page,{active=false}={}){
 const manifest=JSON.parse(await readFile(resolve('work/v5/CXV/films/V7-D-clover-leaf/asset.json'))),bytes=await readFile(manifest.asset);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),manifest.sha256);
 if(active)await page.route('**/__cxv_clover_leaf_play.webp',route=>route.fulfill({body:bytes,contentType:'image/webp'}));
 const details=await page.evaluate(async active=>{
  const start=performance.now(),registry=await import('/src/game/cardrpg/spine/vfx-registry.ts');
  if(active){const image=new Image();image.src='/__cxv_clover_leaf_play.webp';await image.decode();
   if(!registry.registerV5Texture('cxv-clover-leaf',{image,width:image.naturalWidth,height:image.naturalHeight,cols:1,rows:1,frameMs:50,blend:'normal'}))throw Error('Leaf texture invalid');
   for(const id of ['clover-1','clover-4']){const t=registry.V5_SKILL_TIMELINES.get(id);if(!t)throw Error('Missing Clover timeline');registry.V5_SKILL_TIMELINES.set(id,{...t,layers:t.layers.map(l=>l.id==='motes'?{...l,texture:'cxv-clover-leaf'}:l)});}
  }
  return{active,elapsedMs:performance.now()-start};
 },active);
 return{...details,asset:manifest.asset,sha256:manifest.sha256,bytes:active?bytes.length:0,note:'Local intercepted request/decode and temporary timeline selection before measured play at matching CPU rate; not a cold network/load measurement.'};
}
