/** Front-layer alpha at impact. Rear artwork is behind every actor by scene order. */
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const out=process.env.ART_A9_REVIEW??'reports/v4-art/REVIEW/A9',validation=JSON.parse(await readFile(`${out}/validation.json`,'utf8'));
if(!validation.pass)throw Error('Regression required');
for(const [p,h]of Object.entries(validation.runtimeSourceHashes))if(createHash('sha256').update(await readFile(p)).digest('hex')!==h)throw Error(`Source changed: ${p}`);
const report={sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),validatedSourceCommit:validation.sourceCommit,method:'Front FX alpha>=128 intersected with face rectangles at1100ms; rear/ground draw below every actor. Live readback, not encoded-pixel proof.',rows:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{for(const [width,height]of [[1280,720],[1440,900]])for(const fixture of config.fixtures.filter(f=>f.id!=='wave3')){
 let selected=fixture.id==='wave1'?['mochi','soot','clover','panko','needle-moth','teacup-healer']:['binding-thread','yarn-giant'];
 if(process.env.ART_A9_ASSETS)selected=selected.filter(a=>process.env.ART_A9_ASSETS.split(',').includes(a));if(!selected.length)continue;
 const {page,errors}=await openFixture(browser,fixture,{width,height});
 const rows=await page.evaluate(async(selected)=>{
  const s=window.__depthScene,m=window.__depthReview,T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js'),rows=[];
  const names={mochi:'craftShield',soot:'craft',clover:'craftHeal',panko:'craftOven','needle-moth':'craftNeedle','teacup-healer':'craftTea','binding-thread':'craftThread','yarn-giant':'craftYarn'};
  const W=s.width,H=s.height,rt=new T.WebGLRenderTarget(W,H),pixels=new Uint8Array(W*H*4),renderer=s.renderer;
  for(let action=0;action<450&&rows.length<selected.length;action++){
   m.paused=false;if(!m.plan)m.step();const asset=s.actors.get(m.plan?.actorId)?.asset;
   if(m.plan?.ultimate&&selected.includes(asset)&&!rows.some(r=>r.asset===asset)){
    m.paused=true;m.animationAt=1100;s.render({...s.view(),paused:true,fixedTime:21.1},0);s.scene.updateMatrixWorld(true);
    const fx=s[names[asset]],scene=new T.Scene();scene.add(fx.front.clone(true));
    const color=renderer.getClearColor(new T.Color()).clone(),alpha=renderer.getClearAlpha();renderer.setRenderTarget(rt);renderer.setClearColor(0,0);renderer.clear();renderer.render(scene,s.camera);renderer.readRenderTargetPixels(rt,0,0,W,H,pixels);renderer.setRenderTarget(null);renderer.setClearColor(color,alpha);
    const targets=new Set([m.plan.actorId,...m.plan.events.filter(e=>e.actorId===m.plan.actorId&&['damage','heal','shield','status_apply'].includes(e.type)).flatMap(e=>e.targetIds)]);
    const faces=[...s.actors.entries()].filter(([,e])=>e.actor.root.visible).map(([id,e])=>{const box=s.faceBounds(e);let total=0,covered=0;for(let y=Math.max(0,Math.floor(box.y));y<Math.min(H,Math.ceil(box.y+box.height));y++)for(let x=Math.max(0,Math.floor(box.x));x<Math.min(W,Math.ceil(box.x+box.width));x++){total++;if(pixels[((H-1-y)*W+x)*4+3]>=128)covered++;}return{id,box,scoped:targets.has(id),total,covered,fraction:total?covered/total:0};});
    const orders=[...s.actors.values()].map(e=>e.actor.root.renderOrder);if(fx.rear.renderOrder>=Math.min(...orders)||fx.front.renderOrder<=Math.max(...orders))throw Error('Layer-order premise violated');
    rows.push({asset,actorId:m.plan.actorId,skillId:m.plan.skillId,width:W,height:H,ms:1100,faces,maxScopedFaceCoverage:Math.max(0,...faces.filter(f=>f.scoped).map(f=>f.fraction)),maxAnyFaceCoverage:Math.max(0,...faces.map(f=>f.fraction)),layerOrder:{rear:fx.rear.renderOrder,front:fx.front.renderOrder,actorMin:Math.min(...orders),actorMax:Math.max(...orders)}});
   }
   m.paused=false;while(m.plan)m.tick(100);
  }
  rt.dispose();if(rows.length!==selected.length)throw Error('Missing first own ultimate');return rows;
 },selected);
 report.rows.push(...rows.map(r=>({fixture:fixture.id,viewport:{width,height},errors,...r})));await page.close();
}
report.finished=new Date().toISOString();report.pass=report.rows.every(r=>!r.errors.length&&r.maxScopedFaceCoverage<=.5);await writeFile(`${out}/front-face-probe-r3.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({observations:report.rows.length,maxFaceCoverage:Math.max(...report.rows.map(r=>r.maxScopedFaceCoverage)),pass:report.pass}));
}finally{await browser.close();}
