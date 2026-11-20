// One diagnostic pass of three already-registered high-draw frames. Not timing.
import {chromium} from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {open,apply} from './harness.mjs';
const out=process.env.V5_OUT;await mkdir(out,{recursive:true});
const cases=JSON.parse(await readFile(process.env.V5_CASES)).filter(r=>['P4','P8','P15'].includes(r.id));
const result={method:'renderBufferDirect attribution of existing fixed live frames; every submission retained, no changes to effects or clock.',rows:[],errors:[]};
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});page.on('pageerror',e=>result.errors.push(String(e)));await open(page,process.env.V5_ARTIFACT);
 for(const row of cases){await apply(page,row);
  const value=await page.evaluate(()=>{const s=window.__depthScene,renderer=s.renderer,original=renderer.renderBufferDirect,draws=[];
   renderer.renderBufferDirect=function(camera,scene,geometry,material,object,group){let node=object,actor,category='other',chain=[];while(node){chain.push(node.name||node.type);if(node.userData.actorId)actor=node.userData.actorId;if(node===s.stage)category='stage';if(node===s.cardEffects.root)category='card-effects';node=node.parent;}draws.push({actor,category,chain,material:material.name||material.type,geometry:geometry.type,instances:object.isInstancedMesh?object.count:1,transparent:material.transparent});return original.call(this,camera,scene,geometry,material,object,group)};
   try{s.render({...s.view(),fixedTime:3.2,paused:true},0);s.dirty=false;}finally{renderer.renderBufferDirect=original}
   return{stats:{...s.stats},draws};});
  result.rows.push({id:row.id,...value});
 }
}finally{await browser.close();await writeFile(out+'/live-cost.json',JSON.stringify(result,null,2))}
console.log(JSON.stringify(result.rows.map(r=>({id:r.id,stats:r.stats,counts:r.draws.reduce((a,d)=>{const key=d.actor||d.category;a[key]=(a[key]||0)+1;return a},{})}))));
