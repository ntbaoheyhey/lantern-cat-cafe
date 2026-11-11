/** Flat Spine batches must preserve slot stacking, including mixed mesh/region winding. */
import{createRequire}from'node:module';import{writeFile}from'node:fs/promises';
const root=process.cwd(),{chromium}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']}),result={cases:[],errors:[]};
try{const page=await browser.newPage();page.on('pageerror',e=>result.errors.push(e.message));await page.goto('http://127.0.0.1:5970/@fs'+root+'/tools/cardrpg-c/unit-review.html');await page.waitForFunction(()=>window.review);
for(const id of ['mochi','clover','soot','button-guard','sock-skipper','yarn-giant']){
 await page.evaluate(id=>window.review.load(id),id);
 for(const clip of ['idle','attack','skill','ult','hurt','ko','victory'])for(const flip of [false,true]){
  const audit=await page.evaluate(({clip,flip})=>{const r=window.review;r.actor.root.scale.x=flip?-1:1;r.pose(clip,clip==='idle'?.69:.55);const gl=r.renderer.getContext(),size=gl.drawingBufferWidth*gl.drawingBufferHeight*4;
   const draw=single=>{r.actor.mesh.traverse(c=>{if(c.material)for(const m of Array.isArray(c.material)?c.material:[c.material])m.forceSinglePass=single;});r.renderer.render(r.scene,r.camera);const pixels=new Uint8Array(size);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,pixels);return{pixels,calls:r.renderer.info.render.calls};};
   const before=draw(false),control=draw(false),after=draw(true);
   const batches=r.actor.mesh.children.filter(c=>c.visible&&c.geometry);if(batches.length!==1)throw Error('Expected one atlas batch');
   const geometry=batches[0].geometry,groups=geometry.groups.map(g=>({...g}));let start=0;geometry.clearGroups();
   for(const slot of r.actor.mesh.skeleton.drawOrder){const a=slot.getAttachment();if(!a)continue;const count=a.triangles?.length??6;const group=groups.find(g=>start>=g.start&&start<g.start+g.count);if(!group)throw Error('Missing material group');geometry.addGroup(start,count,group.materialIndex);start+=count;}
   if(start!==geometry.drawRange.count)throw Error('Reference slot coverage');
   const reference=draw(false);geometry.groups=groups;
   let referenceChanges=0;for(let i=0;i<size;i++)if(reference.pixels[i]!==after.pixels[i])referenceChanges++;
   let changed=0,opaque=0,maxDelta=0,totalDelta=0,controlChanges=0;for(let i=0;i<size;i++){const delta=Math.abs(before.pixels[i]-after.pixels[i]);if(delta)changed++;maxDelta=Math.max(maxDelta,delta);totalDelta+=delta;if(before.pixels[i]!==control.pixels[i])controlChanges++;if(i%4===3&&after.pixels[i])opaque++;}
   return{before:before.calls,after:after.calls,changed,opaque,maxDelta,totalDelta,controlChanges,referenceChanges};},{clip,flip});
  result.cases.push({id,clip,flip,...audit});if(audit.referenceChanges||!audit.opaque||audit.after*2!==audit.before)throw Error(JSON.stringify(result.cases.at(-1)));
 }
}if(result.errors.length)throw Error(result.errors.join('\n'));result.complete=true;result.method='One-pass batches compared with ordered individual-slot draws; old two-pass batches can reorder opposite-winding region/mesh attachments.';console.log(JSON.stringify({cases:result.cases.length,maxDelta:Math.max(...result.cases.map(c=>c.maxDelta)),changed:result.cases.reduce((n,c)=>n+c.changed,0),referenceDifferences:result.cases.reduce((n,c)=>n+c.referenceChanges,0),drawRatio:.5,errors:result.errors}));
}finally{await writeFile(process.argv.find(a=>a.startsWith('--out='))?.slice(6)??'/tmp/cardrpg-c-layer-order-review.json',JSON.stringify(result,null,2)+'\n');await browser.close();}
